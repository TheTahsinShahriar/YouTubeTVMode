// Key Remapping — Backspace→Escape, Space→Enter (off watch page)
(() => {
  'use strict';

  const ns = window.__yttvm;
  let isEnabled = true;

  const isWatchPage = () =>
    window.location.pathname.includes('/watch') || window.location.hash.includes('/watch');

  ns?.settings?.onChange((key, value, all) => {
    if (key === 'keyRemappingEnabled') {
      isEnabled = value !== false;
    } else if (key === '*') {
      isEnabled = all?.keyRemappingEnabled !== false;
    }
  });

  if (ns?.settings) {
    isEnabled = ns.settings.isEnabled('keyRemappingEnabled');
  }

  document.addEventListener(
    'keydown',
    (event) => {
      if (!isEnabled) return;

      const active = document.activeElement;
      if (active) {
        const tagName = active.tagName.toUpperCase();
        if (
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'IFRAME' ||
          active.isContentEditable
        ) {
          return;
        }
      }

      if (event.key === 'Backspace') {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true,
            cancelable: true
          })
        );
        return false;
      }

      if ((event.key === ' ' || event.code === 'Space') && !isWatchPage()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        document.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
          })
        );
        return false;
      }
    },
    true
  );

  ns?.log?.('keyRemapping ready');
})();
