
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { ReportInfo, ValidationErrors } from '../types';

interface ReportInfoFormProps {
    reportInfo: ReportInfo;
    setReportInfo: React.Dispatch<React.SetStateAction<ReportInfo>>;
    validationErrors: ValidationErrors;
}

const ReportInfoForm: React.FC<ReportInfoFormProps> = ({ reportInfo, setReportInfo, validationErrors }) => {
    const { t } = useContext(LanguageContext);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setReportInfo(prev => ({ ...prev, [name]: value }));
    };

    const dormitoryOptions = [
        '移工宿舍1(臨江路)',
        '移工宿舍2(中山路二段)',
        '移工宿舍3(苑裡山柑)',
    ];

    const renderInput = (name: keyof ReportInfo, type: string = 'text') => {
        const isInvalid = validationErrors[name];
        
        if (name === 'dormitoryName') {
            return (
                <div>
                    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{t(name as any)}</label>
                    <select
                        id={name}
                        name={name}
                        value={reportInfo[name]}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 appearance-none bg-white ${
                            isInvalid
                                ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                                : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                        }`}
                    >
                        <option value="">-- {t('selectDormitory')} --</option>
                        {dormitoryOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{t(name as any)}</label>
                <input
                    type={type}
                    id={name}
                    name={name}
                    value={reportInfo[name]}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                        isInvalid
                            ? 'border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                />
            </div>
        );
    };

    return (
        <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('reportInfoTitle')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderInput('checkDate', 'date')}
                {renderInput('inspector')}
                {renderInput('dormitoryName')}
                {renderInput('dormitoryManagement')}
            </div>
        </div>
    );
};

export default ReportInfoForm;
