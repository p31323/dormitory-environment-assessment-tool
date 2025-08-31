
import React from 'react';
import { ChecklistState, ChecklistId, ComplianceStatus, ChecklistItem } from '../types';

interface ChecklistSectionProps {
  title: string;
  prefix: 'A' | 'B' | 'C' | 'D' | 'E';
  itemCount: number;
  checklistData: ChecklistState;
  onChecklistChange: (id: ChecklistId, field: keyof ChecklistItem, value: ComplianceStatus | string) => void;
  checklistDescriptions: Record<ChecklistId, string>;
  t: (key: string) => string;
  invalidFields: Set<string>;
}

const ChecklistSection: React.FC<ChecklistSectionProps> = ({ title, prefix, itemCount, checklistData, onChecklistChange, checklistDescriptions, t, invalidFields }) => {
  const items = Array.from({ length: itemCount }, (_, i) => i + 1);

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="space-y-4">
        {items.map(index => {
          const id = `${prefix}${index}` as ChecklistId;
          const currentItem = checklistData[id];
          
          return (
            <div key={id} className={`p-3 rounded-md shadow-sm ${invalidFields.has(id) ? 'bg-red-100' : 'bg-gray-50'}`}>
              <div className="flex flex-col md:flex-row items-start md:items-center">
                <label className="flex-shrink-0 w-full md:w-1/2 text-gray-700 font-medium mb-2 md:mb-0">
                  {prefix}{index}. {checklistDescriptions[id]}
                </label>
                <div className="flex w-full md:w-1/4 space-x-4 mb-2 md:mb-0">
                  <label className="flex items-center text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name={`${id}-compliant`}
                      value="Y"
                      checked={currentItem.compliant === 'Y'}
                      onChange={() => onChecklistChange(id, 'compliant', 'Y')}
                      className="form-radio h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="ml-2">{t('compliantY')}</span>
                  </label>
                  <label className="flex items-center text-gray-600 cursor-pointer">
                    <input
                      type="radio"
                      name={`${id}-compliant`}
                      value="N"
                      checked={currentItem.compliant === 'N'}
                      onChange={() => onChecklistChange(id, 'compliant', 'N')}
                      className="form-radio h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="ml-2">{t('compliantN')}</span>
                  </label>
                </div>
                <textarea
                  placeholder={t('notesPlaceholder')}
                  value={currentItem.notes}
                  onChange={(e) => onChecklistChange(id, 'notes', e.target.value)}
                  className="mt-2 md:mt-0 w-full md:w-1/4 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 shadow-sm"
                />
              </div>
              {currentItem.compliant === 'N' && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 border-t pt-3 border-gray-200">
                  <input
                    type="text"
                    placeholder={t('correctiveActionPlaceholder')}
                    value={currentItem.correctiveAction || ''}
                    onChange={(e) => onChecklistChange(id, 'correctiveAction', e.target.value)}
                    className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 shadow-sm ${
                      invalidFields.has(`${id}-correctiveAction`) ? 'bg-red-100 border-red-400' : 'border-gray-300'
                    }`}
                  />
                  <input
                    type="text"
                    placeholder={t('responsiblePersonPlaceholder')}
                    value={currentItem.responsiblePerson || ''}
                    onChange={(e) => onChecklistChange(id, 'responsiblePerson', e.target.value)}
                     className={`w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 shadow-sm ${
                      invalidFields.has(`${id}-responsiblePerson`) ? 'bg-red-100 border-red-400' : 'border-gray-300'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChecklistSection;