
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { GeneratedReport } from '../types';
import { checklistData } from '../constants/checklistData';

interface ReportPreviewProps {
    report: GeneratedReport;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ report }) => {
    const { t } = useContext(LanguageContext);
    const { reportInfo, checklistAnswers, photos } = report;

    const nonCompliantItems = Object.keys(checklistAnswers).filter(key => checklistAnswers[key].status === 'N');

    const getItemDetails = (itemId: string) => {
        for (const category of checklistData) {
            const item = category.items.find(i => i.id === itemId);
            if (item) {
                return {
                    category: t(category.key),
                    description: t(item.id as any)
                };
            }
        }
        return { category: '', description: '' };
    };
    
    const tableHeaderClass = "px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider bg-gray-50 border-b-2 border-gray-200";
    const tableCellClass = "px-4 py-4 text-sm text-gray-800 leading-relaxed";
    const tableRowClass = "border-b border-gray-100 last:border-none";

    return (
        <div id="full-report-container" className="bg-white shadow-sm p-8 sm:p-12 md:p-16 border border-gray-100 font-sans mx-auto">
            {/* Main Content Section (Headers + Sections 1-4) */}
            <div id="report-main-content" className="space-y-12">
                <header className="text-center border-b-2 border-gray-100 pb-8">
                    <h2 className="text-3xl font-black text-gray-900 mb-2">{t('reportTemplateTitle')}</h2>
                    <p className="text-gray-500 uppercase tracking-widest text-xs">{t('subtitle')}</p>
                </header>
                
                {/* Basic Info */}
                <section className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                            <span className="font-bold text-gray-500">{t('reportNo')}</span>
                            <span className="text-gray-900">{reportInfo.reportNo}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                            <span className="font-bold text-gray-500">{t('checkDate')}</span>
                            <span className="text-gray-900">{reportInfo.checkDate}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                            <span className="font-bold text-gray-500">{t('dormitoryName')}</span>
                            <span className="text-gray-900 font-medium">{reportInfo.dormitoryName}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                            <span className="font-bold text-gray-500">{t('inspector')}</span>
                            <span className="text-gray-900">{reportInfo.inspector}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-1">
                            <span className="font-bold text-gray-500">{t('dormitoryManagement')}</span>
                            <span className="text-gray-900">{reportInfo.dormitoryManagement}</span>
                        </div>
                    </div>
                </section>

                {/* 1. Overview */}
                <section>
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 text-sm">1</span>
                        {t('overviewSectionTitle')}
                    </h3>
                    <p className="text-gray-700 text-base leading-relaxed pl-11">{t('overviewText')}</p>
                </section>

                {/* 2. Findings Table */}
                <section>
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 text-sm">2</span>
                        {t('findingsSectionTitle')}
                    </h3>
                    <div className="pl-11">
                        <p className="text-gray-600 text-sm mb-4 italic">{t('findingsIntro', { count: nonCompliantItems.length })}</p>
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className={tableHeaderClass}>No.</th>
                                        <th className={tableHeaderClass}>{t('category')}</th>
                                        <th className={tableHeaderClass}>{t('findingItem')}</th>
                                        <th className={tableHeaderClass}>{t('detailedDescription')}</th>
                                        <th className={tableHeaderClass}>{t('complianceStatus')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {nonCompliantItems.length > 0 ? (
                                        nonCompliantItems.map((itemId, index) => {
                                            const details = getItemDetails(itemId);
                                            return (
                                                <tr key={itemId} className={tableRowClass}>
                                                    <td className={`${tableCellClass} font-mono text-gray-400`}>{String(index + 1).padStart(2, '0')}</td>
                                                    <td className={`${tableCellClass} font-bold text-blue-700`}>{details.category}</td>
                                                    <td className={`${tableCellClass} font-semibold w-1/3`}>{details.description}</td>
                                                    <td className={tableCellClass}>{checklistAnswers[itemId].remarks || '-'}</td>
                                                    <td className={`${tableCellClass} text-red-600 font-black`}>{t('no')}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr className={tableRowClass}>
                                            <td className={tableCellClass}>01</td>
                                            <td className={tableCellClass}>-</td>
                                            <td className={tableCellClass}>{t('noFindingsItem')}</td>
                                            <td className={tableCellClass}>{t('noFindingsDescription')}</td>
                                            <td className={`${tableCellClass} text-green-600 font-black`}>{t('statusCompliant')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* 3. Action Plan Table */}
                <section>
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 text-sm">3</span>
                        {t('actionPlanSectionTitle')}
                    </h3>
                    <div className="pl-11">
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className={tableHeaderClass}>No.</th>
                                        <th className={tableHeaderClass}>{t('findingItem')}</th>
                                        <th className={tableHeaderClass}>{t('correctiveAction')}</th>
                                        <th className={tableHeaderClass}>{t('targetDate')}</th>
                                        <th className={tableHeaderClass}>{t('actionStatus')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {nonCompliantItems.length > 0 ? (
                                        nonCompliantItems.map((itemId, index) => {
                                            const details = getItemDetails(itemId);
                                            return (
                                                <tr key={itemId} className={tableRowClass}>
                                                    <td className={`${tableCellClass} font-mono text-gray-400`}>{String(index + 1).padStart(2, '0')}</td>
                                                    <td className={`${tableCellClass} font-semibold w-1/4`}><span className="text-red-500 mr-1">[{itemId}]</span>{details.description}</td>
                                                    <td className={tableCellClass}>{checklistAnswers[itemId].correctiveAction}</td>
                                                    <td className={`${tableCellClass} font-mono`}>{checklistAnswers[itemId].targetDate}</td>
                                                    <td className={tableCellClass}><span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">{t('statusPending')}</span></td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr className={tableRowClass}>
                                            <td className={tableCellClass}>01</td>
                                            <td className={tableCellClass}>{t('noActionItem')}</td>
                                            <td className={tableCellClass}>{t('noActionRecommendation')}</td>
                                            <td className={tableCellClass}>{t('noActionTargetDate')}</td>
                                            <td className={tableCellClass}><span className="px-3 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">{t('noActionStatus')}</span></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* 4. Conclusion */}
                <section className="bg-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-200">
                    <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 text-sm">4</span>
                        {t('conclusionSectionTitle')}
                    </h3>
                    <p className="text-gray-800 text-lg font-medium pl-11">
                        {nonCompliantItems.length > 0 ? t('conclusionTextNonCompliant') : t('conclusionTextCompliant')}
                    </p>
                </section>
            </div>
            
            {/* 5. Attachments Section - Starts on a new page in PDF */}
            <div id="report-attachments-section" className="mt-16 pt-16 border-t-4 border-gray-100">
                <section>
                    <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center">
                        <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 text-sm">5</span>
                        {t('attachmentsSectionTitle')}
                    </h3>
                    <div className="pl-11">
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 gap-8">
                                {photos.map((photo, index) => (
                                    <div key={index} className="border-4 border-white shadow-lg rounded-2xl overflow-hidden ring-1 ring-gray-200">
                                        <img src={photo} alt={`Site Photo ${index + 1}`} className="w-full h-64 object-cover" />
                                        <div className="bg-gray-50 p-3 text-center text-xs text-gray-500 font-bold border-t border-gray-100">
                                            {t('onSitePhotos')} - {index + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-8 rounded-xl text-center border-2 border-dotted border-gray-300">
                                <p className="text-gray-400 italic text-sm">{t('onSitePhotos')} / {t('workerInterviews')} (N/A)</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ReportPreview;
