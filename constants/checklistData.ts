
export interface ChecklistItemData {
    id: string;
    categoryKey: string;
}

export interface ChecklistCategory {
    key: string;
    items: ChecklistItemData[];
}

export const checklistData: ChecklistCategory[] = [
    {
        key: 'fireSafety',
        items: [
            { id: 'A1', categoryKey: 'fireSafety' },
            { id: 'A2', categoryKey: 'fireSafety' },
            { id: 'A3', categoryKey: 'fireSafety' },
            { id: 'A4', categoryKey: 'fireSafety' },
            { id: 'A5', categoryKey: 'fireSafety' },
            { id: 'A6', categoryKey: 'fireSafety' },
            { id: 'A7', categoryKey: 'fireSafety' },
            { id: 'A8', categoryKey: 'fireSafety' },
            { id: 'A9', categoryKey: 'fireSafety' },
        ]
    },
    {
        key: 'electricalSafety',
        items: [
            { id: 'B1', categoryKey: 'electricalSafety' },
            { id: 'B2', categoryKey: 'electricalSafety' },
            { id: 'B3', categoryKey: 'electricalSafety' },
            { id: 'B4', categoryKey: 'electricalSafety' },
            { id: 'B5', categoryKey: 'electricalSafety' },
        ]
    },
    {
        key: 'gasSafety',
        items: [
            { id: 'C1', categoryKey: 'gasSafety' },
            { id: 'C2', categoryKey: 'gasSafety' },
            { id: 'C3', categoryKey: 'gasSafety' },
            { id: 'C4', categoryKey: 'gasSafety' },
        ]
    },
    {
        key: 'hygieneAndFacilities',
        items: [
            { id: 'D1', categoryKey: 'hygieneAndFacilities' },
            { id: 'D2', categoryKey: 'hygieneAndFacilities' },
            { id: 'D3', categoryKey: 'hygieneAndFacilities' },
            { id: 'D4', categoryKey: 'hygieneAndFacilities' },
            { id: 'D5', categoryKey: 'hygieneAndFacilities' },
            { id: 'D6', categoryKey: 'hygieneAndFacilities' },
            { id: 'D7', categoryKey: 'hygieneAndFacilities' },
            { id: 'D8', categoryKey: 'hygieneAndFacilities' },
        ]
    },
    {
        key: 'others',
        items: [
            { id: 'E1', categoryKey: 'others' },
            { id: 'E2', categoryKey: 'others' },
            { id: 'E3', categoryKey: 'others' },
        ]
    }
];
