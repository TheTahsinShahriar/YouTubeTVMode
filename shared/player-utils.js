// Player / video helpers without busy 1s loops
(() => {
  'use strict';

  const ns = window.__yttvm || (window.__yttvm = {});

  function getPlayer() {
    return (
      document.getElementById('movie_player') ||
      document.querySelector('.html5-video-player') ||
      null
    );
  }

  function getVideo() {
    return document.querySelector('video');
  }

  /**
   * Poll with exponential backoff until predicate returns a truthy value, then stop.
   * @param {() => any} getter
   * @param {(value: any) => void} onFound
   * @param {{ maxMs?: number, startMs?: number, maxInterval?: number }} [opts]
   */
  function waitFor(getter, onFound, opts = {}) {
    const maxMs = opts.maxMs ?? 120000;
    const maxInterval = opts.maxInterval ?? 2000;
    let interval = opts.startMs ?? 100;
    let elapsed = 0;
    let stopped = false;
    let timer = null;

    function tick() {
      if (stopped) return;
      const value = getter();
      if (value) {
        stopped = true;
        onFound(value);
        return;
      }
      elapsed += interval;
      if (elapsed >= maxMs) return;
      interval = Math.min(interval * 1.4, maxInterval);
      timer = setTimeout(tick, interval);
    }

    tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }

  /**
   * Keep a callback attached to the current <video>, re-binding when it changes.
   * Uses MutationObserver + rare fallback instead of a fixed 1s interval.
   */
  function watchVideo(onVideo) {
    let current = null;
    let cleanupListeners = null;

    function attach(video) {
      if (video === current) return;
      if (cleanupListeners) cleanupListeners();
      current = video;
      if (!video) return;
      cleanupListeners = onVideo(video) || null;
    }

    function scan() {
      attach(getVideo());
    }

    scan();

    const observer = new MutationObserver(() => scan());
    const startObserver = () => {
      if (document.documentElement) {
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
    };

    if (document.documentElement) startObserver();
    else document.addEventListener('DOMContentLoaded', startObserver, { once: true });

    // Light fallback for SPA navigations that don't mutate enough
    const fallback = setInterval(scan, 4000);

    return () => {
      observer.disconnect();
      clearInterval(fallback);
      if (cleanupListeners) cleanupListeners();
    };
  }

  /**
   * Watch for video id changes on the YT player.
   */
  function watchPlayerVideoId(onChange) {
    let lastId = null;
    let player = null;

    function check() {
      if (!player) player = getPlayer();
      if (!player || typeof player.getVideoData !== 'function') return;
      try {
        const data = player.getVideoData();
        const id = data?.video_id || null;
        if (id && id !== lastId) {
          lastId = id;
          onChange(id, player, data);
        }
      } catch {
        /* ignore */
      }
    }

    const stopWait = waitFor(getPlayer, (p) => {
      player = p;
      try {
        if (typeof p.addEventListener === 'function') {
          p.addEventListener('onStateChange', check);
        }
      } catch {
        /* ignore */
      }
      check();
    });

    const interval = setInterval(check, 2000);

    return () => {
      stopWait();
      clearInterval(interval);
    };
  }

  ns.player = {
    getPlayer,
    getVideo,
    waitFor,
    watchVideo,
    watchPlayerVideoId
  };
})();
