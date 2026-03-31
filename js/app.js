const { createApp, ref, computed, reactive, onMounted, nextTick } = Vue;

createApp({
  setup() {
    // 状态栏时间
    const sbTime = ref('');
    function updateSbTime() {
      try {
        const d = new Date();
        sbTime.value = d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
      } catch(e) {}
    }
    updateSbTime();
    setInterval(updateSbTime, 10000);

    const now = ref(new Date());
    setInterval(() => { now.value = new Date(); }, 1000);

    // 数据
    const dbReady           = ref(false);
    const desktopPages      = ref([]);
    const dockApps          = ref([]);
    const currentPage     = ref(0);
    const settings          = ref({ ...DEFAULT_SETTINGS });
    const wechatUsers       = ref([]);
    const editMode          = ref(false);
    const openFolder        = ref(null);
    const     importedWidgetDefs = ref([]);

    const currentPageItems = computed(() => {
      const page = desktopPages.value[currentPage.value];
      if (!page) return Array(30).fill(null);
      const arr = [];
      for (let i = 0; i < 30; i++) arr.push(page[i] ?? null);
      return arr;
    });

    // ===== 气泡菜单 =====
    const bubbleMenu = reactive({
      show: false,
      x: 0, y: 0,
      arrowDir: 'up',
      idx: -1,
      src: '',
      itemName: '',
      appKey: '',
    });

    const bubbleMenuStyle = computed(() => ({
      left: bubbleMenu.x + 'px',
      top:  bubbleMenu.y + 'px',
    }));

    function showBubble(e, item, idx, src) {
      const desktop = document.querySelector('.desktop');
      if (!desktop) return;
      const dr = desktop.getBoundingClientRect();
      const tr = e.currentTarget.getBoundingClientRect();
      const menuW = 148, menuH = 190;
      let x = tr.left - dr.left + tr.width / 2 - menuW / 2;
      let y = tr.top  - dr.top  - menuH - 10;
      let arrowDir = 'down';
      if (y < 10) { y = tr.bottom - dr.top + 10; arrowDir = 'up'; }
      x = Math.max(6, Math.min(x, dr.width - menuW - 6));
      bubbleMenu.show     = true;
      bubbleMenu.x        = x;
      bubbleMenu.y        = y;
      bubbleMenu.arrowDir = arrowDir;
      bubbleMenu.idx      = idx;
      bubbleMenu.src      = src;
      bubbleMenu.itemName = item.name || '';
      bubbleMenu.appKey   = item.appKey || '';
    }

    function bubbleRename() {
      bubbleMenu.show = false;
      let item = null;
      if (bubbleMenu.src === 'grid')
        item = desktopPages.value[currentPage.value]?.[bubbleMenu.idx];
      else if (bubbleMenu.src === 'dock')
        item = dockApps.value[bubbleMenu.idx];
      if (!item || item.type === 'widget') return;
      const name = prompt('重命名', item.name);
      if (name && name.trim()) { item.name = name.trim(); saveData(); }
    }
    function bubbleAddWidget() {
      bubbleMenu.show       = false;
      widgetPanelShow.value = true;
    }
    function bubbleEditDesktop() {
      bubbleMenu.show = false;
      editMode.value  = true;
    }
    function bubbleUninstall() {
      bubbleMenu.show = false;
      if (bubbleMenu.src === 'grid') deleteItem(bubbleMenu.idx);
      else if (bubbleMenu.src === 'dock') deleteDockItem(bubbleMenu.idx);
    }

    function deleteItem(idx) {
      const page = desktopPages.value[currentPage.value];
      if (!page) return;
      const item = page[idx];
      if (!item) return;
      if (item.type === 'widget') {
        desktopHelper.deleteWidgetFromGrid(item.widgetId);
      } else {
        page[idx] = null;
        saveData();
      }
    }

    function deleteDockItem(di) {
      if (di < 0 || di >= dockApps.value.length) return;
      dockApps.value[di] = null;
      dockApps.value = dockApps.value.filter(Boolean);
      saveData();
    }

    // ===== 小组件面板 =====
    const widgetPanelShow  = ref(false);
    const showImportInput  = ref(false);
    const widgetImportJson = ref('');
    const widgetImportErr  = ref('');

    const currentBubbleAppWidgets = computed(() => {
      if (!bubbleMenu.appKey) return [];
      return APP_WIDGETS[bubbleMenu.appKey] || [];
    });

    function addWidgetFromPanel(def) {
      const ok = desktopHelper.addWidgetToGrid(def);
      if (!ok) {
        alert('桌面空间不足，请先移除一些 App 或小组件');
        return;
      }
      widgetPanelShow.value = false;
      showImportInput.value = false;
    }

    function confirmImportWidget() {
      widgetImportErr.value = '';
      try {
        const obj = JSON.parse(widgetImportJson.value.trim());
        if (!obj.html) throw new Error('缺少 html 字段');
        const def = {
          id:   obj.id   || ('imported-' + Date.now()),
          name: obj.name || '自定义小组件',
          w:    Math.max(1, Math.min(5, parseInt(obj.w) || 2)),
          h:    Math.max(1, Math.min(6, parseInt(obj.h) || 2)),
          html: obj.html,
        };
        const existing = importedWidgetDefs.value.findIndex(d => d.id === def.id);
        if (existing >= 0) importedWidgetDefs.value[existing] = def;
        else importedWidgetDefs.value.push(def);
        addWidgetFromPanel(def);
        widgetImportJson.value = '';
        showImportInput.value  = false;
        saveData();
      } catch(e) {
        widgetImportErr.value = '格式错误：' + e.message;
      }
    }

    // ===== 点击格子 =====
    function onCellClick(e, idx) {
      if (desktopHelper.drag.moved) return;
      if (desktopHelper.drag.active) return;
      if (bubbleMenu.show) { bubbleMenu.show = false; return; }
      if (editMode.value) return;
      const item = currentPageItems.value[idx];
      if (!item) return;
      if (item.type === 'widget') return;
      if (item.type === 'folder') openFolder.value = item;
      else openApp(item);
    }

    // ===== 长按气泡 =====
    function onCellLongPress(e, idx) {
      desktopHelper.cancelLongPress();
      const item = desktopPages.value[currentPage.value]?.[idx];
      if (!item) return;
      if (item.type === 'widget' && !item.isAnchor) return;
      showBubble(e, item, idx, 'grid');
    }
    function onDockLongPress(e, di) {
      desktopHelper.cancelLongPress();
      const item = dockApps.value[di];
      if (!item) return;
      showBubble(e, item, di, 'dock');
    }

    function openApp(app) {
      openFolder.value = null;
      if (app.appKey === 'settings') {
        settingsHelper.openSettings();
        return;
      }
      console.log('open:', app.appKey);
    }

    function closeAll() {
      bubbleMenu.show = false;
      if (editMode.value) editMode.value = false;
    }

    function onHomeClick() {
      bubbleMenu.show               = false;
      openFolder.value              = null;
      editMode.value                = false;
      widgetPanelShow.value         = false;
      showImportInput.value         = false;
      if (desktopHelper.drag) desktopHelper.drag.active = false;
      if (settingsHelper.settingsOpen.value) settingsHelper.closeSettings();
    }

    // ===== 持久化 =====
    async function saveData() {
      try {
        await Promise.all([
          DB.set('desktopPages',       JSON.parse(JSON.stringify(desktopPages.value))),
          DB.set('dockApps',           JSON.parse(JSON.stringify(dockApps.value))),
          DB.set('settings',           JSON.parse(JSON.stringify(settings.value))),
          DB.set('wechatUsers',        JSON.parse(JSON.stringify(wechatUsers.value))),
          DB.set('importedWidgetDefs', JSON.parse(JSON.stringify(importedWidgetDefs.value))),
        ]);
      } catch(e) {
        console.warn('saveData error:', e);
      }
    }

    async function loadData() {
      const [dp, da, st, wu, iwd] = await Promise.all([
        DB.get('desktopPages'),
        DB.get('dockApps'),
        DB.get('settings'),
        DB.get('wechatUsers'),
        DB.get('importedWidgetDefs'),
      ]);

      if (dp) {
        desktopPages.value = dp;
      } else {
        const page0 = [];
        for (let i = 0; i < 30; i++)
          page0.push(DEFAULT_APPS[i] ? { ...DEFAULT_APPS[i] } : null);
        desktopPages.value = [page0];
        // 默认加入时间小组件到第0格起始
        const timeDef = SYSTEM_WIDGETS[0];
        _placeDefaultWidget(desktopPages.value[0], timeDef);
      }

      dockApps.value           = da  || DEFAULT_DOCK.map(a => ({ ...a }));
      settings.value           = st  ? { ...DEFAULT_SETTINGS, ...st } : { ...DEFAULT_SETTINGS };
      wechatUsers.value        = wu  || DEFAULT_WECHAT_USERS.map(u => ({ ...u, messages:[] }));
      importedWidgetDefs.value = iwd || [];
      dbReady.value            = true;

      await nextTick();
      desktopHelper.calcWidgetUnit();
      settingsHelper.loadSettingsData();
    }

    function _placeDefaultWidget(page, def) {
      // 从第15格（第3行第0列）开始尝试放时间小组件
      const startIdx = 0;
      for (let i = startIdx; i < 30; i++) {
        if (_canPlace(page, i, def.w, def.h)) {
          _doPlace(page, i, def);
          return;
        }
      }
    }

    function _canPlace(page, anchorIdx, w, h) {
      const COLS = 5;
      const row = Math.floor(anchorIdx / COLS);
      const col = anchorIdx % COLS;
      if (col + w > COLS) return false;
      if (row + h > 6)    return false;
      for (let r = row; r < row + h; r++) {
        for (let c = col; c < col + w; c++) {
          if (page[r * COLS + c]) return false;
        }
      }
      return true;
    }

    function _doPlace(page, anchorIdx, def) {
      const COLS = 5;
      const row = Math.floor(anchorIdx / COLS);
      const col = anchorIdx % COLS;
      let first = true;
      for (let r = row; r < row + def.h; r++) {
        for (let c = col; c < col + def.w; c++) {
          page[r * COLS + c] = {
            type:     'widget',
            widgetId: def.id,
            isAnchor: first,
            w:        def.w,
            h:        def.h,
            html:     def.html,
            name:     def.name,
          };
          first = false;
        }
      }
    }

    // ===== store =====
    const store = {
      get desktopPages()  { return desktopPages.value; },
      get currentPage()   { return currentPage.value; },
      get editMode()      { return editMode.value; },
      set editMode(v)     { editMode.value = v; },
      get openFolder()    { return openFolder.value; },
      set openFolder(v)   { openFolder.value = v; },
      get settings()      { return settings.value; },
      get wechatUsers()   { return wechatUsers.value; },
      get dockApps()      { return dockApps.value; },
      openApp,
      saveData,
      clearAll() {
        const page0 = [];
        for (let i = 0; i < 30; i++)
          page0.push(DEFAULT_APPS[i] ? { ...DEFAULT_APPS[i] } : null);
        desktopPages.value       = [page0];
        _placeDefaultWidget(desktopPages.value[0], SYSTEM_WIDGETS[0]);
        dockApps.value           = DEFAULT_DOCK.map(a => ({ ...a }));
        settings.value           = { ...DEFAULT_SETTINGS };
        wechatUsers.value        = DEFAULT_WECHAT_USERS.map(u => ({ ...u, messages:[] }));
        importedWidgetDefs.value = [];
        saveData();
      },
    };

    const desktopHelper = useDesktop(store);
    const settingsHelper = useSettings(store);
    // 供设置页图标预览使用
    const desktopAppsFlat = computed(() => {
      const page = desktopPages.value[currentPage.value] || [];
      return page.filter(i => i && i.type === 'app');
    });

    onMounted(() => {
      loadData().catch(err => {
        console.warn('DB failed:', err);
        const page0 = [];
        for (let i = 0; i < 30; i++)
          page0.push(DEFAULT_APPS[i] ? { ...DEFAULT_APPS[i] } : null);
        desktopPages.value       = [page0];
        _placeDefaultWidget(desktopPages.value[0], SYSTEM_WIDGETS[0]);
        dockApps.value           = DEFAULT_DOCK.map(a => ({ ...a }));
        settings.value           = { ...DEFAULT_SETTINGS };
        wechatUsers.value        = DEFAULT_WECHAT_USERS.map(u => ({ ...u, messages:[] }));
        importedWidgetDefs.value = [];
        dbReady.value            = true;
      });
    });

    return {
      sbTime,
      dbReady, desktopPages, dockApps,
      currentPage, currentPageItems,
      settings, editMode, openFolder, wechatUsers,
      bubbleMenu, bubbleMenuStyle,
      bubbleRename, bubbleAddWidget, bubbleEditDesktop, bubbleUninstall,
      widgetPanelShow, showImportInput,
      widgetImportJson, widgetImportErr,
      importedWidgetDefs,
      currentBubbleAppWidgets,
      systemWidgets: SYSTEM_WIDGETS,
      addWidgetFromPanel, confirmImportWidget,
      deleteItem, deleteDockItem,
      closeAll, onHomeClick, saveData,
      openApp, onCellClick, onCellLongPress, onDockLongPress, desktopAppsFlat,
      ...desktopHelper,
      ...settingsHelper,
    };
  }
}).mount('#app');

