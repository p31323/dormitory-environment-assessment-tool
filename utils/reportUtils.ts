
import { ReportInfo, ChecklistState, ChecklistId, CategorizedFindings, ReportContent, Language } from '../types';
import { translations } from '../translations';

export const buildReportContent = (
    reportInfo: ReportInfo,
    checklist: ChecklistState,
    lang: Language
): ReportContent => {
    const t = (key: string) => translations[lang].messages[key] || key;
    const checklistDescriptions = translations[lang].checklistDescriptions;
    
    const findingCategories = {
        'A': t('categoryA'),
        'B': t('categoryB'),
        'C': t('categoryC'),
        'D': t('categoryD'),
        'E': t('categoryE'),
    };

    let nonCompliantCount = 0;
    const findings: CategorizedFindings = {
        [t('categoryA')]: [], [t('categoryB')]: [], [t('categoryC')]: [], [t('categoryD')]: [], [t('categoryE')]: [],
    };

    (Object.keys(checklist) as ChecklistId[]).forEach((id) => {
        const item = checklist[id];
        if (item.compliant === 'N') {
            nonCompliantCount++;
            const description = checklistDescriptions[id];
            const detailedDescription = item.notes || t('noNotes');
            const finding = {
                id,
                description,
                detailedDescription,
                correctiveAction: item.correctiveAction || '',
                responsiblePerson: item.responsiblePerson || '',
            };
            const categoryPrefix = id.charAt(0) as keyof typeof findingCategories;
            const categoryName = findingCategories[categoryPrefix];
            if(categoryName) {
                findings[categoryName].push(finding);
            }
        }
    });

    const newReportContent: ReportContent = [];

    newReportContent.push({ type: 'heading', level: 2, content: t('reportTitle') });

    const basicInfoContent = `<strong>${t('reportNumber')}:</strong> ${reportInfo.checkDate.replace(/-/g, '')}-DORM-001<br/>`
        + `<strong>${t('checkDate')}:</strong> ${reportInfo.checkDate}<br/>`
        + `<strong>${t('checker')}:</strong> ${reportInfo.checker}<br/>`
        + `<strong>${t('dormNameAddress')}:</strong> ${reportInfo.dormNameAddress}<br/>`
        + `<strong>${t('dormManager')}:</strong> ${reportInfo.dormManager}`;
    newReportContent.push({ type: 'paragraph', content: basicInfoContent });

    newReportContent.push({ type: 'heading', level: 3, content: t('overviewTitle') });
    newReportContent.push({ type: 'paragraph', content: t('overviewContent') });

    newReportContent.push({ type: 'heading', level: 3, content: t('findingsTitle') });
    const findingsIntroContent = t('findingsIntro').replace('{count}', `<strong>${nonCompliantCount}</strong>`);
    newReportContent.push({ type: 'paragraph', content: findingsIntroContent });

    const findingsHeaders = [t('findingsHeader1'), t('findingsHeader2'), t('findingsHeader3'), t('findingsHeader4'), t('findingsHeader5')];
    const findingsRows: string[][] = [];
    if (nonCompliantCount > 0) {
        let findingNum = 1;
        Object.keys(findings).forEach(category => {
            findings[category].forEach(item => {
                const cleanedDesc = item.description.replace(new RegExp(t('cleanupRegex'), 'g'), '').trim();
                const row = [`${findingNum++}`, category, `${item.id} ${cleanedDesc}`, item.detailedDescription, t('statusNonCompliant')];
                findingsRows.push(row);
            });
        });
    } else {
        findingsRows.push(['1', t('categoryNone'), t('noNonCompliantItems'), 'N/A', t('statusCompliant')]);
    }
    newReportContent.push({ type: 'table', headers: findingsHeaders, rows: findingsRows });

    newReportContent.push({ type: 'heading', level: 3, content: t('recommendationsTitle') });
    const recommendationsHeaders = [t('recommendationsHeader1'), t('recommendationsHeader2'), t('recommendationsHeader3'), t('recommendationsHeader4'), t('recommendationsHeader5'), t('recommendationsHeader6')];
    const recommendationsRows: string[][] = [];
    if (nonCompliantCount > 0) {
        let actionNum = 1;
        Object.keys(findings).forEach(category => {
            findings[category].forEach(item => {
                const cleanedDesc = item.description.replace(new RegExp(t('cleanupRegex'), 'g'), '').trim();
                const row = [`${actionNum++}`, `${item.id} ${cleanedDesc}`, item.correctiveAction, item.responsiblePerson, '', t('statusPending')];
                recommendationsRows.push(row);
            });
        });
    } else {
        recommendationsRows.push(['1', t('noNonCompliantItems'), 'N/A', 'N/A', 'N/A', t('statusDone')]);
    }
    newReportContent.push({ type: 'table', headers: recommendationsHeaders, rows: recommendationsRows });

    newReportContent.push({ type: 'heading', level: 3, content: t('conclusionTitle') });
    const conclusionContent = t('conclusionContent')
        .replace('{status}', nonCompliantCount === 0 ? t('conclusionStatusGood') : t('conclusionStatusImprovementsNeeded'));
    newReportContent.push({ type: 'paragraph', content: conclusionContent });

    const attachmentsHtml = `<strong>${t('attachmentsTitle')}:</strong><ul style="list-style-position: inside; margin-left: 20px; margin-top: 8px;"><li>${t('attachmentPhoto')}</li><li>${t('attachmentInterview')}</li></ul>`;
    newReportContent.push({ type: 'paragraph', content: attachmentsHtml });

    return newReportContent;
};

export const renderReportToHtmlString = (reportContent: ReportContent): string => {
    let html = '';
    reportContent.forEach(element => {
        switch (element.type) {
            case 'heading':
                if (element.level === 2) {
                    html += `<h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem;">${element.content}</h2>`;
                } else {
                    html += `<h3 style="font-size: 1.25rem; font-weight: 600; margin-top: 1rem; margin-bottom: 1rem;"><strong>${element.content}</strong></h3>`;
                }
                break;
            case 'paragraph':
                html += `<p style="margin-bottom: 0.5rem;">${element.content}</p>`;
                break;
            case 'table':
                html += '<table style="width: 100%; border-collapse: collapse; margin-top: 1rem; margin-bottom: 1rem; border: 1px solid #ccc;">';
                html += '<thead style="background-color: #f2f2f2;"><tr>';
                element.headers.forEach(header => {
                    html += `<th style="border: 1px solid #ccc; padding: 8px; text-align: left;">${header}</th>`;
                });
                html += '</tr></thead>';
                html += '<tbody>';
                element.rows.forEach(row => {
                    html += '<tr>';
                    row.forEach(cell => {
                        html += `<td style="border: 1px solid #ccc; padding: 8px; vertical-align: top;">${cell}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</tbody></table>';
                break;
        }
    });
    return html;
};
