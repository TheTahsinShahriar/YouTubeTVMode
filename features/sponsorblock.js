// SponsorBlock — skip segments via sponsor.ajay.app (optional, default off)
(() => {
  'use strict';

  const ns = window.__yttvm;
  if (!ns?.player) return;

  const API = 'https://sponsor.ajay.app/api';
  const BAR_COLORS = {
    sponsor: '#00d400',
    intro: '#00ffff',
    outro: '#0202ed',
    interaction: '#cc00ff',
    selfpromo: '#ffff00',
    preview: '#008fd6',
    filler: '#7300FF',
    music_offtopic: '#ff9900'
  };

  let currentHandler = null;

  async function sha256Prefix(videoId) {
    const data = new TextEncoder().encode(videoId);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hash);
    // SponsorBlock uses first 4 hex chars of sha256
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex.substring(0, 4);
  }

  function getCategories() {
    const list = ns.settings?.getArray('sponsorBlockCategories');
    if (list?.length) return list;
    return ns.DEFAULTS?.sponsorBlockCategories || [
      'sponsor',
      'selfpromo',
      'interaction',
      'intro',
      'outro',
      'preview'
    ];
  }

  class Handler {
    constructor(videoId) {
      this.videoId = videoId;
      this.segments = [];
      this.video = null;
      this.overlay = null;
      this.destroyed = false;
      this.onTimeUpdate = () => this.maybeSkip();
      this.onDuration = () => this.buildOverlay();
    }

    async init() {
      if (!ns.settings?.isEnabled('sponsorBlockEnabled')) return;

      try {
        const hash = await sha256Prefix(this.videoId);
        const categories = getCategories();
        const url = `${API}/skipSegments/${hash}?categories=${encodeURIComponent(
          JSON.stringify(categories)
        )}`;
        const resp = await fetch(url);
        if (!resp.ok) return;
        const results = await resp.json();
        const match = Array.isArray(results)
          ? results.find((r) => r.videoID === this.videoId)
          : null;
        if (!match?.segments?.length) {
          ns.log?.('sponsorblock: no segments', this.videoId);
          return;
        }
        this.segments = match.segments.filter((s) =>
          categories.includes(s.category)
        );
        if (!this.segments.length) return;
        this.attachVideo();
      } catch (e) {
        ns.warn?.('sponsorblock fetch failed', e);
      }
    }

    attachVideo() {
      if (this.destroyed) return;
      const video = ns.player.getVideo();
      if (!video) {
        setTimeout(() => this.attachVideo(), 200);
        return;
      }
      this.video = video;
      video.addEventListener('timeupdate', this.onTimeUpdate);
      video.addEventListener('durationchange', this.onDuration);
      video.addEventListener('seeked', this.onTimeUpdate);
      this.buildOverlay();
      ns.log?.('sponsorblock attached', this.videoId, this.segments.length);
    }

    maybeSkip() {
      if (this.destroyed || !this.video || this.video.paused) return;
      if (!ns.settings?.isEnabled('sponsorBlockEnabled')) return;

      const t = this.video.currentTime;
      const categories = new Set(getCategories());

      for (const seg of this.segments) {
        if (!categories.has(seg.category)) continue;
        const [start, end] = seg.segment;
        if (t >= start && t < end - 0.15) {
          this.video.currentTime = end;
          ns.log?.('sponsorblock skip', seg.category, start, '→', end);
          break;
        }
      }
    }

    buildOverlay() {
      if (this.destroyed || !this.video?.duration) return;
      const slider = document.querySelector('div[idomkey="slider"]');
      if (!slider) {
        setTimeout(() => this.buildOverlay(), 300);
        return;
      }

      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }

      const duration = this.video.duration;
      const wrap = document.createElement('div');
      wrap.className = 'yttvm-sb-overlay';
      wrap.style.cssText =
        'position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;z-index:5;';

      for (const seg of this.segments) {
        const [start, end] = seg.segment;
        const left = (start / duration) * 100;
        const width = Math.max(((end - start) / duration) * 100, 0.2);
        const bar = document.createElement('div');
        bar.style.cssText = `position:absolute;top:0;bottom:0;left:${left}%;width:${width}%;background:${
          BAR_COLORS[seg.category] || '#0f0'
        };opacity:0.75;`;
        wrap.appendChild(bar);
      }

      // Position relative to slider parent when possible
      const parent = slider.parentElement || slider;
      if (getComputedStyle(parent).position === 'static') {
        parent.style.position = 'relative';
      }
      parent.appendChild(wrap);
      this.overlay = wrap;
    }

    destroy() {
      this.destroyed = true;
      if (this.video) {
        this.video.removeEventListener('timeupdate', this.onTimeUpdate);
        this.video.removeEventListener('durationchange', this.onDuration);
        this.video.removeEventListener('seeked', this.onTimeUpdate);
      }
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
    }
  }

  function startForVideo(videoId) {
    if (currentHandler) {
      currentHandler.destroy();
      currentHandler = null;
    }
    if (!videoId || !ns.settings?.isEnabled('sponsorBlockEnabled')) return;
    currentHandler = new Handler(videoId);
    currentHandler.init();
  }

  ns.player.watchPlayerVideoId((videoId) => startForVideo(videoId));

  ns.settings?.onChange((key) => {
    if (
      key === 'sponsorBlockEnabled' ||
      key === 'sponsorBlockCategories' ||
      key === '*'
    ) {
      const player = ns.player.getPlayer();
      const id = player?.getVideoData?.()?.video_id;
      if (id) startForVideo(id);
      else if (currentHandler && !ns.settings.isEnabled('sponsorBlockEnabled')) {
        currentHandler.destroy();
        currentHandler = null;
      }
    }
  });

  ns.log?.('sponsorblock ready');
})();
