<div align="center">

<img src="icons/icon.png" alt="YouTube TV Mode" width="200" height="200">

# YouTube TV Mode - Technical Documentation

[← Back to Main README](README.md)

</div>

---

## Architecture

### Layers

1. **Background service worker** (`background.js`)  
   TV URL redirect (via `lib/redirect.js`), auto-fullscreen + window restore, DNR ruleset enable/disable when TV Mode toggles.

2. **Content script** (`lib/defaults.js` + `content.js`)  
   Sequential injection of shared page modules and conditional features; `postMessage` bridge with token `yttvm-bridge-v1`.

3. **Page context** (`shared/*`, `features/*`, `settingsIntegration.js`)  
   Runs in the YouTube TV page: spoofing, JSON middleware, player helpers, native settings UI.

### Shared page modules

| File | Role |
|------|------|
| `lib/defaults.js` | Defaults, message constants, `resolveBool` |
| `lib/thumbnail-url.js` | Pure thumbnail URL upgrades |
| `lib/redirect.js` | Pure TV↔desktop URL mapping |
| `shared/page-init.js` | `window.__yttvm` namespace + debug logging |
| `shared/settings-bridge.js` | Settings get/set/onChange |
| `shared/json-interceptor.js` | Single `JSON.parse` middleware chain + `_yttv` rebind |
| `shared/player-utils.js` | Video/player watchers (backoff / observers) |

### Feature modules

| File | Notes |
|------|--------|
| `deviceSpoof.js` | Screen / UA / HDR capability spoof |
| `highQualityThumbnails.js` | Prototype + fetch hooks |
| `adblock.js` | JSON handler: ads, paid overlay, endscreen, nudges |
| `forceResolution.js` | Respects `forceResolutionEnabled` + `preferredVideoQuality` |
| `sponsorblock.js` | Optional; SponsorBlock API |
| `backgroundPlayback.js` | Visibility shims (reload to toggle) |
| `leanbackMode.js` | CSS link injection |
| `keyRemapping.js` | Capture-phase key shims |
| `playbackSpeed.js` | Persist rate across videos |
| `hideGuide.js` | Guide JSON filter |
| `settingsIntegration.js` | Native menus + `resolveCommand` patch |

### Injection order (TV URLs only)

1. Shared bootstrap (defaults → interceptor → player utils)  
2. Critical: device spoof, HQ thumbnails  
3. Conditional optional features from `chrome.storage.local`  
4. Settings UI last  

---

## Settings

Stored in `chrome.storage.local`. Defaults live in `lib/defaults.js`.

```javascript
{
  "tvModeEnabled": true,
  "forceResolutionEnabled": true,
  "preferredVideoQuality": "highres",
  "autoFullscreenEnabled": true,
  "backgroundPlaybackEnabled": true,
  "leanbackModeEnabled": false,
  "highQualityThumbnailsEnabled": true,
  "keyRemappingEnabled": true,
  "adBlockEnabled": true,
  "playbackSpeedEnabled": true,
  "speedIncrement": 0.25,
  "playbackSpeed": 1.0,
  "miniPlayerEnabled": false,
  "sponsorBlockEnabled": false,
  "sponsorBlockCategories": ["sponsor", "selfpromo", "interaction", "intro", "outro", "preview"],
  "hideEndScreenCards": false,
  "hidePaidPromotion": true,
  "hideSigninReminder": false,
  "disabledSidebarContents": [],
  "debugLogging": false
}
```

**Reload-required keys** (API patches): TV mode, force quality, background playback, HQ thumbs, key remap, adblock, SponsorBlock, preferred quality.  

**Instant**: leanback, speed, sidebar list, mini-player flag, debug, etc.

---

## Design notes

- **One JSON.parse chain** — features register handlers; no stacked re-wraps.  
- **DNR User-Agent** — `rules.json` spoofs TV UA only while ruleset enabled (synced with TV Mode).  
- **Fullscreen** — `chrome.windows.update({ state: "fullscreen" })` keeps Escape for the app.  
- **CRX signing** — release workflow uses secret `CRX_PRIVATE_KEY` when present; otherwise ZIP-only (stable identity).  
- **Logging** — quiet by default; enable **Debug Logging** in Extension Settings.  

---

## Project structure

```
YouTubeTVMode/
├── manifest.json
├── background.js
├── content.js
├── settingsIntegration.js
├── rules.json
├── lib/                 # Shared pure helpers (+ content/background)
├── shared/              # Page-context infrastructure
├── features/            # Page-context features
├── styles/leanback.css
├── popup/
├── tests/               # node:test unit tests
├── docs/                # Landing page + REFERENCES.md
└── package.json
```

Optional local upstream clone: see [docs/REFERENCES.md](docs/REFERENCES.md).

---

## FAQ

### Why do some toggles reload the page?
Features that patch `fetch`, visibility, or inject once at start need a clean page lifecycle.

### Does SponsorBlock send my video IDs?
It hashes the video id (SHA-256 prefix) and queries the public SponsorBlock API, same model as other SB clients.

### Does this affect normal YouTube?
Redirect only when TV Mode is on. Feature scripts inject only on `/tv` URLs.

---

## License & credits

GPL-3.0. Architectural patterns inspired by [TizenTube](https://github.com/reisxd/TizenTube).

[← Back to Main README](README.md)
