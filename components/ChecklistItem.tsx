
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { ChecklistItemData as ItemData } from '../constants/checklistData';
import { ChecklistItemAnswer, ValidationErrors } from '../types';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface ChecklistItemProps {
    itemData: ItemData;
    itemNumber: number;
    answer: ChecklistItemAnswer;
    onAnswerChange: (itemId: string, field: string, value: any) => void;
    validationErrors: ValidationErrors;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ itemData, itemNumber, answer, onAnswerChange, validationErrors }) => {
    const { t } = useContext(LanguageContext);
    
    // Safety check: handle cases where answer might be undefined
    if (!answer) return null;

    const isNonCompliant = answer.status === 'N';
    const isStatusInvalid = validationErrors[itemData.id];

    const StatusButton = ({ value, label, color, Icon }: { value: 'Y' | 'N', label: string, color: string, Icon: React.ElementType }) => {
        const isSelected = answer.status === value;
        const baseClasses = `w-full flex items-center justify-center space-x-2 text-sm font-bold py-3 px-4 rounded-lg border-2 transition-all duration-200 cursor-pointer`;
        const colorClasses = isSelected
            ? `bg-${color}-500 border-${color}-500 text-white shadow-md`
            : `bg-white border-gray-300 text-gray-600 hover:border-${color}-400 hover:text-${color}-600`;

        return (
            <label className={`${baseClasses} ${colorClasses}`}>
                <input
                    type="radio"
                    name={`status-${itemData.id}`}
                    checked={isSelected}
                    onChange={() => onAnswerChange(itemData.id, 'status', value)}
                    className="sr-only" // Hide the actual radio button
                />
                <Icon className={`text-base ${isSelected ? 'text-white' : `text-${color}-500`}`} />
                <span>{label}</span>
            </label>
        );
    };

    return (
        <div className={`p-4 ${isStatusInvalid ? 'bg-red-50 rounded-lg' : ''}`}>
            <div className="flex flex-col md:flex-row md:items-start md:space-x-4 space-y-4 md:space-y-0">
                {/* Item Description */}
                <div className="flex-grow">
                    <p className="font-medium text-gray-800">
                        <span className="text-blue-600 font-bold">{itemData.id}: </span>
                        {t(itemData.id as any)}
                    </p>
                </div>

                {/* Status Selection */}
                <div className="flex-shrink-0 w-full md:w-64">
                    <div className={`grid grid-cols-2 gap-2 ${isStatusInvalid ? 'rounded-lg p-1 border-2 border-red-400' : ''}`}>
                        <StatusButton value="Y" label={t('yes')} color="green" Icon={FaCheck} />
                        <StatusButton value="N" label={t('no')} color="red" Icon={FaTimes} />
                    </div>
                </div>

                {/* Remarks */}
                <div className="flex-shrink-0 w-full md:w-56">
                    <textarea
                        placeholder={t('remarks')}
                        value={answer.remarks || ''}
                        onChange={(e) => onAnswerChange(itemData.id, 'remarks', e.target.value)}
                        className="w-full text-sm px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                    ></textarea>
                </div>
            </div>

            {/* Conditional Fields for Non-compliance */}
            {isNonCompliant && (
                <div className="mt-4 md:pl-8 grid grid-cols-1 sm:grid-cols-2 gap-4 md:border-l-4 border-red-300 md:ml-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('correctiveAction')}</label>
                        <textarea
                            value={answer.correctiveAction || ''}
                            onChange={(e) => onAnswerChange(itemData.id, 'correctiveAction', e.target.value)}
                            className={`w-full text-sm px-3 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                                validationErrors[`${itemData.id}-correctiveAction`]
                                ? 'border-red-500 bg-red-50 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                            rows={3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('targetDate')}</label>
                        <input
                            type="date"
                            value={answer.targetDate || ''}
                            onChange={(e) => onAnswerChange(itemData.id, 'targetDate', e.target.value)}
                             className={`w-full text-sm px-3 py-1.5 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                                validationErrors[`${itemData.id}-targetDate`]
                                ? 'border-red-500 bg-red-50 focus:ring-red-500'
                                : 'border-gray-300 focus:ring-blue-500'
                            }`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChecklistItem;
