<div align="center">

<img src="icons/icon.png" alt="YouTube TV Mode" width="200" height="200">

# YouTube TV Mode - Technical Documentation

[← Back to Main README](README.md)

</div>

---

## Technical Deep Dive

### Architecture & Coordination

YouTube TV Mode is built using a modular, event-driven architecture designed to balance performance with deep page state awareness.

#### **Layered Injection Model**
1. **Content Script Coordinator**: Running at `document_start`, it synchronously injects feature modules before the browser has a chance to render the DOM or detect the User-Agent.
2. **Feature Modules**: Isolated scripts (spoofing, thumbnails, remapping) that self-initialize and subscribe to a global message bus for reactive settings updates.
3. **Settings Integration**: A specialized module that patches directly into the YouTube TV React-like internals to inject a native-feeling configurations UI.

### Key Technologies

#### **Native Framework Patching (Settings & Popups)**
To build menus that feel truly native, the extension hooks into `window._yttv`. By proxying and overriding the `resolveCommand` dispatch method, we intercept custom actions (e.g. `YTTVM_OPEN_SETTINGS`). Utilizing the `commandExecutorCommand.commands` wrapping patterns utilized by YouTube TV modals, we achieve fully interactive multi-level sub-menus.

#### **Network & Response Interception**
- **Thumbnails:** The `highQualityThumbnails` feature overrides the global `fetch` function and the `HTMLImageElement.prototype.src` property descriptor. This rewrites thumbnail URLs on-the-fly (`hqdefault` to `maxresdefault`) without waiting for the DOM.
- **Guide Filtering:** The `hideGuide` feature patches `JSON.parse` to intercept API responses. Guide entries are modified structurally before the React tree ever renders them.

#### **Smart Fullscreen Window State Tracking**
Traditional HTML5 `requestFullscreen()` forces the browser to consume the `Escape` key, breaking TV app navigation. Switching to a background `chrome.windows.update({state: "fullscreen"})` preserves the `Escape` key for the web app. To prevent window-resizing jank upon exiting fullscreen, an event bridge immediately triggers `WINDOW_RESIZED`, allowing the background worker to seamlessly restore exact prior `top/left/width/height` window coordinates from memory.

#### **CSP-Safe CSS Injection (Leanback Mode)**
Instead of inline script injections that violate YouTube's strict Content Security Policy, Leanback mode dynamically evaluates and attaches a dedicated `<link rel="stylesheet">` extracted directly via valid DOM dataset extension URIs. 

#### **Key Interaction Shims**
The TV interface uses complex event handling. Our **Key Remapping** module uses the capture phase of event propagation to ensure that reassigned keys (like Backspace to Escape/Back) are dispatched as fully synthetic `KeyboardEvent`s processed by YouTube's navigation logic.

---

## Settings Persistence

Data is stored in `chrome.storage.local` and synchronized between the extension background, content scripts, and Page Context using a `Window.postMessage` bridge:

```javascript
// Example settings structure
{
  "tvModeEnabled": true,
  "forceResolutionEnabled": true,
  "autoFullscreenEnabled": true,
  "backgroundPlaybackEnabled": true,
  "leanbackModeEnabled": false,
  "highQualityThumbnailsEnabled": true,
  "keyRemappingEnabled": true,
  "playbackSpeedEnabled": true,
  "speedIncrement": 0.25,
  "playbackSpeed": 1.5,
  "miniPlayerEnabled": false,
  "disabledSidebarContents": ["YOUTUBE_MUSIC", "NEWS"]
}
```

---

## Design Philosophy

The project follows a "Native Enhancement" philosophy:
- **Visual Integration**: The settings UI uses YouTube's own component rendering engines (`overlayPanelItemListRenderer`, `compactLinkRenderer`) to look indistinguishable from first-party code.
- **State Efficiency**: Features like Leanback and Guide updates apply smartly via message passing. Sub-menus (like the guide hider) feature a 'Dirty Flag' system ensuring reloads only execute post-modification upon menu closure.
- **Glassmorphism**: The popup uses a premium frosted glass effect with a custom HSL color palette tailored for entertainment.

---

## ❓ FAQ

### **Q: Why are some settings "Restart Required"?**
**A:** Features that involve overriding core browser APIs (like `fetch`, `visibilityState`, or `User-Agent`) must be initialized at the very beginning of the page lifecycle. Changing these on a "live" page can cause inconsistent state or site crashes.

### **Q: How does playback continue in the background?**
**A:** We conditionally shim the `visibilityState` and `hidden` properties of the `document`, as well as intercept the `visibilitychange` event. This tricks YouTube into thinking the tab is always active, preventing it from pausing.

### **Q: Does this work on regular YouTube?**
**A:** Redirection is active for all YouTube URLs if TV Mode is on. Individual features like Leanback Mode and Key Remapping are scoped specifically to the `/tv/` path to avoid breaking the standard desktop experience.

---
## References

This project utilizes architectural patterns and modified code snippets inspired by the [TizenTube](https://github.com/reisxd/TizenTube) repository.

---

## Project Structure

```
YouTubeTVMode/
├── manifest.json          # Manifest V3 Configuration
├── background.js          # Redirection, Auto-Fullscreen, & Window Tracking
├── content.js             # Feature Coordinator (Injection Engine & Messaging)
├── settingsIntegration.js # UI Integration & Command Resolver Patching
├── features/              # Feature Logic (Standalone Modules)
│   ├── deviceSpoof.js
│   ├── forceResolution.js
│   ├── backgroundPlayback.js
│   ├── leanbackMode.js
│   ├── highQualityThumbnails.js
│   ├── keyRemapping.js
│   ├── playbackSpeed.js
│   └── hideGuide.js
├── styles/
│   └── leanback.css       # Dedicated Cursor-Hiding Styles
├── popup/                 # Toolbar Menu (HTML/JS)
├── icons/                 # Project Assets
└── rules.json             # Declarative Net Request Rules
```

---

[← Back to Main README](README.md)
