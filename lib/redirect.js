/**
 * Pure URL redirect helpers for TV Mode (testable, no Chrome APIs).
 */
(function (root) {
  'use strict';

  function isYouTubeHostname(hostname) {
    return (
      hostname === 'www.youtube.com' ||
      hostname === 'youtube.com' ||
      hostname === 'm.youtube.com'
    );
  }

  function isTVPath(pathname) {
    return pathname === '/tv' || pathname.startsWith('/tv/');
  }

  /**
   * @param {string|URL} input
   * @param {boolean} tvModeEnabled
   * @returns {string|null} new URL string if redirect needed, else null
   */
  function mapYouTubeUrl(input, tvModeEnabled) {
    let url;
    try {
      url = typeof input === 'string' ? new URL(input) : input;
    } catch {
      return null;
    }

    if (!isYouTubeHostname(url.hostname)) return null;

    const isTVUrl = isTVPath(url.pathname);
    const isStandardUrl = !isTVUrl;

    if (tvModeEnabled && isStandardUrl) {
      let newUrl;
      if (url.pathname === '/' || url.pathname === '') {
        newUrl = url.origin + '/tv' + url.search + url.hash;
      } else if (url.pathname === '/watch') {
        newUrl = url.origin + '/tv#/watch' + url.search + url.hash;
      } else if (url.pathname === '/results') {
        newUrl = url.origin + '/tv#/search' + url.search + url.hash;
      } else {
        newUrl = url.origin + '/tv#' + url.pathname + url.search + url.hash;
      }
      return newUrl !== url.href ? newUrl : null;
    }

    if (!tvModeEnabled && isTVUrl) {
      let newUrl;
      if (url.hash.startsWith('#/')) {
        const hashPath = url.hash.substring(1);
        try {
          const innerUrl = new URL(hashPath, url.origin);
          let targetPath = innerUrl.pathname;
          if (targetPath === '/search') {
            targetPath = '/results';
          }
          newUrl = url.origin + targetPath + innerUrl.search + innerUrl.hash;
        } catch {
          newUrl = url.origin + '/';
        }
      } else {
        const pathWithoutTV = url.pathname.replace(/^\/tv/, '');
        newUrl = url.origin + (pathWithoutTV || '/') + url.search + url.hash;
      }
      return newUrl !== url.href ? newUrl : null;
    }

    return null;
  }

  const api = { isYouTubeHostname, isTVPath, mapYouTubeUrl };

  root.YTTVM = Object.assign(root.YTTVM || {}, { redirect: api });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this);
