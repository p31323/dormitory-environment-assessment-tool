
export type LanguageCode = 'zh-TW' | 'en' | 'vi' | 'id' | 'th' | 'ms';

export interface ReportInfo {
  reportNo?: string;
  checkDate: string;
  inspector: string;
  dormitoryName: string;
  dormitoryManagement: string;
}

export interface ChecklistItemAnswer {
  status: 'Y' | 'N' | null;
  remarks: string;
  correctiveAction: string;
  responsiblePerson: string;
  targetDate: string;
  actionStatus: string;
}

export type ChecklistAnswers = Record<string, ChecklistItemAnswer>;

export type ValidationErrors = Record<string, boolean>;

export interface GeneratedReport {
  reportInfo: ReportInfo;
  checklistAnswers: ChecklistAnswers;
  photos: string[];
}
