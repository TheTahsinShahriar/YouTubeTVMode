// Playback speed persistence (event-driven video watch)
(() => {
  'use strict';

  const ns = window.__yttvm;
  if (!ns?.player) return;

  let savedSpeed = 1.0;

  function readSpeedFromSettings() {
    const speed = ns.settings?.getNumber('playbackSpeed', 1.0);
    if (!isNaN(speed) && speed > 0) savedSpeed = speed;
  }

  function applySpeed(video) {
    if (!video || savedSpeed === 1.0) return;
    try {
      video.playbackRate = savedSpeed;
    } catch {
      /* ignore */
    }
  }

  ns.player.watchVideo((video) => {
    const onReady = () => applySpeed(video);
    video.addEventListener('canplay', onReady);
    video.addEventListener('play', onReady);
    video.addEventListener('ratechange', () => {
      // Re-assert if player resets rate (ignore user-driven 1.0 when we want non-1)
      if (savedSpeed !== 1.0 && Math.abs(video.playbackRate - savedSpeed) > 0.001) {
        applySpeed(video);
      }
    });
    applySpeed(video);
    return () => {
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('play', onReady);
    };
  });

  ns.settings?.onChange((key, value) => {
    if (key === 'playbackSpeed' || key === '*') {
      if (key === 'playbackSpeed') {
        const speed = parseFloat(value);
        if (!isNaN(speed) && speed > 0) savedSpeed = speed;
      } else {
        readSpeedFromSettings();
      }
      applySpeed(ns.player.getVideo());
    }
  });

  readSpeedFromSettings();
  ns.log?.('playbackSpeed ready');
})();
