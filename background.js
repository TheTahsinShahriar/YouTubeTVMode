// Background service worker — redirect, fullscreen, DNR sync
/* global importScripts */

try {
  importScripts('lib/defaults.js', 'lib/redirect.js');
} catch (e) {
  console.error('[YTTVM] importScripts failed', e);
}

const redirect = (self.YTTVM && self.YTTVM.redirect) || {
  mapYouTubeUrl: () => null
};

const RULESET_ID = 'ruleset_1';
const savedWindowStates = new Map();

async function syncDnrRuleset(tvModeEnabled) {
  try {
    if (tvModeEnabled) {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [RULESET_ID],
        disableRulesetIds: []
      });
    } else {
      await chrome.declarativeNetRequest.updateEnabledRulesets({
        enableRulesetIds: [],
        disableRulesetIds: [RULESET_ID]
      });
    }
  } catch (e) {
    console.warn('[YTTVM] DNR sync failed', e);
  }
}

// Init DNR from storage
chrome.storage.local.get(['tvModeEnabled'], (result) => {
  syncDnrRuleset(result.tvModeEnabled !== false);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.tvModeEnabled) {
    syncDnrRuleset(changes.tvModeEnabled.newValue !== false);
  }
});

function restoreWindowIfNeeded(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  const saved = savedWindowStates.get(windowId);
  if (!saved) return;

  chrome.windows.get(windowId, (win) => {
    if (chrome.runtime.lastError) {
      savedWindowStates.delete(windowId);
      return;
    }
    if (win.state === 'fullscreen') return;

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

chrome.windows.onFocusChanged.addListener(restoreWindowIfNeeded);
chrome.windows.onRemoved.addListener((windowId) => savedWindowStates.delete(windowId));
chrome.tabs.onActivated.addListener((info) => restoreWindowIfNeeded(info.windowId));

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type === 'WINDOW_RESIZED' && sender.tab?.windowId) {
    restoreWindowIfNeeded(sender.tab.windowId);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    chrome.storage.local.get(['tvModeEnabled'], (result) => {
      const tvMode = result.tvModeEnabled !== false;
      const newUrl = redirect.mapYouTubeUrl(tab.url, tvMode);
      if (newUrl) {
        chrome.tabs.update(tabId, { url: newUrl });
      }
    });
  }

  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['tvModeEnabled', 'autoFullscreenEnabled'], (result) => {
      const tvMode = result.tvModeEnabled !== false;
      const autoFullscreen = result.autoFullscreenEnabled !== false;
      if (!tvMode || !autoFullscreen) return;

      let url;
      try {
        url = new URL(tab.url);
      } catch {
        return;
      }

      const isYouTube =
        url.hostname === 'www.youtube.com' ||
        url.hostname === 'youtube.com' ||
        url.hostname === 'm.youtube.com';
      if (!isYouTube) return;

      const isTVUrl = url.pathname === '/tv' || url.pathname.startsWith('/tv/');
      if (!isTVUrl) return;

      chrome.windows.get(tab.windowId, (win) => {
        if (chrome.runtime.lastError) return;
        if (win.state === 'fullscreen') return;

        savedWindowStates.set(tab.windowId, {
          state: win.state,
          top: win.top,
          left: win.left,
          width: win.width,
          height: win.height
        });
        chrome.windows.update(tab.windowId, { state: 'fullscreen' });
      });
    });
  }
});
