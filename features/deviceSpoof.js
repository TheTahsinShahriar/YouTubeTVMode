// Device Spoofing - Google TV Environment
// Spoofs a flagship Google TV device (4K, Android TV)

(() => {
    'use strict';

    /* Screen / Viewport (4K TV, DPR = 1) */
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
        } catch { }
    }

    try {
        Object.defineProperty(window, 'devicePixelRatio', {
            get: () => 1,
            configurable: true
        });
    } catch { }

    /* Navigator identity (TV-class) */
    try {
        Object.defineProperty(navigator, 'platform', {
            get: () => 'Linux aarch64',
            configurable: true
        });
    } catch { }

    try {
        Object.defineProperty(navigator, 'userAgent', {
            get: () => 'Mozilla/5.0 (Linux; Android 16) Cobalt/26.lts.30.1034958-gold (unlike Gecko) v8/12.4.254.15-jit gles Starboard/16, SAMSUNG_S95F_2025 (SAMSUNG, S95F, Wired)',
            configurable: true
        });
    } catch { }

    try {
        Object.defineProperty(navigator, 'maxTouchPoints', {
            get: () => 0,
            configurable: true
        });
    } catch { }

    /* MediaCapabilities (VP9 + HDR positive signal) */
    if (navigator.mediaCapabilities?.decodingInfo) {
        const originalDecodingInfo =
            navigator.mediaCapabilities.decodingInfo.bind(navigator.mediaCapabilities);

        navigator.mediaCapabilities.decodingInfo = async (config) => {
            if (config?.video?.codec) {
                const codec = config.video.codec;

                // VP9 Profile 2 / HDR paths
                if (codec.startsWith('vp09')) {
                    return {
                        supported: true,
                        smooth: true,
                        powerEfficient: true
                    };
                }
            }
            return originalDecodingInfo(config);
        };
    }

    /* HDR / Color-gamut media queries */
    const originalMatchMedia = window.matchMedia.bind(window);

    window.matchMedia = (query) => {
        if (
            /dynamic-range|color-gamut|hdr|rec2020|p3/i.test(query)
        ) {
            return {
                matches: true,
                media: query,
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => false
            };
        }
        return originalMatchMedia(query);
    };

    /* Orientation (TV = landscape) */
    if (screen.orientation) {
        try {
            Object.defineProperty(screen.orientation, 'type', {
                get: () => 'landscape-primary',
                configurable: true
            });
        } catch { }
    }

})();
