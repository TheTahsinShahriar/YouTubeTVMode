const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { mapYouTubeUrl, isYouTubeHostname, isTVPath } = require('../lib/redirect.js');

describe('redirect helpers', () => {
  it('detects YouTube hostnames', () => {
    assert.equal(isYouTubeHostname('www.youtube.com'), true);
    assert.equal(isYouTubeHostname('m.youtube.com'), true);
    assert.equal(isYouTubeHostname('example.com'), false);
  });

  it('detects TV paths', () => {
    assert.equal(isTVPath('/tv'), true);
    assert.equal(isTVPath('/tv/'), true);
    assert.equal(isTVPath('/watch'), false);
  });

  it('maps home to /tv when TV mode on', () => {
    const out = mapYouTubeUrl('https://www.youtube.com/', true);
    assert.equal(out, 'https://www.youtube.com/tv');
  });

  it('maps watch to hash route', () => {
    const out = mapYouTubeUrl('https://www.youtube.com/watch?v=abc123', true);
    assert.equal(out, 'https://www.youtube.com/tv#/watch?v=abc123');
  });

  it('maps results to search', () => {
    const out = mapYouTubeUrl('https://www.youtube.com/results?search_query=test', true);
    assert.equal(out, 'https://www.youtube.com/tv#/search?search_query=test');
  });

  it('maps TV hash watch back to desktop watch', () => {
    const out = mapYouTubeUrl('https://www.youtube.com/tv#/watch?v=abc123', false);
    assert.equal(out, 'https://www.youtube.com/watch?v=abc123');
  });

  it('returns null when already correct', () => {
    assert.equal(mapYouTubeUrl('https://www.youtube.com/tv', true), null);
    assert.equal(mapYouTubeUrl('https://www.youtube.com/watch?v=x', false), null);
  });

  it('ignores non-YouTube URLs', () => {
    assert.equal(mapYouTubeUrl('https://example.com/', true), null);
  });
});
