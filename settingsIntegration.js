// YouTube TV Settings Integration — native UI menus + command resolver
(function () {
  'use strict';

  const ns = window.__yttvm;
  if (!ns) return;

  let sidebarDirty = false;
  let lastPlaybackSettingsCmd = null;

  const SIDEBAR_ITEMS = ns.SIDEBAR_ITEMS || [];
  const QUALITY_OPTIONS = ns.QUALITY_OPTIONS || [];
  const SPONSOR_CATEGORIES = ns.SPONSOR_CATEGORIES || [];

  const settings = () => ns.settings?.cache || {};

  const saveSettings = (partial) => ns.settings?.set(partial);

  const resolveCommand = (cmd) => {
    for (const key in window._yttv || {}) {
      const inst = window._yttv[key]?.instance;
      if (inst?.resolveCommand) return inst.resolveCommand(cmd);
    }
  };

  const toggleItem = (title, subtitle, checked, key, parentMenu) => ({
    compactLinkRenderer: {
      title: { simpleText: title },
      subtitle: subtitle ? { simpleText: subtitle } : undefined,
      secondaryIcon: { iconType: checked ? 'CHECK_BOX' : 'CHECK_BOX_OUTLINE_BLANK' },
      serviceEndpoint: {
        customAction: { action: 'YTTVM_TOGGLE_SETTING', parameters: { key, parentMenu } }
      }
    }
  });

  const navItem = (
    title,
    subtitle,
    action,
    parameters,
    secondaryIcon = 'CHEVRON_RIGHT',
    icon = null
  ) => ({
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
                        subtitle: header.subtitle
                          ? { simpleText: header.subtitle }
                          : undefined
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

  function openSpeedPicker() {
    const s = settings();
    const currentSpeed = s.playbackSpeed || 1.0;
    const increment = s.speedIncrement || 0.25;
    const maxSpeed = 5;
    let selectedIndex = 0;
    const buttons = [];

    for (let speed = increment; speed <= maxSpeed; speed += increment) {
      const fixedSpeed = Math.round(speed * 100) / 100;
      const active = Math.abs(currentSpeed - fixedSpeed) < 0.001;
      buttons.push(
        navItem(`${fixedSpeed}×`, active ? '▶  Current' : null, 'YTTVM_SET_SPEED', {
          speed: fixedSpeed
        }, null)
      );
      if (active) selectedIndex = buttons.length - 1;
    }

    const stutterActive = Math.abs(currentSpeed - 1.0001) < 0.00001;
    buttons.push(
      navItem(
        'Fix Stuttering  (1.0001×)',
        stutterActive ? '▶  Current' : null,
        'YTTVM_SET_SPEED',
        { speed: 1.0001 },
        null
      )
    );

    showModal(
      { title: 'Playback Speed', subtitle: `Current: ${currentSpeed}×` },
      { overlayPanelItemListRenderer: { items: buttons, selectedIndex } },
      'yttvm_speed',
      false
    );
  }

  function qualityLabel() {
    const id = settings().preferredVideoQuality || 'highres';
    return QUALITY_OPTIONS.find((q) => q.id === id)?.label || id;
  }

  // Settings menu injection via unified JSON interceptor
  ns.json?.register(
    'settingsMenu',
    (result) => {
      if (!result?.title?.runs?.some((run) => run.text === 'Settings')) return result;

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
          items: [],
          categoryId: 'yttvm_youtube_settings',
          title: { runs: [{ text: 'YouTube Settings' }] }
        }
      };
      const spacerCategory = {
        settingCategoryCollectionRenderer: {
          items: [],
          categoryId: 'yttvm_spacer',
          title: { runs: [{ text: '   ' }] }
        }
      };

      if (
        result.items &&
        !result.items.some(
          (i) => i.settingCategoryCollectionRenderer?.categoryId === 'yttvm_category'
        )
      ) {
        result.items.unshift(youtubeSettingsCategory);
        result.items.unshift(spacerCategory);
        result.items.unshift(extensionCategory);
      }
      return result;
    },
    5
  );

  function openMainSettings(isUpdate) {
    const s = settings();
    const inc = s.speedIncrement || 0.25;
    const disabledCount = (s.disabledSidebarContents || []).length;
    const items = [
      navItem('Speed Controls', `Increment: ${inc}×`, 'YTTVM_OPEN_SPEED_SETTINGS', {}),
      navItem('Video Quality', qualityLabel(), 'YTTVM_OPEN_QUALITY_SETTINGS', {}),
      navItem('SponsorBlock', s.sponsorBlockEnabled ? 'On' : 'Off', 'YTTVM_OPEN_SPONSOR_SETTINGS', {}),
      toggleItem(
        'Ad Blocker',
        'Block video ads & home screen ads',
        s.adBlockEnabled !== false,
        'adBlockEnabled'
      ),
      toggleItem(
        'Hide Paid Promotions',
        'Remove paid content overlay',
        s.hidePaidPromotion !== false,
        'hidePaidPromotion'
      ),
      toggleItem(
        'Hide End Screens',
        'Remove end-screen cards',
        s.hideEndScreenCards === true,
        'hideEndScreenCards'
      ),
      toggleItem(
        'Force Preferred Quality',
        'Apply selected resolution',
        s.forceResolutionEnabled !== false,
        'forceResolutionEnabled'
      ),
      toggleItem(
        'Auto Fullscreen',
        'Enter fullscreen on load',
        s.autoFullscreenEnabled !== false,
        'autoFullscreenEnabled'
      ),
      toggleItem(
        'Background Playback',
        'Play while tab/window is in background',
        s.backgroundPlaybackEnabled !== false,
        'backgroundPlaybackEnabled'
      ),
      toggleItem(
        'Leanback Mode',
        'Hide cursor & disable mouse',
        s.leanbackModeEnabled === true,
        'leanbackModeEnabled'
      ),
      toggleItem(
        'High Quality Thumbnails',
        'Force max-resolution thumbnails',
        s.highQualityThumbnailsEnabled !== false,
        'highQualityThumbnailsEnabled'
      ),
      toggleItem(
        'Key Remapping',
        'Backspace→Back, Space→Enter',
        s.keyRemappingEnabled !== false,
        'keyRemappingEnabled'
      ),
      toggleItem(
        'Mini Player',
        'Show PiP option in player menu',
        s.miniPlayerEnabled === true,
        'miniPlayerEnabled'
      ),
      navItem(
        'Hide Sidebar Contents',
        `${disabledCount} hidden`,
        'YTTVM_OPEN_SIDEBAR_SETTINGS',
        {}
      ),
      toggleItem(
        'Debug Logging',
        'Verbose console logs',
        s.debugLogging === true,
        'debugLogging'
      )
    ];
    items.sort((a, b) => {
      const titleA = a.compactLinkRenderer?.title?.simpleText || '';
      const titleB = b.compactLinkRenderer?.title?.simpleText || '';
      return titleA.localeCompare(titleB);
    });
    showModal(
      { title: 'YouTube TV Mode', subtitle: `v${ns.version || '1.1.0'} · Configure Features` },
      { overlayPanelItemListRenderer: { items, selectedIndex: 0 } },
      'yttvm_settings',
      isUpdate
    );
  }

  function patchCommands() {
    for (const key in window._yttv || {}) {
      const inst = window._yttv[key]?.instance;
      if (!inst?.resolveCommand || inst.resolveCommand._yttvm_patched) continue;

      const originalResolve = inst.resolveCommand;

      inst.resolveCommand = function (cmd) {
        const ca =
          cmd?.customAction ||
          cmd?.signalAction?.customAction ||
          cmd?.showEngagementPanelEndpoint?.customAction ||
          cmd?.playlistEditEndpoint?.customAction ||
          null;

        if (ca) {
          const { action, parameters } = ca;
          const s = settings();

          if (action === 'YTTVM_OPEN_SETTINGS') {
            openMainSettings(parameters === true);
            return true;
          }

          if (action === 'YTTVM_TOGGLE_SETTING') {
            const k = parameters.key;

            // SponsorBlock category keys: sb_cat_<id>
            if (typeof k === 'string' && k.startsWith('sb_cat_')) {
              const catId = k.slice('sb_cat_'.length);
              const cats = [...(s.sponsorBlockCategories || ns.DEFAULTS.sponsorBlockCategories || [])];
              const idx = cats.indexOf(catId);
              if (idx >= 0) cats.splice(idx, 1);
              else cats.push(catId);
              saveSettings({ sponsorBlockCategories: cats });
              resolveCommand({
                customAction: { action: 'YTTVM_OPEN_SPONSOR_SETTINGS', parameters: true }
              });
              return true;
            }

            const current = ns.resolveBool(k, s);
            saveSettings({ [k]: !current });
            const parentMenu = parameters.parentMenu || 'YTTVM_OPEN_SETTINGS';
            resolveCommand({ customAction: { action: parentMenu, parameters: true } });
            return true;
          }

          if (action === 'YTTVM_OPEN_SPEED_SETTINGS') {
            const inc = s.speedIncrement || 0.25;
            const items = [
              toggleItem(
                'Enable Speed Controls',
                'Show speed button in player menu',
                s.playbackSpeedEnabled !== false,
                'playbackSpeedEnabled',
                'YTTVM_OPEN_SPEED_SETTINGS'
              ),
              navItem('Speed Increment', `Current: ${inc}×`, 'YTTVM_OPEN_SPEED_INCREMENT', {})
            ];
            showModal(
              { title: 'Speed Controls', subtitle: 'Configure playback speed options' },
              { overlayPanelItemListRenderer: { items, selectedIndex: 0 } },
              'yttvm_speed_settings',
              parameters === true
            );
            return true;
          }

          if (action === 'YTTVM_OPEN_SPEED_INCREMENT') {
            const currentInc = s.speedIncrement || 0.25;
            const increments = [];
            let selectedIndex = 0;
            for (let v = 0.05; v <= 0.5; v += 0.05) {
              const fixed = Math.round(v * 100) / 100;
              const active = Math.abs(currentInc - fixed) < 0.001;
              increments.push(
                navItem(
                  `${fixed}×`,
                  active ? '▶  Current' : null,
                  'YTTVM_SET_SPEED_INCREMENT',
                  { value: fixed },
                  null
                )
              );
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

          if (action === 'YTTVM_SET_SPEED_INCREMENT') {
            const value = parseFloat(parameters.value) || 0.25;
            saveSettings({ speedIncrement: value });
            setTimeout(() => window.location.reload(), 300);
            return true;
          }

          if (action === 'YTTVM_OPEN_SPEED') {
            openSpeedPicker();
            return true;
          }

          if (action === 'YTTVM_SET_SPEED') {
            const speed = parseFloat(parameters.speed) || 1.0;
            const video = document.querySelector('video');
            if (video) video.playbackRate = speed;
            saveSettings({ playbackSpeed: speed });
            resolveCommand({ signalAction: { signal: 'POPUP_BACK' } });
            if (lastPlaybackSettingsCmd) {
              setTimeout(() => {
                const refresh = ns.json
                  ? ns.json.rawParse(JSON.stringify(lastPlaybackSettingsCmd))
                  : JSON.parse(JSON.stringify(lastPlaybackSettingsCmd));
                refresh.openPopupAction.updateAction = true;
                refresh.openPopupAction.shouldMatchUniqueId = true;
                resolveCommand(refresh);
              }, 50);
            }
            return true;
          }

          if (action === 'YTTVM_OPEN_QUALITY_SETTINGS') {
            const current = s.preferredVideoQuality || 'highres';
            let selectedIndex = 0;
            const items = QUALITY_OPTIONS.map((opt, idx) => {
              const active = opt.id === current;
              if (active) selectedIndex = idx;
              return navItem(
                opt.label,
                active ? '▶  Current' : null,
                'YTTVM_SET_QUALITY',
                { value: opt.id },
                null
              );
            });
            showModal(
              { title: 'Video Quality', subtitle: 'Preferred playback quality' },
              { overlayPanelItemListRenderer: { items, selectedIndex } },
              'yttvm_quality',
              parameters === true
            );
            return true;
          }

          if (action === 'YTTVM_SET_QUALITY') {
            saveSettings({ preferredVideoQuality: parameters.value || 'highres' });
            resolveCommand({
              customAction: { action: 'YTTVM_OPEN_QUALITY_SETTINGS', parameters: true }
            });
            return true;
          }

          if (action === 'YTTVM_OPEN_SPONSOR_SETTINGS') {
            const cats = s.sponsorBlockCategories || ns.DEFAULTS.sponsorBlockCategories || [];
            const items = [
              toggleItem(
                'Enable SponsorBlock',
                'Skip community-submitted segments',
                s.sponsorBlockEnabled === true,
                'sponsorBlockEnabled',
                'YTTVM_OPEN_SPONSOR_SETTINGS'
              ),
              ...SPONSOR_CATEGORIES.map((cat) =>
                toggleItem(
                  cat.label,
                  `Category: ${cat.id}`,
                  cats.includes(cat.id),
                  `sb_cat_${cat.id}`,
                  'YTTVM_OPEN_SPONSOR_SETTINGS'
                )
              )
            ];
            showModal(
              { title: 'SponsorBlock', subtitle: 'Powered by sponsor.ajay.app' },
              { overlayPanelItemListRenderer: { items, selectedIndex: 0 } },
              'yttvm_sponsor',
              parameters === true
            );
            return true;
          }

          if (action === 'YTTVM_PIP') {
            resolveCommand({ signalAction: { signal: 'POPUP_BACK' } });
            document
              .querySelector('video')
              ?.requestPictureInPicture()
              .catch((e) => ns.warn?.('PiP failed', e));
            return true;
          }

          if (action === 'YTTVM_OPEN_SIDEBAR_SETTINGS') {
            const disabled = s.disabledSidebarContents || [];
            const items = SIDEBAR_ITEMS.map((item) => ({
              compactLinkRenderer: {
                title: { simpleText: item.name },
                secondaryIcon: {
                  iconType: disabled.includes(item.icon)
                    ? 'CHECK_BOX'
                    : 'CHECK_BOX_OUTLINE_BLANK'
                },
                serviceEndpoint: {
                  customAction: {
                    action: 'YTTVM_TOGGLE_SIDEBAR_ITEM',
                    parameters: { icon: item.icon }
                  }
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

          if (action === 'YTTVM_TOGGLE_SIDEBAR_ITEM') {
            const icon = parameters.icon;
            const disabled = [...(s.disabledSidebarContents || [])];
            const idx = disabled.indexOf(icon);
            if (idx >= 0) disabled.splice(idx, 1);
            else disabled.push(icon);
            saveSettings({ disabledSidebarContents: disabled });
            sidebarDirty = true;
            resolveCommand({
              customAction: { action: 'YTTVM_OPEN_SIDEBAR_SETTINGS', parameters: true }
            });
            return true;
          }
        }

        if (cmd?.signalAction?.signal === 'POPUP_BACK' && sidebarDirty) {
          sidebarDirty = false;
          originalResolve.apply(this, arguments);
          setTimeout(() => window.location.reload(), 300);
          return true;
        }

        if (cmd?.openPopupAction?.uniqueId === 'playback-settings') {
          lastPlaybackSettingsCmd = ns.json
            ? ns.json.rawParse(JSON.stringify(cmd))
            : JSON.parse(JSON.stringify(cmd));

          const items =
            cmd.openPopupAction.popup?.overlaySectionRenderer?.overlay
              ?.overlayTwoPanelRenderer?.actionPanel?.overlayPanelRenderer?.content
              ?.overlayPanelItemListRenderer?.items;

          if (items) {
            const s = settings();
            if (s.playbackSpeedEnabled !== false) {
              for (let i = 0; i < items.length; i++) {
                const item = items[i]?.compactLinkRenderer;
                if (item?.icon?.iconType === 'SLOW_MOTION_VIDEO') {
                  const spd = s.playbackSpeed || 1.0;
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

            const hasMini = items.some(
              (i) =>
                i?.compactLinkRenderer?.serviceEndpoint?.customAction?.action === 'YTTVM_PIP'
            );
            if (s.miniPlayerEnabled === true && !hasMini) {
              items.unshift(
                navItem(
                  'Mini Player',
                  'Play video in PiP mode',
                  'YTTVM_PIP',
                  {},
                  'CHEVRON_RIGHT',
                  'CLEAR_COOKIES'
                )
              );
            }
          }
        }

        if (cmd?.commandExecutorCommand?.commands) {
          const hasCustom = cmd.commandExecutorCommand.commands.some((c) => c.customAction);
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

  // Backoff patching instead of fixed 1s forever
  let delay = 200;
  let found = false;
  function schedulePatch() {
    patchCommands();
    let any = false;
    for (const key in window._yttv || {}) {
      if (window._yttv[key]?.instance?.resolveCommand?._yttvm_patched) any = true;
    }
    if (any) {
      found = true;
      delay = 4000;
    } else {
      delay = found ? 5000 : Math.min(delay * 1.4, 2000);
    }
    setTimeout(schedulePatch, delay);
  }
  schedulePatch();

  ns.log?.('settingsIntegration ready');
})();
