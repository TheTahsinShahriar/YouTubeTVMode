// Leanback Mode — hide cursor / disable mouse via CSS link
(() => {
  'use strict';

  const ns = window.__yttvm;
  let isEnabled = false;
  let linkElement = null;

  function enable() {
    if (isEnabled) return;
    document.documentElement.classList.add('yttvm-leanback-enabled');

    if (!linkElement) {
      linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.type = 'text/css';
      linkElement.id = 'yttvm-leanback-css';
      const cssUrl = document.documentElement.dataset.yttvmLeanbackCss;
      if (cssUrl) {
        linkElement.href = cssUrl;
        (document.head || document.documentElement).appendChild(linkElement);
      }
    }
    isEnabled = true;
    ns?.log?.('leanback enabled');
  }

  function disable() {
    if (!isEnabled) return;
    document.documentElement.classList.remove('yttvm-leanback-enabled');
    if (linkElement?.parentNode) {
      linkElement.parentNode.removeChild(linkElement);
      linkElement = null;
    }
    isEnabled = false;
    ns?.log?.('leanback disabled');
  }

  function apply(value) {
    if (value) enable();
    else disable();
  }

  ns?.settings?.onChange((key, value, all) => {
    if (key === 'leanbackModeEnabled') apply(value === true);
    else if (key === '*') apply(all?.leanbackModeEnabled === true);
  });

  if (ns?.settings?.isEnabled('leanbackModeEnabled')) enable();
})();
