
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { FaTrashAlt, FaInfoCircle } from 'react-icons/fa';

interface DataManagementProps {
    onClear: () => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ onClear }) => {
    const { t } = useContext(LanguageContext);

    const confirmClear = () => {
        if (window.confirm(t('clearDataConfirm'))) {
            onClear();
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-xl p-4 border-l-4 border-red-500 mb-8 flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
                <FaInfoCircle className="text-gray-400" />
                <p className="text-xs text-gray-500 font-medium">
                    {t('subtitle')} - 資料僅儲存於您的瀏覽器中。
                </p>
            </div>
            
            <button
                onClick={confirmClear}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-2 rounded-lg text-sm font-black flex items-center transition-all border border-red-200 shadow-sm active:scale-95"
            >
                <FaTrashAlt className="mr-2" />
                {t('clearDataButton')}
            </button>
        </div>
    );
};

export default DataManagement;
