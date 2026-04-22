export type NamespaceDataEntry = readonly [
    namespace: string,
    memberName: string,
    category: string,
    summary: string,
    signature: string,
    sourceLink: string,
];

export type TopLevelDataEntry = readonly [
    label: string,
    category: string,
    summary: string,
    signature: string,
    sourceLink: string,
];

export type AliasDataEntry = readonly [
    alias: string,
    canonicalName: string,
    category: string,
    summary: string,
    signature: string,
    sourceLink: string,
];
