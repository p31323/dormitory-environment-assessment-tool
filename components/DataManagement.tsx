
import React, { useContext, useRef } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaSave, FaUpload, FaTrashAlt, FaInfoCircle } from 'react-icons/fa';
import { ReportInfo, ChecklistAnswers } from '../types';

interface DataManagementProps {
    reportInfo: ReportInfo;
    checklistAnswers: ChecklistAnswers;
    photos: string[];
    onRestore: (data: { reportInfo: ReportInfo, checklistAnswers: ChecklistAnswers, photos: string[] }) => void;
    onClear: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ reportInfo, checklistAnswers, photos, onRestore, onClear }) => {
    const { t } = useContext(LanguageContext);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = {
            reportInfo,
            checklistAnswers,
            photos,
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `dorm-assessment-${reportInfo.dormitoryName || 'backup'}-${new Date().toISOString().split('T')[0]}.json`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.reportInfo && data.checklistAnswers) {
                    onRestore({
                        reportInfo: data.reportInfo,
                        checklistAnswers: data.checklistAnswers,
                        photos: data.photos || []
                    });
                } else {
                    throw new Error('Invalid format');
                }
            } catch (err) {
                alert('導入失敗，請確保檔案格式正確。');
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const confirmClear = () => {
        if (window.confirm('確定要清空所有已填寫的內容嗎？此動作無法復原。')) {
            onClear();
        }
    };

    return (
        <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-blue-500 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <FaSave className="mr-2 text-blue-600" />
                        資料備份與還原
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <FaInfoCircle className="mr-1" />
                        提示：您可以下載 JSON 備份檔，或是手動儲存至雲端。
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors shadow-sm"
                    >
                        <FaSave className="mr-2" />
                        匯出 JSON 備份
                    </button>
                    
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors border border-gray-300"
                    >
                        <FaUpload className="mr-2" />
                        導入備份
                    </button>
                    
                    <button
                        onClick={confirmClear}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors border border-red-200"
                    >
                        <FaTrashAlt className="mr-2" />
                        清空資料
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
    );
};

export default DataManagement;
