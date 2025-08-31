import React, { useState, useRef, useCallback, useMemo } from 'react';
import { 
  ReportInfo, 
  ChecklistState, 
  ChecklistItem, 
  ChecklistId, 
  ComplianceStatus,
  ReportContent,
  Language
} from './types';
import { CHECKLIST_SECTIONS } from './constants';
import { translations } from './translations';
import { buildReportContent, renderReportToHtmlString } from './utils/reportUtils';
import ReportInfoForm from './components/ReportInfoForm';
import ChecklistSection from './components/ChecklistSection';
import ReportDisplay from './components/ReportDisplay';
import Modal from './components/Modal';

const initialChecklistState = (): ChecklistState => {
  const state: Partial<ChecklistState> = {};
  CHECKLIST_SECTIONS.forEach(section => {
      for (let i = 1; i <= section.itemCount; i++) {
          const id = `${section.prefix}${i}` as ChecklistId;
          state[id] = { compliant: null, notes: '' };
      }
  });
  return state as ChecklistState;
};

// Get today's date in YYYY-MM-DD format
const getTodayDate = () => new Date().toISOString().split('T')[0];

export default function App() {
  const [language, setLanguage] = useState<Language>('zh-TW');
  const [reportInfo, setReportInfo] = useState<ReportInfo>({
    checkDate: getTodayDate(),
    checker: '',
    dormNameAddress: '',
    dormManager: '',
  });

  const [checklist, setChecklist] = useState<ChecklistState>(initialChecklistState);
  const [reportContent, setReportContent] = useState<ReportContent>([]);
  const [showReport, setShowReport] = useState(false);
  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  // State for validation modal
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidationModalOpen, setValidationModalOpen] = useState(false);

  const reportContentRef = useRef<HTMLDivElement>(null);
  
  const t = useCallback((key: string): string => {
      return translations[language][key] as string || key;
  }, [language]);

  const checklistDescriptions = useMemo(() => {
    return translations[language].checklistDescriptions as Record<ChecklistId, string>;
  }, [language]);

  const handleReportInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReportInfo((prev) => ({ ...prev, [name]: value }));
    if (invalidFields.has(name)) {
      setInvalidFields(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  }, [invalidFields]);

  const handleChecklistChange = useCallback((id: ChecklistId, field: keyof ChecklistItem, value: ComplianceStatus | string) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    
    // Clear validation errors for the interacted fields
    const newInvalidFields = new Set(invalidFields);
    let changed = false;
    if (field === 'compliant' && newInvalidFields.has(id)) {
      newInvalidFields.delete(id);
      changed = true;
    } else if (field === 'correctiveAction' && newInvalidFields.has(`${id}-correctiveAction`)) {
      newInvalidFields.delete(`${id}-correctiveAction`);
      changed = true;
    } else if (field === 'responsiblePerson' && newInvalidFields.has(`${id}-responsiblePerson`)) {
      newInvalidFields.delete(`${id}-responsiblePerson`);
      changed = true;
    }
    if (changed) {
      setInvalidFields(newInvalidFields);
    }

  }, [invalidFields]);

  const validateForm = () => {
    const missingFields = new Set<string>();
    const missingFieldLabels : string[] = [];

    // Validate report info
    (Object.keys(reportInfo) as Array<keyof ReportInfo>).forEach(key => {
      if (!reportInfo[key]) {
        missingFields.add(key);
        missingFieldLabels.push(t(key));
      }
    });

    // Validate checklist
    (Object.keys(checklist) as ChecklistId[]).forEach(id => {
      const item = checklist[id];
      if (item.compliant === null) {
        missingFields.add(id);
        missingFieldLabels.push(`${id} (${t('complianceStatus')})`);
      } else if (item.compliant === 'N') {
        if (!item.correctiveAction) {
          missingFields.add(`${id}-correctiveAction`);
          missingFieldLabels.push(`${id} (${t('correctiveActionPlaceholder')})`);
        }
        if (!item.responsiblePerson) {
          missingFields.add(`${id}-responsiblePerson`);
          missingFieldLabels.push(`${id} (${t('responsiblePersonPlaceholder')})`);
        }
      }
    });

    setInvalidFields(missingFields);
    