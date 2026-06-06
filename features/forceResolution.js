// Force Highest Resolution
// Automatically sets video playback quality to highest available

(() => {
    'use strict';

    let lastVideoId = null;

    setInterval(() => {
        try {
            const player = document.getElementById('movie_player') || document.querySelector('.html5-video-player');
            if (player && typeof player.setPlaybackQualityRange === 'function' && typeof player.getVideoData === 'function') {
                const videoData = player.getVideoData();
                const videoId = videoData?.video_id;

                if (videoId && videoId !== lastVideoId) {
                    // Ensure video data has loaded before applying quality settings
                    if (videoData.video_quality) {
                        player.setPlaybackQualityRange('highres');
                        lastVideoId = videoId;
                        console.log(`[Force Resolution] Quality set to highres for video: ${videoId}`);
                    }
                }
            }
        } catch (e) {
            console.warn('[Force Resolution] Error checking player:', e);
        }
    }, 1000);

})();
