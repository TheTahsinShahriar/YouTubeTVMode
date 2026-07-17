// Ad Blocker — JSON middleware (stronger filters, settings-aware)
(() => {
  'use strict';

  const ns = window.__yttvm;
  if (!ns?.json) return;

  function filterShelfContents(contents) {
    if (!Array.isArray(contents)) return contents;
    return contents
      .filter((elm) => !elm.adSlotRenderer)
      .map((shelf) => {
        const items = shelf.shelfRenderer?.content?.horizontalListRenderer?.items;
        if (items) {
          shelf.shelfRenderer.content.horizontalListRenderer.items = items.filter(
            (item) => !item.adSlotRenderer
          );
        }
        return shelf;
      });
  }

  function stripAds(obj) {
    const adOn = ns.settings?.isEnabled('adBlockEnabled');

    if (adOn) {
      if (obj.adPlacements) obj.adPlacements = [];
      if (obj.playerAds) obj.playerAds = false;
      if (obj.adSlots) obj.adSlots = [];

      if (obj.playerResponse) {
        if (obj.playerResponse.adPlacements) obj.playerResponse.adPlacements = [];
        if (obj.playerResponse.playerAds) obj.playerResponse.playerAds = false;
        if (obj.playerResponse.adSlots) obj.playerResponse.adSlots = [];
      }

      if (!Array.isArray(obj) && obj.entries) {
        obj.entries = obj.entries.filter(
          (elm) => !elm?.command?.reelWatchEndpoint?.adClientParams?.isAd
        );
      }
    }

    if (ns.settings?.isEnabled('hidePaidPromotion') && obj.paidContentOverlay) {
      obj.paidContentOverlay = null;
    }

    if (ns.settings?.isEnabled('hideEndScreenCards') && obj.endscreen) {
      obj.endscreen = null;
    }

    if (Array.isArray(obj.messages) && ns.settings?.isEnabled('hideSigninReminder')) {
      obj.messages = obj.messages.filter((msg) => !msg?.youThereRenderer);
    }

    const homePath =
      obj?.contents?.tvBrowseRenderer?.content?.tvSurfaceContentRenderer?.content
        ?.sectionListRenderer;

    if (homePath?.contents) {
      let contents = homePath.contents;

      if (ns.settings?.isEnabled('hideSigninReminder')) {
        contents = contents.filter((elm) => !elm.feedNudgeRenderer);
      }

      if (adOn) {
        contents = filterShelfContents(contents);
      }

      homePath.contents = contents;
    }

    if (adOn) {
      if (obj?.contents?.sectionListRenderer?.contents) {
        obj.contents.sectionListRenderer.contents = filterShelfContents(
          obj.contents.sectionListRenderer.contents
        );
      }
      if (obj?.continuationContents?.sectionListContinuation?.contents) {
        obj.continuationContents.sectionListContinuation.contents = filterShelfContents(
          obj.continuationContents.sectionListContinuation.contents
        );
      }
    }

    return obj;
  }

  ns.json.register('adblock', stripAds, 10);
  ns.log?.('adblock registered');
})();
