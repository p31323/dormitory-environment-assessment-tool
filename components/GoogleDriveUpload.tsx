
import React, { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaFilePdf, FaFileExcel, FaCheckCircle, FaExclamationCircle, FaExternalLinkAlt, FaQuestionCircle, FaCloudUploadAlt, FaCaretDown } from 'react-icons/fa';

interface GoogleDriveUploadProps {
    getPdfBlob: () => Promise<Blob | null>;
    getExcelBlob: () => Promise<Blob | null>;
    baseFileName: string;
}

const FOLDER_ID = '1pPM8zepZlfHYu5-IVcP7P_4vOsw5xZWi';
const CLIENT_ID = '107079139052-ebc9550lab5vlh4hg337m7h54lpqgpek.apps.googleusercontent.com';

const GoogleDriveUpload: React.FC<GoogleDriveUploadProps> = ({ getPdfBlob, getExcelBlob, baseFileName }) => {
    const { t } = useContext(LanguageContext);
    const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const [uploadFormat, setUploadFormat] = useState<'pdf' | 'excel'>('pdf');
    const [showDropdown, setShowDropdown] = useState(false);

    const handleUpload = async () => {
        if (status === 'uploading') return;
        setStatus('uploading');
        setFileUrl(null);
        setShowDropdown(false);

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
            
            // Get correct blob and metadata based on selected format
            let blob: Blob | null = null;
            let mimeType = '';
            let finalFileName = '';

            if (uploadFormat === 'pdf') {
                blob = await getPdfBlob();
                mimeType = 'application/pdf';
                finalFileName = `${baseFileName}.pdf`;
            } else {
                blob = await getExcelBlob();
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                finalFileName = `${baseFileName}.xlsx`;
            }

            if (!blob) throw new Error('BLOB_GEN_FAILED');

            const metadata = {
                name: finalFileName,
                parents: [FOLDER_ID],
                mimeType: mimeType,
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
                            'Content-Type: ' + mimeType + '\r\n' +
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
                        className="flex items-center space-x-1 text-xs font-bold text-blue-700 bg-blue-50 px-4 py-3 rounded-xl border border-blue-200 hover:bg-blue-100 transition-all shadow-sm animate-bounce"
                    >
                        <FaExternalLinkAlt size={10} />
                        <span>開啟備份檔案</span>
                    </a>
                )}

                <div className="relative flex items-stretch">
                    {/* Format Toggle Button */}
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className={`flex items-center space-x-1 px-3 rounded-l-xl border-2 border-r-0 transition-all ${
                            uploadFormat === 'pdf' ? 'text-red-600 border-red-500 hover:bg-red-50' : 'text-green-600 border-green-500 hover:bg-green-50'
                        }`}
                        title="選擇檔案格式"
                    >
                        {uploadFormat === 'pdf' ? <FaFilePdf /> : <FaFileExcel />}
                        <FaCaretDown size={10} />
                    </button>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={status === 'uploading'}
                        className={`flex items-center space-x-2 font-black py-3 px-6 rounded-r-xl transition-all shadow-md ${
                            status === 'success' ? 'bg-green-500 text-white border-2 border-green-500' : 
                            status === 'error' ? 'bg-red-500 text-white border-2 border-red-500' : 
                            uploadFormat === 'pdf' 
                                ? 'bg-white text-red-600 border-2 border-red-500 hover:bg-red-50' 
                                : 'bg-white text-green-600 border-2 border-green-500 hover:bg-green-50'
                        }`}
                    >
                        {status === 'uploading' ? (
                            <div className="flex items-center space-x-2">
                                <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>上傳中...</span>
                            </div>
                        ) : status === 'success' ? (
                            <><FaCheckCircle /><span>備份成功</span></>
                        ) : status === 'error' ? (
                            <><FaExclamationCircle /><span>上傳重試</span></>
                        ) : (
                            <><FaCloudUploadAlt /><span>上傳至雲端 ({uploadFormat.toUpperCase()})</span></>
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            <button 
                                onClick={() => { setUploadFormat('pdf'); setShowDropdown(false); }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${uploadFormat === 'pdf' ? 'bg-red-50 text-red-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                                <FaFilePdf className="text-red-500" />
                                <span>PDF 格式</span>
                            </button>
                            <button 
                                onClick={() => { setUploadFormat('excel'); setShowDropdown(false); }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm transition-colors ${uploadFormat === 'excel' ? 'bg-green-50 text-green-700 font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                                <FaFileExcel className="text-green-500" />
                                <span>Excel 格式</span>
                            </button>
                        </div>
                    )}
                </div>

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
                        💡 備份說明
                    </h4>
                    <div className="text-[11px] text-gray-600 space-y-3">
                        <p>1. 您可以切換左側圖示來選擇上傳 <strong>PDF</strong>（包含照片）或 <strong>Excel</strong>（純數據）。</p>
                        <p>2. 點擊主按鈕後，檔案將自動儲存至公司指定的 Google Drive 備份資料夾中。</p>
                        <p>3. 系統將在背景完成上傳，完成後可點擊連結確認雲端檔案。</p>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="mt-4 w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold">關閉說明</button>
                </div>
            )}
        </div>
    );
};

export default GoogleDriveUpload;
