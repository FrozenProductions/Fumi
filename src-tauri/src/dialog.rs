#![cfg_attr(target_os = "macos", allow(unexpected_cfgs))]

use tauri::Runtime;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};

use crate::APP_TITLE;

const DEFAULT_CONFIRM_LABEL: &str = "OK";
const DEFAULT_CANCEL_LABEL: &str = "Cancel";

pub(crate) struct ConfirmDialogOptions<'a> {
    pub(crate) title: &'a str,
    pub(crate) message: &'a str,
    pub(crate) confirm_label: &'a str,
    pub(crate) cancel_label: &'a str,
}

/// Shows a native confirmation dialog and returns whether the user confirmed.
#[tauri::command]
pub fn show_confirmation_dialog(app: tauri::AppHandle, message: String) -> Result<bool, String> {
    show_warning_confirmation_dialog(
        &app,
        ConfirmDialogOptions {
            title: APP_TITLE,
            message: &message,
            confirm_label: DEFAULT_CONFIRM_LABEL,
            cancel_label: DEFAULT_CANCEL_LABEL,
        },
    )
}

pub(crate) fn show_warning_confirmation_dialog<R: Runtime>(
    app: &tauri::AppHandle<R>,
    options: ConfirmDialogOptions<'_>,
) -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        return show_macos_confirmation_dialog(app, &options)
            .or_else(|_| Ok(show_plugin_confirmation_dialog(app, &options)));
    }

    #[cfg(not(target_os = "macos"))]
    {
        Ok(show_plugin_confirmation_dialog(app, &options))
    }
}

fn show_plugin_confirmation_dialog<R: Runtime>(
    app: &tauri::AppHandle<R>,
    options: &ConfirmDialogOptions<'_>,
) -> bool {
    app.dialog()
        .message(options.message)
        .title(options.title)
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            options.confirm_label.to_string(),
            options.cancel_label.to_string(),
        ))
        .blocking_show()
}

#[cfg(target_os = "macos")]
fn show_macos_confirmation_dialog<R: Runtime>(
    app: &tauri::AppHandle<R>,
    options: &ConfirmDialogOptions<'_>,
) -> Result<bool, String> {
    use std::sync::mpsc;

    let (tx, rx) = mpsc::channel();
    let title = options.title.to_string();
    let message = options.message.to_string();
    let confirm_label = options.confirm_label.to_string();
    let cancel_label = options.cancel_label.to_string();

    app.run_on_main_thread(move || {
        let result = unsafe {
            run_macos_confirmation_dialog(&title, &message, &confirm_label, &cancel_label)
        };

        let _ = tx.send(result);
    })
    .map_err(|error| error.to_string())?;

    rx.recv().map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
unsafe fn run_macos_confirmation_dialog(
    title: &str,
    message: &str,
    confirm_label: &str,
    cancel_label: &str,
) -> bool {
    use objc::rc::autoreleasepool;
    use objc::runtime::Object;
    use objc::{class, msg_send, sel, sel_impl};
    use objc_foundation::{INSString, NSString};
    use objc_id::{Id, Owned};

    const NS_ALERT_STYLE_WARNING: i64 = 0;
    const NS_ALERT_FIRST_BUTTON_RETURN: i64 = 1_000;

    autoreleasepool(|| {
        let alert: *mut Object = msg_send![class!(NSAlert), new];
        let alert: Id<Object, Owned> = Id::from_retained_ptr(alert);

        let _: () = msg_send![&*alert, setAlertStyle: NS_ALERT_STYLE_WARNING];

        let title = NSString::from_str(title);
        let _: () = msg_send![&*alert, setMessageText: title];

        let message = NSString::from_str(message);
        let _: () = msg_send![&*alert, setInformativeText: message];

        let shared_app: *mut Object = msg_send![class!(NSApplication), sharedApplication];
        let app_icon: *mut Object = msg_send![shared_app, applicationIconImage];
        let _: () = msg_send![&*alert, setIcon: app_icon];

        let confirm_label = NSString::from_str(confirm_label);
        let _: () = msg_send![&*alert, addButtonWithTitle: confirm_label];

        let cancel_label = NSString::from_str(cancel_label);
        let _: () = msg_send![&*alert, addButtonWithTitle: cancel_label];

        let response: i64 = msg_send![&*alert, runModal];
        response == NS_ALERT_FIRST_BUTTON_RETURN
    })
}
