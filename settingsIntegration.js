// YouTube TV Settings Integration
// Adds extension settings to YouTube TV's native UI.
// Patches the command resolver for custom actions and player-menu injection.

(function () {
    'use strict';

    let settings = {};
    let sidebarDirty = false;
    let lastPlaybackSettingsCmd = null;

    const getSettings = () =>
        window.postMessage({ source: 'yttvm-page', type: 'GET_SETTINGS' }, '*');

    const saveSettings = (newSettings) => {
        settings = { ...settings, ...newSettings };
        window.postMessage({ source: 'yttvm-page', type: 'SET_SETTINGS', settings }, '*');
    };

    window.addEventListener('message', (event) => {
        if (event.source !== window || !event.data || event.data.source !== 'yttvm-content') return;
        if (event.data.type === 'SETTINGS_RESPONSE' || event.data.type === 'SETTINGS_CHANGED') {
            settings = event.data.settings || {};
        }
    });

    // ───── UI Helpers ─────

    const resolveCommand = (cmd) => {
        for (const key in window._yttv || {}) {
            const inst = window._yttv[key]?.instance;
            if (inst?.resolveCommand) return inst.resolveCommand(cmd);
        }
    };

    // Checkbox toggle button
    // parentMenu: optional action name to refresh after toggling (defaults to main settings)
    const toggleItem = (title, subtitle, checked, key, parentMenu) => ({
        compactLinkRenderer: {
            title: { simpleText: title },
            subtitle: subtitle ? { simpleText: subtitle } : undefined,
            secondaryIcon: { iconType: checked ? 'CHECK_BOX' : 'CHECK_BOX_OUTLINE_BLANK' },
            serviceEndpoint: { customAction: { action: 'YTTVM_TOGGLE_SETTING', parameters: { key, parentMenu } } }
        }
    });

    // Navigation / action item (no checkbox)
    // Uses bare customAction — same format as toggleItem which works.
    // secondaryIcon: CHEVRON_RIGHT indicates sub-menu navigation.
    // icon: optional left-side iconType
    const navItem = (title, subtitle, action, parameters, secondaryIcon = 'CHEVRON_RIGHT', icon = null) => ({
        compactLinkRenderer: {
            title: { simpleText: title },
            subtitle: subtitle ? { simpleText: subtitle } : undefined,
            icon: icon ? { iconType: icon } : undefined,
            secondaryIcon: secondaryIcon ? { iconType: secondaryIcon } : undefined,
            serviceEndpoint: { customAction: { action, parameters: parameters ?? {} } }
        }
    });

    const showModal = (header, content, uniqueId, isUpdate) => {
        resolveCommand({
            openPopupAction: {
                popupType: 'MODAL',
                popup: {
                    overlaySectionRenderer: {
                        overlay: {
                            overlayTwoPanelRenderer: {
                                actionPanel: {
                                    overlayPanelRenderer: {
                                        header: {
                                            overlayPanelHeaderRenderer: {
                                                title: { simpleText: header.title },
                                                subtitle: header.subtitle ? { simpleText: header.subtitle } : undefined
                                            }
                                        },
                                        content
                                    }
                                },
                                backButton: {
                                    buttonRenderer: {
                                        accessibilityData: { accessibilityData: { label: 'Back' } },
                                        command: { signalAction: { signal: 'POPUP_BACK' } }
                                    }
                                }
                            }
                        },
                        dismissalCommand: { signalAction: { signal: 'POPUP_BACK' } }
                    }
                },
                uniqueId,
                shouldMatchUniqueId: !!isUpdate,
                updateAction: !!isUpdate
            }
        });
    };

    // ───── Sidebar items ─────

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

    // ───── Speed picker modal ─────
    // Generates buttons from the configured speedIncrement setting.

    function openSpeedPicker() {
        const currentSpeed = settings.playbackSpeed || 1.0;
        const increment = settings.speedIncrement || 0.25;
        const maxSpeed = 5;
        let selectedIndex = 0;
        const buttons = [];

        for (let speed = increment; speed <= maxSpeed; speed += increment) {
            const fixedSpeed = Math.round(speed * 100) / 100;
            const active = Math.abs(currentSpeed - fixedSpeed) < 0.001;
            buttons.push(navItem(
                `${fixedSpeed}×`,
                active ? '▶  Current' : null,
                'YTTVM_SET_SPEED',
                { speed: fixedSpeed },
                null // No chevron for selection
            ));
            if (active) selectedIndex = buttons.length - 1;
        }

        // Fix stuttering option (from TizenTube)
        const stutterActive = Math.abs(currentSpeed - 1.0001) < 0.00001;
        buttons.push(navItem(
            'Fix Stuttering  (1.0001×)',
            stutterActive ? '▶  Current' : null,
            'YTTVM_SET_SPEED',
            { speed: 1.0001 },
            null // No chevron
        ));

        showModal(
            { title: 'Playback Speed', subtitle: `Current: ${currentSpeed}×` },
            { overlayPanelItemListRenderer: { items: buttons, selectedIndex } },
            'yttvm_speed',
            false
        );
    }

    // ───── JSON.parse intercept ─────
    // Injects the "YouTube TV Mode" entry into the native Settings menu.

    const originalParse = JSON.parse;
    window.JSON.parse = function () {
        const result = originalParse.apply(this, arguments);
        if (!result || typeof result !== 'object') return result;

        if (result?.title?.runs?.some(run => run.text === 'Settings')) {
            const extensionSetting = {
                settingActionRenderer: {
                    title: { runs: [{ text: 'YouTube TV Mode' }] },
                    serviceEndpoint: { customAction: { action: 'YTTVM_OPEN_SETTINGS' } },
                    summary: { runs: [{ text: 'Extension Features' }] },
                    itemId: 'yttvm_extension',
                    actionLabel: { runs: [{ text: 'Configure' }] }
                }
            };
            const extensionCategory = {
                settingCategoryCollectionRenderer: {
                    items: [extensionSetting],
                    categoryId: 'yttvm_category',
                    title: { runs: [{ text: 'Extension Settings' }] }
                }
            };
            const youtubeSettingsCategory = {
                settingCategoryCollectionRenderer: {
                    items: [], categoryId: 'yttvm_youtube_settings',
                    title: { runs: [{ text: 'YouTube Settings' }] }
                }
            };
            const spacerCategory = {
                settingCategoryCollectionRenderer: {
                    items: [], categoryId: 'yttvm_spacer',
                    title: { runs: [{ text: '   ' }] }
                }
            };

            if (result.items && !result.items.some(i =>
                i.settingCategoryCollectionRenderer?.categoryId === 'yttvm_category'
            )) {
                result.items.unshift(youtubeSettingsCategory);
                result.items.unshift(spacerCategory);
                result.items.unshift(extensionCategory);
            }
        }

        return result;
    };

    // ───── Command resolver patch ─────

    function patchCommands() {
        for (const key in window._yttv || {}) {
            const inst = window._yttv[key]?.instance;
            if (!inst?.resolveCommand || inst.resolveCommand._yttvm_patched) continue;

            const originalResolve = inst.resolveCommand;

            inst.resolveCommand = function (cmd) {

                // ───── Extract customAction from any wrapper format ─────
                // YouTube TV routes commands through different wrapper types
                // depending on context (modal clicks, signal actions, etc.).
                const ca = cmd?.customAction
                    || cmd?.signalAction?.customAction
                    || cmd?.showEngagementPanelEndpoint?.customAction
                    || cmd?.playlistEditEndpoint?.customAction
                    || null;

                if (ca) {
                    const { action, parameters } = ca;

                    // ───── Main settings ─────
                    if (action === 'YTTVM_OPEN_SETTINGS') {
                        const spd = settings.playbackSpeed || 1.0;
                        const inc = settings.speedIncrement || 0.25;
                        const disabledCount = (settings.disabledSidebarContents || []).length;
                        const items = [
                            navItem('Speed Controls', `Increment: ${inc}×`, 'YTTVM_OPEN_SPEED_SETTINGS', {}),
                            toggleItem('Ad Blocker', 'Block video ads & home screen ads', settings.adBlockEnabled !== false, 'adBlockEnabled'),
                            toggleItem('Force Highest Resolution', 'Auto select highest available video quality', settings.forceResolutionEnabled !== false, 'forceResolutionEnabled'),
                            toggleItem('Auto Fullscreen', 'Enter fullscreen on load', settings.autoFullscreenEnabled !== false, 'autoFullscreenEnabled'),
                            toggleItem('Background Playback', 'Continue playing even if tab/window is in background', settings.backgroundPlaybackEnabled !== false, 'backgroundPlaybackEnabled'),
                            toggleItem('Leanback Mode', 'Hide cursor & disable mouse', settings.leanbackModeEnabled === true, 'leanbackModeEnabled'),
                            toggleItem('High Quality Thumbnails', 'Force max-resolution thumbnails', settings.highQualityThumbnailsEnabled !== false, 'highQualityThumbnailsEnabled'),
                            toggleItem('Key Remapping', 'Backspace→Back, Space→Enter', settings.keyRemappingEnabled !== false, 'keyRemappingEnabled'),
                            toggleItem('Mini Player', 'Show PiP option in player menu', settings.miniPlayerEnabled === true, 'miniPlayerEnabled'),
                            navItem('Hide Sidebar Contents', `${disabledCount} hidden`, 'YTTVM_OPEN_SIDEBAR_SETTINGS', {}),
                        ];
                        items.sort((a, b) => {
                            const titleA = a.compactLinkRenderer?.title?.simpleText || '';
                            const titleB = b.compactLinkRenderer?.title?.simpleText || '';
                            return titleA.localeCompare(titleB);
                        });
                        showModal(
                            { title: 'YouTube TV Mode', subtitle: 'Configure Extension Features' },
                            { overlayPanelItemListRenderer: { items, selectedIndex: 0 } },
                            'yttvm_settings',
                            parameters === true
                        );
                        return true;
                    }

                    // ───── Toggle boolean setting ─────
                    if (action === 'YTTVM_TOGGLE_SETTING') {
                        const k = parameters.key;
                        const defaultOffKeys = ['leanbackModeEnabled', 'miniPlayerEnabled'];
                        const current = defaultOffKeys.includes(k) ? settings[k] === true : settings[k] !== false;
                        const next = !current;
                        saveSettings({ [k]: next });
                        // Refresh the parent menu that contains this toggle
                        const parentMenu = parameters.parentMenu || 'YTTVM_OPEN_SETTINGS';
                        resolveCommand({ customAction: { action: parentMenu, parameters: true } });
                        return true;
                    }

                    // ───── Speed Controls sub-menu ─────
                    if (action === 'YTTVM_OPEN_SPEED_SETTINGS') {
                        const inc = settings.speedIncrement || 0.25;
                        const items = [
                            toggleItem('Enable Speed Controls', 'Show speed button in player menu', settings.playbackSpeedEnabled !== false, 'playbackSpeedEnabled', 'YTTVM_OPEN_SPEED_SETTINGS'),
                            navItem('Speed Increment', `Current: ${inc}×`, 'YTTVM_OPEN_SPEED_INCREMENT', {}),
                        ];
                        showModal(
                            { title: 'Speed Controls', subtitle: 'Configure playback speed options' },
                            { overlayPanelItemListRenderer: { items, selectedIndex: 0 } },
                            'yttvm_speed_settings',
                            parameters === true
                        );
                        return true;
                    }

                    // ───── Speed increment picker ─────
                    if (action === 'YTTVM_OPEN_SPEED_INCREMENT') {
                        const currentInc = settings.speedIncrement || 0.25;
                        const increments = [];
                        let selectedIndex = 0;
                        for (let v = 0.05; v <= 0.5; v += 0.05) {
                            const fixed = Math.round(v * 100) / 100;
                            const active = Math.abs(currentInc - fixed) < 0.001;
                            increments.push(navItem(
                                `${fixed}×`,
                                active ? '▶  Current' : null,
                                'YTTVM_SET_SPEED_INCREMENT',
                                { value: fixed },
                                null // No chevron
                            ));
                            if (active) selectedIndex = increments.length - 1;
                        }
                        showModal(
                            { title: 'Speed Increment', subtitle: `Current: ${currentInc}×` },
                            { overlayPanelItemListRenderer: { items: increments, selectedIndex } },
                            'yttvm_speed_increment',
                            false
                        );
                        return true;
                    }

                    // ───── Set speed increment ─────
                    if (action === 'YTTVM_SET_SPEED_INCREMENT') {
                        const value = parseFloat(parameters.value) || 0.25;
                        saveSettings({ speedIncrement: value });
                        // Speed increment change needs reload to apply to player menu
                        setTimeout(() => window.location.reload(), 300);
                        return true;
                    }

                    // ───── Speed picker (from player menu) ─────
                    if (action === 'YTTVM_OPEN_SPEED') {
                        openSpeedPicker();
                        return true;
                    }

                    // ───── Set actual playback speed ─────
                    if (action === 'YTTVM_SET_SPEED') {
                        const speed = parseFloat(parameters.speed) || 1.0;
                        const video = document.querySelector('video');
                        if (video) video.playbackRate = speed;
                        saveSettings({ playbackSpeed: speed });

                        // Perform native back first
                        resolveCommand({ signalAction: { signal: 'POPUP_BACK' } });

                        // Then rerender the parent menu to reflect the change
                        if (lastPlaybackSettingsCmd) {
                            setTimeout(() => {
                                const refresh = JSON.parse(JSON.stringify(lastPlaybackSettingsCmd));
                                refresh.openPopupAction.updateAction = true;
                                refresh.openPopupAction.shouldMatchUniqueId = true;
                                resolveCommand(refresh);
                            }, 50);
                        }
                        return true;
                    }

                    // ───── PiP (Chrome native) ─────
                    if (action === 'YTTVM_PIP') {
                        resolveCommand({ signalAction: { signal: 'POPUP_BACK' } });
                        document.querySelector('video')?.requestPictureInPicture()
                            .catch(e => console.warn('[YouTube TV Mode] PiP failed:', e));
                        return true;
                    }

                    // ───── Sidebar contents sub-menu ─────
                    if (action === 'YTTVM_OPEN_SIDEBAR_SETTINGS') {
                        const disabled = settings.disabledSidebarContents || [];
                        const items = SIDEBAR_ITEMS.map(item => ({
                            compactLinkRenderer: {
                                title: { simpleText: item.name },
                                secondaryIcon: {
                                    iconType: disabled.includes(item.icon) ? 'CHECK_BOX' : 'CHECK_BOX_OUTLINE_BLANK'
                                },
                                serviceEndpoint: {
                                    customAction: { action: 'YTTVM_TOGGLE_SIDEBAR_ITEM', parameters: { icon: item.icon } }
                                }
                            }
                        }));
                        showModal(
                            { title: 'Sidebar Contents', subtitle: 'Check items to hide from the guide' },
                            { overlayPanelItemListRenderer: { items, selectedIndex: 0 } },
                            'yttvm_sidebar',
                            parameters === true
                        );
                        return true;
                    }

                    // ───── Toggle individual sidebar item ─────
                    if (action === 'YTTVM_TOGGLE_SIDEBAR_ITEM') {
                        const icon = parameters.icon;
                        const disabled = settings.disabledSidebarContents || [];
                        const idx = disabled.indexOf(icon);
                        if (idx >= 0) {
                            disabled.splice(idx, 1);
                        } else {
                            disabled.push(icon);
                        }
                        saveSettings({ disabledSidebarContents: [...disabled] });
                        sidebarDirty = true;
                        // Refresh sidebar settings modal
                        resolveCommand({ customAction: { action: 'YTTVM_OPEN_SIDEBAR_SETTINGS', parameters: true } });
                        return true;
                    }
                }

                // ───── Sidebar reload on exit ─────
                // When user exits sidebar settings after making changes,
                // reload so the guide re-renders with the new filter.
                if (cmd?.signalAction?.signal === 'POPUP_BACK' && sidebarDirty) {
                    sidebarDirty = false;
                    // Let the popup close first, then reload
                    originalResolve.apply(this, arguments);
                    setTimeout(() => window.location.reload(), 300);
                    return true;
                }

                // ───── Player playback-settings popup injection ─────
                // Adapted from TizenTube resolveCommand.js
                if (cmd?.openPopupAction?.uniqueId === 'playback-settings') {
                    // Cache the command for rerendering later
                    lastPlaybackSettingsCmd = JSON.parse(JSON.stringify(cmd));

                    const items = cmd.openPopupAction.popup
                        ?.overlaySectionRenderer?.overlay
                        ?.overlayTwoPanelRenderer?.actionPanel
                        ?.overlayPanelRenderer?.content
                        ?.overlayPanelItemListRenderer?.items;

                    if (items) {
                        // Replace native speed item with our speed picker
                        if (settings.playbackSpeedEnabled !== false) {
                            for (let i = 0; i < items.length; i++) {
                                const item = items[i]?.compactLinkRenderer;
                                if (item?.icon?.iconType === 'SLOW_MOTION_VIDEO') {
                                    const spd = settings.playbackSpeed || 1.0;
                                    // If already replaced, just update the subtitle and icon
                                    if (item.serviceEndpoint?.customAction?.action === 'YTTVM_OPEN_SPEED') {
                                        item.subtitle = { simpleText: `${spd}×` };
                                        item.secondaryIcon = { iconType: 'CHEVRON_RIGHT' };
                                    } else {
                                        items[i] = {
                                            compactLinkRenderer: {
                                                title: { simpleText: 'Speed' },
                                                subtitle: { simpleText: `${spd}×` },
                                                icon: { iconType: 'SLOW_MOTION_VIDEO' },
                                                secondaryIcon: { iconType: 'CHEVRON_RIGHT' },
                                                serviceEndpoint: { customAction: { action: 'YTTVM_OPEN_SPEED' } }
                                            }
                                        };
                                    }
                                    break;
                                }
                            }
                        }

                        // Add Mini Player button (idempotent check to avoid duplication on rerender)
                        const hasMini = items.some(i => i?.compactLinkRenderer?.serviceEndpoint?.customAction?.action === 'YTTVM_PIP');
                        if (settings.miniPlayerEnabled === true && !hasMini) {
                            items.unshift(navItem('Mini Player', 'Play video in PiP mode', 'YTTVM_PIP', {}, 'CHEVRON_RIGHT', 'CLEAR_COOKIES'));
                        }
                    }
                }

                // ───── commandExecutorCommand iteration ─────
                // YouTube TV wraps button clicks (especially inside modals) in
                // commandExecutorCommand. We must only unroll and intercept if
                // one of the sub-commands is our customAction. Otherwise, pass
                // the batch wholesale to native handlers.
                if (cmd?.commandExecutorCommand?.commands) {
                    const hasCustom = cmd.commandExecutorCommand.commands.some(c => c.customAction);
                    if (hasCustom) {
                        for (const command of cmd.commandExecutorCommand.commands) {
                            if (command.customAction) {
                                inst.resolveCommand.call(this, command);
                            } else {
                                originalResolve.call(this, command);
                            }
                        }
                        return true;
                    }
                }

                return originalResolve.apply(this, arguments);
            };

            inst.resolveCommand._yttvm_patched = true;
        }
    }

    setInterval(patchCommands, 1000);
    getSettings();

})();
