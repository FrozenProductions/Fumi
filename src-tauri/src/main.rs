#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Err(error) = fumi_lib::run() {
        eprintln!("Failed to start Fumi: {error}");
        std::process::exit(1);
    }
}
