
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
    
    const tableHeaderClass = "px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50";
    const tableCellClass = "px-3 sm:px-4 py-4 text-sm text-gray-800";
    const tableRowClass = "border-b border-gray-200";

    return (
        <div id="full-report-container" className="bg-white shadow-lg rounded-xl p-4 sm:p-6 md:p-10 border border-gray-200 font-sans">
            {/* Main Content Section (Headers + Sections 1-4) */}
            <div id="report-main-content">
                <header className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{t('reportTemplateTitle')}</h2>
                </header>
                
                {/* Basic Info */}
                <section className="mb-8 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                        <p><strong className="font-semibold text-gray-600">{t('reportNo')}:</strong> {reportInfo.reportNo}</p>
                        <p><strong className="font-semibold text-gray-600">{t('checkDate')}:</strong> {reportInfo.checkDate}</p>
                        <p><strong className="font-semibold text-gray-600">{t('dormitoryName')}:</strong> {reportInfo.dormitoryName}</p>
                        <p><strong className="font-semibold text-gray-600">{t('inspector')}:</strong> {reportInfo.inspector}</p>
                        <p><strong className="font-semibold text-gray-600">{t('dormitoryManagement')}:</strong> {reportInfo.dormitoryManagement}</p>
                    </div>
                </section>
                <hr className="my-8" />

                {/* 1. Overview */}
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{t('overviewSectionTitle')}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">{t('overviewText')}</p>
                </section>

                {/* 2. Findings Table */}
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{t('findingsSectionTitle')}</h3>
                    <p className="text-gray-700 text-sm mb-4">{t('findingsIntro', { count: nonCompliantItems.length })}</p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {nonCompliantItems.length > 0 ? (
                                    nonCompliantItems.map((itemId, index) => {
                                        const details = getItemDetails(itemId);
                                        return (
                                            <tr key={itemId} className={tableRowClass}>
                                                <td className={tableCellClass}>{index + 1}</td>
                                                <td className={tableCellClass}>{details.category}</td>
                                                <td className={`${tableCellClass} font-semibold whitespace-normal w-1/3`}>{details.description}</td>
                                                <td className={`${tableCellClass} whitespace-normal`}>{checklistAnswers[itemId].remarks || '-'}</td>
                                                <td className={`${tableCellClass} text-red-600 font-bold`}>{t('no')}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className={tableRowClass}>
                                        <td className={tableCellClass}>1</td>
                                        <td className={tableCellClass}>-</td>
                                        <td className={tableCellClass}>{t('noFindingsItem')}</td>
                                        <td className={tableCellClass}>{t('noFindingsDescription')}</td>
                                        <td className={`${tableCellClass} text-green-600 font-bold`}>{t('statusCompliant')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 3. Action Plan Table */}
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{t('actionPlanSectionTitle')}</h3>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead >
                                <tr>
                                    <th className={tableHeaderClass}>No.</th>
                                    <th className={tableHeaderClass}>{t('findingItem')}</th>
                                    <th className={tableHeaderClass}>{t('correctiveAction')}</th>
                                    <th className={tableHeaderClass}>{t('responsiblePerson')}</th>
                                    <th className={tableHeaderClass}>{t('targetDate')}</th>
                                    <th className={tableHeaderClass}>{t('actionStatus')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {nonCompliantItems.length > 0 ? (
                                    nonCompliantItems.map((itemId, index) => {
                                        const details = getItemDetails(itemId);
                                        return (
                                            <tr key={itemId} className={tableRowClass}>
                                                <td className={tableCellClass}>{index + 1}</td>
                                                <td className={`${tableCellClass} whitespace-normal w-1/4`}><span className="font-mono text-red-600">{itemId}:</span> {details.description}</td>
                                                <td className={`${tableCellClass} whitespace-normal`}>{checklistAnswers[itemId].correctiveAction}</td>
                                                <td className={tableCellClass}>{checklistAnswers[itemId].responsiblePerson}</td>
                                                <td className={tableCellClass}>{checklistAnswers[itemId].targetDate}</td>
                                                <td className={tableCellClass}><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">{t('statusPending')}</span></td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr className={tableRowClass}>
                                        <td className={tableCellClass}>1</td>
                                        <td className={tableCellClass}>{t('noActionItem')}</td>
                                        <td className={tableCellClass}>{t('noActionRecommendation')}</td>
                                        <td className={tableCellClass}>{t('noActionResponsible')}</td>
                                        <td className={tableCellClass}>{t('noActionTargetDate')}</td>
                                        <td className={tableCellClass}><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('noActionStatus')}</span></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 4. Conclusion */}
                <section className="mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{t('conclusionSectionTitle')}</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        {nonCompliantItems.length > 0 ? t('conclusionTextNonCompliant') : t('conclusionTextCompliant')}
                    </p>
                </section>
            </div>
            
            {/* 5. Attachments Section */}
            <div id="report-attachments-section">
                <section>
                    <h3 className="text-xl font-bold text-gray-800 mb-3">{t('attachmentsSectionTitle')}</h3>
                    {photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            {photos.map((photo, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <img src={photo} alt={`Site Photo ${index + 1}`} className="w-full h-48 object-cover" />
                                    <div className="bg-gray-50 p-2 text-center text-xs text-gray-500 font-semibold border-t border-gray-200">
                                        {t('onSitePhotos')} - {index + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                            <li>{t('onSitePhotos')}</li>
                            <li>{t('workerInterviews')}</li>
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ReportPreview;
