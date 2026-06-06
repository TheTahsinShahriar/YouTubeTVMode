// Leanback Mode - Dynamic Enable/Disable
// Hides cursor and disables mouse input for remote/keyboard-only control.
// Uses a dedicated CSS file (styles/leanback.css) injected via <link> element.

(() => {
    'use strict';

    console.log('[Leanback Mode] Initialized');

    let isEnabled = false;
    let linkElement = null;

    function enable() {
        if (isEnabled) return;

        // Add CSS class
        document.documentElement.classList.add('yttvm-leanback-enabled');

        // Inject CSS file via <link> if not already present
        if (!linkElement) {
            linkElement = document.createElement('link');
            linkElement.rel = 'stylesheet';
            linkElement.type = 'text/css';
            linkElement.id = 'yttvm-leanback-css';

            // Get the CSS URL from the extension via a data attribute
            // set by the content script, or construct it if possible.
            // Since this runs in page context, we use the URL stored on
            // the <html> element by content.js.
            const cssUrl = document.documentElement.dataset.yttvmLeanbackCss;
            if (cssUrl) {
                linkElement.href = cssUrl;
                (document.head || document.documentElement).appendChild(linkElement);
            }
        }

        isEnabled = true;
        console.log('[Leanback Mode] Enabled — cursor hidden, mouse disabled');
    }

    function disable() {
        if (!isEnabled) return;

        document.documentElement.classList.remove('yttvm-leanback-enabled');

        if (linkElement && linkElement.parentNode) {
            linkElement.parentNode.removeChild(linkElement);
            linkElement = null;
        }

        isEnabled = false;
        console.log('[Leanback Mode] Disabled — cursor visible, mouse enabled');
    }

    // Listen for settings changes AND initial settings response
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        // Handle instant toggle messages
        if (event.data?.source === 'yttvm-settings-change' && event.data.key === 'leanbackModeEnabled') {
            console.log('[Leanback Mode] Received setting change:', event.data.value);
            if (event.data.value) {
                enable();
            } else {
                disable();
            }
        }

        // Handle initial settings response
        if (event.data?.source === 'yttvm-content' && event.data?.type === 'SETTINGS_RESPONSE') {
            const leanbackEnabled = event.data.settings?.leanbackModeEnabled === true;
            console.log('[Leanback Mode] Initial state from settings:', leanbackEnabled);
            if (leanbackEnabled) {
                enable();
            }
        }
    });

    console.log('[Leanback Mode] Listening for settings changes');

})();
