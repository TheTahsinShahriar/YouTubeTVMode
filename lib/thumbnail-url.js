/**
 * Pure thumbnail URL upgrade helpers (testable).
 */
(function (root) {
  'use strict';

  function upgradeThumbnailUrl(url) {
    if (typeof url !== 'string') return url;
    if (!url.includes('ytimg.com') && !url.includes('youtube.com')) return url;

    const match =
      url.match(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)(?:\?.*)?$/i) ||
      url.match(/\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)\?/i);

    if (match) {
      const baseUrl = url.split('?')[0];
      return baseUrl.replace(
        /\/(hqdefault|sddefault|mqdefault|default)\.(jpg|webp)$/i,
        '/maxresdefault.$2'
      );
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
        if (spaceIndex === -1) {
          return upgradeThumbnailUrl(trimmed);
        }
        const url = trimmed.slice(0, spaceIndex);
        const rest = trimmed.slice(spaceIndex);
        return upgradeThumbnailUrl(url) + rest;
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
    return styleString.replace(/url\((['"]?)([^'")]+)\1\)/gi, (match, quote, url) => {
      return `url(${quote}${upgradeThumbnailUrl(url)}${quote})`;
    });
  }

  const api = { upgradeThumbnailUrl, upgradeThumbnailSrcset, upgradeStyleUrl };

  root.YTTVM = Object.assign(root.YTTVM || {}, { thumbnails: api });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this);
