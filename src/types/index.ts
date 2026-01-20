import { UserRole, State } from "@prisma/client";

export type { UserRole, State };

export interface StudentProfile {
  firstName: string;
  lastName: string;
  middleName?: string;
  faculty: string;
  department: string;
  course: string;
  level: string;
  semester: string;
  session: string;
  phoneNumber?: string;
}

export interface LogbookData {
  companyName: string;
  companyAddress: string;
  companyState: State;
  startDate: Date;
  endDate: Date;
  industrySupervisorName: string;
  industrySupervisorEmail: string;
  industrySupervisorPhone?: string;
}

export interface DailyEntry {
  weekNumber: number;
  dayOfWeek: string;
  date: Date;
  description: string;
  skillsLearned?: string;
  attachments?: File[];
}

export interface WeeklySummary {
  weekNumber: number;
  summary: string;
  attachments?: File[];
}
