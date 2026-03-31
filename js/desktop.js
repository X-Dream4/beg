function useDesktop(store) {
  const { ref, reactive, computed, shallowRef } = Vue;

  const desktopRef     = ref(null);
  const gridRef        = ref(null);
  const gridAreaRef    = ref(null);
  const dockRef        = ref(null);
  const widgetUnit     = ref(60);

  function calcWidgetUnit() {
    if (gridAreaRef.value)
      widgetUnit.value = gridAreaRef.value.offsetWidth / 5;
  }

  const COLS = 5;
  const ROWS = 6;
  const DOCK_MAX = 5;

  // ===== 网格工具 =====
  function idxToPos(idx) { return { row: Math.floor(idx / COLS), col: idx % COLS }; }
  function posToIdx(row, col) { return row * COLS + col; }

  function getWidgetCells(anchorIdx, w, h) {
    const { row, col } = idxToPos(anchorIdx);
    const cells = [];
    for (let r = row; r < row + h; r++)
      for (let c = col; c < col + w; c++)
        if (r < ROWS && c < COLS) cells.push(posToIdx(r, c));
    return cells;
  }
  function canPlaceWidget(page, anchorIdx, w, h, excludeId) {
    const { row, col } = idxToPos(anchorIdx);
    if (col + w > COLS || row + h > ROWS) return false;
    for (const ci of getWidgetCells(anchorIdx, w, h)) {
      const item = page[ci];
      if (!item) continue;
      if (item.type === 'widget' && item.widgetId === excludeId) continue;
      return false;
    }
    return true;
  }
  function findWidgetAnchor(page, widgetId) {
    return page.findIndex(c => c && c.type === 'widget' && c.widgetId === widgetId && c.isAnchor);
  }
  function removeWidgetFromGrid(page, widgetId) {
    for (let i = 0; i < page.length; i++)
      if (page[i] && page[i].type === 'widget' && page[i].widgetId === widgetId)
        page[i] = null;
  }
  function placeWidgetOnGrid(page, anchorIdx, widgetDef) {
    getWidgetCells(anchorIdx, widgetDef.w, widgetDef.h).forEach((ci, i) => {
      page[ci] = { type:'widget', widgetId:widgetDef.id, isAnchor:i===0, w:widgetDef.w, h:widgetDef.h, html:widgetDef.html, name:widgetDef.name };
    });
  }

  // ===== 拖拽状态（普通对象，不用 reactive，避免响应式开销） =====
  const drag = {
    active:              false,
    src:                 '',
    fromIdx:             -1,
    overIdx:             -1,
    insertIdx:           -1,
    dockFromIdx:         -1,
    dockInsertIdx:       -1,
    dockHoverIdx:        -1,
    overZone:            'none',
    folderChildIdx:      -1,
    widgetId:            null,
    widgetOffX:          0,
    widgetOffY:          0,
    x: 0, y: 0,
    startX: 0, startY: 0,
    moved:               false,
    ghostData:           null,
    draggingWidget:      null,
    mergeTimer:          null,
    mergeTarget:         -1,
    mergeDockTarget:     -1,
    willMergeConfirmed:  false,
    willMergeDockConfirmed: false,
  };

  // 响应式数据只用于模板渲染
  const dragState = reactive({
    active:    false,
    ghostData: null,
    x: 0, y: 0,
    willMergeIdx:     -1,
    willMergeDockIdx: -1,
    overIdx:          -1,
    dockOverIdx:      -1,
    fromIdx:          -1,
    src:              '',
  });

  // 预览（shallowRef 避免深度追踪）
  const previewPage = shallowRef(null);
  const previewDock = shallowRef(null);

  // 幽灵 DOM 元素（原生操作，不走 Vue）
  let ghostEl = null;

  function createGhost(data) {
    if (ghostEl) ghostEl.remove();
    ghostEl = document.createElement('div');
    ghostEl.style.cssText = `
      position:fixed;pointer-events:none;z-index:9999;
      display:flex;flex-direction:column;align-items:center;gap:3px;
      transform:translate(-50%,-50%) scale(1.12);
      filter:drop-shadow(0 8px 20px rgba(0,0,0,0.5));
      transition:none;
    `;
    const iconSize = Math.min(58, Math.max(36, window.innerWidth * 0.075));
    const radius   = Math.min(16, Math.max(9, iconSize * 0.27));
    ghostEl.innerHTML = `
      <div style="width:${iconSize}px;height:${iconSize}px;border-radius:${radius}px;
        background:${data.color};display:flex;align-items:center;justify-content:center;
        box-shadow:0 8px 24px rgba(0,0,0,0.45);position:relative;overflow:hidden;">
        <span style="font-size:${iconSize*0.41}px;font-weight:700;color:#fff;z-index:1">${data.icon}</span>
        <div style="position:absolute;top:0;left:0;right:0;height:50%;
          background:linear-gradient(to bottom,rgba(255,255,255,0.18),transparent);
          border-radius:${radius}px ${radius}px 0 0;pointer-events:none;"></div>
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,0.88);
        text-shadow:0 1px 3px rgba(0,0,0,0.55);white-space:nowrap;
        max-width:60px;overflow:hidden;text-overflow:ellipsis;text-align:center;">
        ${data.name}
      </div>
    `;
    document.body.appendChild(ghostEl);
  }

  function moveGhost(x, y) {
    if (ghostEl) {
      ghostEl.style.left = x + 'px';
      ghostEl.style.top  = y + 'px';
    }
  }

  function removeGhost() {
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
  }

  // ===== 合并判断 =====
  function willMerge(idx) {
    return dragState.willMergeIdx === idx;
  }
  function willMergeDock(di) {
    return dragState.willMergeDockIdx === di;
  }

  // ===== 坐标命中 =====
  function getGridIdxFromPoint(clientX, clientY) {
    if (!gridAreaRef.value) return -1;
    const rect = gridAreaRef.value.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return -1;
    const col = Math.floor((clientX - rect.left) / (rect.width  / COLS));
    const row = Math.floor((clientY - rect.top)  / (rect.height / ROWS));
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return -1;
    return posToIdx(row, col);
  }

  function getDockInsertFromPoint(clientX, clientY) {
    if (!dockRef.value) return -1;
    const rect = dockRef.value.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return -1;
    const items = store.dockApps.filter(Boolean);
    const slotW = rect.width / DOCK_MAX;
    return Math.max(0, Math.min(Math.floor((clientX - rect.left) / slotW), items.length));
  }

  function getDockHoverFromPoint(clientX, clientY) {
    if (!dockRef.value) return -1;
    const cells = dockRef.value.querySelectorAll('.dock-cell');
    for (let i = 0; i < cells.length; i++) {
      const r = cells[i].getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return i;
    }
    return -1;
  }

  function detectZone(clientX, clientY) {
    if (!gridAreaRef.value || !dockRef.value) return 'none';
    const gr = gridAreaRef.value.getBoundingClientRect();
    const dr = dockRef.value.getBoundingClientRect();
    if (clientX >= gr.left && clientX <= gr.right && clientY >= gr.top && clientY <= gr.bottom) return 'grid';
    if (clientX >= dr.left && clientX <= dr.right && clientY >= dr.top && clientY <= dr.bottom) return 'dock';
    return 'none';
  }

  let longPressTimer = null;
  function cancelLongPress() {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  }
  function cancelMergeTimer() {
    if (drag.mergeTimer) { clearTimeout(drag.mergeTimer); drag.mergeTimer = null; }
    drag.mergeTarget           = -1;
    drag.mergeDockTarget       = -1;
    drag.willMergeConfirmed    = false;
    drag.willMergeDockConfirmed= false;
    dragState.willMergeIdx     = -1;
    dragState.willMergeDockIdx = -1;
  }

  // ===== 背景长按 =====
  function onBgMousedown(e) {
    longPressTimer = setTimeout(() => { store.editMode = true; }, 600);
  }
  function onBgTouchstart(e) {
    longPressTimer = setTimeout(() => { store.editMode = true; }, 600);
  }

  // ===== 格子按下 =====
  function onCellMousedown(e, idx) {
    const item = store.desktopPages[store.currentPage]?.[idx];
    if (!item) return;
    drag.startX = e.clientX; drag.startY = e.clientY; drag.moved = false;
    longPressTimer = setTimeout(() => {
      store.editMode = true;
      _startGridDrag(idx, e.clientX, e.clientY);
    }, 500);
  }
  function onCellTouchstart(e, idx) {
    const item = store.desktopPages[store.currentPage]?.[idx];
    if (!item) return;
    const t = e.touches[0];
    drag.startX = t.clientX; drag.startY = t.clientY; drag.moved = false;
    longPressTimer = setTimeout(() => {
      store.editMode = true;
      _startGridDrag(idx, t.clientX, t.clientY);
    }, 500);
  }

  function _startGridDrag(idx, clientX, clientY) {
    const page = store.desktopPages[store.currentPage];
    const item = page?.[idx];
    if (!item) return;
    if (item.type === 'widget') {
      const anchorIdx  = findWidgetAnchor(page, item.widgetId);
      const anchorItem = page[anchorIdx];
      if (!anchorItem) return;
      drag.draggingWidget = { widgetId:item.widgetId, w:anchorItem.w, h:anchorItem.h, html:anchorItem.html, name:anchorItem.name, id:item.widgetId };
      drag.active   = true; drag.src     = 'widget-grid';
      drag.fromIdx  = anchorIdx; drag.overIdx = anchorIdx;
      drag.overZone = 'grid';
      drag.ghostData = { icon: anchorItem.name?.[0]||'W', color:'rgba(30,30,40,0.85)', name:anchorItem.name };
    } else {
      drag.active    = true; drag.src      = 'grid';
      drag.fromIdx   = idx;  drag.overIdx  = idx;
      drag.insertIdx = idx;  drag.overZone = 'grid';
      drag.ghostData = { icon:item.icon, color:item.color, name:item.name };
    }
    drag.x = clientX; drag.y = clientY;
    createGhost(drag.ghostData);
    moveGhost(clientX, clientY);
    dragState.active   = true;
    dragState.src      = drag.src;
    dragState.fromIdx  = drag.fromIdx;
    dragState.ghostData= drag.ghostData;
    previewPage.value  = null;
    previewDock.value  = null;
  }

  // ===== Dock 按下 =====
  function onDockMousedown(e, di) {
    const item = store.dockApps[di];
    if (!item) return;
    drag.startX = e.clientX; drag.startY = e.clientY; drag.moved = false;
    longPressTimer = setTimeout(() => {
      store.editMode = true;
      _startDockDrag(di, e.clientX, e.clientY);
    }, 500);
  }
  function onDockTouchstart(e, di) {
    const item = store.dockApps[di];
    if (!item) return;
    const t = e.touches[0];
    drag.startX = t.clientX; drag.startY = t.clientY; drag.moved = false;
    longPressTimer = setTimeout(() => {
      store.editMode = true;
      _startDockDrag(di, t.clientX, t.clientY);
    }, 500);
  }
  function _startDockDrag(di, clientX, clientY) {
    const item = store.dockApps[di];
    if (!item) return;
    drag.active       = true; drag.src          = 'dock';
    drag.dockFromIdx  = di;   drag.dockInsertIdx= di;
    drag.dockHoverIdx = -1;   drag.overZone     = 'dock';
    drag.ghostData    = { icon:item.icon, color:item.color, name:item.name };
    drag.x = clientX; drag.y = clientY;
    createGhost(drag.ghostData);
    moveGhost(clientX, clientY);
    dragState.active  = true;
    dragState.src     = 'dock';
    previewDock.value = null;
  }
  function onDockEnter(di) {}
  function onDockClick(e, di) {
    if (drag.moved) return;
    if (store.editMode) return;
    const items = store.dockApps.filter(Boolean);
    const item  = items[di];
    if (!item) return;
    if (item.type === 'folder') store.openFolder = item;
    else store.openApp(item);
  }

  // ===== 文件夹内 =====
  function onFolderItemMousedown(e, ci) {
    drag.startX = e.clientX; drag.startY = e.clientY; drag.moved = false;
    longPressTimer = setTimeout(() => { _startFolderDrag(ci, e.clientX, e.clientY); }, 500);
  }
  function onFolderItemTouchstart(e, ci) {
    const t = e.touches[0];
    drag.startX = t.clientX; drag.startY = t.clientY; drag.moved = false;
    longPressTimer = setTimeout(() => { _startFolderDrag(ci, t.clientX, t.clientY); }, 500);
  }
  function _startFolderDrag(ci, clientX, clientY) {
    const folder = store.openFolder;
    if (!folder || !folder.children[ci]) return;
    const item = folder.children[ci];
    drag.active         = true; drag.src            = 'folder';
    drag.folderChildIdx = ci;
    drag.ghostData      = { icon:item.icon, color:item.color, name:item.name };
    drag.x = clientX; drag.y = clientY;
    drag.moved = false;
    createGhost(drag.ghostData);
    moveGhost(clientX, clientY);
    dragState.active = true;
  }
  function onFolderItemClick(child, ci) {
    if (drag.moved) return;
    store.openApp(child);
  }

  // ===== 移动（核心：只操作原生 DOM，最小化 Vue 更新） =====
  function onPointerMove(e) { _handleMove(e.clientX, e.clientY); }
  function onTouchMove(e)   { const t = e.touches[0]; _handleMove(t.clientX, t.clientY); }

  // 节流：每 16ms 处理一次（约 60fps）
  let lastMoveTime = 0;
  function _handleMove(clientX, clientY) {
    if (longPressTimer) {
      const dx = Math.abs(clientX - drag.startX);
      const dy = Math.abs(clientY - drag.startY);
      if (dx > 6 || dy > 6) cancelLongPress();
    }
    if (!drag.active) return;

    // 只移动幽灵DOM，零Vue更新
    moveGhost(clientX, clientY);
    drag.x = clientX;
    drag.y = clientY;
    drag.moved = true;

    // 节流到50ms一次逻辑计算
    const now = Date.now();
    if (now - lastMoveTime < 50) return;
    lastMoveTime = now;

    const zone = detectZone(clientX, clientY);
    if (zone !== 'none') drag.overZone = zone;

    if (drag.src === 'widget-grid') {
      const idx = getGridIdxFromPoint(clientX, clientY);
      if (idx >= 0) drag.overIdx = idx;
      return;
    }

    if (zone === 'grid') {
      const idx = getGridIdxFromPoint(clientX, clientY);
      if (idx >= 0) {
        drag.overIdx       = idx;
        drag.insertIdx     = idx;
        drag.dockInsertIdx = -1;

        const page     = store.desktopPages[store.currentPage];
        const overItem = page[idx];
        let dragIsApp  = false;

        if (drag.src === 'grid') {
          const f = page[drag.fromIdx];
          dragIsApp = !!(f && f.type === 'app' && idx !== drag.fromIdx);
        } else if (drag.src === 'dock') {
          const f = store.dockApps[drag.dockFromIdx];
          dragIsApp = !!(f && f.type === 'app');
        } else if (drag.src === 'folder') {
          dragIsApp = true;
        }

        if (dragIsApp && overItem && overItem.type === 'app') {
          if (drag.mergeTarget !== idx) {
            cancelMergeTimer();
            drag.mergeTarget = idx;
            drag.mergeTimer  = setTimeout(() => {
              drag.willMergeConfirmed = true;
              dragState.willMergeIdx  = idx;
            }, 600);
          }
        } else {
          if (drag.mergeTarget !== -1) cancelMergeTimer();
        }
      }
      drag.dockHoverIdx = -1;
    }

    if (zone === 'dock') {
      cancelMergeTimer();
      const insertIdx  = getDockInsertFromPoint(clientX, clientY);
      const hoverIdx   = getDockHoverFromPoint(clientX, clientY);
      drag.dockInsertIdx = insertIdx;
      drag.dockHoverIdx  = hoverIdx;

      const items    = store.dockApps.filter(Boolean);
      const overItem = hoverIdx >= 0 ? items[hoverIdx] : null;
      let dragIsApp  = false;

      if (drag.src === 'dock') {
        const f = store.dockApps[drag.dockFromIdx];
        dragIsApp = !!(f && f.type === 'app' && hoverIdx !== drag.dockFromIdx);
      } else if (drag.src === 'grid') {
        const f = store.desktopPages[store.currentPage]?.[drag.fromIdx];
        dragIsApp = !!(f && f.type === 'app');
      } else if (drag.src === 'folder') {
        dragIsApp = true;
      }

      if (dragIsApp && overItem && overItem.type === 'app') {
        if (drag.mergeDockTarget !== hoverIdx) {
          cancelMergeTimer();
          drag.mergeDockTarget = hoverIdx;
          drag.mergeTimer = setTimeout(() => {
            drag.willMergeDockConfirmed = true;
            dragState.willMergeDockIdx  = hoverIdx;
          }, 600);
        }
      } else {
        if (drag.mergeDockTarget !== -1) cancelMergeTimer();
      }
    }
  }


  // ===== 抬起 =====
  function onPointerUp() {
    cancelLongPress();
    cancelMergeTimer();
    removeGhost();

    if (!drag.active) { _resetDrag(); return; }

    if (drag.moved) {
      const zone = drag.overZone;
      if (drag.src === 'widget-grid') {
        _dropWidgetOnGrid();
      } else if (drag.src === 'grid') {
        if (zone === 'grid') {
          if (drag.willMergeConfirmed && drag.mergeTarget >= 0)
            _mergeGridToGrid(drag.fromIdx, drag.mergeTarget);
          else if (drag.overIdx >= 0 && drag.overIdx !== drag.fromIdx)
            _insertGridToGrid(drag.fromIdx, drag.overIdx);
        } else if (zone === 'dock') {
          if (drag.willMergeDockConfirmed && drag.mergeDockTarget >= 0)
            _mergeGridToDock(drag.fromIdx, drag.mergeDockTarget);
          else if (drag.dockInsertIdx >= 0)
            _insertGridToDock(drag.fromIdx, drag.dockInsertIdx);
        }
      } else if (drag.src === 'dock') {
        if (zone === 'dock') {
          if (drag.willMergeDockConfirmed && drag.mergeDockTarget >= 0)
            _mergeDockToDock(drag.dockFromIdx, drag.mergeDockTarget);
          else if (drag.dockInsertIdx >= 0)
            _insertDockToDock(drag.dockFromIdx, drag.dockInsertIdx);
        } else if (zone === 'grid') {
          if (drag.willMergeConfirmed && drag.mergeTarget >= 0)
            _mergeDockToGrid(drag.dockFromIdx, drag.mergeTarget);
          else if (drag.overIdx >= 0)
            _insertDockToGrid(drag.dockFromIdx, drag.overIdx);
        }
      } else if (drag.src === 'folder') {
        _dropFromFolder();
      }
    }

    previewPage.value = null;
    previewDock.value = null;
    _resetDrag();
  }

  function _resetDrag() {
    drag.active              = false;
    drag.src                 = '';
    drag.fromIdx             = -1; drag.overIdx          = -1;
    drag.insertIdx           = -1;
    drag.dockFromIdx         = -1; drag.dockInsertIdx    = -1;
    drag.dockHoverIdx        = -1;
    drag.overZone            = 'none';
    drag.folderChildIdx      = -1;
    drag.widgetId            = null;
    drag.moved               = false;
    drag.ghostData           = null;
    drag.draggingWidget      = null;
    drag.mergeTarget         = -1; drag.mergeDockTarget  = -1;
    drag.willMergeConfirmed  = false; drag.willMergeDockConfirmed = false;
    dragState.active         = false;
    dragState.src            = '';
    dragState.fromIdx        = -1;
    dragState.overIdx        = -1;
    dragState.dockOverIdx    = -1;
    dragState.willMergeIdx   = -1;
    dragState.willMergeDockIdx = -1;
    dragState.ghostData      = null;
    lastMoveTime             = 0;
  }

  // ===== 落点处理 =====
  function _dropWidgetOnGrid() {
    const page = store.desktopPages[store.currentPage];
    const dw   = drag.draggingWidget;
    if (!dw) return;
    const toIdx = drag.overIdx;
    if (toIdx < 0) return;
    if (!canPlaceWidget(page, toIdx, dw.w, dw.h, dw.widgetId)) return;
    removeWidgetFromGrid(page, dw.widgetId);
    placeWidgetOnGrid(page, toIdx, dw);
    store.saveData();
  }

  function _insertGridToGrid(fromIdx, toIdx) {
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return;
    const page     = store.desktopPages[store.currentPage];
    const fromItem = page[fromIdx];
    if (!fromItem || fromItem.type === 'widget') return;
    const toItem   = page[toIdx];
    if (toItem && toItem.type === 'widget') return;
    if (!toItem) {
      page[toIdx] = { ...fromItem }; page[fromIdx] = null;
    } else {
      page[toIdx] = { ...fromItem }; page[fromIdx] = { ...toItem };
    }
    store.saveData();
  }

  function _mergeGridToGrid(fromIdx, toIdx) {
    const page     = store.desktopPages[store.currentPage];
    const fromItem = page[fromIdx];
    const toItem   = page[toIdx];
    if (!fromItem || !toItem) return;
    if (toItem.type === 'folder') {
      toItem.children.push({ ...fromItem }); page[fromIdx] = null;
    } else if (toItem.type === 'app' && fromItem.type === 'app') {
      page[toIdx]   = { id:'folder-'+Date.now(), type:'folder', name:'文件夹', children:[{ ...toItem },{ ...fromItem }] };
      page[fromIdx] = null;
    }
    store.saveData();
  }

  function _insertGridToDock(fromIdx, insertIdx) {
    if (fromIdx < 0 || insertIdx < 0) return;
    const page     = store.desktopPages[store.currentPage];
    const fromItem = page[fromIdx];
    if (!fromItem || fromItem.type === 'widget') return;
    const items = store.dockApps.filter(Boolean);
    if (items.length >= DOCK_MAX) return;
    const clamp = Math.max(0, Math.min(insertIdx, items.length));
    items.splice(clamp, 0, { ...fromItem });
    store.dockApps.splice(0, store.dockApps.length, ...items);
    page[fromIdx] = null;
    store.saveData();
  }

  function _mergeGridToDock(fromIdx, dockHoverIdx) {
    const page     = store.desktopPages[store.currentPage];
    const fromItem = page[fromIdx];
    if (!fromItem || fromItem.type !== 'app') return;
    const items  = store.dockApps.filter(Boolean);
    const toItem = items[dockHoverIdx];
    if (!toItem) return;
    if (toItem.type === 'folder') {
      toItem.children.push({ ...fromItem });
    } else if (toItem.type === 'app') {
      items[dockHoverIdx] = { id:'folder-'+Date.now(), type:'folder', name:'文件夹', children:[{ ...toItem },{ ...fromItem }] };
    }
    store.dockApps.splice(0, store.dockApps.length, ...items);
    page[fromIdx] = null;
    store.saveData();
  }

  function _insertDockToDock(fromDockIdx, insertIdx) {
    if (fromDockIdx < 0 || insertIdx < 0) return;
    const items = store.dockApps.filter(Boolean).map(i => ({ ...i }));
    const item  = items[fromDockIdx];
    if (!item) return;
    items.splice(fromDockIdx, 1);
    const clamp = Math.max(0, Math.min(insertIdx, items.length));
    items.splice(clamp, 0, item);
    store.dockApps.splice(0, store.dockApps.length, ...items);
    store.saveData();
  }

  function _mergeDockToDock(fromDockIdx, hoverIdx) {
    const items    = store.dockApps.filter(Boolean).map(i => ({ ...i }));
    const fromItem = items[fromDockIdx];
    const toItem   = items[hoverIdx];
    if (!fromItem || !toItem) return;
    if (toItem.type === 'folder') {
      toItem.children.push({ ...fromItem }); items.splice(fromDockIdx, 1);
    } else if (toItem.type === 'app' && fromItem.type === 'app') {
      items[hoverIdx] = { id:'folder-'+Date.now(), type:'folder', name:'文件夹', children:[{ ...toItem },{ ...fromItem }] };
      items.splice(fromDockIdx, 1);
    }
    store.dockApps.splice(0, store.dockApps.length, ...items);
    store.saveData();
  }

  function _insertDockToGrid(fromDockIdx, toIdx) {
    if (fromDockIdx < 0 || toIdx < 0) return;
    const items    = store.dockApps.filter(Boolean);
    const fromItem = items[fromDockIdx];
    if (!fromItem) return;
    const page   = store.desktopPages[store.currentPage];
    const toItem = page[toIdx];
    if (!toItem) {
      page[toIdx] = { ...fromItem };
    } else if (toItem.type === 'widget') {
      const emptyIdx = page.findIndex(c => !c);
      if (emptyIdx >= 0) page[emptyIdx] = { ...fromItem }; else return;
    } else {
      page[toIdx] = { ...fromItem };
      const emptyIdx = page.findIndex((c, i) => !c && i !== toIdx);
      if (emptyIdx >= 0) page[emptyIdx] = { ...toItem };
    }
    items.splice(fromDockIdx, 1);
    store.dockApps.splice(0, store.dockApps.length, ...items);
    store.saveData();
  }

  function _mergeDockToGrid(fromDockIdx, toIdx) {
    const items    = store.dockApps.filter(Boolean);
    const fromItem = items[fromDockIdx];
    if (!fromItem || fromItem.type !== 'app') return;
    const page   = store.desktopPages[store.currentPage];
    const toItem = page[toIdx];
    if (!toItem) return;
    if (toItem.type === 'folder') {
      toItem.children.push({ ...fromItem });
    } else if (toItem.type === 'app') {
      page[toIdx] = { id:'folder-'+Date.now(), type:'folder', name:'文件夹', children:[{ ...toItem },{ ...fromItem }] };
    }
    items.splice(fromDockIdx, 1);
    store.dockApps.splice(0, store.dockApps.length, ...items);
    store.saveData();
  }

  function _dropFromFolder() {
    const folder = store.openFolder;
    if (!folder) return;
    const ci   = drag.folderChildIdx;
    const item = folder.children?.[ci];
    if (!item) return;
    folder.children.splice(ci, 1);

    const zone = drag.overZone;
    const page = store.desktopPages[store.currentPage];

    if (zone === 'dock') {
      const items = store.dockApps.filter(Boolean);
      if (drag.willMergeDockConfirmed && drag.mergeDockTarget >= 0) {
        const toItem = items[drag.mergeDockTarget];
        if (toItem && toItem.type === 'folder') toItem.children.push({ ...item });
        else if (toItem && toItem.type === 'app' && item.type === 'app')
          items[drag.mergeDockTarget] = { id:'folder-'+Date.now(), type:'folder', name:'文件夹', children:[{ ...toItem },{ ...item }] };
      } else if (items.length < DOCK_MAX && drag.dockInsertIdx >= 0) {
        const clamp = Math.max(0, Math.min(drag.dockInsertIdx, items.length));
        items.splice(clamp, 0, { ...item });
      } else {
        const emptyIdx = page.findIndex(c => !c);
        if (emptyIdx >= 0) page[emptyIdx] = { ...item };
      }
      store.dockApps.splice(0, store.dockApps.length, ...items);
    } else {
      if (drag.willMergeConfirmed && drag.mergeTarget >= 0) {
        const toItem = page[drag.mergeTarget];
        if (toItem && toItem.type === 'folder') toItem.children.push({ ...item });
        else if (toItem && toItem.type === 'app' && item.type === 'app')
          page[drag.mergeTarget] = { id:'folder-'+Date.now(), type:'folder', name:'文件夹', children:[{ ...toItem },{ ...item }] };
      } else {
        const toIdx  = drag.overIdx;
        const toItem = toIdx >= 0 ? page[toIdx] : null;
        if (toIdx >= 0 && !toItem) page[toIdx] = { ...item };
        else { const ei = page.findIndex(c => !c); if (ei >= 0) page[ei] = { ...item }; }
      }
    }

    if (folder.children.length === 1) {
      const last = { ...folder.children[0] };
      const fi2  = page.findIndex(c => c && c.type === 'folder' && c.id === folder.id);
      if (fi2 >= 0) page[fi2] = last;
      else {
        const items2 = store.dockApps.filter(Boolean);
        const dfi    = items2.findIndex(c => c && c.type === 'folder' && c.id === folder.id);
        if (dfi >= 0) { items2[dfi] = last; store.dockApps.splice(0, store.dockApps.length, ...items2); }
      }
      store.openFolder = null;
    }
    if (folder.children.length === 0) {
      const fi2 = page.findIndex(c => c && c.type === 'folder' && c.id === folder.id);
      if (fi2 >= 0) page[fi2] = null;
      else {
        const items2 = store.dockApps.filter(Boolean);
        const dfi    = items2.findIndex(c => c && c.type === 'folder' && c.id === folder.id);
        if (dfi >= 0) { items2.splice(dfi, 1); store.dockApps.splice(0, store.dockApps.length, ...items2); }
      }
      store.openFolder = null;
    }
    store.saveData();
  }

  function buildGridPreview(fromIdx, toIdx) {
    const page = store.desktopPages[store.currentPage];
    if (!page) return null;
    const clone    =     page.map(i => i ? { ...i } : null);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return clone;
    const fromItem = clone[fromIdx];
    const toItem   = clone[toIdx];
    if (!fromItem || fromItem.type === 'widget') return clone;
    if (toItem && toItem.type === 'widget') return clone;
    if (!toItem) {
      clone[toIdx]   = { ...fromItem };
      clone[fromIdx] = null;
    } else {
      clone[toIdx]   = { ...fromItem };
      clone[fromIdx] = { ...toItem };
    }
    return clone;
  }

  function buildDockPreview(src, fromDockIdx, fromGridIdx, insertIdx) {
    const da = store.dockApps.filter(Boolean).map(i => ({ ...i }));
    if (src === 'dock' && fromDockIdx >= 0) da.splice(fromDockIdx, 1);
    let dragItem = null;
    if (src === 'dock')   dragItem = store.dockApps[fromDockIdx];
    else if (src === 'grid')   dragItem = store.desktopPages[store.currentPage]?.[fromGridIdx];
    else if (src === 'folder') dragItem = store.openFolder?.children[drag.folderChildIdx];
    if (!dragItem || dragItem.type === 'widget') return da;
    const clamp = Math.max(0, Math.min(insertIdx, da.length));
    da.splice(clamp, 0, { ...dragItem, _preview: true });
    return da;
  }

  function onCellEnter(idx) {
    if (!drag.active) return;
    drag.overIdx  = idx;
    drag.overZone = 'grid';
  }

  function addWidgetToGrid(widgetDef) {
    const page = store.desktopPages[store.currentPage];
    for (let i = 0; i < COLS * ROWS; i++) {
      if (canPlaceWidget(page, i, widgetDef.w, widgetDef.h, null)) {
        placeWidgetOnGrid(page, i, { ...widgetDef });
        store.saveData();
        return true;
      }
    }
    return false;
  }

  function deleteWidgetFromGrid(widgetId) {
    const page = store.desktopPages[store.currentPage];
    removeWidgetFromGrid(page, widgetId);
    store.saveData();
  }

  return {
    desktopRef, gridRef, gridAreaRef, dockRef,
    widgetUnit, calcWidgetUnit,
    drag: dragState,
    previewPage, previewDock,
    willMerge, willMergeDock,
    cancelLongPress,
    onBgMousedown, onBgTouchstart,
    onCellMousedown, onCellTouchstart, onCellEnter,
    onDockMousedown, onDockTouchstart, onDockEnter, onDockClick,
    onFolderItemMousedown, onFolderItemTouchstart, onFolderItemClick,
    onPointerMove, onTouchMove, onPointerUp,
    addWidgetToGrid, deleteWidgetFromGrid,
    getWidgetCells, findWidgetAnchor,
  };
}

