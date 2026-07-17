// Device Spoofing - TV environment (UA string from shared defaults)
(() => {
  'use strict';

  const UA =
    window.__yttvm?.UA ||
    (globalThis.YTTVM && globalThis.YTTVM.YTTVM_USER_AGENT) ||
    'Mozilla/5.0 (Linux; Android 16) Cobalt/26.lts.30.1034958-gold (unlike Gecko) v8/12.4.254.15-jit gles Starboard/16, SAMSUNG_S95F_2025 (SAMSUNG, S95F, Wired)';

  const screenSpoof = {
    width: 3840,
    height: 2160,
    availWidth: 3840,
    availHeight: 2160,
    colorDepth: 24,
    pixelDepth: 24
  };

  for (const key in screenSpoof) {
    try {
      Object.defineProperty(screen, key, {
        get: () => screenSpoof[key],
        configurable: true
      });
    } catch {
      /* ignore */
    }
  }

  try {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: () => 1,
      configurable: true
    });
  } catch {
    /* ignore */
  }

  try {
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Linux aarch64',
      configurable: true
    });
  } catch {
    /* ignore */
  }

  try {
    Object.defineProperty(navigator, 'userAgent', {
      get: () => UA,
      configurable: true
    });
  } catch {
    /* ignore */
  }

  try {
    Object.defineProperty(navigator, 'maxTouchPoints', {
      get: () => 0,
      configurable: true
    });
  } catch {
    /* ignore */
  }

  if (navigator.mediaCapabilities?.decodingInfo) {
    const originalDecodingInfo = navigator.mediaCapabilities.decodingInfo.bind(
      navigator.mediaCapabilities
    );

    navigator.mediaCapabilities.decodingInfo = async (config) => {
      if (config?.video?.codec?.startsWith('vp09')) {
        return { supported: true, smooth: true, powerEfficient: true };
      }
      return originalDecodingInfo(config);
    };
  }

  const originalMatchMedia = window.matchMedia.bind(window);
  window.matchMedia = (query) => {
    if (/dynamic-range|color-gamut|hdr|rec2020|p3/i.test(query)) {
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      };
    }
    return originalMatchMedia(query);
  };

  if (screen.orientation) {
    try {
      Object.defineProperty(screen.orientation, 'type', {
        get: () => 'landscape-primary',
        configurable: true
      });
    } catch {
      /* ignore */
    }
  }

  window.__yttvm?.log?.('deviceSpoof ready');
})();
