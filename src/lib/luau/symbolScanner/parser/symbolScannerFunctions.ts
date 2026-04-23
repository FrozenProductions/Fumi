import type { LuauSymbolKind } from "../../luau.type";
import type {
    LuauToken,
    ScopeFrame,
    TokenBoundary,
} from "../symbolScanner.type";
import { LuauSymbolScannerBindings } from "../symbolScannerBindings";

export abstract class LuauSymbolScannerFunctions extends LuauSymbolScannerBindings {
    protected abstract parseScopedBlock(
        endKeywords: Set<string>,
        currentFunctionScope: ScopeFrame | null,
        initializeScope?: (scope: ScopeFrame) => void,
        existingScope?: ScopeFrame,
    ): void;

    protected parseFunctionDeclaration(
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

    protected parseFunctionParameters(): Array<{
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
}
