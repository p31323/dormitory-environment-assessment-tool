
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaFileExcel, FaCheckCircle, FaExclamationCircle, FaExternalLinkAlt, FaQuestionCircle, FaTools, FaShieldAlt, FaUserCheck } from 'react-icons/fa';

interface GoogleDriveUploadProps {
    getPdfBlob: () => Promise<Blob | null>; // 這裡名稱保留 getPdfBlob 但實際傳入 Excel Blob
    fileName: string;
}

const FOLDER_ID = '1pPM8zepZlfHYu5-IVcP7P_4vOsw5xZWi';
const CLIENT_ID = '107079139052-ebc9550lab5vlh4hg337m7h54lpqgpek.apps.googleusercontent.com';

const GoogleDriveUpload: React.FC<GoogleDriveUploadProps> = ({ getPdfBlob, fileName }) => {
    const { t } = useContext(LanguageContext);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    const handleUpload = async () => {
        if (status === 'uploading') return;
        setStatus('uploading');
        setFileUrl(null);

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
            const blob = await getPdfBlob();
            if (!blob) throw new Error('EXCEL_GEN_FAILED');

            const metadata = {
                name: fileName,
                parents: [FOLDER_ID],
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const reader = new FileReader();
            reader.readAsArrayBuffer(blob);
            
            const uploadedFile = await new Promise<any>((resolve, reject) => {
                reader.onload = async () => {
                    try {
                        const uint8Array = new Uint8Array(reader.result as ArrayBuffer);
                        let binary = '';
                        for (let i = 0; i < uint8Array.byteLength; i++) {
                            binary += String.fromCharCode(uint8Array[i]);
                        }
                        const base64Data = btoa(binary);

                        const body = delimiter +
                            'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) +
                            delimiter +
                            'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n' +
                            'Content-Transfer-Encoding: base64\r\n\r\n' + base64Data +
                            close_delim;

                        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'multipart/related; boundary="' + boundary + '"',
                            },
                            body: body,
                        });

                        if (!response.ok) throw new Error('API_ERROR');
                        const data = await response.json();
                        resolve(data);
                    } catch (e) { reject(e); }
                };
            });

            setFileUrl(uploadedFile.webViewLink || `https://drive.google.com/file/d/${uploadedFile.id}/view`);
            setStatus('success');
            setTimeout(() => { if(status === 'success') setStatus('idle'); }, 15000);

        } catch (error: any) {
            console.error('Upload Error:', error);
            setStatus('error');
            setShowGuide(true);
        }
    };

    return (
        <div className="flex flex-col items-end space-y-2 relative">
            <div className="flex items-center space-x-2">
                {status === 'success' && fileUrl && (
                    <a 
                        href={fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-xs font-bold text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-200 hover:bg-green-100 transition-all shadow-sm animate-bounce"
                    >
                        <FaExternalLinkAlt size={10} />
                        <span>在 Drive 開啟 Excel</span>
                    </a>
                )}

                <button
                    onClick={handleUpload}
                    disabled={status === 'uploading'}
                    className={`flex items-center space-x-2 font-black py-3 px-8 rounded-xl transition-all transform hover:scale-105 shadow-md ${
                        status === 'success' ? 'bg-green-500 text-white' : 
                        status === 'error' ? 'bg-red-500 text-white' : 
                        'bg-white text-green-700 border-2 border-green-500 hover:bg-green-50'
                    }`}
                >
                    {status === 'uploading' ? (
                        <div className="flex items-center space-x-2">
                            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>雲端處理中...</span>
                        </div>
                    ) : status === 'success' ? (
                        <><FaCheckCircle /><span>Excel 已上傳</span></>
                    ) : status === 'error' ? (
                        <><FaExclamationCircle /><span>上傳重試</span></>
                    ) : (
                        <><FaFileExcel /><span>備份 Excel 至雲端</span></>
                    )}
                </button>

                <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className={`p-3 rounded-full transition-colors ${showGuide ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <FaQuestionCircle size={18} />
                </button>
            </div>

            {showGuide && (
                <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 shadow-2xl max-w-md text-left animate-fade-in z-50">
                    <h4 className="text-sm font-black text-gray-800 mb-3 flex items-center border-b pb-2">
                        <FaTools className="mr-2 text-blue-600" /> 
                        為什麼改用 Excel？
                    </h4>
                    <div className="text-[11px] text-gray-600 space-y-3">
                        <p>1. <strong>解決切割問題：</strong> Excel 以儲存格為單位，不會有 PDF 在手機端產生的「文字橫向截斷」或「分頁位置尷尬」的問題。</p>
                        <p>2. <strong>資料彙整：</strong> Excel 方便管理員進行篩選、排序，並能將多份報告彙整成年度統計表。</p>
                        <p>3. <strong>自動分頁：</strong> 本次更新將「基本資訊」、「全清單」與「改善計畫」拆分為三個 Sheet 分頁，結構更清晰。</p>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">關閉</button>
                </div>
            )}
        </div>
    );
};

export default GoogleDriveUpload;
