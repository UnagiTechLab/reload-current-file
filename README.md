# Reload Current File

**Unagi Tech Inc.（株式会社うなぎテック）** · MIT License

English | [日本語](README.ja.md)

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20us-e11982?logo=ko-fi&logoColor=white)](https://ko-fi.com/unagitech)

An Obsidian plugin that reloads the open note when another program changes it on disk.

Obsidian normally notices outside changes by itself. On network drives (NAS, SMB shares) and some sync folders, it is often not told about them, so the note on screen stays out of date until you reopen it or restart Obsidian. This plugin fixes that for the note you are looking at.

## Features

- **Automatic reload**: checks the open note every few seconds and reloads it when the file on disk is newer.
- **Keeps your place**: the cursor and scroll position stay where they were.
- **Manual reload**: the command **Reload current file from disk**. You can assign a hotkey in **Settings → Hotkeys**.
- **Works in both views**: editing view (Live Preview and Source mode) and Reading view.
- **English and Japanese** interface, following Obsidian's language setting.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Reload automatically | On | Turn off to reload only with the command. |
| Check interval (seconds) | 3 | How often the open note is checked, from 1 to 60 seconds. |
| Show a notice after reloading | On | Shows a short message after an automatic reload. |

## Install

**From Community plugins** (after the plugin is listed)

1. **Settings → Community plugins → Browse**
2. Search for **Reload Current File** and select **Install**, then **Enable**.

**Manually**

1. Download `main.js` and `manifest.json` from the [latest release](../../releases/latest).
2. Put them in `<your vault>/.obsidian/plugins/reload-current-file/`.
3. **Settings → Community plugins**: select the reload button next to **Installed plugins**, then enable **Reload Current File**.

## Good to know

- Only the note in the active pane is checked. Other notes show the latest content when you open them.
- If you are typing in a note while another program changes the same file, the outside change wins and your last unsaved keystrokes (usually the last second or two) can be lost. Avoid editing the same file in two programs at the same time.
- Desktop only.

## Privacy

This plugin makes no network requests and collects no data. It only reads the note that is open in your vault.

## License

[MIT](LICENSE) — Copyright (c) 2026 Unagi Tech Inc.

Keep the copyright notice when you modify or redistribute.

## Disclaimer

This plugin is provided "as is", without warranty of any kind, as stated in the [license](LICENSE). Keep backups of your vault. Unagi Tech Inc. is not liable for any loss of data or other damage arising from its use.

This is an independently developed plugin. It is not made, endorsed or supported by Obsidian (Dynalist Inc.).

## Support

Tips are optional (Ko-fi). They help us keep shipping and maintaining free tools.

[![Support on Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/unagitech)

## Links

- Lab org: [UnagiTechLab](https://github.com/UnagiTechLab)
- Company: [unagi.tech](https://www.unagi.tech)
- Bug reports and requests: [Issues](../../issues)
