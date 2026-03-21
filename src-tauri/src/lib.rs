use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize)]
struct FileSystemEntry {
    path: String,
    name: String,
    is_directory: bool,
    modified_at: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize)]
struct NoteMetadata {
    position: i32,
    created_at: u64,
    modified_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct FolderMetadata {
    position: i32,
    is_expanded: bool,
    created_at: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppMetadata {
    current_note_path: Option<String>,
    editor_scroll_percent: f64,
    editor_line: i32,
    editor_column: i32,
    show_file_nav: bool,
    show_editor: bool,
    show_preview: bool,
    folders: std::collections::HashMap<String, FolderMetadata>,
    notes: std::collections::HashMap<String, NoteMetadata>,
}

fn get_app_data_dir(app: tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

fn get_notes_dir(app: tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_app_data_dir(app)?;
    path.push("notes");
    Ok(path)
}

fn get_metadata_path(app: tauri::AppHandle) -> Result<PathBuf, String> {
    let mut path = get_app_data_dir(app)?;
    path.push(".metadata.json");
    Ok(path)
}

#[tauri::command]
fn initialize_storage(app: tauri::AppHandle) -> Result<(), String> {
    let notes_dir = get_notes_dir(app.clone())?;

    if !notes_dir.exists() {
        fs::create_dir_all(&notes_dir)
            .map_err(|e| format!("Failed to create notes directory: {}", e))?;
    }

    let metadata_path = get_metadata_path(app)?;
    if !metadata_path.exists() {
        let default_metadata = AppMetadata {
            current_note_path: None,
            editor_scroll_percent: 0.0,
            editor_line: 1,
            editor_column: 1,
            show_file_nav: true,
            show_editor: true,
            show_preview: true,
            folders: std::collections::HashMap::new(),
            notes: std::collections::HashMap::new(),
        };

        let json = serde_json::to_string_pretty(&default_metadata)
            .map_err(|e| format!("Failed to serialize metadata: {}", e))?;

        fs::write(&metadata_path, json)
            .map_err(|e| format!("Failed to write metadata file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn list_notes(app: tauri::AppHandle) -> Result<Vec<FileSystemEntry>, String> {
    let notes_dir = get_notes_dir(app)?;
    let mut entries = Vec::new();

    fn scan_directory(
        dir: &PathBuf,
        base_dir: &PathBuf,
        entries: &mut Vec<FileSystemEntry>,
    ) -> Result<(), String> {
        let read_dir =
            fs::read_dir(dir).map_err(|e| format!("Failed to read directory {:?}: {}", dir, e))?;

        for entry in read_dir {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();

            if name.starts_with('.') {
                continue;
            }

            let relative_path = path
                .strip_prefix(base_dir)
                .map_err(|e| format!("Failed to get relative path: {}", e))?
                .to_string_lossy()
                .to_string();

            let metadata = entry
                .metadata()
                .map_err(|e| format!("Failed to read metadata: {}", e))?;

            let modified_at = metadata
                .modified()
                .ok()
                .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|duration| duration.as_secs());

            if metadata.is_dir() {
                entries.push(FileSystemEntry {
                    path: relative_path.clone(),
                    name: name.clone(),
                    is_directory: true,
                    modified_at,
                });
                scan_directory(&path, base_dir, entries)?;
            } else if path.extension().and_then(|s| s.to_str()) == Some("md") {
                entries.push(FileSystemEntry {
                    path: relative_path,
                    name,
                    is_directory: false,
                    modified_at,
                });
            }
        }

        Ok(())
    }

    scan_directory(&notes_dir, &notes_dir, &mut entries)?;
    Ok(entries)
}

#[tauri::command]
fn read_note(app: tauri::AppHandle, relative_path: String) -> Result<String, String> {
    let notes_dir = get_notes_dir(app)?;
    let note_path = notes_dir.join(&relative_path);

    if !note_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    fs::read_to_string(&note_path).map_err(|e| format!("Failed to read note: {}", e))
}

#[tauri::command]
fn write_note(app: tauri::AppHandle, relative_path: String, content: String) -> Result<(), String> {
    let notes_dir = get_notes_dir(app)?;
    let note_path = notes_dir.join(&relative_path);

    if !note_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    if let Some(parent) = note_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }

    fs::write(&note_path, content).map_err(|e| format!("Failed to write note: {}", e))
}

#[tauri::command]
fn delete_note(app: tauri::AppHandle, relative_path: String) -> Result<(), String> {
    let notes_dir = get_notes_dir(app)?;
    let note_path = notes_dir.join(&relative_path);

    if !note_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    fs::remove_file(&note_path).map_err(|e| format!("Failed to delete note: {}", e))
}

#[tauri::command]
fn create_folder(app: tauri::AppHandle, relative_path: String) -> Result<(), String> {
    let notes_dir = get_notes_dir(app)?;
    let folder_path = notes_dir.join(&relative_path);

    if !folder_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    fs::create_dir_all(&folder_path).map_err(|e| format!("Failed to create folder: {}", e))
}

#[tauri::command]
fn delete_folder(app: tauri::AppHandle, relative_path: String) -> Result<(), String> {
    let notes_dir = get_notes_dir(app)?;
    let folder_path = notes_dir.join(&relative_path);

    if !folder_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    fs::remove_dir_all(&folder_path).map_err(|e| format!("Failed to delete folder: {}", e))
}

#[tauri::command]
fn read_metadata(app: tauri::AppHandle) -> Result<String, String> {
    let metadata_path = get_metadata_path(app)?;

    if !metadata_path.exists() {
        return Ok("{}".to_string());
    }

    fs::read_to_string(&metadata_path).map_err(|e| format!("Failed to read metadata: {}", e))
}

#[tauri::command]
fn write_metadata(app: tauri::AppHandle, metadata: String) -> Result<(), String> {
    let metadata_path = get_metadata_path(app)?;

    fs::write(&metadata_path, metadata).map_err(|e| format!("Failed to write metadata: {}", e))
}

#[tauri::command]
fn move_note(app: tauri::AppHandle, old_path: String, new_path: String) -> Result<(), String> {
    let notes_dir = get_notes_dir(app)?;
    let old_note_path = notes_dir.join(&old_path);
    let new_note_path = notes_dir.join(&new_path);

    if !old_note_path.starts_with(&notes_dir) || !new_note_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    if let Some(parent) = new_note_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }

    fs::rename(&old_note_path, &new_note_path).map_err(|e| format!("Failed to move note: {}", e))
}

#[tauri::command]
fn move_folder(app: tauri::AppHandle, old_path: String, new_path: String) -> Result<(), String> {
    let notes_dir = get_notes_dir(app)?;
    let old_folder_path = notes_dir.join(&old_path);
    let new_folder_path = notes_dir.join(&new_path);

    if !old_folder_path.starts_with(&notes_dir) || !new_folder_path.starts_with(&notes_dir) {
        return Err("Invalid path: attempting to access outside notes directory".to_string());
    }

    if let Some(parent) = new_folder_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create parent directories: {}", e))?;
    }

    fs::rename(&old_folder_path, &new_folder_path)
        .map_err(|e| format!("Failed to move folder: {}", e))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            initialize_storage,
            list_notes,
            read_note,
            write_note,
            delete_note,
            create_folder,
            delete_folder,
            read_metadata,
            write_metadata,
            move_note,
            move_folder,
        ])
        .setup(|app| {
            let quit = MenuItemBuilder::with_id("quit", "Quit Markup")
                .accelerator("CmdOrCtrl+Q")
                .build(app)?;

            let app_menu = SubmenuBuilder::new(app, "Markup").item(&quit).build()?;

            let undo = MenuItemBuilder::with_id("undo", "Undo")
                .accelerator("CmdOrCtrl+Z")
                .build(app)?;
            let redo = MenuItemBuilder::with_id("redo", "Redo")
                .accelerator("CmdOrCtrl+Shift+Z")
                .build(app)?;
            let cut = MenuItemBuilder::with_id("cut", "Cut")
                .accelerator("CmdOrCtrl+X")
                .build(app)?;
            let copy = MenuItemBuilder::with_id("copy", "Copy")
                .accelerator("CmdOrCtrl+C")
                .build(app)?;
            let paste = MenuItemBuilder::with_id("paste", "Paste")
                .accelerator("CmdOrCtrl+V")
                .build(app)?;

            let edit_menu = SubmenuBuilder::new(app, "Edit ")
                .item(&undo)
                .item(&redo)
                .separator()
                .item(&cut)
                .item(&copy)
                .item(&paste)
                .build()?;

            let increase_font = MenuItemBuilder::with_id("increase_font", "Zoom In")
                .accelerator("CmdOrCtrl+=")
                .build(app)?;
            let decrease_font = MenuItemBuilder::with_id("decrease_font", "Zoom Out")
                .accelerator("CmdOrCtrl+-")
                .build(app)?;
            let reset_font = MenuItemBuilder::with_id("reset_font", "Actual Size")
                .accelerator("CmdOrCtrl+0")
                .build(app)?;

            let view_menu = SubmenuBuilder::new(app, "View")
                .item(&increase_font)
                .item(&decrease_font)
                .item(&reset_font)
                .build()?;

            let menu = MenuBuilder::new(app)
                .items(&[&app_menu, &edit_menu, &view_menu])
                .build()?;

            app.set_menu(menu)?;

            app.on_menu_event(move |app, event| match event.id().as_ref() {
                "quit" => {
                    app.exit(0);
                }
                "undo" => {
                    let _ = app.emit("menu:undo", ());
                }
                "redo" => {
                    let _ = app.emit("menu:redo", ());
                }
                "cut" => {
                    let _ = app.emit("menu:cut", ());
                }
                "copy" => {
                    let _ = app.emit("menu:copy", ());
                }
                "paste" => {
                    let _ = app.emit("menu:paste", ());
                }
                "increase_font" => {
                    let _ = app.emit("menu:increase-font", ());
                }
                "decrease_font" => {
                    let _ = app.emit("menu:decrease-font", ());
                }
                "reset_font" => {
                    let _ = app.emit("menu:reset-font", ());
                }
                _ => {}
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
