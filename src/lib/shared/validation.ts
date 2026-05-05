/**
 * Returns whether the value is a non-null object.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/**
 * Returns whether the value is a string.
 */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/**
 * Returns whether the value is a finite number (rejects NaN and Infinity via Number.isFinite).
 */
export function isNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

/**
 * Returns whether the value is a boolean.
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === "boolean";
}

/**
 * Returns whether the value is one of the provided string literals.
 */
export function isStringLiteral<TValue extends string>(
    value: unknown,
    values: readonly TValue[],
): value is TValue {
    return typeof value === "string" && values.some((item) => item === value);
}

/**
 * Returns whether the value is one of the provided number literals.
 */
export function isNumberLiteral<TValue extends number>(
    value: unknown,
    values: readonly TValue[],
): value is TValue {
    return typeof value === "number" && values.some((item) => item === value);
}
