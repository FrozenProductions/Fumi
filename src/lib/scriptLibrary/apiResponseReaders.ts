import { isBoolean, isNumber, isString } from "../shared/validation";
import { createInvalidScriptLibraryResponseError } from "./apiErrors";

/**
 * Reads an optional string field from a record, throwing if the value is present but not a string.
 *
 * @param value - The parent record
 * @param key - The field key to read
 * @param operation - Operation name for error context
 * @returns The string value, or undefined if the field is absent
 * @throws {ScriptLibraryError} If the field exists but is not a string
 */
export function readOptionalString(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): string | undefined {
    const candidate = value[key];

    if (candidate === undefined) {
        return undefined;
    }

    if (!isString(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

/**
 * Reads an optional nullable string field from a record, throwing if the value is present but not a string.
 *
 * @param value - The parent record
 * @param key - The field key to read
 * @param operation - Operation name for error context
 * @returns The string value, null, or undefined
 * @throws {ScriptLibraryError} If the field exists and is non-null but not a string
 */
export function readOptionalNullableString(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): string | null | undefined {
    const candidate = value[key];

    if (candidate === undefined || candidate === null) {
        return candidate;
    }

    if (!isString(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

/**
 * Reads an optional number field from a record, throwing if the value is present but not a number.
 *
 * @param value - The parent record
 * @param key - The field key to read
 * @param operation - Operation name for error context
 * @returns The number value, or undefined if the field is absent
 * @throws {ScriptLibraryError} If the field exists but is not a number
 */
export function readOptionalNumber(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): number | undefined {
    const candidate = value[key];

    if (candidate === undefined) {
        return undefined;
    }

    if (!isNumber(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

/**
 * Reads an optional boolean field from a record, throwing if the value is present but not a boolean.
 *
 * @param value - The parent record
 * @param key - The field key to read
 * @param operation - Operation name for error context
 * @returns The boolean value, or undefined if the field is absent
 * @throws {ScriptLibraryError} If the field exists but is not a boolean
 */
export function readOptionalBoolean(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): boolean | undefined {
    const candidate = value[key];

    if (candidate === undefined) {
        return undefined;
    }

    if (!isBoolean(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}

/**
 * Reads an optional nullable boolean field from a record, throwing if the value is present but not a boolean.
 *
 * @param value - The parent record
 * @param key - The field key to read
 * @param operation - Operation name for error context
 * @returns The boolean value, null, or undefined
 * @throws {ScriptLibraryError} If the field exists and is non-null but not a boolean
 */
export function readOptionalNullableBoolean(
    value: Record<string, unknown>,
    key: string,
    operation: string,
): boolean | null | undefined {
    const candidate = value[key];

    if (candidate === undefined || candidate === null) {
        return candidate;
    }

    if (!isBoolean(candidate)) {
        throw createInvalidScriptLibraryResponseError(operation);
    }

    return candidate;
}
