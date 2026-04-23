import type { LuauToken, TokenBoundary } from "../symbolScanner.type";
import { LuauSymbolScannerCore } from "./symbolScannerCore";

export abstract class LuauSymbolScannerCursor extends LuauSymbolScannerCore {
    protected canStartBareAssignment(): boolean {
        const currentToken = this.current();
        const nextToken = this.peekNonNewline(1);

        return (
            currentToken?.type === "identifier" &&
            nextToken?.type === "symbol" &&
            nextToken.value === "="
        );
    }

    protected consumeEndKeyword(): TokenBoundary {
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

    protected current(): LuauToken | null {
        return this.tokens[this.index] ?? null;
    }

    protected isBlockTerminator(
        token: LuauToken | null,
        endKeywords: Set<string>,
    ): boolean {
        return token?.type === "identifier" && endKeywords.has(token.value);
    }

    protected isCurrentKeyword(keyword: string): boolean {
        const token = this.current();
        return token?.type === "identifier" && token.value === keyword;
    }

    protected isKeywordToken(
        token: LuauToken | null,
        keyword: string,
    ): boolean {
        return token?.type === "identifier" && token.value === keyword;
    }

    protected matchKeyword(keyword: string): boolean {
        if (!this.isCurrentKeyword(keyword)) {
            return false;
        }

        this.index += 1;
        return true;
    }

    protected matchSymbol(symbol: string): boolean {
        const token = this.current();
        if (token?.type !== "symbol" || token.value !== symbol) {
            return false;
        }

        this.index += 1;
        return true;
    }

    protected peekNonNewline(offset = 0): LuauToken | null {
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

    protected skipBalancedTypeParameters(
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

    protected skipNewlinesAndSemicolons(): void {
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

    protected skipSimpleStatement(): void {
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

    protected skipTypeExpression(stopValues: Set<string>): void {
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

    protected skipUntilKeyword(keyword: string): void {
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
