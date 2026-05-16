/**
 * Joins multiple class names into a single string, filtering out falsy values.
 *
 * @param classNames - Class names to join (strings, null, undefined, or false)
 * @returns A space-separated string of valid class names
 */
export function joinClassNames(
    ...classNames: Array<string | false | null | undefined>
): string {
    return classNames.filter(Boolean).join(" ");
}
