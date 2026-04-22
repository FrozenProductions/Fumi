import { isBoolean, isNumber, isString } from "../shared/validation";
import { createInvalidScriptLibraryResponseError } from "./apiErrors";

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
