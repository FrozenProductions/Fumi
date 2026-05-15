import type { ReactElement } from "react";
import { WorkspaceActionsProcessRow } from "./WorkspaceActionsProcessRow";
import type { WorkspaceActionsDropdownProps } from "./workspaceActionsDropdown.type";

type WorkspaceActionsProcessListProps = {
    options: WorkspaceActionsDropdownProps;
};

/**
 * Renders per-instance Roblox actions inside the workspace actions dropdown.
 *
 * @param props - Component props
 * @param props.options - The shared dropdown props containing menu, roblox, confirm, and actions state
 */
export function WorkspaceActionsProcessList({
    options,
}: WorkspaceActionsProcessListProps): ReactElement[] {
    const { roblox } = options;

    return roblox.processes.map((process, index) => {
        return (
            <WorkspaceActionsProcessRow
                key={process.pid}
                index={index}
                options={options}
                process={process}
            />
        );
    });
}
