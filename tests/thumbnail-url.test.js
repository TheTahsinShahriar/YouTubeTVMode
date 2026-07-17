const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  upgradeThumbnailUrl,
  upgradeThumbnailSrcset,
  upgradeStyleUrl
} = require('../lib/thumbnail-url.js');

describe('thumbnail URL upgrade', () => {
  it('upgrades hqdefault to maxresdefault', () => {
    const input = 'https://i.ytimg.com/vi/VIDEO/hqdefault.jpg?sqp=xxx';
    assert.equal(
      upgradeThumbnailUrl(input),
      'https://i.ytimg.com/vi/VIDEO/maxresdefault.jpg'
    );
  });

  it('leaves non-thumbnail URLs alone', () => {
    const input = 'https://i.ytimg.com/vi/VIDEO/maxresdefault.jpg';
    assert.equal(upgradeThumbnailUrl(input), input);
    assert.equal(upgradeThumbnailUrl('https://example.com/a.jpg'), 'https://example.com/a.jpg');
  });

  it('upgrades srcset entries', () => {
    const input =
      'https://i.ytimg.com/vi/V/hqdefault.jpg 1x, https://i.ytimg.com/vi/V/sddefault.jpg 2x';
    const out = upgradeThumbnailSrcset(input);
    assert.ok(out.includes('maxresdefault.jpg 1x'));
    assert.ok(out.includes('maxresdefault.jpg 2x'));
  });

  it('upgrades css url()', () => {
    const input = 'background-image: url("https://i.ytimg.com/vi/V/mqdefault.webp")';
    assert.ok(upgradeStyleUrl(input).includes('maxresdefault.webp'));
  });
});
