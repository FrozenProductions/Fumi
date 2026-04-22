import { CURRENT_FILE_DOC_SOURCE } from "../../constants/luau/core/luau";
import type { LuauSymbolKind } from "./luau.type";
import type {
    LuauFileAnalysis,
    LuauScanMode,
    LuauToken,
    PendingLuauFileSymbol,
    ScopeFrame,
    TokenBoundary,
} from "./symbolScanner.type";
import { extractLuauOutlineComments } from "./symbolScannerOutlineComments";
import { tokenizeLuau } from "./symbolScannerTokenizer";

export abstract class LuauSymbolScannerCore {
    protected readonly content: string;
    protected readonly functionScopes: ScopeFrame[] = [];
    protected index = 0;
    protected readonly mode: LuauScanMode;
    protected readonly pendingSymbols: PendingLuauFileSymbol[] = [];
    protected readonly rootScope: ScopeFrame;
    protected readonly tokens: LuauToken[];

    public constructor(content: string, mode: LuauScanMode) {
        this.content = content;
        this.mode = mode;
        this.tokens = tokenizeLuau(content);
        this.rootScope = {
            start: 0,
            end: content.length,
        };
    }

    protected abstract parseBlock(
        scope: ScopeFrame,
        endKeywords: Set<string>,
        currentFunctionScope: ScopeFrame | null,
    ): void;

    public scan(): LuauFileAnalysis {
        this.parseBlock(this.rootScope, new Set(), null);
        const commentSymbols =
            this.mode === "functions"
                ? []
                : extractLuauOutlineComments(this.content, this.rootScope);

        return {
            functionScopes: this.functionScopes,
            symbols: [...this.pendingSymbols, ...commentSymbols].map(
                (symbol) => ({
                    ...symbol,
                    ownerFunctionStart: symbol.ownerFunction?.start ?? null,
                    ownerFunctionEnd: symbol.ownerFunction?.end ?? null,
                    scopeStart: symbol.scope.start,
                    scopeEnd: symbol.scope.end,
                    visibleEnd: symbol.scope.end,
                }),
            ),
        };
    }

    protected addSymbol(options: {
        declaration: TokenBoundary;
        detail: string;
        docSummary: string;
        isLexical: boolean;
        insertText?: string;
        kind: LuauSymbolKind;
        label: string;
        ownerFunction: ScopeFrame | null;
        scope: ScopeFrame;
        signature?: string;
        visibleStart?: number;
    }): void {
        this.pendingSymbols.push({
            label: options.label,
            kind: options.kind,
            detail: options.detail,
            declarationStart: options.declaration.start,
            declarationEnd: options.declaration.end,
            isLexical: options.isLexical,
            ownerFunction: options.ownerFunction,
            visibleStart: options.visibleStart ?? options.declaration.end,
            insertText: options.insertText,
            score: 2000,
            scope: options.scope,
            doc: {
                source: CURRENT_FILE_DOC_SOURCE,
                summary: options.docSummary,
                signature: options.signature,
            },
        });
    }
}
