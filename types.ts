
export interface ReportInfo {
  checkDate: string;
  checker: string;
  dormNameAddress: string;
  dormManager: string;
}

export type ComplianceStatus = 'Y' | 'N' | null;

export interface ChecklistItem {
  compliant: ComplianceStatus;
  notes: string;
  correctiveAction?: string;
  responsiblePerson?: string;
}

export type Language = 'zh-TW' | 'en' | 'vi' | 'id' | 'th' | 'ms';

export type ChecklistId = 
  | `A${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `B${1 | 2 | 3 | 4 | 5}`
  | `C${1 | 2 | 3 | 4}`
  | `D${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
  | `E${1 | 2 | 3 | 4}`;

export type ChecklistState = Record<ChecklistId, ChecklistItem>;

export interface Finding {
  id: ChecklistId;
  description: string;
  detailedDescription: string;
  correctiveAction: string;
  responsiblePerson: string;
}

export type CategorizedFindings = {
  [key: string]: Finding[];
};

export interface ChecklistSectionConfig {
    id: string;
    titleKey: string;
    prefix: 'A' | 'B' | 'C' | 'D' | 'E';
    itemCount: number;
}

// Types for structured report content
export type ReportElement =
  | { type: 'heading'; level: 2 | 3; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'table'; headers: string[]; rows: string[][] };

export type ReportContent = ReportElement[];

// Type for translation messages
export type TranslationMessages = {
  [key: string]: string;
};

export type ChecklistDescriptions = Record<ChecklistId, string>;

export type LanguageTranslations = {
  messages: TranslationMessages;
  checklistDescriptions: ChecklistDescriptions;
}

export type Translations = Record<Language, LanguageTranslations>;
