// Popup Logic - TV Mode Toggle

document.addEventListener('DOMContentLoaded', () => {
    const tvModeToggle = document.getElementById('tvModeToggle');
    const statusText = document.getElementById('statusText');

    const updateStatusText = (enabled) => {
        statusText.textContent = enabled ? 'TV Mode Active' : 'Enable YouTube TV interface';
    };

    // Load current TV Mode state
    chrome.storage.local.get(['tvModeEnabled'], (result) => {
        if (chrome.runtime.lastError) return;
        const enabled = result.tvModeEnabled !== false; // Default: true
        tvModeToggle.checked = enabled;
        updateStatusText(enabled);
    });

    // Save TV Mode state on change
    tvModeToggle.addEventListener('change', () => {
        const enabled = tvModeToggle.checked;
        chrome.storage.local.set({ tvModeEnabled: enabled });
        updateStatusText(enabled);
    });
});
