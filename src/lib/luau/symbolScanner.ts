import { CURRENT_FILE_DOC_SOURCE } from "../../constants/luau/luau";
import type { LuauSymbolKind } from "./luau.type";
import type {
    LuauFileAnalysis,
    LuauScanMode,
    LuauToken,
    PendingLuauFileSymbol,
    ScopeFrame,
    TokenBoundary,
} from "./symbolScanner.type";

function isIdentifierStart(character: string): boolean {
    return /[A-Za-z_]/.test(character);
}

function isIdentifierPart(character: string): boolean {
    return /[A-Za-z0-9_]/.test(character);
}

function isDigit(character: string): boolean {
    return /[0-9]/.test(character);
}

function isStandaloneComment(content: string, commentStart: number): boolean {
    const lineStart = content.lastIndexOf("\n", commentStart - 1) + 1;

    return content.slice(lineStart, commentStart).trim().length === 0;
}

function normalizeOutlineCommentLine(value: string): string {
    return value.replace(/^[\s#*/=-]+/u, "").trim();
}

function getOutlineCommentMetadata(commentBody: string): {
    detail: string;
    label: string;
    summary: string;
} | null {
    const cleanedLines = commentBody
        .split("\n")
        .map((line) => normalizeOutlineCommentLine(line))
        .filter((line) => line.length > 0);

    const summary = cleanedLines.join(" ").trim();

    if (!summary || !/[A-Za-z0-9]/u.test(summary)) {
        return null;
    }

    return {
        detail: commentBody.includes("\n") ? "multiline comment" : "comment",
        label: cleanedLines[0] ?? summary,
        summary,
    };
}

function extractLuauOutlineComments(
    content: string,
    rootScope: ScopeFrame,
): PendingLuauFileSymbol[] {
    const comments: PendingLuauFileSymbol[] = [];
    let index = 0;

    while (index < content.length) {
        const character = content[index];
        const nextCharacter = content[index + 1] ?? "";

        if (character === "\r" || /\s/.test(character)) {
            index += 1;
            continue;
        }

        if (character === "-" && nextCharacter === "-") {
            const commentStart = index;
            const longCommentMatch = content
                .slice(index + 2)
                .match(/^\[(=*)\[/u);
            const shouldIncludeComment = isStandaloneComment(
                content,
                commentStart,
            );

            if (!longCommentMatch) {
                index += 2;
                const commentBodyStart = index;

                while (index < content.length && content[index] !== "\n") {
                    index += 1;
                }

                if (shouldIncludeComment) {
                    const metadata = getOutlineCommentMetadata(
                        content.slice(commentBodyStart, index),
                    );

                    if (metadata) {
                        comments.push({
                            declarationStart: commentStart,
                            declarationEnd: index,
                            detail: metadata.detail,
                            doc: {
                                source: CURRENT_FILE_DOC_SOURCE,
                                summary: metadata.summary,
                            },
                            isLexical: false,
                            kind: "comment",
                            label: metadata.label,
                            ownerFunction: null,
                            scope: rootScope,
                            visibleStart: commentStart,
                        });
                    }
                }

                continue;
            }

            const equals = longCommentMatch[1] ?? "";
            const closeDelimiter = `]${equals}]`;
            index += 2 + longCommentMatch[0].length;
            const commentBodyStart = index;

            while (
                index < content.length &&
                !content.startsWith(closeDelimiter, index)
            ) {
                index += 1;
            }

            const commentBodyEnd = index;

            if (content.startsWith(closeDelimiter, index)) {
                index += closeDelimiter.length;
            }

            if (shouldIncludeComment) {
                const metadata = getOutlineCommentMetadata(
                    content.slice(commentBodyStart, commentBodyEnd),
                );

                if (metadata) {
                    comments.push({
                        declarationStart: commentStart,
                        declarationEnd: index,
                        detail: metadata.detail,
                        doc: {
                            source: CURRENT_FILE_DOC_SOURCE,
                            summary: metadata.summary,
                        },
                        isLexical: false,
                        kind: "comment",
                        label: metadata.label,
                        ownerFunction: null,
                        scope: rootScope,
                        visibleStart: commentStart,
                    });
                }
            }

            continue;
        }

        if (character === "'" || character === '"' || character === "`") {
            const quote = character;
            index += 1;

            while (index < content.length) {
                const currentCharacter = content[index];

                if (currentCharacter === "\\") {
                    index += 2;
                    continue;
                }

                index += 1;

                if (currentCharacter === quote) {
                    break;
                }
            }

            continue;
        }

        if (character === "[") {
            const longStringMatch = content.slice(index).match(/^\[(=*)\[/u);

            if (longStringMatch) {
                const equals = longStringMatch[1] ?? "";
                const closeDelimiter = `]${equals}]`;
                index += longStringMatch[0].length;

                while (
                    index < content.length &&
                    !content.startsWith(closeDelimiter, index)
                ) {
                    index += 1;
                }

                if (content.startsWith(closeDelimiter, index)) {
                    index += closeDelimiter.length;
                }

                continue;
            }
        }

        index += 1;
    }

    return comments;
}

function tokenizeLuau(content: string): LuauToken[] {
    const tokens: LuauToken[] = [];
    let index = 0;

    while (index < content.length) {
        const character = content[index];
        const nextCharacter = content[index + 1] ?? "";

        if (character === "\r") {
            index += 1;
            continue;
        }

        if (character === "\n") {
            tokens.push({
                type: "newline",
                value: "\n",
                start: index,
                end: index + 1,
            });
            index += 1;
            continue;
        }

        if (/\s/.test(character)) {
            index += 1;
            continue;
        }

        if (character === "-" && nextCharacter === "-") {
            const longCommentMatch = content
                .slice(index + 2)
                .match(/^\[(=*)\[/u);

            if (!longCommentMatch) {
                index += 2;

                while (index < content.length && content[index] !== "\n") {
                    index += 1;
                }

                continue;
            }

            const equals = longCommentMatch[1] ?? "";
            const closeDelimiter = `]${equals}]`;
            index += 2 + longCommentMatch[0].length;

            while (
                index < content.length &&
                !content.startsWith(closeDelimiter, index)
            ) {
                if (content[index] === "\n") {
                    tokens.push({
                        type: "newline",
                        value: "\n",
                        start: index,
                        end: index + 1,
                    });
                }

                index += 1;
            }

            index += closeDelimiter.length;
            continue;
        }

        if (character === "'" || character === '"' || character === "`") {
            const quote = character;
            index += 1;

            while (index < content.length) {
                const currentCharacter = content[index];

                if (currentCharacter === "\\") {
                    index += 2;
                    continue;
                }

                if (currentCharacter === "\n") {
                    tokens.push({
                        type: "newline",
                        value: "\n",
                        start: index,
                        end: index + 1,
                    });
                }

                index += 1;

                if (currentCharacter === quote) {
                    break;
                }
            }

            continue;
        }

        if (character === "[") {
            const longStringMatch = content.slice(index).match(/^\[(=*)\[/u);

            if (longStringMatch) {
                const equals = longStringMatch[1] ?? "";
                const closeDelimiter = `]${equals}]`;
                index += longStringMatch[0].length;

                while (
                    index < content.length &&
                    !content.startsWith(closeDelimiter, index)
                ) {
                    if (content[index] === "\n") {
                        tokens.push({
                            type: "newline",
                            value: "\n",
                            start: index,
                            end: index + 1,
                        });
                    }

                    index += 1;
                }

                index += closeDelimiter.length;
                continue;
            }
        }

        if (content.startsWith("...", index)) {
            tokens.push({
                type: "symbol",
                value: "...",
                start: index,
                end: index + 3,
            });
            index += 3;
            continue;
        }

        if (content.startsWith("::", index)) {
            tokens.push({
                type: "symbol",
                value: "::",
                start: index,
                end: index + 2,
            });
            index += 2;
            continue;
        }

        if (isIdentifierStart(character)) {
            const start = index;
            index += 1;

            while (
                index < content.length &&
                isIdentifierPart(content[index] ?? "")
            ) {
                index += 1;
            }

            tokens.push({
                type: "identifier",
                value: content.slice(start, index),
                start,
                end: index,
            });
            continue;
        }

        if (isDigit(character)) {
            const start = index;
            index += 1;

            while (
                index < content.length &&
                /[0-9A-Fa-f_xXbBeE.]/.test(content[index] ?? "")
            ) {
                index += 1;
            }

            tokens.push({
                type: "number",
                value: content.slice(start, index),
                start,
                end: index,
            });
            continue;
        }

        tokens.push({
            type: "symbol",
            value: character,
            start: index,
            end: index + 1,
        });
        index += 1;
    }

    return tokens;
}

class LuauSymbolScanner {
    private readonly content: string;
    private readonly functionScopes: ScopeFrame[] = [];
    private index = 0;
    private readonly mode: LuauScanMode;
    private readonly pendingSymbols: PendingLuauFileSymbol[] = [];
    private readonly rootScope: ScopeFrame;
    private readonly tokens: LuauToken[];

    public constructor(content: string, mode: LuauScanMode) {
        this.content = content;
        this.mode = mode;
        this.tokens = tokenizeLuau(content);
        this.rootScope = {
            start: 0,
            end: content.length,
        };
    }

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

    private addSymbol(options: {
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

    private canStartBareAssignment(): boolean {
        const currentToken = this.current();
        const nextToken = this.peekNonNewline(1);

        return (
            currentToken?.type === "identifier" &&
            nextToken?.type === "symbol" &&
            nextToken.value === "="
        );
    }

    private consumeEndKeyword(): TokenBoundary {
        const token = this.current();

        if (!token) {
            return {
                start: this.content.length,
                end: this.content.length,
            };
        }

        this.index += 1;
        return {
            start: token.start,
            end: token.end,
        };
    }

    private current(): LuauToken | null {
        return this.tokens[this.index] ?? null;
    }

    private isBlockTerminator(
        token: LuauToken | null,
        endKeywords: Set<string>,
    ): boolean {
        return token?.type === "identifier" && endKeywords.has(token.value);
    }

    private isCurrentKeyword(keyword: string): boolean {
        const token = this.current();
        return token?.type === "identifier" && token.value === keyword;
    }

    private isKeywordToken(token: LuauToken | null, keyword: string): boolean {
        return token?.type === "identifier" && token.value === keyword;
    }

    private matchKeyword(keyword: string): boolean {
        if (!this.isCurrentKeyword(keyword)) {
            return false;
        }

        this.index += 1;
        return true;
    }

    private parseBareAssignment(): void {
        if (this.mode === "functions") {
            this.skipSimpleStatement();
            return;
        }

        const identifierToken = this.current();

        if (!identifierToken || identifierToken.type !== "identifier") {
            return;
        }

        this.index += 1;

        const equalsToken = this.peekNonNewline();
        if (equalsToken?.type === "symbol" && equalsToken.value === "=") {
            this.index = this.tokens.indexOf(equalsToken) + 1;
            this.addSymbol({
                label: identifierToken.value,
                kind: "constant",
                detail: "global variable",
                declaration: identifierToken,
                isLexical: false,
                ownerFunction: null,
                scope: this.rootScope,
                docSummary: "Global variable assigned in the current file.",
                visibleStart: identifierToken.end,
            });
        }

        this.skipSimpleStatement();
    }

    private parseBindings(): Array<{
        declaration: TokenBoundary;
        label: string;
    }> {
        const bindings: Array<{
            declaration: TokenBoundary;
            label: string;
        }> = [];

        while (true) {
            const bindingToken = this.current();
            if (!bindingToken || bindingToken.type !== "identifier") {
                break;
            }

            bindings.push({
                label: bindingToken.value,
                declaration: {
                    start: bindingToken.start,
                    end: bindingToken.end,
                },
            });
            this.index += 1;

            if (this.matchSymbol(":")) {
                this.skipTypeExpression(new Set([",", "=", "\n", ")"]));
            }

            if (!this.matchSymbol(",")) {
                break;
            }
        }

        return bindings;
    }

    private parseBlock(
        scope: ScopeFrame,
        endKeywords: Set<string>,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        while (this.index < this.tokens.length) {
            this.skipNewlinesAndSemicolons();

            const token = this.current();

            if (!token || this.isBlockTerminator(token, endKeywords)) {
                return;
            }

            if (this.matchKeyword("do")) {
                this.parseScopedBlock(new Set(["end"]), currentFunctionScope);
                continue;
            }

            if (this.matchKeyword("while")) {
                this.skipUntilKeyword("do");

                if (this.matchKeyword("do")) {
                    this.parseScopedBlock(
                        new Set(["end"]),
                        currentFunctionScope,
                    );
                }
                continue;
            }

            if (this.matchKeyword("repeat")) {
                this.parseRepeatBlock(currentFunctionScope);
                continue;
            }

            if (this.matchKeyword("if")) {
                this.parseIfStatement(currentFunctionScope);
                continue;
            }

            if (this.matchKeyword("for")) {
                this.parseForStatement(currentFunctionScope);
                continue;
            }

            if (this.matchKeyword("local")) {
                if (this.matchKeyword("function")) {
                    this.parseFunctionDeclaration(
                        scope,
                        currentFunctionScope,
                        true,
                    );
                } else {
                    this.parseLocalBindings(scope, currentFunctionScope);
                }
                continue;
            }

            if (this.matchKeyword("function")) {
                this.parseFunctionDeclaration(
                    scope,
                    currentFunctionScope,
                    false,
                );
                continue;
            }

            if (this.matchKeyword("export")) {
                this.skipSimpleStatement();
                continue;
            }

            if (this.canStartBareAssignment()) {
                this.parseBareAssignment();
                continue;
            }

            this.skipSimpleStatement();
        }
    }

    private parseForBindings(): Array<{
        declaration: TokenBoundary;
        label: string;
    }> {
        const bindings: Array<{
            declaration: TokenBoundary;
            label: string;
        }> = [];

        while (true) {
            const token = this.current();
            if (!token || token.type !== "identifier") {
                break;
            }

            bindings.push({
                label: token.value,
                declaration: {
                    start: token.start,
                    end: token.end,
                },
            });
            this.index += 1;

            if (this.matchSymbol(":")) {
                this.skipTypeExpression(new Set([",", "=", "in", "do"]));
            }

            if (!this.matchSymbol(",")) {
                break;
            }
        }

        return bindings;
    }

    private parseForStatement(currentFunctionScope: ScopeFrame | null): void {
        const bindings = this.parseForBindings();

        while (
            this.current() &&
            !this.isCurrentKeyword("do") &&
            this.current()?.type !== "newline"
        ) {
            this.index += 1;
        }

        if (!this.matchKeyword("do")) {
            return;
        }

        const loopScopeStart = this.current()?.start ?? this.content.length;
        this.parseScopedBlock(
            new Set(["end"]),
            currentFunctionScope,
            (loopScope) => {
                loopScope.start = loopScopeStart;

                if (this.mode === "functions") {
                    return;
                }

                for (const binding of bindings) {
                    this.addSymbol({
                        label: binding.label,
                        kind: "constant",
                        detail: "loop variable",
                        declaration: binding.declaration,
                        isLexical: true,
                        ownerFunction: currentFunctionScope,
                        scope: loopScope,
                        docSummary:
                            "Loop variable declared in the current file.",
                    });
                }
            },
        );
    }

    private parseFunctionDeclaration(
        parentScope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
        isLocal: boolean,
    ): void {
        const nameSegments: LuauToken[] = [];
        let usesMethodSyntax = false;
        let functionLabel: string | null = null;
        let functionKind: LuauSymbolKind = "function";
        const declarationStart = this.current()?.start ?? this.content.length;

        while (this.current()) {
            const token = this.current();
            if (!token) {
                break;
            }

            if (token.type === "identifier") {
                nameSegments.push(token);
                this.index += 1;
                continue;
            }

            if (
                token.type === "symbol" &&
                (token.value === "." || token.value === ":")
            ) {
                usesMethodSyntax = usesMethodSyntax || token.value === ":";
                this.index += 1;
                continue;
            }

            break;
        }

        if (nameSegments.length > 0) {
            functionLabel = isLocal
                ? (nameSegments[nameSegments.length - 1]?.value ?? null)
                : nameSegments.length === 1
                  ? (nameSegments[0]?.value ?? null)
                  : (nameSegments[0]?.value ?? null);
            functionKind = nameSegments.length === 1 ? "function" : "namespace";
        }

        while (this.matchSymbol("<")) {
            this.skipBalancedTypeParameters("<", ">");
        }

        if (!this.matchSymbol("(")) {
            return;
        }

        const parameterTokens = this.parseFunctionParameters();

        if (this.matchSymbol(":")) {
            this.skipTypeExpression(new Set(["\n"]));
        }

        const functionScopeStart = this.current()?.start ?? this.content.length;
        const functionScope: ScopeFrame = {
            start: functionScopeStart,
            end: this.content.length,
        };

        this.functionScopes.push(functionScope);
        this.parseScopedBlock(
            new Set(["end"]),
            functionScope,
            (scope) => {
                scope.start = functionScopeStart;

                if (this.mode === "functions") {
                    return;
                }

                for (const parameter of parameterTokens) {
                    this.addSymbol({
                        label: parameter.label,
                        kind: parameter.kind,
                        detail: parameter.detail,
                        declaration: parameter.declaration,
                        isLexical: true,
                        ownerFunction: functionScope,
                        scope,
                        docSummary: parameter.summary,
                    });
                }

                if (usesMethodSyntax) {
                    this.addSymbol({
                        label: "self",
                        kind: "constant",
                        detail: "parameter",
                        declaration: {
                            start: declarationStart,
                            end: declarationStart,
                        },
                        isLexical: true,
                        ownerFunction: functionScope,
                        scope,
                        docSummary:
                            "Implicit method receiver parameter in the current file.",
                        visibleStart: scope.start,
                    });
                }
            },
            functionScope,
        );

        if (!functionLabel) {
            return;
        }

        const declarationEnd =
            this.tokens[this.index - 1]?.end ?? declarationStart;
        const signature = this.content
            .slice(declarationStart, functionScopeStart)
            .replace(/\s+/g, " ")
            .trim();

        this.addSymbol({
            label: functionLabel,
            kind: functionKind,
            detail:
                functionKind === "namespace"
                    ? "function namespace"
                    : isLocal
                      ? "local function"
                      : "function",
            declaration: {
                start: declarationStart,
                end: declarationEnd,
            },
            isLexical: isLocal,
            ownerFunction: isLocal ? currentFunctionScope : null,
            scope: isLocal ? parentScope : this.rootScope,
            docSummary:
                functionKind === "namespace"
                    ? "Function namespace declared in the current file."
                    : "Function declared in the current file.",
            signature: signature || undefined,
            visibleStart: declarationStart,
        });
    }

    private parseFunctionParameters(): Array<{
        declaration: TokenBoundary;
        detail: string;
        kind: LuauSymbolKind;
        label: string;
        summary: string;
    }> {
        const parameters: Array<{
            declaration: TokenBoundary;
            detail: string;
            kind: LuauSymbolKind;
            label: string;
            summary: string;
        }> = [];
        let parenDepth = 1;

        while (this.current() && parenDepth > 0) {
            const token = this.current();
            if (!token) {
                break;
            }

            if (token.type === "symbol" && token.value === "(") {
                parenDepth += 1;
                this.index += 1;
                continue;
            }

            if (token.type === "symbol" && token.value === ")") {
                parenDepth -= 1;
                this.index += 1;
                continue;
            }

            if (
                parenDepth === 1 &&
                token.type === "symbol" &&
                token.value === "..."
            ) {
                parameters.push({
                    label: "...",
                    kind: "constant",
                    detail: "parameter",
                    summary: "Variadic parameter declared in the current file.",
                    declaration: {
                        start: token.start,
                        end: token.end,
                    },
                });
                this.index += 1;

                if (this.matchSymbol(":")) {
                    this.skipTypeExpression(new Set([",", ")"]));
                }

                continue;
            }

            if (parenDepth === 1 && token.type === "identifier") {
                parameters.push({
                    label: token.value,
                    kind: "constant",
                    detail: "parameter",
                    summary: "Parameter declared in the current file.",
                    declaration: {
                        start: token.start,
                        end: token.end,
                    },
                });
                this.index += 1;

                if (this.matchSymbol(":")) {
                    this.skipTypeExpression(new Set([",", ")"]));
                }

                continue;
            }

            this.index += 1;
        }

        return parameters;
    }

    private parseIfStatement(currentFunctionScope: ScopeFrame | null): void {
        this.skipUntilKeyword("then");

        if (!this.matchKeyword("then")) {
            return;
        }

        this.parseScopedBlock(
            new Set(["elseif", "else", "end"]),
            currentFunctionScope,
        );

        while (this.matchKeyword("elseif")) {
            this.skipUntilKeyword("then");

            if (!this.matchKeyword("then")) {
                return;
            }

            this.parseScopedBlock(
                new Set(["elseif", "else", "end"]),
                currentFunctionScope,
            );
        }

        if (this.matchKeyword("else")) {
            this.parseScopedBlock(new Set(["end"]), currentFunctionScope);
        }

        this.matchKeyword("end");
    }

    private parseLocalBindings(
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        if (this.mode === "functions") {
            this.skipSimpleStatement();
            return;
        }

        const bindings = this.parseBindings();
        const visibleStart = this.current()?.start ?? this.content.length;

        this.skipSimpleStatement();

        for (const binding of bindings) {
            this.addSymbol({
                label: binding.label,
                kind: "constant",
                detail: "local variable",
                declaration: binding.declaration,
                isLexical: true,
                ownerFunction: currentFunctionScope,
                scope,
                docSummary: "Local variable declared in the current file.",
                visibleStart,
            });
        }
    }

    private parseRepeatBlock(currentFunctionScope: ScopeFrame | null): void {
        const repeatScope: ScopeFrame = {
            start: this.current()?.start ?? this.content.length,
            end: this.content.length,
        };

        this.parseBlock(repeatScope, new Set(["until"]), currentFunctionScope);
        const untilToken = this.current();

        if (!this.matchKeyword("until")) {
            repeatScope.end = this.current()?.start ?? this.content.length;
            return;
        }

        this.skipSimpleStatement();
        repeatScope.end =
            this.tokens[this.index - 1]?.end ??
            untilToken?.start ??
            repeatScope.end;
    }

    private parseScopedBlock(
        endKeywords: Set<string>,
        currentFunctionScope: ScopeFrame | null,
        initializeScope?: (scope: ScopeFrame) => void,
        existingScope?: ScopeFrame,
    ): void {
        const childScope =
            existingScope ??
            ({
                start: this.current()?.start ?? this.content.length,
                end: this.content.length,
            } satisfies ScopeFrame);

        initializeScope?.(childScope);
        this.parseBlock(childScope, endKeywords, currentFunctionScope);

        const endToken = this.current();
        childScope.end = endToken?.start ?? this.content.length;

        if (this.isCurrentKeyword("end")) {
            this.consumeEndKeyword();
        }
    }

    private matchSymbol(symbol: string): boolean {
        const token = this.current();
        if (token?.type !== "symbol" || token.value !== symbol) {
            return false;
        }

        this.index += 1;
        return true;
    }

    private peekNonNewline(offset = 0): LuauToken | null {
        let tokenIndex = this.index + offset;

        while (tokenIndex < this.tokens.length) {
            const token = this.tokens[tokenIndex];
            if (!token || token.type !== "newline") {
                return token ?? null;
            }

            tokenIndex += 1;
        }

        return null;
    }

    private skipBalancedTypeParameters(
        openSymbol: string,
        closeSymbol: string,
    ): void {
        let depth = 1;

        while (this.current() && depth > 0) {
            const token = this.current();
            if (!token) {
                break;
            }

            if (token.type === "symbol" && token.value === openSymbol) {
                depth += 1;
            } else if (token.type === "symbol" && token.value === closeSymbol) {
                depth -= 1;
            }

            this.index += 1;
        }
    }

    private skipNewlinesAndSemicolons(): void {
        while (this.current()) {
            const token = this.current();
            if (!token) {
                return;
            }

            if (
                token.type !== "newline" &&
                !(token.type === "symbol" && token.value === ";")
            ) {
                return;
            }

            this.index += 1;
        }
    }

    private skipSimpleStatement(): void {
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;

        while (this.current()) {
            const token = this.current();
            if (!token) {
                return;
            }

            if (
                token.type === "newline" &&
                parenDepth === 0 &&
                bracketDepth === 0 &&
                braceDepth === 0
            ) {
                return;
            }

            if (
                parenDepth === 0 &&
                bracketDepth === 0 &&
                braceDepth === 0 &&
                token.type === "symbol" &&
                token.value === ";"
            ) {
                this.index += 1;
                return;
            }

            if (token.type === "symbol") {
                if (token.value === "(") {
                    parenDepth += 1;
                } else if (token.value === ")" && parenDepth > 0) {
                    parenDepth -= 1;
                } else if (token.value === "[") {
                    bracketDepth += 1;
                } else if (token.value === "]" && bracketDepth > 0) {
                    bracketDepth -= 1;
                } else if (token.value === "{") {
                    braceDepth += 1;
                } else if (token.value === "}" && braceDepth > 0) {
                    braceDepth -= 1;
                }
            }

            this.index += 1;
        }
    }

    private skipTypeExpression(stopValues: Set<string>): void {
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;
        let angleDepth = 0;

        while (this.current()) {
            const token = this.current();
            if (!token) {
                return;
            }

            if (
                parenDepth === 0 &&
                bracketDepth === 0 &&
                braceDepth === 0 &&
                angleDepth === 0 &&
                ((token.type === "symbol" && stopValues.has(token.value)) ||
                    (token.type === "identifier" &&
                        stopValues.has(token.value)) ||
                    (token.type === "newline" && stopValues.has("\n")))
            ) {
                return;
            }

            if (token.type === "symbol") {
                if (token.value === "(") {
                    parenDepth += 1;
                } else if (token.value === ")" && parenDepth > 0) {
                    parenDepth -= 1;
                } else if (token.value === "[") {
                    bracketDepth += 1;
                } else if (token.value === "]" && bracketDepth > 0) {
                    bracketDepth -= 1;
                } else if (token.value === "{") {
                    braceDepth += 1;
                } else if (token.value === "}" && braceDepth > 0) {
                    braceDepth -= 1;
                } else if (token.value === "<") {
                    angleDepth += 1;
                } else if (token.value === ">" && angleDepth > 0) {
                    angleDepth -= 1;
                }
            }

            this.index += 1;
        }
    }

    private skipUntilKeyword(keyword: string): void {
        let parenDepth = 0;
        let bracketDepth = 0;
        let braceDepth = 0;

        while (this.current()) {
            const token = this.current();
            if (!token) {
                return;
            }

            if (
                parenDepth === 0 &&
                bracketDepth === 0 &&
                braceDepth === 0 &&
                this.isKeywordToken(token, keyword)
            ) {
                return;
            }

            if (token.type === "symbol") {
                if (token.value === "(") {
                    parenDepth += 1;
                } else if (token.value === ")" && parenDepth > 0) {
                    parenDepth -= 1;
                } else if (token.value === "[") {
                    bracketDepth += 1;
                } else if (token.value === "]" && bracketDepth > 0) {
                    bracketDepth -= 1;
                } else if (token.value === "{") {
                    braceDepth += 1;
                } else if (token.value === "}" && braceDepth > 0) {
                    braceDepth -= 1;
                }
            }

            this.index += 1;
        }
    }
}

let lastScannedContent = "";
let lastScannedMode: LuauScanMode = "full";
let lastScannedAnalysis: LuauFileAnalysis = {
    functionScopes: [],
    symbols: [],
};

export function scanLuauFileAnalysis(
    content: string,
    options?: {
        mode?: LuauScanMode;
    },
): LuauFileAnalysis {
    const mode = options?.mode ?? "full";

    if (content === lastScannedContent && mode === lastScannedMode) {
        return lastScannedAnalysis;
    }

    const scanner = new LuauSymbolScanner(content, mode);
    lastScannedContent = content;
    lastScannedMode = mode;
    lastScannedAnalysis = scanner.scan();
    return lastScannedAnalysis;
}
