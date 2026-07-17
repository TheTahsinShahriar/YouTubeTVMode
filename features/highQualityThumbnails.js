// High-Quality Thumbnails — upgrade ytimg URLs (uses lib/thumbnail-url helpers)
(() => {
  'use strict';

  const ns = window.__yttvm;
  const thumbs =
    globalThis.YTTVM?.thumbnails ||
    (function fallback() {
      function upgradeThumbnailUrl(url) {
        if (typeof url !== 'string') return url;
        if (!url.includes('ytimg.com') && !url.includes('youtube.com')) return url;
        const match =
          url.match(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)(?:\?.*)?$/i) ||
          url.match(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)\?/i);
        if (match) {
          return url
            .split('?')[0]
            .replace(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)$/i, '/maxresdefault.$2');
        }
        return url;
      }
      function upgradeThumbnailSrcset(srcset) {
        if (typeof srcset !== 'string') return srcset;
        return srcset
          .split(',')
          .map((part) => {
            const trimmed = part.trim();
            const spaceIndex = trimmed.indexOf(' ');
            if (spaceIndex === -1) return upgradeThumbnailUrl(trimmed);
            return upgradeThumbnailUrl(trimmed.slice(0, spaceIndex)) + trimmed.slice(spaceIndex);
          })
          .join(', ');
      }
      function upgradeStyleUrl(styleString) {
        if (
          typeof styleString !== 'string' ||
          (!styleString.includes('ytimg.com') && !styleString.includes('youtube.com'))
        ) {
          return styleString;
        }
        return styleString.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, url) => {
          return `url(${q}${upgradeThumbnailUrl(url)}${q})`;
        });
      }
      return { upgradeThumbnailUrl, upgradeThumbnailSrcset, upgradeStyleUrl };
    })();

  const { upgradeThumbnailUrl, upgradeThumbnailSrcset, upgradeStyleUrl } = thumbs;

  let isEnabled = false;
  let patchesApplied = false;

  const nativeSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  const nativeSrcsetDescriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    'srcset'
  );
  const nativeBgImageDescriptor = Object.getOwnPropertyDescriptor(
    CSSStyleDeclaration.prototype,
    'backgroundImage'
  );
  const nativeBgDescriptor = Object.getOwnPropertyDescriptor(
    CSSStyleDeclaration.prototype,
    'background'
  );
  const nativeCssTextDescriptor = Object.getOwnPropertyDescriptor(
    CSSStyleDeclaration.prototype,
    'cssText'
  );
  const nativeSetProperty = CSSStyleDeclaration.prototype.setProperty;
  const nativeSetAttribute = Element.prototype.setAttribute;
  const nativeFetch = window.fetch;

  function applyStyleString(element, styleString) {
    try {
      element.style.cssText = '';
    } catch {
      for (let i = element.style.length - 1; i >= 0; i--) {
        element.style.removeProperty(element.style[i]);
      }
    }
    if (!styleString) return;

    let i = 0;
    while (i < styleString.length) {
      const colonIndex = styleString.indexOf(':', i);
      if (colonIndex === -1) break;
      const propName = styleString.slice(i, colonIndex).trim();
      const valueStart = colonIndex + 1;
      let valueEnd = valueStart;
      let inSingleQuote = false;
      let inDoubleQuote = false;
      let parenDepth = 0;

      while (valueEnd < styleString.length) {
        const char = styleString[valueEnd];
        if (char === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
        else if (char === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
        else if (char === '(' && !inSingleQuote && !inDoubleQuote) parenDepth++;
        else if (char === ')' && !inSingleQuote && !inDoubleQuote) parenDepth--;
        else if (char === ';' && !inSingleQuote && !inDoubleQuote && parenDepth === 0) break;
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
            ns?.warn?.('thumbnail Request clone failed', e);
          }
        }
      }
    }
    return nativeFetch.call(window, input, init);
  }

  function applyPatches() {
    if (patchesApplied) return;

    window.fetch = patchedFetch;

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

    Element.prototype.setAttribute = function (name, value) {
      if (isEnabled && typeof value === 'string') {
        const nameLower = name.toLowerCase();
        if (this instanceof HTMLImageElement) {
          if (nameLower === 'src' && !this._maxresFailed) {
            this._originalSrc = value;
            value = upgradeThumbnailUrl(value);
          } else if (nameLower === 'srcset' && !this._maxresFailed) {
            this._originalSrcset = value;
            value = upgradeThumbnailSrcset(value);
          }
        } else if (nameLower === 'style') {
          value = upgradeStyleUrl(value);
          try {
            applyStyleString(this, value);
            return;
          } catch {
            /* fall through */
          }
        }
      }
      return nativeSetAttribute.call(this, name, value);
    };

    if (nativeBgImageDescriptor) {
      Object.defineProperty(CSSStyleDeclaration.prototype, 'backgroundImage', {
        get() {
          return nativeBgImageDescriptor.get.call(this);
        },
        set(value) {
          nativeBgImageDescriptor.set.call(
            this,
            isEnabled ? upgradeStyleUrl(value) : value
          );
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
          nativeBgDescriptor.set.call(this, isEnabled ? upgradeStyleUrl(value) : value);
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
          nativeCssTextDescriptor.set.call(
            this,
            isEnabled ? upgradeStyleUrl(value) : value
          );
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

    window.addEventListener(
      'error',
      (event) => {
        if (!isEnabled) return;
        const target = event.target;
        if (!(target instanceof HTMLImageElement)) return;
        const currentSrc = target.src || '';
        const currentSrcset = target.srcset || '';
        if (
          !target._maxresFailed &&
          (currentSrc.includes('maxresdefault') || currentSrcset.includes('maxresdefault'))
        ) {
          target._maxresFailed = true;
          if (target._originalSrcset) target.srcset = target._originalSrcset;
          if (target._originalSrc) target.src = target._originalSrc;
        }
      },
      true
    );

    patchesApplied = true;
  }

  function enable() {
    applyPatches();
    isEnabled = true;
    ns?.log?.('highQualityThumbnails enabled');
  }

  function disable() {
    isEnabled = false;
    ns?.log?.('highQualityThumbnails disabled');
  }

  // Wait for settings before enabling (avoids flash if user disabled feature)
  let settingsSeen = false;

  ns?.settings?.onChange((key, value, all) => {
    if (key === 'highQualityThumbnailsEnabled' || key === '*') {
      settingsSeen = true;
      const on =
        key === '*'
          ? all?.highQualityThumbnailsEnabled !== false
          : value !== false;
      if (on) enable();
      else disable();
    }
  });

  // Early patches ready but inactive until settings; short timeout defaults ON
  applyPatches();
  setTimeout(() => {
    if (!settingsSeen) enable();
  }, 50);
})();
