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
