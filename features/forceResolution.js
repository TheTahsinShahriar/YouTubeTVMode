// Preferred / highest video quality (respects forceResolutionEnabled + preferredVideoQuality)
(() => {
  'use strict';

  const ns = window.__yttvm;
  if (!ns?.player) return;

  let lastVideoId = null;
  let appliedForId = null;

  function desiredQuality() {
    if (!ns.settings?.isEnabled('forceResolutionEnabled')) return null;
    const q = ns.settings.get('preferredVideoQuality') || 'highres';
    if (q === 'auto') return null;
    return q;
  }

  function apply(player, videoId) {
    const quality = desiredQuality();
    if (!quality || !player) return;

    try {
      if (typeof player.setPlaybackQualityRange === 'function') {
        player.setPlaybackQualityRange(quality, quality);
      } else if (typeof player.setPlaybackQuality === 'function') {
        player.setPlaybackQuality(quality);
      }
      appliedForId = videoId;
      ns.log?.('forceResolution applied', quality, videoId);
    } catch (e) {
      ns.warn?.('forceResolution failed', e);
    }
  }

  function tryApply() {
    const player = ns.player.getPlayer();
    if (!player || typeof player.getVideoData !== 'function') return;

    try {
      const data = player.getVideoData();
      const videoId = data?.video_id;
      if (!videoId) return;

      if (videoId !== lastVideoId) {
        lastVideoId = videoId;
        appliedForId = null;
      }

      // Wait until quality metadata exists when possible
      if (appliedForId === videoId) return;
      if (data.video_quality || data.isPlayable !== false) {
        apply(player, videoId);
      }
    } catch (e) {
      ns.warn?.('forceResolution check error', e);
    }
  }

  ns.player.watchPlayerVideoId((videoId, player) => {
    lastVideoId = videoId;
    appliedForId = null;
    // Apply after a short delay so formats are ready
    setTimeout(() => apply(player, videoId), 300);
    setTimeout(() => apply(player, videoId), 1500);
  });

  ns.settings?.onChange((key) => {
    if (key === 'forceResolutionEnabled' || key === 'preferredVideoQuality' || key === '*') {
      appliedForId = null;
      tryApply();
    }
  });

  // Event-driven + light fallback
  document.addEventListener(
    'yt-navigate-finish',
    () => {
      appliedForId = null;
      tryApply();
    },
    true
  );

  ns.player.waitFor(ns.player.getPlayer, (player) => {
    try {
      player.addEventListener('onStateChange', tryApply);
    } catch {
      /* ignore */
    }
    tryApply();
  });

  ns.log?.('forceResolution ready');
})();
