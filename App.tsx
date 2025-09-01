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
    return missingFieldLabels;
  };

  const generateReport = useCallback(() => {
    const missingFieldLabels = validateForm();
    if (missingFieldLabels.length > 0) {
      setError(t('validationError'));
      setValidationErrors(missingFieldLabels);
      setValidationModalOpen(true);
      setShowReport(false);
      return;
    }

    setError('');
    
    const newReportContent = buildReportContent(reportInfo, checklist, language);
    setReportContent(newReportContent);
    setShowReport(true);
    setTimeout(() => {
        reportContentRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

  }, [reportInfo, checklist, language, t]);

  const generateDocxBlob = useCallback(() => {
    const selectedLangHtml = renderReportToHtmlString(reportContent);
    let finalHtml = selectedLangHtml;
    
    // If current language is not Chinese, generate and append the Chinese report
    if (language !== 'zh-TW') {
        const chineseReportContent = buildReportContent(reportInfo, checklist, 'zh-TW');
        const chineseHtml = renderReportToHtmlString(chineseReportContent);
        finalHtml += `<p style="page-break-before: always;"></p>${chineseHtml}`;
    }

    const content = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${finalHtml}</body></html>`;
    return (window as any).htmlDocx.asBlob(content);
  }, [reportInfo, checklist, language, reportContent]);


  const downloadWordReport = useCallback(() => {
    if (typeof (window as any).saveAs === 'undefined') {
      alert('Word generation library not loaded.');
      return;
    }
    const blob = generateDocxBlob();
    (window as any).saveAs(blob, `${reportInfo.checkDate.replace(/-/g, '')}-${t('wordFilename')}.docx`);
  }, [reportInfo.checkDate, t, generateDocxBlob]);
  
  const handleShare = useCallback(async () => {
    const blob = generateDocxBlob();
    const fileName = `${reportInfo.checkDate.replace(/-/g, '')}-${t('wordFilename')}.docx`;
    const file = new File([blob], fileName, {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                files: [file],
                title: t('shareTitle'),
                text: t('shareText'),
            });
        } catch (error) {
            const err = error as Error;
            // User cancelled the share dialog. This is a normal flow, not an error.
            if (err.name === 'AbortError') {
                console.log('Share action cancelled by user.');
            // The environment may block sharing, resulting in a permission error.
            } else if (err.name === 'NotAllowedError' || err.message.toLowerCase().includes('permission denied')) {
                console.error('Share permission denied:', err);
                alert(t('sharePermissionDenied'));
            } else {
                // Handle other unexpected errors.
                console.error('An unexpected error occurred during sharing:', err);
                alert(`${t('shareGenericError')}: ${err.message}`);
            }
        }
    } else {
        alert(t('shareNotSupported'));
    }
  }, [generateDocxBlob, reportInfo.checkDate, t]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 p-4">
      <h1 className="text-4xl font-bold text-center text-indigo-800 mb-8 mt-4">{t('appTitle')}</h1>

      <div className="max-w-4xl mx-auto mb-6 p-4 bg-white/70 rounded-lg shadow-md backdrop-blur-sm">
        <label htmlFor="language-select" className="block text-sm font-medium text-gray-800 mb-2">{t('selectLanguage')}:</label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
        >
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="vi">Tiếng Việt (越南文)</option>
          <option value="id">Bahasa Indonesia (印尼文)</option>
          <option value="th">ภาษาไทย (泰文)</option>
          <option value="ms">Bahasa Melayu (馬來文)</option>
        </select>
      </div>

      <ReportInfoForm 
        reportInfo={reportInfo} 
        onReportInfoChange={handleReportInfoChange} 
        error={error} 
        t={t}
        invalidFields={invalidFields}
      />

      <div className="max-w-4xl mx-auto bg-gray-50 p-6 rounded-lg shadow-xl">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">{t('checklistTitle')}</h2>
        {CHECKLIST_SECTIONS.map(section => (
          <ChecklistSection
            key={section.id}
// Fix: Cast section.titleKey to string to match the type expected by the `t` function.
            title={t(section.titleKey as string)}
            prefix={section.prefix}
            itemCount={section.itemCount}
            checklistData={checklist}
            onChecklistChange={handleChecklistChange}
            checklistDescriptions={checklistDescriptions}
            t={t}
            invalidFields={invalidFields}
          />
        ))}
        <button
          onClick={generateReport}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 mt-8"
        >
          {t('generateReportButton')}
        </button>
      </div>

      {showReport && (
        <ReportDisplay
          reportContent={reportContent}
          reportContentRef={reportContentRef}
          onDownloadWord={downloadWordReport}
          onShare={handleShare}
          onHideReport={() => setShowReport(false)}
          t={t}
        />
      )}
      
      <Modal
        isOpen={isValidationModalOpen}
        onClose={() => setValidationModalOpen(false)}
        title={t('validationAlertTitle')}
      >
        <p className="text-sm text-gray-500 mb-4">{t('validationModalIntro')}</p>
        <ul className="list-disc list-inside space-y-1 text-left max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-md">
          {validationErrors.map((error, index) => (
            <li key={index} className="text-sm text-gray-800">{error}</li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}