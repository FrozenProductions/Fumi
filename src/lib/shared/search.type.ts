export type SearchField<TFieldName extends string> = {
    name: TFieldName;
    value: string;
};

export type SearchResult<TItem> = {
    item: TItem;
    index: number;
    score: number;
};
