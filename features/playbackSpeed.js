// Playback Speed
// Persists and restores custom playback speed across video loads.

(() => {
    'use strict';

    let savedSpeed = 1.0;
    let lastAttachedVideo = null;

    function applySpeed(video) {
        if (!video || savedSpeed === 1.0) return;
        video.playbackRate = savedSpeed;
    }

    setInterval(() => {
        try {
            const video = document.querySelector('video');
            if (video) {
                if (video !== lastAttachedVideo) {
                    lastAttachedVideo = video;
                    video.addEventListener('canplay', () => applySpeed(video));
                    video.addEventListener('play', () => applySpeed(video));
                    applySpeed(video);
                } else {
                    // Keep speed in sync in case native player reset it
                    if (savedSpeed !== 1.0 && video.playbackRate !== savedSpeed) {
                        applySpeed(video);
                    }
                }
            }
        } catch (e) {
            console.warn('[Playback Speed] Error checking video speed:', e);
        }
    }, 1000);

    window.addEventListener('message', (event) => {
        if (event.source !== window) return;

        if (event.data?.source === 'yttvm-content' && event.data?.type === 'SETTINGS_RESPONSE') {
            const speed = parseFloat(event.data.settings?.playbackSpeed);
            if (!isNaN(speed) && speed > 0) {
                savedSpeed = speed;
                applySpeed(document.querySelector('video'));
            }
        }

        if (event.data?.source === 'yttvm-settings-change' && event.data.key === 'playbackSpeed') {
            const speed = parseFloat(event.data.value);
            if (!isNaN(speed) && speed > 0) {
                savedSpeed = speed;
                applySpeed(document.querySelector('video'));
            }
        }
    });
})();
