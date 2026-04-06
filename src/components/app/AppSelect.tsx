import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { type ReactElement, useEffect, useRef, useState } from "react";
import { APP_SELECT_DROPDOWN_EXIT_DURATION_MS } from "../../constants/app/input";
import { usePresenceTransition } from "../../hooks/shared/usePresenceTransition";
import { AppIcon } from "./AppIcon";
import type { AppSelectProps } from "./appForm.type";

export function AppSelect<TValue extends string>({
    value,
    options,
    onChange,
    className = "",
}: AppSelectProps<TValue>): ReactElement {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selectedOption = options.find((option) => option.value === value);
    const { isPresent, isClosing } = usePresenceTransition({
        isOpen,
        exitDurationMs: APP_SELECT_DROPDOWN_EXIT_DURATION_MS,
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen || isPresent) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, isPresent]);

    const dropdownMotionClassName = isClosing
        ? "motion-safe:motion-opacity-out-0 motion-safe:motion-scale-out-[96%] motion-safe:-motion-translate-y-out-[4%] motion-safe:motion-duration-120 motion-safe:motion-ease-in-quad"
        : "motion-safe:motion-opacity-in-0 motion-safe:motion-scale-in-[96%] motion-safe:-motion-translate-y-in-[6%] motion-safe:motion-duration-150 motion-safe:motion-ease-spring-snappy";

    return (
        <div
            ref={containerRef}
            className={`relative inline-block text-left ${className}`}
        >
            <button
                type="button"
                onClick={() => setIsOpen((currentValue) => !currentValue)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className={`app-select-none flex h-8 items-center justify-between gap-1.5 whitespace-nowrap rounded-[0.65rem] border bg-fumi-50 px-2.5 text-xs font-semibold transition-[color,background-color,border-color,box-shadow] hover:bg-fumi-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fumi-600 ${
                    isOpen
                        ? "border-fumi-300 text-fumi-800 shadow-sm ring-1 ring-fumi-200"
                        : "border-fumi-200 text-fumi-500 hover:border-fumi-300 hover:text-fumi-600"
                }`}
            >
                {selectedOption?.label ?? options[0]?.label ?? value}
                <AppIcon
                    icon={ArrowDown01Icon}
                    size={14}
                    strokeWidth={2.5}
                    className={`transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-fumi-600" : "text-fumi-400"
                    }`}
                />
            </button>

            {isPresent ? (
                <div
                    className={[
                        "absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[140px] origin-top-right overflow-hidden rounded-[0.85rem] border border-fumi-200 bg-fumi-50 p-1.5 shadow-[var(--shadow-app-floating)] motion-reduce:animate-none motion-reduce:transform-none",
                        isClosing ? "pointer-events-none" : "",
                        dropdownMotionClassName,
                    ].join(" ")}
                    role="listbox"
                >
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="option"
                            aria-selected={value === option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`app-select-none flex w-full items-center justify-between gap-3 rounded-[0.5rem] px-2.5 py-2 text-left text-[11px] font-semibold tracking-wide transition-colors ${
                                value === option.value
                                    ? "bg-fumi-100 text-fumi-800"
                                    : "text-fumi-500 hover:bg-fumi-50 hover:text-fumi-800"
                            }`}
                        >
                            {option.label}
                            {value === option.value ? (
                                <AppIcon
                                    icon={Tick01Icon}
                                    size={14}
                                    strokeWidth={3}
                                    className="text-fumi-600"
                                />
                            ) : null}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
