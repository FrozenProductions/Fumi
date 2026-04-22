import type { ScopeFrame } from "./symbolScanner.type";
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

    protected parseForStatement(currentFunctionScope: ScopeFrame | null): void {
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

    protected parseIfStatement(currentFunctionScope: ScopeFrame | null): void {
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

    protected parseRepeatBlock(currentFunctionScope: ScopeFrame | null): void {
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
