export type TopLevelDataEntry = readonly [
    label: string,
    summary: string,
    signature: string,
    sourceLink: string,
];

export type NamespaceDataEntry = readonly [
    namespace: string,
    memberName: string,
    summary: string,
    signature: string,
    sourceLink: string,
];
