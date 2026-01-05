
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ValidationErrorModalProps {
    onClose: () => void;
    errorFields: string[];
}

const ValidationErrorModal: React.FC<ValidationErrorModalProps> = ({ onClose, errorFields }) => {
    const { t } = useContext(LanguageContext);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-center mb-4">
                        <FaExclamationTriangle className="text-red-500 text-2xl mr-3" />
                        <h2 className="text-lg font-bold text-gray-800">{t('validationErrorTitle')}</h2>
                    </div>
                    <div className="max-h-60 overflow-y-auto bg-red-50 p-3 rounded-md border border-red-200">
                        <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                            {errorFields.map((field, index) => (
                                <li key={index}>{field}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={onClose}
                            className="bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        >
                            {t('closeButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ValidationErrorModal;