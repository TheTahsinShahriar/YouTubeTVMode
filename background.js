// Background Service Worker - TV Mode URL Redirection & Auto Fullscreen

// Saved window states: when we fullscreen a window, we save its previous
// state/size/position so we can restore it when the user exits fullscreen.
const savedWindowStates = new Map();

// ── Restore window state when user exits fullscreen ──────────────────────
function restoreWindowIfNeeded(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const saved = savedWindowStates.get(windowId);
  if (!saved) return;

  chrome.windows.get(windowId, (win) => {
    if (chrome.runtime.lastError) {
      savedWindowStates.delete(windowId);
      return;
    }
    if (win.state === 'fullscreen') return; // Still fullscreen

    // Exited fullscreen — restore saved state
    savedWindowStates.delete(windowId);
    if (saved.state === 'maximized') {
      chrome.windows.update(windowId, { state: 'maximized' });
    } else {
      chrome.windows.update(windowId, {
        state: 'normal',
        top: saved.top,
        left: saved.left,
        width: saved.width,
        height: saved.height
      });
    }
  });
}

// Event-based triggers
chrome.windows.onFocusChanged.addListener(restoreWindowIfNeeded);
chrome.windows.onRemoved.addListener((windowId) => savedWindowStates.delete(windowId));
chrome.tabs.onActivated.addListener((info) => restoreWindowIfNeeded(info.windowId));

// Content script trigger: fires immediately when window resizes (F11 exit)
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'WINDOW_RESIZED' && sender.tab?.windowId) {
    restoreWindowIfNeeded(sender.tab.windowId);
  }
});

// ── Tab update handler ───────────────────────────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Phase 1: Redirect as EARLY as possible — fires as soon as navigation starts.
  if (changeInfo.status === 'loading' && tab.url) {
    chrome.storage.local.get(['tvModeEnabled'], (result) => {
      const tvMode = result.tvModeEnabled !== false;

      let url;
      try { url = new URL(tab.url); } catch { return; }
      const isYouTube = url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com' || url.hostname === 'm.youtube.com';
      if (!isYouTube) return;

      const isTVUrl = url.pathname === '/tv' || url.pathname.startsWith('/tv/');
      const isStandardUrl = !isTVUrl;

      if (tvMode && isStandardUrl) {
        let newUrl;
        if (url.pathname === '/' || url.pathname === '') {
          newUrl = url.origin + '/tv' + url.search + url.hash;
        } else if (url.pathname === '/watch') {
          newUrl = url.origin + '/tv#/watch' + url.search + url.hash;
        } else if (url.pathname === '/results') {
          newUrl = url.origin + '/tv#/search' + url.search + url.hash;
        } else {
          newUrl = url.origin + '/tv#' + url.pathname + url.search + url.hash;
        }
        if (newUrl !== tab.url) {
          console.log(`[TV Mode] Redirecting: ${tab.url} → ${newUrl}`);
          chrome.tabs.update(tabId, { url: newUrl });
        }
      } else if (!tvMode && isTVUrl) {
        let newUrl;
        if (url.hash.startsWith('#/')) {
          const hashPath = url.hash.substring(1);
          try {
            const innerUrl = new URL(hashPath, url.origin);
            let targetPath = innerUrl.pathname;
            if (targetPath === '/search') {
              targetPath = '/results';
            }
            newUrl = url.origin + targetPath + innerUrl.search + innerUrl.hash;
          } catch {
            newUrl = url.origin + '/';
          }
        } else {
          const pathWithoutTV = url.pathname.replace(/^\/tv/, '');
          newUrl = url.origin + (pathWithoutTV || '/') + url.search + url.hash;
        }
        if (newUrl !== tab.url) {
          console.log(`[TV Mode] Redirecting: ${tab.url} → ${newUrl}`);
          chrome.tabs.update(tabId, { url: newUrl });
        }
      }
    });
  }

  // Phase 2: Fullscreen AFTER page is ready.
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['tvModeEnabled', 'autoFullscreenEnabled'], (result) => {
      const tvMode = result.tvModeEnabled !== false;
      const autoFullscreen = result.autoFullscreenEnabled !== false;

      let url;
      try { url = new URL(tab.url); } catch { return; }
      const isYouTube = url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com' || url.hostname === 'm.youtube.com';
      if (!isYouTube) return;

      const isTVUrl = url.pathname === '/tv' || url.pathname.startsWith('/tv/');

      if (tvMode && isTVUrl && autoFullscreen) {
        // Save window state BEFORE fullscreening so we can restore it
        chrome.windows.get(tab.windowId, (win) => {
          if (chrome.runtime.lastError) return;
          if (win.state === 'fullscreen') return; // Already fullscreen

          savedWindowStates.set(tab.windowId, {
            state: win.state,
            top: win.top,
            left: win.left,
            width: win.width,
            height: win.height
          });
          chrome.windows.update(tab.windowId, { state: 'fullscreen' });
        });
      }
    });
  }
});
