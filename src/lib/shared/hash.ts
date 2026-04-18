/**
 * Computes a FNV-1a hash of a string, returning an 8-character hex string.
 *
 * @remarks
 * Used for content-based caching where a fast hash is preferred over
 * cryptographic strength. The algorithm is deterministic across runs.
 */
export function hashString(value: string): string {
    let hash = 0x811c9dc5;

    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }

    return (hash >>> 0).toString(16).padStart(8, "0");
}
