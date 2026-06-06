// Key Remapping
// Remaps Backspace→Escape and Spacebar→Enter based on page context and focus state.
// With F11-style fullscreen (chrome.windows.update), Escape doesn't exit
// fullscreen — it goes to the page normally. So the original synthetic
// Escape dispatch approach works perfectly.

(() => {
    'use strict';

    console.log('[Key Remapping] Initialized');

    let isEnabled = true;

    const isWatchPage = () =>
        window.location.pathname.includes('/watch') ||
        window.location.hash.includes('/watch');

    // Listen for settings and toggle updates
    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data) return;

        if (event.data.source === 'yttvm-content' && event.data.type === 'SETTINGS_RESPONSE') {
            isEnabled = event.data.settings?.keyRemappingEnabled !== false;
            console.log('[Key Remapping] Initial state from settings:', isEnabled);
        }

        if (event.data.source === 'yttvm-settings-change' && event.data.key === 'keyRemappingEnabled') {
            isEnabled = event.data.value !== false;
            console.log('[Key Remapping] Toggle settings changed:', isEnabled);
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!isEnabled) return;

        // Skip key remapping if the user is focused inside a text input field, textarea, iframe, or content-editable area
        const active = document.activeElement;
        if (active) {
            const tagName = active.tagName.toUpperCase();
            if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'IFRAME' || active.isContentEditable) {
                return;
            }
        }

        // Backspace → Escape
        if (event.key === 'Backspace') {
            console.log('[Key Remapping] Backspace → Escape');
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const escKeyEvent = new KeyboardEvent('keydown', {
                key: 'Escape',
                code: 'Escape',
                keyCode: 27,
                which: 27,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(escKeyEvent);
            return false;
        }

        // Spacebar → Enter (except on the watch page, where spacebar is used natively to play/pause)
        if ((event.key === ' ' || event.code === 'Space') && !isWatchPage()) {
            console.log('[Key Remapping] Spacebar → Enter');
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const enterKeyEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(enterKeyEvent);
            return false;
        }
    }, true); // Capture phase

    // Request initial settings state
    window.postMessage({ source: 'yttvm-page', type: 'GET_SETTINGS' }, '*');

    console.log('[Key Remapping] Event listener attached');
})();
