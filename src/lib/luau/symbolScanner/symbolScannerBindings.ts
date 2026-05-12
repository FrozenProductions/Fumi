import { LuauSymbolScannerCursor } from "./parser/symbolScannerCursor";
import type { ScopeFrame, TokenBoundary } from "./symbolScanner.type";

const GLOBAL_ENVIRONMENT_IDENTIFIER = "_G";

export abstract class LuauSymbolScannerBindings extends LuauSymbolScannerCursor {
    protected parseBareAssignment(
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        if (this.mode === "functions") {
            this.skipSimpleStatement();
            return;
        }

        const identifierToken = this.current();

        if (!identifierToken || identifierToken.type !== "identifier") {
            return;
        }

        if (identifierToken.value === GLOBAL_ENVIRONMENT_IDENTIFIER) {
            this.parseGlobalEnvironmentAssignment(
                identifierToken.end,
                scope,
                currentFunctionScope,
            );
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

        const statementStartIndex = this.index;
        this.skipSimpleStatement();
        this.addLoadstringSymbolsInTokenRange(
            statementStartIndex,
            this.index,
            scope,
            currentFunctionScope,
        );
    }

    private parseGlobalEnvironmentAssignment(
        visibleStart: number,
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        this.index += 1;

        if (!this.matchSymbol(".")) {
            const statementStartIndex = this.index;
            this.skipSimpleStatement();
            this.addLoadstringSymbolsInTokenRange(
                statementStartIndex,
                this.index,
                scope,
                currentFunctionScope,
            );
            return;
        }

        const memberToken = this.current();
        if (!memberToken || memberToken.type !== "identifier") {
            this.skipSimpleStatement();
            return;
        }

        this.index += 1;

        const equalsToken = this.peekNonNewline();
        if (equalsToken?.type === "symbol" && equalsToken.value === "=") {
            this.index = this.tokens.indexOf(equalsToken) + 1;
            this.addSymbol({
                label: memberToken.value,
                namespace: GLOBAL_ENVIRONMENT_IDENTIFIER,
                kind: "constant",
                detail: "global variable",
                declaration: memberToken,
                isLexical: false,
                ownerFunction: null,
                scope: this.rootScope,
                docSummary: "Global _G member assigned in the current file.",
                visibleStart,
            });
        }

        const statementStartIndex = this.index;
        this.skipSimpleStatement();
        this.addLoadstringSymbolsInTokenRange(
            statementStartIndex,
            this.index,
            scope,
            currentFunctionScope,
        );
    }

    protected parseBindings(): Array<{
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

    protected parseForBindings(): Array<{
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

    protected parseLocalBindings(
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        if (this.mode === "functions") {
            this.skipSimpleStatement();
            return;
        }

        const bindings = this.parseBindings();
        const visibleStart = this.current()?.start ?? this.content.length;

        const statementStartIndex = this.index;
        this.skipSimpleStatement();
        this.addLoadstringSymbolsInTokenRange(
            statementStartIndex,
            this.index,
            scope,
            currentFunctionScope,
        );

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
}
