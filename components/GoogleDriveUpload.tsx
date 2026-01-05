
import React, { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaGoogleDrive, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExternalLinkAlt, FaQuestionCircle, FaCopy, FaLink } from 'react-icons/fa';

interface GoogleDriveUploadProps {
    getPdfBlob: () => Promise<Blob | null>;
    fileName: string;
}

const FOLDER_ID = '1pPM8zepZlfHYu5-IVcP7P_4vOsw5xZWi';
const CLIENT_ID = '107079139052-ebc9550lab5vlh4hg337m7h54lpqgpek.apps.googleusercontent.com';

const GoogleDriveUpload: React.FC<GoogleDriveUploadProps> = ({ getPdfBlob, fileName }) => {
    const { t } = useContext(LanguageContext);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [currentOrigin, setCurrentOrigin] = useState('');

    useEffect(() => {
        setCurrentOrigin(window.location.origin);
    }, []);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('網址已複製！請貼到 Google Console 的「已授權的 JavaScript 來源」');
    };

    const handleUpload = async () => {
        if (status === 'uploading') return;
        setStatus('uploading');
        setErrorMessage('');
        setFileUrl(null);

        try {
            const tokenResponse = await new Promise<any>((resolve, reject) => {
                if (!(window as any).google?.accounts?.oauth2) {
                    return reject(new Error('Google SDK 未就緒，請重新整理網頁。'));
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
            if (!blob) throw new Error('PDF 生成失敗');

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

                        if (!response.ok) throw new Error('API 回傳錯誤');
                        const data = await response.json();
                        resolve(data);
                    } catch (e) { reject(e); }
                };
            });

            setFileUrl(uploadedFile.webViewLink || `https://drive.google.com/file/d/${uploadedFile.id}/view`);
            setStatus('success');
            setTimeout(() => { if(status === 'success') setStatus('idle'); }, 10000);

        } catch (error: any) {
            console.error(error);
            setStatus('error');
            if (error.error === 'invalid_request') {
                setErrorMessage('授權封鎖 (400)：來源網址未許可。');
                setShowGuide(true);
            } else {
                setErrorMessage('上傳失敗，請重試。');
            }
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
                        <span>在雲端查看</span>
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
                            <span>驗證中...</span>
                        </div>
                    ) : status === 'success' ? (
                        <><FaCheckCircle /><span>備份完成</span></>
                    ) : status === 'error' ? (
                        <><FaExclamationCircle /><span>修復錯誤</span></>
                    ) : (
                        <><FaGoogleDrive /><span>{t('uploadToDrive')}</span></>
                    )}
                </button>

                <button 
                    onClick={() => setShowGuide(!showGuide)}
                    className={`p-2 transition-colors ${showGuide ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <FaQuestionCircle />
                </button>
            </div>

            {status === 'error' && !showGuide && (
                <p className="text-[10px] text-red-500 font-medium">{errorMessage}</p>
            )}

            {showGuide && (
                <div className="bg-white border-2 border-blue-500 rounded-lg p-5 shadow-2xl max-w-sm text-left animate-fade-in z-50">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center">
                        <FaInfoCircle className="mr-1 text-blue-500" /> 解決 400 invalid_request
                    </h4>
                    
                    <div className="text-[11px] text-gray-600 space-y-3 leading-relaxed">
                        <p>Google 拒絕了請求，因為它不知道這個網站是安全的。請執行以下操作：</p>
                        
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                            <p className="font-bold text-gray-800 mb-1 flex items-center">
                                <FaLink className="mr-1" /> 1. 複製下方目前的網址：
                            </p>
                            <div className="flex items-center space-x-2">
                                <code className="bg-white p-1 border flex-grow overflow-hidden text-ellipsis whitespace-nowrap rounded text-[10px]">
                                    {currentOrigin}
                                </code>
                                <button 
                                    onClick={() => copyToClipboard(currentOrigin)}
                                    className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                                    title="複製網址"
                                >
                                    <FaCopy size={12} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="font-bold text-gray-800">2. 前往 Google Cloud Console：</p>
                            <ul className="list-disc list-inside ml-2">
                                <li>點擊左側選單的 <span className="font-bold">「用戶端 (Clients)」</span> (或憑證)。</li>
                                <li>點擊名稱為 <span className="text-blue-600 font-bold">AAA</span> 的項目。</li>
                                <li>找到 <span className="font-bold">「已授權的 JavaScript 來源」</span>。</li>
                                <li>點擊「新增 URI」並將剛才複製的網址貼上。</li>
                                <li>按下儲存。</li>
                            </ul>
                        </div>
                        
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 font-medium">
                            ※ 儲存後需等待約 60 秒再重試上傳。
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowGuide(false)}
                        className="mt-4 w-full py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded font-bold transition-colors"
                    >
                        關閉提示
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleDriveUpload;
