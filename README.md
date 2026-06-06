<div align="center">

<img src="icons/icon.png" alt="YouTube TV Mode" width="200" height="200">

# YouTube TV Mode

**Version 1.0.0**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.google.com/chrome/)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](https://www.gnu.org/licenses/gpl-3.0)

*The ultimate YouTube TV experience for your desktop browser.*

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Full Documentation](README+.md)

</div>

---

## Overview

**YouTube TV Mode** is a Chrome extension designed to bring the TV UI of YouTube to your desktop browser. It goes beyond simple redirection by spoofing TV-compatible devices, forcing the highest available resolutions, and seamlessly blending custom features directly into the native YouTube TV UI. Whether you're watching on a laptop, a big monitor, or a home theater PC, this extension ensures YouTube TV looks and feels native.

---

## ✨ Features

- **Perfect TV Mode**: Accurate device spoofing and lightning-fast URL redirection to the `youtube.com/tv` interface.
- **Native Settings UI Integration**: Custom extension settings embedded directly into the native YouTube TV settings menu, complete with multi-level sub-menus.
- **Precision Speed Controls**: Set custom playback speeds with granular increment pickers (from 0.05× to 0.50×) right from the player menu. Speeds persist automatically across videos.
- **Fix Stuttering**: Toggle a subtle 1.0001× speed hack to resolve potential frame-pacing or audio-sync issues common on some hardware.
- **Ad Blocker**: Built-in support to block both home screen ads and video-interrupting ads, ensuring a clean, leanback experience.
- **Sidebar Customization**: Declutter your sidebar. Selectively hide specific tabs in the sidebar (e.g., News, Sports, Music, Podcasts etc) to build a focused TV experience.
- **4K & High Resolution**: Bypasses browser limitations to force the highest available quality for every video.
- **Smart Auto Fullscreen**: Enters borderless F11-style fullscreen automatically when launching TV mode and restores your window state upon exit.
- **Leanback Control**: Instant toggle to hide the cursor and disable mouse input for a pure keyboard/remote experience.
- **Background Playback**: Keeps your audio and video playing even when the tab or window is inactive or in the background.
- **High-Quality Thumbnails**: Intercepts and upgrades all thumbnail images to their maximum resolution.
- **Key Remapping**: Intuitive controls (Backspace → Back, Spacebar → OK/Enter) tailored for the TV interface, perfectly sidestepping browser hotkey conflicts.
- **Mini Player (PiP)**: Dedicated Picture-in-Picture trigger integrated into the TV player menu.
- **Zero Side-Effects**: All settings, increments, and sidebar toggles in TV Mode are strictly isolated and do not affect your normal desktop YouTube experience.

> [!TIP]
> **Looking for technical details?** Check out the [Technical Deep Dive & FAQ](README+.md) for architecture, performance optimizations, and design philosophy.

---

## Installation

### Latest Release (Recommended)

For the best experience, we recommend using the **ZIP** file. Most modern chromium based browsers (like Chrome, Edge, Brave, Opera etc) block direct `.crx` installations for security reasons.

[![Download ZIP](https://img.shields.io/badge/Download-ZIP-orange?style=for-the-badge&logo=github&logoColor=white)](https://github.com/TheTahsinShahriar/YouTubeTVMode/releases/latest/download/YouTubeTVMode.zip)
[![Download CRX](https://img.shields.io/badge/Download-CRX-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://github.com/TheTahsinShahriar/YouTubeTVMode/releases/latest/download/YouTubeTVMode.crx)

1.  **Download & Extract**: Download the `.zip` file from the [Latest Release](https://github.com/TheTahsinShahriar/YouTubeTVMode/releases/latest) and extract it to a folder on your computer.
2.  **Open Extensions**: Navigate to `chrome://extensions/` in your browser.
3.  **Enable Developer Mode**: Toggle the **Developer mode** switch on.
4.  **Load Unpacked**: Click the **Load unpacked** button and select the extracted folder.

> [!NOTE]
> **Using the CRX?** If you prefer the `.crx` file, you can try dragging and dropping it into the `chrome://extensions/` page with Developer Mode enabled, though this may be blocked by your browser.

---
### 🛠️ Developer Mode (Manual)

For developers or those who want the absolute latest (potentially unstable) features directly from the source:

1.  **Clone or Download** the repository:
    - **Clone** using Git:
      ```bash
      git clone https://github.com/TheTahsinShahriar/YouTubeTVMode.git
      ```
    - **Download** the [Source ZIP](https://github.com/TheTahsinShahriar/YouTubeTVMode/archive/refs/heads/main.zip) and extract it to a local folder.
2.  **Load the Extension**:
    - Open `chrome://extensions/` and enable **Developer mode**.
    - Click **Load unpacked** and select the `YouTubeTVMode` directory you just cloned.

---

## Usage

1. **Launch**: Click the extension icon in your toolbar and toggle **TV Mode** to **On**.
2. **Navigate**: Any YouTube link will now automatically redirect to the TV interface (`/tv/`).
3. **Customize**: Under the YouTube TV interface, navigate to the native **Settings** → **Extension Settings** to configure features like Speed Controls, Sidebar Contents, and Fullscreen behavior and more!

---

## License

This project is licensed under the GNU GPLv3 License - see the [LICENSE](LICENSE) file for details.

---

## Author

**Tahsin Shahriar**

---

<div align="center">

### ⭐ If you enjoy using YouTube TV Mode, consider starring the repository!

**Made with ❤️ for people who watch way too much YouTube.**

</div>
