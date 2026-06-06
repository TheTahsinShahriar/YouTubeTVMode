// High-Quality Thumbnails
// Intercepts and upgrades thumbnail URLs to maximum resolution

(() => {
    'use strict';

    console.log('[High-Quality Thumbnails] Initialized');

    let isEnabled = false;
    let patchesApplied = false;

    // Capture the native descriptors and methods ONCE at module load
    const nativeSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    const nativeSrcsetDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'srcset');
    
    const nativeBgImageDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'backgroundImage');
    const nativeBgDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'background');
    const nativeCssTextDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'cssText');
    const nativeSetProperty = CSSStyleDeclaration.prototype.setProperty;
    
    const nativeSetAttribute = Element.prototype.setAttribute;
    const nativeFetch = window.fetch;

    // Upgrade thumbnail URL to maxresdefault equivalent and strip query params
    function upgradeThumbnailUrl(url) {
        if (typeof url !== 'string') return url;
        if (!url.includes('ytimg.com') && !url.includes('youtube.com')) return url;

        // Match hqdefault, sddefault, mqdefault, default
        const match = url.match(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)(?:\?.*)?$/i) ||
                      url.match(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)\?/i);
        
        if (match) {
            // Strip signature/query parameters (take part before '?')
            const baseUrl = url.split('?')[0];
            return baseUrl.replace(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)$/i, '/maxresdefault.$2');
        }
        return url;
    }

    // Upgrade all URLs in a srcset list
    function upgradeThumbnailSrcset(srcset) {
        if (typeof srcset !== 'string') return srcset;
        return srcset.split(',').map(part => {
            const trimmed = part.trim();
            const spaceIndex = trimmed.indexOf(' ');
            if (spaceIndex === -1) {
                return upgradeThumbnailUrl(trimmed);
            }
            const url = trimmed.slice(0, spaceIndex);
            const rest = trimmed.slice(spaceIndex);
            return upgradeThumbnailUrl(url) + rest;
        }).join(', ');
    }

    // Upgrade URLs found inside inline CSS/styles (like url("..."))
    function upgradeStyleUrl(styleString) {
        if (typeof styleString !== 'string' || (!styleString.includes('ytimg.com') && !styleString.includes('youtube.com'))) {
            return styleString;
        }
        return styleString.replace(/url\((['"]?)([^'")]+)\1\)/gi, (match, quote, url) => {
            return `url(${quote}${upgradeThumbnailUrl(url)}${quote})`;
        });
    }

    // Parse style string and apply to element style properties directly to bypass CSP inline style restrictions
    function applyStyleString(element, styleString) {
        try {
            element.style.cssText = '';
        } catch (e) {
            for (let i = element.style.length - 1; i >= 0; i--) {
                const prop = element.style[i];
                element.style.removeProperty(prop);
            }
        }

        if (!styleString) return;

        let i = 0;
        while (i < styleString.length) {
            const colonIndex = styleString.indexOf(':', i);
            if (colonIndex === -1) break;
            const propName = styleString.slice(i, colonIndex).trim();

            let valueStart = colonIndex + 1;
            let valueEnd = valueStart;
            let inSingleQuote = false;
            let inDoubleQuote = false;
            let parenDepth = 0;

            while (valueEnd < styleString.length) {
                const char = styleString[valueEnd];
                if (char === '\'' && !inDoubleQuote) {
                    inSingleQuote = !inSingleQuote;
                } else if (char === '"' && !inSingleQuote) {
                    inDoubleQuote = !inDoubleQuote;
                } else if (char === '(' && !inSingleQuote && !inDoubleQuote) {
                    parenDepth++;
                } else if (char === ')' && !inSingleQuote && !inDoubleQuote) {
                    parenDepth--;
                } else if (char === ';' && !inSingleQuote && !inDoubleQuote && parenDepth === 0) {
                    break;
                }
                valueEnd++;
            }

            const propValue = styleString.slice(valueStart, valueEnd).trim();
            if (propName) {
                const important = propValue.endsWith('!important');
                const cleanValue = important ? propValue.slice(0, -10).trim() : propValue;
                element.style.setProperty(propName, cleanValue, important ? 'important' : '');
            }

            i = valueEnd + 1;
        }
    }

    // Patched fetch function
    function patchedFetch(input, init) {
        if (isEnabled) {
            if (typeof input === 'string') {
                input = upgradeThumbnailUrl(input);
            } else if (input instanceof Request) {
                const newUrl = upgradeThumbnailUrl(input.url);
                if (newUrl !== input.url) {
                    try {
                        input = new Request(newUrl, input);
                    } catch (e) {
                        console.error('[High-Quality Thumbnails] Failed to clone Request:', e);
                    }
                }
            }
        }
        return nativeFetch.call(window, input, init);
    }

    // Apply the prototype patches and event listener
    function applyPatches() {
        if (patchesApplied) return;

        // 1. Intercept fetch
        window.fetch = patchedFetch;

        // 2. Intercept HTMLImageElement.prototype.src
        if (nativeSrcDescriptor) {
            Object.defineProperty(HTMLImageElement.prototype, 'src', {
                get() {
                    return nativeSrcDescriptor.get.call(this);
                },
                set(url) {
                    if (isEnabled && !this._maxresFailed) {
                        this._originalSrc = url;
                        nativeSrcDescriptor.set.call(this, upgradeThumbnailUrl(url));
                    } else {
                        nativeSrcDescriptor.set.call(this, url);
                    }
                },
                configurable: true,
                enumerable: true
            });
        }

        // 3. Intercept HTMLImageElement.prototype.srcset
        if (nativeSrcsetDescriptor) {
            Object.defineProperty(HTMLImageElement.prototype, 'srcset', {
                get() {
                    return nativeSrcsetDescriptor.get.call(this);
                },
                set(srcset) {
                    if (isEnabled && !this._maxresFailed) {
                        this._originalSrcset = srcset;
                        nativeSrcsetDescriptor.set.call(this, upgradeThumbnailSrcset(srcset));
                    } else {
                        nativeSrcsetDescriptor.set.call(this, srcset);
                    }
                },
                configurable: true,
                enumerable: true
            });
        }

        // 4. Intercept Element.prototype.setAttribute
        Element.prototype.setAttribute = function (name, value) {
            if (isEnabled && typeof value === 'string') {
                const nameLower = name.toLowerCase();
                if (this instanceof HTMLImageElement) {
                    if (nameLower === 'src') {
                        if (!this._maxresFailed) {
                            this._originalSrc = value;
                            value = upgradeThumbnailUrl(value);
                        }
                    } else if (nameLower === 'srcset') {
                        if (!this._maxresFailed) {
                            this._originalSrcset = value;
                            value = upgradeThumbnailSrcset(value);
                        }
                    }
                } else if (nameLower === 'style') {
                    value = upgradeStyleUrl(value);
                    try {
                        applyStyleString(this, value);
                        return;
                    } catch (e) {
                        console.warn('[High-Quality Thumbnails] Failed to apply style programmatically, falling back to setAttribute:', e);
                    }
                }
            }
            return nativeSetAttribute.call(this, name, value);
        };

        // 5. Intercept CSSStyleDeclaration properties for background images
        if (nativeBgImageDescriptor) {
            Object.defineProperty(CSSStyleDeclaration.prototype, 'backgroundImage', {
                get() {
                    return nativeBgImageDescriptor.get.call(this);
                },
                set(value) {
                    if (isEnabled) {
                        nativeBgImageDescriptor.set.call(this, upgradeStyleUrl(value));
                    } else {
                        nativeBgImageDescriptor.set.call(this, value);
                    }
                },
                configurable: true,
                enumerable: true
            });
        }

        if (nativeBgDescriptor) {
            Object.defineProperty(CSSStyleDeclaration.prototype, 'background', {
                get() {
                    return nativeBgDescriptor.get.call(this);
                },
                set(value) {
                    if (isEnabled) {
                        nativeBgDescriptor.set.call(this, upgradeStyleUrl(value));
                    } else {
                        nativeBgDescriptor.set.call(this, value);
                    }
                },
                configurable: true,
                enumerable: true
            });
        }

        if (nativeCssTextDescriptor) {
            Object.defineProperty(CSSStyleDeclaration.prototype, 'cssText', {
                get() {
                    return nativeCssTextDescriptor.get.call(this);
                },
                set(value) {
                    if (isEnabled) {
                        nativeCssTextDescriptor.set.call(this, upgradeStyleUrl(value));
                    } else {
                        nativeCssTextDescriptor.set.call(this, value);
                    }
                },
                configurable: true,
                enumerable: true
            });
        }

        CSSStyleDeclaration.prototype.setProperty = function (propertyName, value, priority) {
            if (isEnabled && typeof value === 'string') {
                const propLower = propertyName.toLowerCase();
                if (propLower === 'background-image' || propLower === 'background') {
                    value = upgradeStyleUrl(value);
                }
            }
            return nativeSetProperty.call(this, propertyName, value, priority);
        };

        // 6. Global error capturer for image 404 fallbacks
        window.addEventListener('error', (event) => {
            if (!isEnabled) return;
            const target = event.target;
            if (target instanceof HTMLImageElement) {
                const currentSrc = target.src || '';
                const currentSrcset = target.srcset || '';
                
                // If it failed to load maxresdefault, trigger fallback
                if (!target._maxresFailed && (currentSrc.includes('maxresdefault') || currentSrcset.includes('maxresdefault'))) {
                    target._maxresFailed = true;
                    console.warn('[High-Quality Thumbnails] maxresdefault failed to load, falling back to original URL:', currentSrc || currentSrcset);
                    
                    // Re-assign the original properties so the browser falls back
                    if (target._originalSrcset) {
                        target.srcset = target._originalSrcset;
                    }
                    if (target._originalSrc) {
                        target.src = target._originalSrc;
                    }
                }
            }
        }, true); // capturing phase is crucial as error events do not bubble

        patchesApplied = true;
        console.log('[High-Quality Thumbnails] Prototype patches applied');
    }

    // Enable feature
    function enable() {
        applyPatches();
        if (isEnabled) return;
        isEnabled = true;
        console.log('[High-Quality Thumbnails] Enabled');
    }

    // Disable feature
    function disable() {
        if (!isEnabled) return;
        isEnabled = false;
        console.log('[High-Quality Thumbnails] Disabled');
    }

    // Listen for settings and toggle messages
    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        // Handle settings response
        if (event.data?.source === 'yttvm-content' && event.data?.type === 'SETTINGS_RESPONSE') {
            const enabled = event.data.settings?.highQualityThumbnailsEnabled !== false;
            console.log('[High-Quality Thumbnails] Initial state from settings:', enabled);
            if (enabled) {
                enable();
            } else {
                disable();
            }
        }

        // Handle instant toggle from user menu
        if (event.data?.source === 'yttvm-settings-change' && event.data.key === 'highQualityThumbnailsEnabled') {
            console.log('[High-Quality Thumbnails] Toggle settings changed:', event.data.value);
            if (event.data.value) {
                enable();
            } else {
                disable();
            }
        }
    });

    // Apply patches immediately to catch early loads, default to enabled until settings are loaded
    enable();

})();
