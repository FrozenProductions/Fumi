import { CheckmarkCircle01Icon, Key01Icon } from "@hugeicons/core-free-icons";
import type { ReactElement } from "react";
import { AppIcon } from "../app/common/AppIcon";
import type { ScriptLibraryCardProps } from "./scriptLibrary.type";

type ScriptLibraryBadgesProps = {
    script: ScriptLibraryCardProps["script"];
};

export function ScriptLibraryBadges({
    script,
}: ScriptLibraryBadgesProps): ReactElement {
    return (
        <>
            {script.keySystem === false ? (
                <div
                    title="Keyless"
                    className="flex size-6 items-center justify-center rounded-full bg-fumi-100 text-fumi-600"
                >
                    <AppIcon icon={Key01Icon} size={12} strokeWidth={2.4} />
                </div>
            ) : null}
            {script.unpatched ? (
                <div
                    title="Unpatched"
                    className="flex size-6 items-center justify-center rounded-full bg-fumi-100 text-fumi-600"
                >
                    <AppIcon
                        icon={CheckmarkCircle01Icon}
                        size={12}
                        strokeWidth={2.4}
                    />
                </div>
            ) : null}
        </>
    );
}
