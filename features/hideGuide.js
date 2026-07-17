// Hide Guide — sidebar filtering via JSON middleware
(() => {
  'use strict';

  const ns = window.__yttvm;
  if (!ns?.json) return;

  ns.json.register(
    'hideGuide',
    (obj) => {
      const disabled = ns.settings?.getArray('disabledSidebarContents') || [];
      if (!disabled.length || !obj?.items || !Array.isArray(obj.items)) return obj;

      for (let i = 0; i < obj.items.length; i++) {
        const section = obj.items[i]?.guideSectionRenderer;
        if (!section?.items) continue;
        for (let j = 0; j < section.items.length; j++) {
          const item = section.items[j]?.guideEntryRenderer;
          if (!item) continue;
          if (disabled.includes(item.icon?.iconType)) {
            section.items.splice(j, 1);
            j--;
          }
        }
      }
      return obj;
    },
    20
  );

  ns.log?.('hideGuide registered');
})();
