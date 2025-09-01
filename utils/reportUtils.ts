
import { ReportInfo, ChecklistState, ChecklistId, CategorizedFindings, ReportContent, Language } from '../types';
import { translations } from '../translations';

export const buildReportContent = (
    reportInfo: ReportInfo,
    checklist: ChecklistState,
    lang: Language
): ReportContent => {
    const t = (key: string) => translations[lang][key] || key;
    // Fix: Add a helper to cast translations to string for cleaner code, resolving multiple type errors.
    const ts = (key: string) => t(key) as string;
    const checklistDescriptions = t('checklistDescriptions') as Record<ChecklistId, string>;
    const findingCategories = {
        'A': ts('categoryA'),
        'B': ts('categoryB'),
        'C': ts('categoryC'),
        'D': ts('categoryD'),
        'E': ts('categoryE'),
    };

    let nonCompliantCount = 0;
    const findings: CategorizedFindings = {
        [ts('categoryA')]: [], [ts('categoryB')]: [], [ts('categoryC')]: [], [ts('categoryD')]: [], [ts('categoryE')]: [],
    };

    (Object.keys(checklist) as ChecklistId[]).forEach((id) => {
        const item = checklist[id];
        if (item.compliant === 'N') {
            nonCompliantCount++;
            const description = checklistDescriptions[id];
            const detailedDescription = item.notes || ts('noNotes');
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

    newReportContent.push({ type: 'heading', level: 2, content: ts('reportTitle') });

    const basicInfoContent = `<strong>${ts('reportNumber')}:</strong> ${reportInfo.checkDate.replace(/-/g, '')}-DORM-001<br/>`
        + `<strong>${ts('checkDate')}:</strong> ${reportInfo.checkDate}<br/>`
        + `<strong>${ts('checker')}:</strong> ${reportInfo.checker}<br/>`
        + `<strong>${ts('dormNameAddress')}:</strong> ${reportInfo.dormNameAddress}<br/>`
        + `<strong>${ts('dormManager')}:</strong> ${reportInfo.dormManager}`;
    newReportContent.push({ type: 'paragraph', content: basicInfoContent });

    newReportContent.push({ type: 'heading', level: 3, content: ts('overviewTitle') });
    newReportContent.push({ type: 'paragraph', content: ts('overviewContent') });

    newReportContent.push({ type: 'heading', level: 3, content: ts('findingsTitle') });
    const findingsIntroContent = ts('findingsIntro').replace('{count}', `<strong>${nonCompliantCount}</strong>`);
    newReportContent.push({ type: 'paragraph', content: findingsIntroContent });

    const findingsHeaders = [ts('findingsHeader1'), ts('findingsHeader2'), ts('findingsHeader3'), ts('findingsHeader4'), ts('findingsHeader5')];
    const findingsRows: string[][] = [];
    if (nonCompliantCount > 0) {
        let findingNum = 1;
        Object.keys(findings).forEach(category => {
            findings[category].forEach(item => {
                const cleanedDesc = item.description.replace(new RegExp(ts('cleanupRegex'), 'g'), '').trim();
                const row = [`${findingNum++}`, category, `${item.id} ${cleanedDesc}`, item.detailedDescription, ts('statusNonCompliant')];
                findingsRows.push(row);
            });
        });
    } else {
        findingsRows.push(['1', ts('categoryNone'), ts('noNonCompliantItems'), 'N/A', ts('statusCompliant')]);
    }
    newReportContent.push({ type: 'table', headers: findingsHeaders, rows: findingsRows });

    newReportContent.push({ type: 'heading', level: 3, content: ts('recommendationsTitle') });
    const recommendationsHeaders = [ts('recommendationsHeader1'), ts('recommendationsHeader2'), ts('recommendationsHeader3'), ts('recommendationsHeader4'), ts('recommendationsHeader5'), ts('recommendationsHeader6')];
    const recommendationsRows: string[][] = [];
    if (nonCompliantCount > 0) {
        let actionNum = 1;
        Object.keys(findings).forEach(category => {
            findings[category].forEach(item => {
                const cleanedDesc = item.description.replace(new RegExp(ts('cleanupRegex'), 'g'), '').trim();
                const row = [`${actionNum++}`, `${item.id} ${cleanedDesc}`, item.correctiveAction, item.responsiblePerson, '', ts('statusPending')];
                recommendationsRows.push(row);
            });
        });
    } else {
        recommendationsRows.push(['1', ts('noNonCompliantItems'), 'N/A', 'N/A', 'N/A', ts('statusDone')]);
    }
    newReportContent.push({ type: 'table', headers: recommendationsHeaders, rows: recommendationsRows });

    newReportContent.push({ type: 'heading', level: 3, content: ts('conclusionTitle') });
    const conclusionContent = ts('conclusionContent')
        .replace('{status}', nonCompliantCount === 0 ? ts('conclusionStatusGood') : ts('conclusionStatusImprovementsNeeded'));
    newReportContent.push({ type: 'paragraph', content: conclusionContent });

    const attachmentsHtml = `<strong>${ts('attachmentsTitle')}:</strong><ul style="list-style-position: inside; margin-left: 20px; margin-top: 8px;"><li>${ts('attachmentPhoto')}</li><li>${ts('attachmentInterview')}</li></ul>`;
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
