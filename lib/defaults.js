/**
 * Shared defaults & constants for content scripts, background, and tests.
 * Page context loads this via inject; isolated worlds load it via manifest.
 */
(function (root) {
  'use strict';

  const YTTVM_USER_AGENT =
    'Mozilla/5.0 (Linux; Android 16) Cobalt/26.lts.30.1034958-gold (unlike Gecko) v8/12.4.254.15-jit gles Starboard/16, SAMSUNG_S95F_2025 (SAMSUNG, S95F, Wired)';

  /** Keys that default to OFF (everything else defaults to ON when undefined). */
  const DEFAULT_OFF_KEYS = [
    'leanbackModeEnabled',
    'miniPlayerEnabled',
    'sponsorBlockEnabled',
    'hideEndScreenCards',
    'hideSigninReminder',
    'debugLogging'
  ];

  const DEFAULTS = {
    tvModeEnabled: true,
    forceResolutionEnabled: true,
    preferredVideoQuality: 'highres',
    autoFullscreenEnabled: true,
    backgroundPlaybackEnabled: true,
    leanbackModeEnabled: false,
    highQualityThumbnailsEnabled: true,
    keyRemappingEnabled: true,
    adBlockEnabled: true,
    playbackSpeedEnabled: true,
    speedIncrement: 0.25,
    playbackSpeed: 1.0,
    miniPlayerEnabled: false,
    sponsorBlockEnabled: false,
    sponsorBlockCategories: [
      'sponsor',
      'selfpromo',
      'interaction',
      'intro',
      'outro',
      'preview'
    ],
    hideEndScreenCards: false,
    hidePaidPromotion: true,
    hideSigninReminder: false,
    disabledSidebarContents: [],
    debugLogging: false
  };

  const QUALITY_OPTIONS = [
    { id: 'highres', label: 'Highest available' },
    { id: 'hd2160', label: '2160p (4K)' },
    { id: 'hd1440', label: '1440p' },
    { id: 'hd1080', label: '1080p' },
    { id: 'hd720', label: '720p' },
    { id: 'large', label: '480p' },
    { id: 'medium', label: '360p' },
    { id: 'auto', label: 'Auto (no force)' }
  ];

  const SIDEBAR_ITEMS = [
    { name: 'Search', icon: 'SEARCH' },
    { name: 'Home', icon: 'WHAT_TO_WATCH' },
    { name: 'Sports', icon: 'TROPHY' },
    { name: 'News', icon: 'NEWS' },
    { name: 'Music', icon: 'YOUTUBE_MUSIC' },
    { name: 'Podcasts', icon: 'BROADCAST' },
    { name: 'Movies & TV', icon: 'CLAPPERBOARD' },
    { name: 'Live', icon: 'LIVE' },
    { name: 'Gaming', icon: 'GAMING' },
    { name: 'Subscriptions', icon: 'SUBSCRIPTIONS' },
    { name: 'Library', icon: 'TAB_LIBRARY' },
    { name: 'More', icon: 'TAB_MORE' }
  ];

  const SPONSOR_CATEGORIES = [
    { id: 'sponsor', label: 'Sponsors' },
    { id: 'selfpromo', label: 'Self-promotion' },
    { id: 'interaction', label: 'Interaction reminders' },
    { id: 'intro', label: 'Intros' },
    { id: 'outro', label: 'Outros' },
    { id: 'preview', label: 'Preview / recap' },
    { id: 'filler', label: 'Filler / tangents' },
    { id: 'music_offtopic', label: 'Non-music (music videos)' }
  ];

  const MESSAGE = {
    PAGE: 'yttvm-page',
    CONTENT: 'yttvm-content',
    SETTINGS_CHANGE: 'yttvm-settings-change',
    TOKEN: 'yttvm-bridge-v1'
  };

  /** Features that need a full page reload when toggled (API patches). */
  const RELOAD_REQUIRED_KEYS = [
    'tvModeEnabled',
    'forceResolutionEnabled',
    'backgroundPlaybackEnabled',
    'highQualityThumbnailsEnabled',
    'keyRemappingEnabled',
    'adBlockEnabled',
    'sponsorBlockEnabled'
  ];

  /** Instant apply via postMessage (no reload). */
  const INSTANT_APPLY_KEYS = [
    'autoFullscreenEnabled',
    'leanbackModeEnabled',
    'playbackSpeed',
    'speedIncrement',
    'disabledSidebarContents',
    'miniPlayerEnabled',
    'playbackSpeedEnabled',
    'preferredVideoQuality',
    'sponsorBlockCategories',
    'hideEndScreenCards',
    'hidePaidPromotion',
    'hideSigninReminder',
    'debugLogging'
  ];

  function isDefaultOn(key) {
    return !DEFAULT_OFF_KEYS.includes(key);
  }

  /**
   * Resolve a boolean setting with defaults.
   * @param {string} key
   * @param {Record<string, unknown>} settings
   */
  function resolveBool(key, settings) {
    if (isDefaultOn(key)) {
      return settings?.[key] !== false;
    }
    return settings?.[key] === true;
  }

  const api = {
    YTTVM_USER_AGENT,
    DEFAULT_OFF_KEYS,
    DEFAULTS,
    QUALITY_OPTIONS,
    SIDEBAR_ITEMS,
    SPONSOR_CATEGORIES,
    MESSAGE,
    RELOAD_REQUIRED_KEYS,
    INSTANT_APPLY_KEYS,
    isDefaultOn,
    resolveBool
  };

  root.YTTVM = Object.assign(root.YTTVM || {}, api);

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this);
