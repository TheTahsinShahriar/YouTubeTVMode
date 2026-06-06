// Content Script - Feature Coordinator
// Conditionally injects features based on TV Mode state

(() => {
    'use strict';

    // Helper: Inject script into page context
    function injectScript(src) {
        console.log(`[Content Script] Injecting: ${src}`);
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.onload = () => {
            script.remove();
            console.log(`[Content Script] Loaded: ${src}`);
        };
        script.onerror = () => {
            console.error(`[Content Script] Failed to load: ${src}`);
        };
        (document.head || document.documentElement).appendChild(script);
    }

    // Check if we're on YouTube TV
    const isTVUrl = window.location.href.includes('youtube.com/tv');

    // For document_start timing, inject scripts synchronously ASAP
    if (isTVUrl) {
        console.log('[Content Script] TV URL detected, injecting core features immediately');

        // These must run at document_start to intercept early requests
        injectScript('features/deviceSpoof.js');
        injectScript('features/highQualityThumbnails.js'); // Must run early to intercept fetch

        // Conditional features: only inject if enabled
        chrome.storage.local.get(['backgroundPlaybackEnabled'], (result) => {
            // Background playback: only inject when enabled (default: on)
            if (result.backgroundPlaybackEnabled !== false) {
                injectScript('features/backgroundPlayback.js');
            }
        });

        // These can load slightly later but still early
        // Pass leanback CSS URL to page context (leanbackMode.js needs it)
        document.documentElement.dataset.yttvmLeanbackCss = chrome.runtime.getURL('styles/leanback.css');
        injectScript('features/leanbackMode.js');
        injectScript('features/adblock.js');
        injectScript('features/forceResolution.js');
        injectScript('features/keyRemapping.js');
        injectScript('features/playbackSpeed.js');
        injectScript('features/hideGuide.js');

        injectScript('settingsIntegration.js');
    }

    // Notify background when window resizes (triggers fullscreen-exit restore)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            try {
                chrome.runtime.sendMessage({ type: 'WINDOW_RESIZED' }, () => {
                    // Suppress unchecked runtime.lastError warnings / context invalidation warnings
                    const err = chrome.runtime.lastError;
                });
            } catch (e) {
                // Suppress "Extension context invalidated" errors
            }
        }, 100);
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local') {
            // Features that require page reload (script injection needed)
            const reloadRequiredFeatures = [
                'tvModeEnabled',
                'forceResolutionEnabled',
                'backgroundPlaybackEnabled',
                'highQualityThumbnailsEnabled',
                'keyRemappingEnabled',
                'adBlockEnabled'
            ];

            // Features that apply instantly via postMessage (no reload needed)
            const instantApplyFeatures = [
                'autoFullscreenEnabled',
                'leanbackModeEnabled',
                'playbackSpeed',
                'speedIncrement',
                'disabledSidebarContents'
            ];

            // Check if reload is needed
            if (reloadRequiredFeatures.some(key => changes[key])) {
                console.log('[YouTube TV Mode] Settings changed, reloading page...');
                setTimeout(() => window.location.reload(), 100);
            }
            // For instant-apply features, notify page scripts
            else if (instantApplyFeatures.some(key => changes[key])) {
                Object.keys(changes).forEach(key => {
                    window.postMessage({
                        source: 'yttvm-settings-change',
                        key,
                        value: changes[key].newValue
                    }, '*');
                });
            }
        }
    });

    // Message relay between page scripts and extension storage
    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data || event.data.source !== 'yttvm-page') {
            return;
        }

        if (event.data.type === 'GET_SETTINGS') {
            // Read all settings from storage
            console.log('[YouTube TV Mode Content] Getting settings from storage');
            chrome.storage.local.get(null, (result) => {
                console.log('[YouTube TV Mode Content] Sending settings to page:', result);

                // Send settings response (for settingsIntegration.js and hideGuide.js)
                window.postMessage({
                    source: 'yttvm-content',
                    type: 'SETTINGS_RESPONSE',
                    settings: result
                }, '*');

                // Also send initial state for instant-apply features
                window.postMessage({
                    source: 'yttvm-settings-change',
                    key: 'leanbackModeEnabled',
                    value: result.leanbackModeEnabled === true
                }, '*');
                window.postMessage({
                    source: 'yttvm-settings-change',
                    key: 'disabledSidebarContents',
                    value: result.disabledSidebarContents || []
                }, '*');
                window.postMessage({
                    source: 'yttvm-settings-change',
                    key: 'playbackSpeed',
                    value: result.playbackSpeed || 1.0
                }, '*');

            });
        } else if (event.data.type === 'SET_SETTINGS') {
            // Save settings to storage
            console.log('[YouTube TV Mode Content] Saving settings to storage:', event.data.settings);
            chrome.storage.local.set(event.data.settings, () => {
                console.log('[YouTube TV Mode Content] Settings saved successfully');
            });
        }
    });

})();
