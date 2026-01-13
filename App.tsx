
import React, { useState, useEffect, useCallback } from 'react';
import { translations, Translation } from './constants/translations';
import { checklistData } from './constants/checklistData';
import { ReportInfo, ChecklistAnswers, ValidationErrors, GeneratedReport, LanguageCode, ChecklistItemAnswer } from './types';
import LanguageSelector from './components/LanguageSelector';
import ReportInfoForm from './components/ReportInfoForm';
import Checklist from './components/Checklist';
import ImageUpload from './components/ImageUpload';
import ReportPreview from './components/ReportPreview';
import GoogleDriveUpload from './components/GoogleDriveUpload';
import ValidationErrorModal from './components/ValidationErrorModal';
import { FaFileSignature, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import { LanguageContext } from './contexts/LanguageContext';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    XLSX: any;
    google: any;
  }
}

const STORAGE_KEY = 'dorm_assessment_data_v2';

const App: React.FC = () => {
  const [language, setLanguage] = useState<LanguageCode>('zh-TW');

  const createInitialAnswers = (): ChecklistAnswers => {
    const initial: ChecklistAnswers = {};
    checklistData.forEach(cat => {
      cat.items.forEach(item => {
        initial[item.id] = {
          status: null, 
          remarks: '', 
          correctiveAction: '', 
          responsiblePerson: '', 
          targetDate: '', 
          actionStatus: 'pending'
        };
      });
    });
    return initial;
  };

  const [reportInfo, setReportInfo] = useState<ReportInfo>({
    checkDate: new Date().toISOString().split('T')[0],
    inspector: '',
    dormitoryName: '',
    dormitoryManagement: '',
  });
  const [checklistAnswers, setChecklistAnswers] = useState<ChecklistAnswers>(createInitialAnswers);
  const [photos, setPhotos] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.reportInfo) setReportInfo(parsed.reportInfo);
        if (parsed.checklistAnswers) {
          setChecklistAnswers(prev => ({ ...prev, ...parsed.checklistAnswers }));
        }
        if (parsed.photos) setPhotos(parsed.photos);
        if (parsed.language) setLanguage(parsed.language);
      } catch (e) { console.error("Load fail", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ reportInfo, checklistAnswers, photos, language }));
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
    return `${selectedLangText} (${chineseText})`;
  }, [language]);

  const handleValidation = (): string[] => {
    const errors: string[] = [];
    const newValidationErrors: ValidationErrors = {};
    if (!reportInfo.inspector) { errors.push(t('inspector')); newValidationErrors['inspector'] = true; }
    if (!reportInfo.dormitoryName) { errors.push(t('dormitoryName')); newValidationErrors['dormitoryName'] = true; }
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
        const reportNumber = `${reportInfo.checkDate.replace(/-/g, '')}-DORM-001`;
        setGeneratedReport({
            reportInfo: { ...reportInfo, reportNo: reportNumber },
            checklistAnswers: { ...checklistAnswers },
            photos: [...photos],
        });
    }
  };

  const generateExcelBlob = async (): Promise<Blob | null> => {
    if (typeof window.XLSX === 'undefined') return null;
    const XLSX = window.XLSX;
    const wb = XLSX.utils.book_new();

    const summaryData = [
        [t('reportTemplateTitle')],
        [],
        [t('reportNo'), generatedReport?.reportInfo.reportNo],
        [t('checkDate'), reportInfo.checkDate],
        [t('inspector'), reportInfo.inspector],
        [t('dormitoryName'), reportInfo.dormitoryName],
        [t('dormitoryManagement'), reportInfo.dormitoryManagement],
        [],
        [t('conclusionSectionTitle')],
        [(Object.values(checklistAnswers) as ChecklistItemAnswer[]).some(a => a.status === 'N') ? t('conclusionTextNonCompliant') : t('conclusionTextCompliant')]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

    const checklistRows = [[t('item'), t('category'), t('status'), t('remarks')]];
    checklistData.forEach(cat => {
        cat.items.forEach(item => {
            const ans = checklistAnswers[item.id];
            checklistRows.push([
                `${item.id}: ${t(item.id as any)}`,
                t(cat.key as any),
                ans ? (ans.status === 'Y' ? t('yes') : ans.status === 'N' ? t('no') : '-') : '-',
                ans?.remarks || ''
            ]);
        });
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(checklistRows), "Full Checklist");

    const actionRows = [[t('item'), t('correctiveAction'), t('responsiblePerson'), t('targetDate'), t('actionStatus')]];
    let hasN = false;
    Object.keys(checklistAnswers).forEach(id => {
        const ans = checklistAnswers[id];
        if (ans && ans.status === 'N') {
            hasN = true;
            actionRows.push([id, ans.correctiveAction, ans.responsiblePerson, ans.targetDate, t('statusPending')]);
        }
    });
    if (!hasN) actionRows.push([t('noFindingsItem'), 'N/A', 'N/A', 'N/A', 'N/A']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(actionRows), "Action Plan");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  };

  const generatePdfBlob = async (): Promise<Blob | null> => {
    const reportElement = document.getElementById('full-report-container');
    if (!reportElement || !window.html2canvas || !window.jspdf) return null;

    try {
        const canvas = await window.html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: reportElement.scrollWidth,
            windowHeight: reportElement.scrollHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        return pdf.output('blob');
    } catch (error) {
        console.error('PDF generation error:', error);
        return null;
    }
  };

  const handleDownloadExcel = async () => {
    const blob = await generateExcelBlob();
    if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report-${reportInfo.dormitoryName}-${reportInfo.checkDate}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
    }
  };

  const handleDownloadPdf = async () => {
    const blob = await generatePdfBlob();
    if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report-${reportInfo.dormitoryName}-${reportInfo.checkDate}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div className="container mx-auto p-4 sm:p-6 md:p-8 font-sans max-w-5xl">
        <header className="bg-white shadow-md rounded-xl p-6 mb-8 border-b-4 border-blue-500">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
               <FaFileSignature className="text-4xl text-blue-600" />
               <div className="text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{t('title')}</h1>
                  <p className="text-gray-500 text-sm font-medium">{t('subtitle')}</p>
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
            <button onClick={handleGenerateReport} className="bg-blue-600 text-white font-black py-4 px-12 rounded-xl hover:bg-blue-700 shadow-lg transition-all transform hover:scale-105 active:scale-95 w-full sm:w-auto text-lg">
              {t('generateReportButton')}
            </button>
          </div>
        </main>

        {generatedReport && (
          <div className="mt-12 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-end mb-6 space-y-2 sm:space-y-0 sm:space-x-4">
                <GoogleDriveUpload 
                  getPdfBlob={generatePdfBlob} 
                  getExcelBlob={generateExcelBlob}
                  baseFileName={`report-${reportInfo.dormitoryName}-${reportInfo.checkDate}`} 
                />
                <button 
                  onClick={handleDownloadPdf} 
                  className="bg-red-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-red-700 shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <FaFilePdf className="text-lg" />
                  <span>下載 PDF</span>
                </button>
                <button 
                  onClick={handleDownloadExcel} 
                  className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 shadow-md transition-all flex items-center justify-center space-x-2"
                >
                  <FaFileExcel className="text-lg" />
                  <span>下載 Excel</span>
                </button>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-gray-200">
                <ReportPreview report={generatedReport} />
            </div>
          </div>
        )}

        {showErrorModal && <ValidationErrorModal onClose={() => setShowErrorModal(false)} errorFields={errorMessages} />}
      </div>
    </LanguageContext.Provider>
  );
};

export default App;
