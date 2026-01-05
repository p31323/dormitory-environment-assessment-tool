
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { checklistData } from '../constants/checklistData';
import ChecklistItem from './ChecklistItem';
import { ChecklistAnswers, ValidationErrors } from '../types';

interface ChecklistProps {
    checklistAnswers: ChecklistAnswers;
    setChecklistAnswers: React.Dispatch<React.SetStateAction<ChecklistAnswers>>;
    validationErrors: ValidationErrors;
}

const Checklist: React.FC<ChecklistProps> = ({ checklistAnswers, setChecklistAnswers, validationErrors }) => {
    const { t } = useContext(LanguageContext);

    const handleAnswerChange = (itemId: string, field: string, value: any) => {
        setChecklistAnswers(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    return (
        <div className="bg-white shadow-md rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('checklistTitle')}</h2>
            <div className="space-y-8">
                {checklistData.map((category) => (
                    <div key={category.key}>
                        <h3 className="text-lg font-semibold text-blue-700 bg-blue-50 p-3 rounded-t-lg border-b-2 border-blue-200">
                            {t(category.key)}
                        </h3>
                        <div className="divide-y divide-gray-200">
                            {category.items.map((item, index) => (
                                <ChecklistItem
                                    key={item.id}
                                    itemData={item}
                                    itemNumber={index + 1}
                                    answer={checklistAnswers[item.id]}
                                    onAnswerChange={handleAnswerChange}
                                    validationErrors={validationErrors}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Checklist;