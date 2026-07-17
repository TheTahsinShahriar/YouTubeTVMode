const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveBool,
  DEFAULTS,
  RELOAD_REQUIRED_KEYS,
  isDefaultOn
} = require('../lib/defaults.js');

describe('defaults / resolveBool', () => {
  it('defaults ad block on', () => {
    assert.equal(resolveBool('adBlockEnabled', {}), true);
    assert.equal(resolveBool('adBlockEnabled', { adBlockEnabled: false }), false);
  });

  it('defaults leanback off', () => {
    assert.equal(isDefaultOn('leanbackModeEnabled'), false);
    assert.equal(resolveBool('leanbackModeEnabled', {}), false);
    assert.equal(resolveBool('leanbackModeEnabled', { leanbackModeEnabled: true }), true);
  });

  it('includes force resolution in reload keys', () => {
    assert.ok(RELOAD_REQUIRED_KEYS.includes('forceResolutionEnabled'));
    assert.ok(RELOAD_REQUIRED_KEYS.includes('sponsorBlockEnabled'));
  });

  it('has expected default quality', () => {
    assert.equal(DEFAULTS.preferredVideoQuality, 'highres');
  });
});
