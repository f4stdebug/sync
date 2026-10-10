# Changelog

All notable changes to SteamSync are documented here.

## [1.0.3] — First Public Release

### Added
- **Steam auto-discovery** — detects Steam on any drive: saved config, Windows registry (HKCU/HKLM + WOW6432Node), running `steam.exe` process, and full scan of drives C:–Z:
- **Smart library pick** — when multiple Steam locations are found, the one containing Dota 2 (`570`) is preferred
- **Manual folder picker** — if Steam isn't found, a native dialog lets you pick the folder; the path is saved
- **Account search** — filter the Source/Target dropdowns by nickname or ID3
- **Copy progress** — live file count and byte progress (`X / Y files · MB / MB`)
- **Smart post-transfer launch** — Steam / Secret DLC / Custom app / Nothing
- **Per-mode executable path** — each launch mode shows the detected path and can be changed; saved to config
- **Localization** — English / Русский

### Changed
- Copy operation is now file-by-file (was single-folder copy) to support progress
- Steam and Umbrella launch respect user-defined paths
- Settings are merged instead of overwritten (no more losing the Steam path)
- Umbrella loader is searched in both `C:\Umbrella` and `C:\umb`

### Fixed
- App no longer crashes when Steam is already closed
- Target `570` folder is replaced safely
- Telegram opens in the system browser instead of an Electron window

---

## [1.0.2]
- Multi-SSD Steam autodiscovery

## [1.0.1]
- Fixed Umbrella loader launch

## [1.0.0]
- Initial release: transfer Dota 2 configs between Steam accounts

