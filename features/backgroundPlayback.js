// Background Playback — keep tab "visible" so YT does not pause
(() => {
  'use strict';

  try {
    Object.defineProperties(document, {
      hidden: { value: false, configurable: false, writable: false },
      visibilityState: { value: 'visible', configurable: false, writable: false },
      webkitHidden: { value: false, configurable: false, writable: false },
      webkitVisibilityState: { value: 'visible', configurable: false, writable: false },
      hasFocus: { value: () => true, configurable: false, writable: false }
    });

    Object.defineProperty(Document.prototype, 'hasFocus', {
      value: () => true,
      configurable: false,
      writable: false
    });

    const blockedEvents = [
      'visibilitychange',
      'webkitvisibilitychange',
      'mozvisibilitychange',
      'pagehide',
      'pageshow',
      'unload',
      'beforeunload'
    ];

    const originalAddEventListener = EventTarget.prototype.addEventListener;

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (
        blockedEvents.includes(type) &&
        (this === window ||
          this === document ||
          this === document.body ||
          this === document.documentElement)
      ) {
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    window.__yttvm?.log?.('backgroundPlayback active');
  } catch (e) {
    window.__yttvm?.error?.('backgroundPlayback failed', e);
  }
})();
