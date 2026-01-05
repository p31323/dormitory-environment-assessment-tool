
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Language, translations, Translation } from './constants/translations';
import { checklistData, ChecklistCategory } from './constants/checklistData';
import { ReportInfo, ChecklistAnswers, ValidationErrors, GeneratedReport, LanguageCode } from './types';
import LanguageSelector from './components/LanguageSelector';
import ReportInfoForm from './components/ReportInfoForm';
import Checklist from './components/Checklist';
import ImageUpload from './components/ImageUpload';
import ReportPreview from './components/ReportPreview';
import GoogleDriveUpload from './components/GoogleDriveUpload';
import ValidationErrorModal from './components/ValidationErrorModal';
import { FaFileSignature, FaDownload } from 'react-icons/fa';
import { LanguageContext } from './contexts/LanguageContext';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const STORAGE_KEY = 'dorm_assessment_data_v2';

const App: React.FC = () => {
  const [language, setLanguage] = useState<LanguageCode>('zh-TW');
  
  const getInitialReportInfo = (): ReportInfo => ({
    checkDate: new Date().toISOString().split('T')[0],
    inspector: '',
    dormitoryName: '',
    dormitoryManagement: '',
  });

  const getInitialChecklistAnswers = (): ChecklistAnswers => {
    const answers: ChecklistAnswers = {};
    checklistData.forEach(category => {
      category.items.forEach(item => {
        answers[item.id] = {
          status: null,
          remarks: '',
          correctiveAction: '',
          responsiblePerson: '',
          targetDate: '',
          actionStatus: 'pending',
        };
      });
    });
    return answers;
  };

  const [reportInfo, setReportInfo] = useState<ReportInfo>(getInitialReportInfo);
  const [checklistAnswers, setChecklistAnswers] = useState<ChecklistAnswers>(getInitialChecklistAnswers);
  const [photos, setPhotos] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  const reportPreviewRef = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.reportInfo) setReportInfo(parsed.reportInfo);
        if (parsed.checklistAnswers) setChecklistAnswers(parsed.checklistAnswers);
        if (parsed.photos) setPhotos(parsed.photos);
        if (parsed.language) setLanguage(parsed.language);
      } catch (e) {
        console.error("Failed to load saved data", e);
      }
    }
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const dataToSave = {
      reportInfo,
      checklistAnswers,
      photos,
      language,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [reportInfo, checklistAnswers, photos, language]);
  
  const t = useCallback((key: keyof Translation, replacements?: Record<string, string | number>): string => {
    const applyReplacements = (text: string): string => {
        if (!replacements) return text;
        let result = text;
        for (const placeholder in replacements) {
            const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
            result = result.replace(regex, String(replacements[placeholder]));
        }
        return result;
    };

    const selectedLangText = applyReplacements(translations[language][key] || String(key));
    if (language === 'zh-TW') return selectedLangText;

    const chineseText = applyReplacements(translations['zh-TW'][key] || String(key));
    if (selectedLangText === chineseText) return selectedLangText;

    return `${selectedLangText} (${chineseText})`;
  }, [language]);

  const handleValidation = (): string[] => {
    const errors: string[] = [];
    const newValidationErrors: ValidationErrors = {};

    Object.keys(reportInfo).forEach(key => {
        const fieldKey = key as keyof ReportInfo;
        if (fieldKey !== 'reportNo' && !reportInfo[fieldKey]) {
            errors.push(t(fieldKey as keyof Translation));
            newValidationErrors[fieldKey] = true;
        }
    });

    Object.keys(checklistAnswers).forEach(itemId => {
        const item = checklistAnswers[itemId];
        if (item.status === null) {
            errors.push(`${t('checklistTitle')} (${itemId}): ${t('status')}`);
            newValidationErrors[itemId] = true;
        } else if (item.status === 'N') {
            if (!item.correctiveAction) {
                errors.push(`${t('checklistTitle')} (${itemId}): ${t('correctiveAction')}`);
                newValidationErrors[`${itemId}-correctiveAction`] = true;
            }
            if (!item.responsiblePerson) {
                errors.push(`${t('checklistTitle')} (${itemId}): ${t('responsiblePerson')}`);
                newValidationErrors[`${itemId}-responsiblePerson`] = true;
            }
            if (!item.targetDate) {
                errors.push(`${t('checklistTitle')} (${itemId}): ${t('targetDate')}`);
                newValidationErrors[`${itemId}-targetDate`] = true;
            }
        }
    });

    setValidationErrors(newValidationErrors);
    return errors;
  }

  const handleGenerateReport = () => {
    const messages = handleValidation();
    if (messages.length > 0) {
        setErrorMessages(messages);
        setShowErrorModal(true);
        setGeneratedReport(null);
    } else {
        setErrorMessages([]);
        setShowErrorModal(false);
        const reportNumber = `${reportInfo.checkDate.replace(/-/g, '')}-DORM-001`;
        const report: GeneratedReport = {
            reportInfo: { ...reportInfo, reportNo: reportNumber },
            checklistAnswers: { ...checklistAnswers },
            photos: [...photos],
        };
        setGeneratedReport(report);
    }
  };

  const addCanvasToPdf = (pdf: any, canvas: HTMLCanvasElement, startsOnNewPage: boolean) => {
    const margin = 10; 
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pdfWidth - (2 * margin);
    const usableHeight = pdfHeight - (2 * margin);
    const imgWidth = usableWidth;
    const imgHeight = imgWidth * (canvas.height / canvas.width);
    const imgData = canvas.toDataURL('image/png');

    let heightLeft = imgHeight;
    let sourceY = 0;
    let isFirstIteration = true;

    while (heightLeft > 0) {
      if (!isFirstIteration || startsOnNewPage) pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, margin - sourceY, imgWidth, imgHeight);
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, margin, 'F'); 
      pdf.rect(0, pdfHeight - margin, pdfWidth, margin, 'F'); 
      pdf.rect(0, 0, margin, pdfHeight, 'F'); 
      pdf.rect(pdfWidth - margin, 0, margin, pdfHeight, 'F'); 
      sourceY += usableHeight;
      heightLeft -= usableHeight;
      isFirstIteration = false;
    }
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    if (!reportPreviewRef.current || typeof window.html2canvas === 'undefined' || typeof window.jspdf === 'undefined') return null;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const mainContentEl = document.getElementById('report-main-content');
    const attachmentsEl = document.getElementById('report-attachments-section');

    if (generatedReport && generatedReport.photos.length > 0 && mainContentEl && attachmentsEl) {
        const mainCanvas = await window.html2canvas(mainContentEl, { scale: 2, useCORS: true });
        addCanvasToPdf(pdf, mainCanvas, false);
        const attachmentCanvas = await window.html2canvas(attachmentsEl, { scale: 2, useCORS: true });
        addCanvasToPdf(pdf, attachmentCanvas, true);
    } else {
        const canvas = await window.html2canvas(reportPreviewRef.current, { scale: 2, useCORS: true });
        addCanvasToPdf(pdf, canvas, false);
    }
    return pdf.output('blob');
  };

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
        const blob = await generatePdfBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dormitory-assessment-report-${reportInfo.checkDate || 'report'}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error("Download Error:", error);
    } finally {
        setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (generatedReport) reportPreviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [generatedReport]);

  const pdfFileName = `dormitory-report-${reportInfo.dormitoryName || 'dorm'}-${reportInfo.checkDate}.pdf`;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="container mx-auto p-4 sm:p-6 md:p-8 font-sans">
        <header className="bg-white shadow-md rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
               <FaFileSignature className="text-4xl text-blue-600" />
               <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('title')}</h1>
                  <p className="text-gray-500">{t('subtitle')}</p>
                </div>
            </div>
            <LanguageSelector />
          </div>
        </header>

        <main className="space-y-8">
          <ReportInfoForm reportInfo={reportInfo} setReportInfo={setReportInfo} validationErrors={validationErrors} />
          <Checklist checklistAnswers={checklistAnswers} setChecklistAnswers={setChecklistAnswers} validationErrors={validationErrors} />
          <ImageUpload photos={photos} setPhotos={setPhotos} />
          <div className="flex justify-center">
            <button onClick={handleGenerateReport} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-transform transform hover:scale-105 w-full sm:w-auto">
              {t('generateReportButton')}
            </button>
          </div>
        </main>

        {generatedReport && (
          <div className="mt-12">
            <div className="flex flex-col sm:flex-row justify-end mb-4 space-y-2 sm:space-y-0 sm:space-x-4">
                <GoogleDriveUpload getPdfBlob={generatePdfBlob} fileName={pdfFileName} />
                <button onClick={handleDownloadReport} disabled={isDownloading} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md">
                  {isDownloading ? (
                    <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>{t('downloading')}</span></>
                  ) : (
                    <><FaDownload /><span>{t('downloadReportButton')}</span></>
                  )}
                </button>
            </div>
            <div ref={reportPreviewRef}><ReportPreview report={generatedReport} /></div>
          </div>
        )}

        {showErrorModal && <ValidationErrorModal onClose={() => setShowErrorModal(false)} errorFields={errorMessages} />}
      </div>
    </LanguageContext.Provider>
  );
};

export default App;
