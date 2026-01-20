import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Whitelist of allowed file extensions
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "pdf"];

/**
 * Validates and extracts file extension from filename
 * @param filename - The filename to validate
 * @returns The validated lowercase extension or null if invalid
 */
export function validateFileExtension(filename: string): string | null {
  // Apply multiple rounds of URL decoding to detect nested encoding attacks
  let decodedFilename = filename;
  let previousFilename = "";
  let iterations = 0;
  const maxIterations = 3; // Prevent infinite loops

  while (decodedFilename !== previousFilename && iterations < maxIterations) {
    previousFilename = decodedFilename;
    try {
      decodedFilename = decodeURIComponent(decodedFilename);
    } catch {
      // Invalid encoding, reject
      return null;
    }
    iterations++;
  }

  // Check for suspicious patterns in decoded filename (path traversal, null bytes)
  if (
    decodedFilename.includes("..") ||
    decodedFilename.includes("/") ||
    decodedFilename.includes("\\") ||
    decodedFilename.includes("\0")
  ) {
    return null;
  }

  // Extract extension from the last dot only, using original filename
  const lastDotIndex = filename.lastIndexOf(".");
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return null;
  }

  const extension = filename.substring(lastDotIndex + 1).toLowerCase();

  // Validate against whitelist
  return ALLOWED_EXTENSIONS.includes(extension) ? extension : null;
}

/**
 * Determines the file type category based on extension
 * @param extension - The file extension
 * @returns The file type category (IMAGE, DOCUMENT, or DIAGRAM)
 */
export function getFileType(extension: string): string {
  const documentExtensions = ["pdf"];
  return documentExtensions.includes(extension) ? "DOCUMENT" : "IMAGE";
}

/**
 * Validates multiple files and returns a map of file to validated extension
 * @param files - Array of files to validate
 * @returns Map of valid files to their extensions, or error message if validation fails
 */
export function validateFiles(
  files: File[],
):
  | { success: true; validatedFiles: Map<File, string> }
  | { success: false; error: string } {
  const validatedFiles: Map<File, string> = new Map();

  for (const file of files) {
    if (file.size > 0) {
      const fileExtension = validateFileExtension(file.name);
      if (!fileExtension) {
        return {
          success: false,
          error: `Invalid file type for "${file.name}". Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        };
      }
      validatedFiles.set(file, fileExtension);
    }
  }

  return { success: true, validatedFiles };
}

export interface UploadedFileInfo {
  originalName: string;
  savedFileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  extension: string;
}

/**
 * Uploads a file to the public/uploads directory
 * @param file - The file to upload
 * @param validatedExtension - The pre-validated file extension
 * @returns Information about the uploaded file
 */
export async function uploadFile(
  file: File,
  validatedExtension: string,
): Promise<UploadedFileInfo> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename with validated extension
  const savedFileName = `${uuidv4()}.${validatedExtension}`;
  const filePath = join(process.cwd(), "public", "uploads", savedFileName);

  // Save file
  await writeFile(filePath, buffer);

  // Determine file type based on extension
  const fileType = getFileType(validatedExtension);

  return {
    originalName: file.name,
    savedFileName,
    fileUrl: `/uploads/${savedFileName}`,
    fileType,
    fileSize: file.size,
    extension: validatedExtension,
  };
}

/**
 * Uploads multiple files
 * @param files - Map of files to their validated extensions
 * @returns Array of uploaded file information
 */
export async function uploadMultipleFiles(
  validatedFiles: Map<File, string>,
): Promise<UploadedFileInfo[]> {
  const uploadedFiles: UploadedFileInfo[] = [];

  for (const [file, extension] of validatedFiles) {
    const fileInfo = await uploadFile(file, extension);
    uploadedFiles.push(fileInfo);
  }

  return uploadedFiles;
}

/**
 * Gets the list of allowed file extensions
 */
export function getAllowedExtensions(): string[] {
  return [...ALLOWED_EXTENSIONS];
}
