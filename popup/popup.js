// Popup — TV Mode + quick feature toggles
document.addEventListener('DOMContentLoaded', () => {
  const tvModeToggle = document.getElementById('tvModeToggle');
  const autoFullscreenToggle = document.getElementById('autoFullscreenToggle');
  const adBlockToggle = document.getElementById('adBlockToggle');
  const sponsorBlockToggle = document.getElementById('sponsorBlockToggle');
  const leanbackToggle = document.getElementById('leanbackToggle');
  const statusText = document.getElementById('statusText');
  const versionText = document.getElementById('versionText');

  const manifest = chrome.runtime.getManifest();
  versionText.textContent = `v${manifest.version}`;

  const updateStatusText = (enabled) => {
    statusText.textContent = enabled ? 'TV Mode Active' : 'Enable YouTube TV interface';
  };

  const bindToggle = (el, key, defaultOn) => {
    return (storage) => {
      el.checked = defaultOn ? storage[key] !== false : storage[key] === true;
      el.addEventListener('change', () => {
        chrome.storage.local.set({ [key]: el.checked });
      });
    };
  };

  const applyTv = bindToggle(tvModeToggle, 'tvModeEnabled', true);
  const applyFs = bindToggle(autoFullscreenToggle, 'autoFullscreenEnabled', true);
  const applyAd = bindToggle(adBlockToggle, 'adBlockEnabled', true);
  const applySb = bindToggle(sponsorBlockToggle, 'sponsorBlockEnabled', false);
  const applyLb = bindToggle(leanbackToggle, 'leanbackModeEnabled', false);

  tvModeToggle.addEventListener('change', () => {
    updateStatusText(tvModeToggle.checked);
  });

  chrome.storage.local.get(
    [
      'tvModeEnabled',
      'autoFullscreenEnabled',
      'adBlockEnabled',
      'sponsorBlockEnabled',
      'leanbackModeEnabled'
    ],
    (result) => {
      if (chrome.runtime.lastError) return;
      applyTv(result);
      applyFs(result);
      applyAd(result);
      applySb(result);
      applyLb(result);
      updateStatusText(result.tvModeEnabled !== false);
    }
  );
});
