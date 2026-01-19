import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LogbookData {
  student: {
    firstName: string;
    lastName: string;
    middleName?: string;
    matricNumber: string;
    faculty: string;
    department: string;
    course: string;
    level: string;
    session: string;
  };
  logbook: {
    companyName: string;
    companyAddress: string;
    companyState: string;
    startDate: Date;
    endDate: Date;
  };
  entries: Array<{
    weekNumber: number;
    dayOfWeek: string;
    date: Date;
    description: string;
    skillsLearned?: string;
  }>;
  weeklyReports: Array<{
    weekNumber: number;
    studentSummary: string;
    industrySupervisorComment?: string;
    schoolSupervisorComment?: string;
  }>;
  industrySupervisor?: {
    firstName: string;
    lastName: string;
    company: string;
    position: string;
  };
}

export function generateLogbookPDF(data: LogbookData) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text("AHMADU BELLO UNIVERSITY, ZARIA", 105, 20, { align: "center" });
  doc.setFontSize(14);
  doc.text("SIWES LOGBOOK", 105, 28, { align: "center" });

  // Student Information
  doc.setFontSize(12);
  doc.text("STUDENT INFORMATION", 14, 40);
  doc.setFontSize(10);
  const studentInfo = [
    ["Name:", `${data.student.firstName} ${data.student.middleName || ""} ${data.student.lastName}`],
    ["Matric Number:", data.student.matricNumber],
    ["Faculty:", data.student.faculty],
    ["Department:", data.student.department],
    ["Course:", data.student.course],
    ["Level:", data.student.level],
    ["Session:", data.student.session],
  ];

  autoTable(doc, {
    startY: 45,
    body: studentInfo,
    theme: "plain",
    styles: { fontSize: 9 },
  });

  // Company Information
  doc.setFontSize(12);
  doc.text("COMPANY/ORGANIZATION INFORMATION", 14, doc.lastAutoTable.finalY + 10);
  const companyInfo = [
    ["Company Name:", data.logbook.companyName],
    ["Address:", data.logbook.companyAddress],
    ["State:", data.logbook.companyState.replace(/_/g, " ")],
    ["Training Period:", `${new Date(data.logbook.startDate).toLocaleDateString()} - ${new Date(data.logbook.endDate).toLocaleDateString()}`],
  ];

  if (data.industrySupervisor) {
    companyInfo.push(
      ["Supervisor:", `${data.industrySupervisor.firstName} ${data.industrySupervisor.lastName}`],
      ["Position:", data.industrySupervisor.position]
    );
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 15,
    body: companyInfo,
    theme: "plain",
    styles: { fontSize: 9 },
  });

  // Daily Entries
  doc.addPage();
  doc.setFontSize(14);
  doc.text("DAILY LOGBOOK ENTRIES", 105, 20, { align: "center" });

  // Group entries by week
  const entriesByWeek = data.entries.reduce((acc, entry) => {
    if (!acc[entry.weekNumber]) {
      acc[entry.weekNumber] = [];
    }
    acc[entry.weekNumber].push(entry);
    return acc;
  }, {} as Record<number, typeof data.entries>);

  let currentY = 30;

  Object.keys(entriesByWeek)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach((weekNum) => {
      const weekEntries = entriesByWeek[parseInt(weekNum)];

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.text(`Week ${weekNum}`, 14, currentY);
      currentY += 5;

      const tableData = weekEntries.map((entry) => [
        entry.dayOfWeek,
        new Date(entry.date).toLocaleDateString(),
        entry.description,
        entry.skillsLearned || "-",
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [["Day", "Date", "Activities", "Skills Learned"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 80 },
          3: { cellWidth: 50 },
        },
      });

      currentY = doc.lastAutoTable.finalY + 10;

      // Add weekly report if available
      const weeklyReport = data.weeklyReports.find(
        (r) => r.weekNumber === parseInt(weekNum)
      );

      if (weeklyReport) {
        doc.setFontSize(10);
        doc.text("Weekly Summary:", 14, currentY);
        currentY += 5;
        const summaryLines = doc.splitTextToSize(
          weeklyReport.studentSummary,
          180
        );
        doc.setFontSize(9);
        doc.text(summaryLines, 14, currentY);
        currentY += summaryLines.length * 5 + 5;

        if (weeklyReport.industrySupervisorComment) {
          doc.setFontSize(10);
          doc.text("Industry Supervisor Comment:", 14, currentY);
          currentY += 5;
          const commentLines = doc.splitTextToSize(
            weeklyReport.industrySupervisorComment,
            180
          );
          doc.setFontSize(9);
          doc.text(commentLines, 14, currentY);
          currentY += commentLines.length * 5 + 5;
        }

        if (weeklyReport.schoolSupervisorComment) {
          doc.setFontSize(10);
          doc.text("School Supervisor Comment:", 14, currentY);
          currentY += 5;
          const commentLines = doc.splitTextToSize(
            weeklyReport.schoolSupervisorComment,
            180
          );
          doc.setFontSize(9);
          doc.text(commentLines, 14, currentY);
          currentY += commentLines.length * 5 + 10;
        }
      }
    });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc;
}
