import type { ScopeFrame } from "../symbolScanner.type";
import { LuauSymbolScannerFunctions } from "./symbolScannerFunctions";

export class LuauSymbolScannerBlocks extends LuauSymbolScannerFunctions {
    protected parseBlock(
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
                const conditionStartIndex = this.index;
                this.skipUntilKeyword("do");
                this.addLoadstringSymbolsInTokenRange(
                    conditionStartIndex,
                    this.index,
                    scope,
                    currentFunctionScope,
                );

                if (this.matchKeyword("do")) {
                    this.parseScopedBlock(
                        new Set(["end"]),
                        currentFunctionScope,
                    );
                }
                continue;
            }

            if (this.matchKeyword("repeat")) {
                this.parseRepeatBlock(scope, currentFunctionScope);
                continue;
            }

            if (this.matchKeyword("if")) {
                this.parseIfStatement(scope, currentFunctionScope);
                continue;
            }

            if (this.matchKeyword("for")) {
                this.parseForStatement(scope, currentFunctionScope);
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
                const statementStartIndex = this.index;
                this.skipSimpleStatement();
                this.addLoadstringSymbolsInTokenRange(
                    statementStartIndex,
                    this.index,
                    scope,
                    currentFunctionScope,
                );
                continue;
            }

            if (this.canStartBareAssignment()) {
                this.parseBareAssignment(scope, currentFunctionScope);
                continue;
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
    }

    protected parseForStatement(
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        const bindings = this.parseForBindings();

        const iteratorStartIndex = this.index;

        while (
            this.current() &&
            !this.isCurrentKeyword("do") &&
            this.current()?.type !== "newline"
        ) {
            this.index += 1;
        }
        this.addLoadstringSymbolsInTokenRange(
            iteratorStartIndex,
            this.index,
            scope,
            currentFunctionScope,
        );

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

    protected parseIfStatement(
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
        const conditionStartIndex = this.index;
        this.skipUntilKeyword("then");
        this.addLoadstringSymbolsInTokenRange(
            conditionStartIndex,
            this.index,
            scope,
            currentFunctionScope,
        );

        if (!this.matchKeyword("then")) {
            return;
        }

        this.parseScopedBlock(
            new Set(["elseif", "else", "end"]),
            currentFunctionScope,
        );

        while (this.matchKeyword("elseif")) {
            const elseifConditionStartIndex = this.index;
            this.skipUntilKeyword("then");
            this.addLoadstringSymbolsInTokenRange(
                elseifConditionStartIndex,
                this.index,
                scope,
                currentFunctionScope,
            );

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

    protected parseRepeatBlock(
        scope: ScopeFrame,
        currentFunctionScope: ScopeFrame | null,
    ): void {
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

        const conditionStartIndex = this.index;
        this.skipSimpleStatement();
        this.addLoadstringSymbolsInTokenRange(
            conditionStartIndex,
            this.index,
            scope,
            currentFunctionScope,
        );
        repeatScope.end =
            this.tokens[this.index - 1]?.end ??
            untilToken?.start ??
            repeatScope.end;
    }

    protected parseScopedBlock(
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
}
