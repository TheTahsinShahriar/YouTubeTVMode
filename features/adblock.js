// Ad Blocker
// Intercepts JSON.parse to strip ad-related data from YouTube TV API responses.
// Adapted from TizenTube (https://github.com/reisxd/TizenTube)

(() => {
    'use strict';

    // Setting state — updated via postMessage relay from content script
    let adBlockEnabled = true; // Default: ON

    // Listen for setting changes from content script
    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data) return;
        if (event.data.source === 'yttvm-settings-change' && event.data.key === 'adBlockEnabled') {
            adBlockEnabled = event.data.value !== false;
        }
        if (event.data.source === 'yttvm-content' && event.data.type === 'SETTINGS_RESPONSE') {
            adBlockEnabled = event.data.settings?.adBlockEnabled !== false;
        }
    });

    // ── JSON.parse interception ──────────────────────────────────────────

    const origParse = JSON.parse;

    JSON.parse = function () {
        const r = origParse.apply(this, arguments);
        if (!r || typeof r !== 'object' || !adBlockEnabled) return r;

        // Strip video ad placements
        if (r.adPlacements) {
            r.adPlacements = [];
        }

        // Strip player ads
        if (r.playerAds) {
            r.playerAds = false;
        }

        // Strip ad slots (required alongside adPlacements)
        if (r.adSlots) {
            r.adSlots = [];
        }

        // Strip "masthead" / banner ads from the home screen
        if (
            r?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content
                ?.sectionListRenderer?.contents
        ) {
            const contents = r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer
                .content.sectionListRenderer.contents;

            // Remove top-level ad slot renderers
            r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer
                .content.sectionListRenderer.contents = contents.filter(
                    (elm) => !elm.adSlotRenderer
                );

            // Remove ad slots within shelf items
            for (const shelf of r.contents.tvBrowseRenderer.content.tvSurfaceContentRenderer
                .content.sectionListRenderer.contents) {
                if (shelf.shelfRenderer?.content?.horizontalListRenderer?.items) {
                    shelf.shelfRenderer.content.horizontalListRenderer.items =
                        shelf.shelfRenderer.content.horizontalListRenderer.items.filter(
                            (item) => !item.adSlotRenderer
                        );
                }
            }
        }

        // Remove Shorts ads
        if (!Array.isArray(r) && r?.entries) {
            r.entries = r.entries?.filter(
                (elm) => !elm?.command?.reelWatchEndpoint?.adClientParams?.isAd
            );
        }

        return r;
    };

    // Patch internal _yttv JSON.parse references to use our wrapped version
    window.JSON.parse = JSON.parse;
    setInterval(() => {
        for (const key in window._yttv || {}) {
            if (window._yttv[key]?.JSON?.parse && window._yttv[key].JSON.parse !== window.JSON.parse) {
                window._yttv[key].JSON.parse = window.JSON.parse;
            }
        }
    }, 1000);

    console.log('[YouTube TV Mode] Ad blocker initialized');
})();
