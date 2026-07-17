<div align="center">

<img src="icons/icon.png" alt="YouTube TV Mode" width="200" height="200">

# YouTube TV Mode

**Version 1.1.0**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

*The ultimate YouTube TV experience for your desktop browser.*

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Full Documentation](README+.md)

</div>

---

## Overview

**YouTube TV Mode** is a Chrome extension designed to bring the TV UI of YouTube to your desktop browser. It goes beyond simple redirection by spoofing TV-compatible devices, forcing preferred resolutions, integrating settings into the native YouTube TV UI, and adding leanback-friendly tools (ads, SponsorBlock, speed, sidebar cleanup).

---

## ✨ Features

- **Perfect TV Mode**: Device spoofing + fast URL redirection to `youtube.com/tv`.
- **Native Settings UI**: Extension options inside YouTube TV **Settings → Extension Settings**.
- **Video Quality**: Force highest available quality, or pick 4K / 1440p / 1080p / 720p / Auto.
- **Precision Speed Controls**: Custom speeds with configurable increments; optional 1.0001× stutter fix.
- **Ad Blocker**: Strips video ads, home masthead slots, and related payloads when enabled.
- **SponsorBlock** (optional): Auto-skip community segments via [sponsor.ajay.app](https://sponsor.ajay.app).
- **Sidebar Customization**: Hide guide entries (News, Sports, Music, …).
- **Smart Auto Fullscreen**: Window fullscreen with restore of previous bounds on exit.
- **Leanback Mode**: Hide cursor and disable mouse for remote/keyboard use.
- **Background Playback**: Keep media playing when the tab is in the background.
- **High-Quality Thumbnails**: Upgrade thumbnail URLs to max resolution.
- **Key Remapping**: Backspace → Back, Space → OK (outside the watch page).
- **Mini Player (PiP)**: Optional Picture-in-Picture entry in the player menu.
- **Popup quick toggles**: TV Mode, fullscreen, ads, SponsorBlock, leanback.
- **Isolated from desktop YT**: Feature scripts only run on `/tv` paths.

---

## Installation

### Latest Release (Recommended)

Prefer the **ZIP** (load unpacked). Direct `.crx` install is often blocked; CRX is only published when a stable signing key is configured for releases.

[![Download ZIP](https://img.shields.io/badge/Download-ZIP-orange?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TheTahsinShahriar/YouTubeTVMode/releases/latest/download/YouTubeTVMode.zip)

1. Download & extract the `.zip` from [Latest Release](https://github.com/TheTahsinShahriar/YouTubeTVMode/releases/latest).
2. Open `chrome://extensions/` and enable **Developer mode**.
3. **Load unpacked** → select the extracted folder.

### Developer install

```bash
git clone https://github.com/TheTahsinShahriar/YouTubeTVMode.git
cd YouTubeTVMode
npm test   # optional
```

Then **Load unpacked** pointing at this repository root (not `references/`).

---

## Usage

1. Click the extension icon → turn **TV Mode** on.
2. YouTube navigations redirect to the TV interface.
3. Open **Settings → Extension Settings** on YouTube TV for full options.
4. Use the popup for quick toggles (ads, SponsorBlock, leanback, fullscreen).

---

## Development

```bash
npm install
npm test
npm run lint   # requires eslint (devDependency)
```

Architecture notes: [README+.md](README+.md) · Upstream inspiration: [docs/REFERENCES.md](docs/REFERENCES.md)

---

## License

GNU GPLv3 — see [LICENSE](LICENSE).

---

## Author

**Tahsin Shahriar**

<div align="center">

### ⭐ If you enjoy YouTube TV Mode, star the repository!

</div>
