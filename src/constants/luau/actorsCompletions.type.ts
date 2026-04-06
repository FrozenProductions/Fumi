export type TopLevelDataEntry = readonly [
    label: string,
    summary: string,
    signature: string,
    sourceLink: string,
];

export type AliasDataEntry = readonly [
    alias: string,
    canonicalName: string,
    summary: string,
    signature: string,
    sourceLink: string,
];
