//! Native application menu construction and event handling.

use tauri::{
    menu::{AboutMetadata, Menu, MenuEvent, MenuItemBuilder, PredefinedMenuItem, Submenu},
    AppHandle, Manager, Runtime,
};

use crate::{
    events::{
        emit_check_for_updates, emit_open_settings, emit_zoom_in, emit_zoom_out, emit_zoom_reset,
    },
    lifecycle::request_app_exit,
};

const APP_OPEN_SETTINGS_ID: &str = "app-open-settings";
const APP_CHECK_FOR_UPDATES_ID: &str = "app-check-for-updates";
const APP_QUIT_ID: &str = "app-quit";
const VIEW_OPEN_DEVTOOLS_ID: &str = "view-open-devtools";
const VIEW_ZOOM_IN_ID: &str = "view-zoom-in";
const VIEW_ZOOM_OUT_ID: &str = "view-zoom-out";
const VIEW_ZOOM_RESET_ID: &str = "view-zoom-reset";

pub(crate) fn build_app_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let package_info = app.package_info();
    let about_metadata = AboutMetadata {
        name: Some(package_info.name.clone()),
        version: Some(package_info.version.to_string()),
        ..Default::default()
    };

    let open_settings = MenuItemBuilder::with_id(APP_OPEN_SETTINGS_ID, "Open Settings")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;
    let check_for_updates =
        MenuItemBuilder::with_id(APP_CHECK_FOR_UPDATES_ID, "Check for Updates…").build(app)?;
    let quit = MenuItemBuilder::with_id(APP_QUIT_ID, format!("Quit {}", package_info.name))
        .accelerator("CmdOrCtrl+Q")
        .build(app)?;
    let zoom_reset = MenuItemBuilder::with_id(VIEW_ZOOM_RESET_ID, "Actual Size")
        .accelerator("CmdOrCtrl+0")
        .build(app)?;
    let open_devtools = MenuItemBuilder::with_id(VIEW_OPEN_DEVTOOLS_ID, "Developer Tools")
        .accelerator("CmdOrCtrl+Alt+I")
        .build(app)?;
    let zoom_in = MenuItemBuilder::with_id(VIEW_ZOOM_IN_ID, "Zoom In")
        .accelerator("CmdOrCtrl+=")
        .build(app)?;
    let zoom_out = MenuItemBuilder::with_id(VIEW_ZOOM_OUT_ID, "Zoom Out")
        .accelerator("CmdOrCtrl+-")
        .build(app)?;

    Menu::with_items(
        app,
        &[
            &Submenu::with_items(
                app,
                package_info.name.clone(),
                true,
                &[
                    &PredefinedMenuItem::about(app, None, Some(about_metadata))?,
                    &PredefinedMenuItem::separator(app)?,
                    &open_settings,
                    &check_for_updates,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::hide(app, None)?,
                    &PredefinedMenuItem::hide_others(app, None)?,
                    &PredefinedMenuItem::show_all(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &quit,
                ],
            )?,
            &Submenu::with_items(
                app,
                "Edit",
                true,
                &[
                    &PredefinedMenuItem::undo(app, None)?,
                    &PredefinedMenuItem::redo(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::cut(app, None)?,
                    &PredefinedMenuItem::copy(app, None)?,
                    &PredefinedMenuItem::paste(app, None)?,
                    &PredefinedMenuItem::select_all(app, None)?,
                ],
            )?,
            &Submenu::with_items(
                app,
                "File",
                true,
                &[&PredefinedMenuItem::close_window(app, None)?],
            )?,
            &Submenu::with_items(
                app,
                "View",
                true,
                &[
                    &zoom_reset,
                    &zoom_in,
                    &zoom_out,
                    &PredefinedMenuItem::separator(app)?,
                    &open_devtools,
                ],
            )?,
            &Submenu::with_items(
                app,
                "Window",
                true,
                &[
                    &PredefinedMenuItem::minimize(app, None)?,
                    &PredefinedMenuItem::maximize(app, None)?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::close_window(app, None)?,
                ],
            )?,
        ],
    )
}

pub(crate) fn handle_menu_event<R: Runtime>(app: &AppHandle<R>, event: MenuEvent) {
    let result = match event.id().as_ref() {
        APP_OPEN_SETTINGS_ID => emit_open_settings(app),
        APP_CHECK_FOR_UPDATES_ID => emit_check_for_updates(app),
        APP_QUIT_ID => {
            request_app_exit(app);
            Ok(())
        }
        VIEW_ZOOM_IN_ID => emit_zoom_in(app),
        VIEW_ZOOM_OUT_ID => emit_zoom_out(app),
        VIEW_ZOOM_RESET_ID => emit_zoom_reset(app),
        VIEW_OPEN_DEVTOOLS_ID => {
            if let Some(window) = app.get_webview_window(crate::events::MAIN_WINDOW_LABEL) {
                window.open_devtools();
            }

            Ok(())
        }
        _ => Ok(()),
    };

    if let Err(error) = result {
        eprintln!(
            "Failed to handle menu event {}: {error}",
            event.id().as_ref()
        );
    }
}
