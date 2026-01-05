
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaGoogleDrive, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExternalLinkAlt, FaQuestionCircle, FaShieldAlt, FaUserCheck } from 'react-icons/fa';

interface GoogleDriveUploadProps {
    getPdfBlob: () => Promise<Blob | null>;
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
            if (!blob) throw new Error('PDF_GEN_FAILED');

            const metadata = {
                name: fileName,
                parents: [FOLDER_ID],
                mimeType: 'application/pdf',
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
                            'Content-Type: application/pdf\r\n' +
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
            setTimeout(() => { if(status === 'success') setStatus('idle'); }, 10000);

        } catch (error: any) {
            console.error('Upload Error:', error);
            setStatus('error');
            // 如果出錯，自動打開導引提示使用者如何操作
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
                        className="flex items-center space-x-1 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors animate-fade-in"
                    >
                        <FaExternalLinkAlt size={10} />
                        <span>開啟檔案連結</span>
                    </a>
                )}

                <button
                    onClick={handleUpload}
                    disabled={status === 'uploading'}
                    className={`flex items-center space-x-2 font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-md ${
                        status === 'success' ? 'bg-green-500 text-white' : 
                        status === 'error' ? 'bg-red-500 text-white' : 
                        'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                    }`}
                >
                    {status === 'uploading' ? (
                        <div className="flex items-center space-x-2">
                            <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>驗證身分中...</span>
                        </div>
                    ) : status === 'success' ? (
                        <><FaCheckCircle /><span>備份成功</span></>
                    ) : status === 'error' ? (
                        <><FaExclamationCircle /><span>重新登入</span></>
                    ) : (
                        <><FaGoogleDrive /><span>{t('uploadToDrive')}</span></>
                    )}
                </button>

                <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className={`p-2 transition-colors ${showGuide ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                    title="登入說明"
                >
                    <FaQuestionCircle />
                </button>
            </div>

            {showGuide && (
                <div className="bg-white border-2 border-blue-600 rounded-xl p-6 shadow-2xl max-w-sm text-left animate-fade-in z-50">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center border-b pb-2">
                        <FaShieldAlt className="mr-2 text-blue-600" /> 
                        如何順利登入備份？
                    </h4>
                    
                    <div className="text-[11px] text-gray-600 space-y-4 leading-relaxed">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="font-bold text-blue-800 mb-1 flex items-center">
                                <FaUserCheck className="mr-1" /> 已正式發佈：
                            </p>
                            <p>本工具已完成 Google Cloud 設定，任何帳號皆可使用。但因未經過官方審核，首次登入需手動跳過警告。</p>
                        </div>

                        <div className="space-y-2">
                            <p className="font-bold text-gray-800 underline">登入步驟圖解：</p>
                            <ol className="list-decimal list-inside space-y-2 ml-1">
                                <li>點擊「上傳至雲端」並選擇您的 Google 帳號。</li>
                                <li>出現「Google 尚未驗證...」畫面時，點擊左下角 <span className="font-bold text-blue-600">「進階 (Advanced)」</span>。</li>
                                <li>點擊最下方的 <span className="text-red-600 font-bold underline">「前往...(不安全)」</span>。</li>
                                <li>點擊「繼續」授予權限。</li>
                            </ol>
                        </div>

                        <p className="text-[10px] text-gray-400 italic">
                            ※ 檔案將自動存入您的雲端硬碟指定資料夾中，既安全又方便。
                        </p>
                    </div>

                    <button 
                        onClick={() => setShowGuide(false)}
                        className="mt-4 w-full py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-bold transition-all"
                    >
                        關閉指南
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleDriveUpload;
