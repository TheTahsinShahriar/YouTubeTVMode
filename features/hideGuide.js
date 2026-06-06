// Hide Guide — Sidebar Content Filtering
// Intercepts JSON.parse to structurally remove guide entries before YouTube TV

(() => {
    'use strict';

    let disabledItems = [];

    // Listen for settings to get the disabled items array
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        if (event.data?.source === 'yttvm-content' && event.data?.type === 'SETTINGS_RESPONSE') {
            disabledItems = event.data.settings?.disabledSidebarContents || [];
        }

        if (event.data?.source === 'yttvm-settings-change' && event.data.key === 'disabledSidebarContents') {
            disabledItems = event.data.value || [];
        }
    });

    // Intercept JSON.parse to filter guide entries
    // When the parsed JSON contains guideSectionRenderer
    // items, we splice out entries whose iconType is in the disabled list.
    
    const origParse = JSON.parse;
    JSON.parse = function () {
        const r = origParse.apply(this, arguments);

        if (r && r.items && Array.isArray(r.items)) {
            for (let i = 0; i < r.items.length; i++) {
                const section = r.items[i]?.guideSectionRenderer;
                if (!section?.items) continue;
                for (let j = 0; j < section.items.length; j++) {
                    const item = section.items[j]?.guideEntryRenderer;
                    if (!item) continue;
                    if (disabledItems.includes(item.icon?.iconType)) {
                        section.items.splice(j, 1);
                        j--;
                    }
                }
            }
        }

        return r;
    };

    // Periodically patch window._yttv JSON.parse references with our guide-filtering parser
    setInterval(() => {
        for (const key in window._yttv || {}) {
            if (window._yttv[key]?.JSON?.parse && window._yttv[key].JSON.parse !== window.JSON.parse) {
                window._yttv[key].JSON.parse = window.JSON.parse;
            }
        }
    }, 1000);

})();
