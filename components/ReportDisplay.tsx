import React, { useState, useEffect } from 'react';
import { ReportContent } from '../types';

interface ReportDisplayProps {
  reportContent: ReportContent;
  reportContentRef: React.RefObject<HTMLDivElement>;
  onDownloadWord: () => void;
  onShare: () => void;
  onHideReport: () => void;
  t: (key: string) => string;
}

const ReportDisplay: React.FC<ReportDisplayProps> = ({
  reportContent,
  reportContentRef,
  onDownloadWord,
  onShare,
  onHideReport,
  t
}) => {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Check if the Web Share API is available and can share files.
    // The file is a dummy one just for the capability check.
    const dummyFile = new File([''], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    if (navigator.share && typeof navigator.canShare === 'function' && navigator.canShare({ files: [dummyFile] })) {
      setCanShare(true);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-xl border-t-4 border-indigo-500">
      <h2 className="text-3xl font-bold text-indigo-800 mb-6">{t('generatedReportTitle')}</h2>
      <div
        ref={reportContentRef}
        className="font-sans text-gray-800 bg-gray-50 p-6 rounded-md border border-gray-200"
      >
        {reportContent.map((element, index) => {
          switch (element.type) {
            case 'heading':
              if (element.level === 2) {
                return <h2 key={index} className="text-2xl font-semibold mb-4 text-gray-800">{element.content}</h2>;
              }
              return <h3 key={index} className="text-xl font-semibold my-4 text-gray-700"><strong>{element.content}</strong></h3>;
            case 'paragraph':
              return <p key={index} className="mb-2 text-gray-800" dangerouslySetInnerHTML={{ __html: element.content }} />;
            case 'table':
              return (
                <table key={index} className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg overflow-hidden my-4 shadow-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {element.headers.map((header, hIndex) => (
                        <th key={hIndex} className="px-4 py-2 border-r last:border-r-0 border-gray-200">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {element.rows.map((row, rIndex) => (
                      <tr key={rIndex}>
                        {row.map((cell, cIndex) => (
                          <td key={cIndex} className="px-4 py-2 whitespace-pre-wrap text-sm text-gray-800 border-r last:border-r-0 border-gray-100">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            default:
              return null;
          }
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={onDownloadWord}
          className="flex-grow md:flex-grow-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {t('downloadWordButton')}
        </button>
        {canShare && (
           <button
             onClick={onShare}
             className="flex-grow md:flex-grow-0 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
           >
             {t('shareReportButton')}
           </button>
        )}
        <button
          onClick={onHideReport}
          className="flex-grow md:flex-grow-0 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg shadow-md transform transition duration-300 ease-in-out hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300"
        >
          {t('hideReportButton')}
        </button>
      </div>
    </div>
  );
};

export default ReportDisplay;