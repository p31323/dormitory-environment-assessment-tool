
import React, { useContext, useRef, useState } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaSave, FaUpload, FaTrashAlt, FaInfoCircle, FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { ReportInfo, ChecklistAnswers } from '../types';

interface DataManagementProps {
    reportInfo: ReportInfo;
    checklistAnswers: ChecklistAnswers;
    photos: string[];
    onRestore: (data: { reportInfo: ReportInfo, checklistAnswers: ChecklistAnswers, photos: string[] }) => void;
    onClear: () => void;
}

const FOLDER_ID = '11_Bdd1tKHTAR-CJ79o-0ShE5VLB3objg';
const CLIENT_ID = '211134551544-ebes70u90l205o19p7eemcecr2mvk2u7.apps.googleusercontent.com';

const DataManagement: React.FC<DataManagementProps> = ({ reportInfo, checklistAnswers, photos, onRestore, onClear }) => {
    const { t } = useContext(LanguageContext);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cloudStatus, setCloudStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

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
        const fileName = `dorm-data-${reportInfo.dormitoryName || 'backup'}-${new Date().toISOString().split('T')[0]}.json`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleCloudBackup = async () => {
        if (cloudStatus === 'uploading') return;
        setCloudStatus('uploading');

        try {
            const tokenResponse = await new Promise<any>((resolve, reject) => {
                if (!(window as any).google?.accounts?.oauth2) {
                    return reject(new Error('SDK_NOT_LOADED'));
                }
                const client = (window as any).google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: 'https://www.googleapis.com/auth/drive.file',
                    callback: (resp: any) => {
                        if (resp.error) reject(resp);
                        else resolve(resp);
                    },
                });
                client.requestAccessToken({ prompt: 'select_account' });
            });

            const accessToken = tokenResponse.access_token;
            const data = {
                reportInfo,
                checklistAnswers,
                photos,
                exportedAt: new Date().toISOString()
            };
            const jsonString = JSON.stringify(data, null, 2);
            const fileName = `data-backup-${reportInfo.dormitoryName || 'unknown'}-${new Date().toISOString().split('T')[0]}.json`;

            const metadata = {
                name: fileName,
                parents: [FOLDER_ID],
                mimeType: 'application/json',
            };

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const body = delimiter +
                'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) +
                delimiter +
                'Content-Type: application/json\r\n' +
                'Content-Transfer-Encoding: base64\r\n\r\n' + btoa(unescape(encodeURIComponent(jsonString))) +
                close_delim;

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"',
                },
                body: body,
            });

            if (!response.ok) throw new Error('API_ERROR');
            setCloudStatus('success');
            setTimeout(() => setCloudStatus('idle'), 5000);
        } catch (error) {
            console.error('Cloud Backup Error:', error);
            setCloudStatus('error');
            setTimeout(() => setCloudStatus('idle'), 5000);
        }
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
                        資料管理與雲端備份
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center">
                        <FaInfoCircle className="mr-1" />
                        填寫完的表單資料（JSON）也可以直接備份至 Google 雲端硬碟。
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={handleCloudBackup}
                        disabled={cloudStatus === 'uploading'}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all shadow-sm ${
                            cloudStatus === 'success' ? 'bg-green-500 text-white' : 
                            cloudStatus === 'error' ? 'bg-red-500 text-white' : 
                            'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                        }`}
                    >
                        {cloudStatus === 'uploading' ? '上傳中...' : cloudStatus === 'success' ? <><FaCheckCircle className="mr-2"/>備份成功</> : <><FaCloudUploadAlt className="mr-2"/>雲端備份 (JSON)</>}
                    </button>

                    <button
                        onClick={handleExport}
                        className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors border border-gray-300 shadow-sm"
                    >
                        <FaSave className="mr-2 text-blue-500" />
                        本地匯出
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
                        清空
                    </button>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
        </div>
    );
};

export default DataManagement;
