import type {
    AppSidebarItem,
    AppSidebarPosition,
} from "../../../lib/app/sidebar.type";

export type AppSidebarProps = {
    isOpen: boolean;
    position: AppSidebarPosition;
    activeItem: AppSidebarItem;
    showsSettingsUpdateIndicator: boolean;
    onSelectItem: (item: AppSidebarItem) => void;
};
