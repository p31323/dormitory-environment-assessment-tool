
import React from 'react';
import { ReportInfo } from '../types';

interface ReportInfoFormProps {
  reportInfo: ReportInfo;
  onReportInfoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error: string;
  t: (key: string) => string;
  invalidFields: Set<string>;
}

const ReportInfoForm: React.FC<ReportInfoFormProps> = ({ reportInfo, onReportInfoChange, error, t, invalidFields }) => {
  const formFields: { id: keyof ReportInfo; labelKey: string; type: string; placeholderKey: string }[] = [
    { id: 'checkDate', labelKey: 'checkDate', type: 'date', placeholderKey: '' },
    { id: 'checker', labelKey: 'checker', type: 'text', placeholderKey: 'checkerPlaceholder' },
    { id: 'dormNameAddress', labelKey: 'dormNameAddress', type: 'text', placeholderKey: 'dormNameAddressPlaceholder' },
    { id: 'dormManager', labelKey: 'dormManager', type: 'text', placeholderKey: 'dormManagerPlaceholder' },
  ];

  return (
    <div className="max-w-4xl mx-auto mb-8 p-6 bg-white rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">{t('reportInfoTitle')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formFields.map(field => (
          <div key={field.id} className="flex flex-col">
            <label htmlFor={field.id} className="mb-2 text-gray-700 font-medium">
              {t(field.labelKey)} <span className="text-red-500">*</span>
            </label>
            <input
              type={field.type}
              id={field.id}
              name={field.id}
              value={reportInfo[field.id]}
              onChange={onReportInfoChange}
              className={`p-3 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 shadow-sm ${
                invalidFields.has(field.id) ? 'bg-red-100 border-red-400' : 'border-gray-300'
              }`}
              placeholder={field.placeholderKey ? t(field.placeholderKey) : ''}
              required
            />
          </div>
        ))}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md shadow-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ReportInfoForm;
