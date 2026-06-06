// Background Playback
// Prevents video from pausing when tab loses focus

(() => {
    'use strict';

    try {
        // Lock visibility properties to always appear active
        const properties = {
            'hidden': { value: false, configurable: false, writable: false },
            'visibilityState': { value: 'visible', configurable: false, writable: false },
            'webkitHidden': { value: false, configurable: false, writable: false },
            'webkitVisibilityState': { value: 'visible', configurable: false, writable: false },
            'hasFocus': { value: () => true, configurable: false, writable: false }
        };

        Object.defineProperties(document, {
            'hidden': properties.hidden,
            'visibilityState': properties.visibilityState,
            'webkitHidden': properties.webkitHidden,
            'webkitVisibilityState': properties.webkitVisibilityState,
            'hasFocus': properties.hasFocus
        });

        Object.defineProperty(Document.prototype, 'hasFocus', {
            value: () => true,
            configurable: false,
            writable: false
        });

        // Block visibility-related events (focus/blur events are kept native to prevent navigation/input issues)
        const blockedEvents = [
            'visibilitychange',
            'webkitvisibilitychange',
            'mozvisibilitychange',
            'pagehide',
            'pageshow',
            // Chrome Permissions Policy now forbids unload/beforeunload in this
            // document context. Silently dropping them prevents the console
            // violation that fires when we forward them to native addEventListener.
            'unload',
            'beforeunload'
        ];

        const originalAddEventListener = EventTarget.prototype.addEventListener;

        EventTarget.prototype.addEventListener = function (type, listener, options) {
            // Block focus/visibility events ONLY if the target is window, document, body, or html element
            if (blockedEvents.includes(type) && (this === window || this === document || this === document.body || this === document.documentElement)) {
                return;
            }
            return originalAddEventListener.call(this, type, listener, options);
        };

    } catch (e) {
        console.error('[YouTube TV Mode] Background playback injection failed:', e);
    }

})();
