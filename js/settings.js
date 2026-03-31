function useSettings(store) {
  const { ref, reactive, computed } = Vue;

  const pageStack   = ref(['main']);
  const currentPage = computed(() => pageStack.value[pageStack.value.length - 1]);
  const settingsOpen = ref(false);

  function openSettings() { pageStack.value = ['main']; settingsOpen.value = true; }
  function closeSettings() { settingsOpen.value = false; pageStack.value = ['main']; closeAllModals(); }
  function pushPage(p) { pageStack.value.push(p); }
  function popPage()   { if (pageStack.value.length > 1) pageStack.value.pop(); else closeSettings(); }

  // ===== 搜索 =====
  const searchQuery = ref('');
  const searchResults = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();
    if (!q) return [];
    const items = [
      { label:'壁纸',    page:'persona' },
      { label:'字体',    page:'persona-font' },
      { label:'图标',    page:'persona-icon' },
      { label:'API设置', page:'api' },
      { label:'账号信息',page:'account-info' },
      { label:'昵称',    page:'account-info' },
      { label:'头像',    page:'account-info' },
    ];
    return items.filter(i => i.label.toLowerCase().includes(q));
  });

  // ===== 账号 =====
  const accountUser = reactive({
    name:'用户', id:'oppo_'+Math.random().toString(36).slice(2,8),
    avatarColor:'#007aff', avatarImg:'',
    gender:'', phone:'', email:'', emergency:'',
  });
  const avatarModalShow  = ref(false);
  const avatarUrlInput   = ref('');
  const nicknameModalShow= ref(false);
  const nicknameInput    = ref('');

  function openAvatarModal()  { avatarModalShow.value = true; avatarUrlInput.value = ''; }
  function closeAvatarModal() { avatarModalShow.value = false; }
  function confirmAvatar() {
    if (avatarUrlInput.value.trim()) accountUser.avatarImg = avatarUrlInput.value.trim();
    avatarModalShow.value = false; saveSettings();
  }
  function onAvatarFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { accountUser.avatarImg = ev.target.result; avatarModalShow.value = false; saveSettings(); };
    reader.readAsDataURL(file);
  }
  function openNicknameModal() { nicknameInput.value = accountUser.name; nicknameModalShow.value = true; }
  function confirmNickname() {
    if (nicknameInput.value.trim()) { accountUser.name = nicknameInput.value.trim(); saveSettings(); }
    nicknameModalShow.value = false;
  }

  // ===== API =====
  const apiModel       = ref('');
  const fetchedModels  = ref([]);
  const modelListShow  = ref(false);
  const fetchingModels = ref(false);
  const fetchModelErr  = ref('');
  const apiPresets     = ref([]);
  const presetNameShow = ref(false);
  const presetNameInput= ref('');

  async function fetchModels() {
    fetchingModels.value = true; fetchModelErr.value = ''; fetchedModels.value = [];
    try {
      const base = store.settings.apiBaseUrl || 'https://api.openai.com';
      const res  = await fetch(base + '/v1/models', {
        headers: { 'Authorization': 'Bearer ' + store.settings.apiKey },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      fetchedModels.value = (json.data || []).map(m => m.id);
      modelListShow.value = true;
    } catch(e) { fetchModelErr.value = '拉取失败：' + e.message; }
    finally    { fetchingModels.value = false; }
  }
  function selectModel(m) {
    apiModel.value = m; store.settings.apiModel = m;
    modelListShow.value = false; saveSettings();
  }
  function openSavePreset() { presetNameInput.value = ''; presetNameShow.value = true; }
  function savePreset() {
    if (!presetNameInput.value.trim()) return;
    apiPresets.value.push({
      id: Date.now(), name: presetNameInput.value.trim(),
      provider: store.settings.apiProvider, key: store.settings.apiKey,
      baseUrl: store.settings.apiBaseUrl,   model: apiModel.value,
    });
    presetNameShow.value = false; saveSettings();
  }
  function loadPreset(p) {
    store.settings.apiProvider = p.provider; store.settings.apiKey     = p.key;
    store.settings.apiBaseUrl  = p.baseUrl;  store.settings.apiModel   = p.model;
    apiModel.value = p.model; saveSettings();
  }
  function deletePreset(id) { apiPresets.value = apiPresets.value.filter(p => p.id !== id); saveSettings(); }

  // ===== 壁纸 =====
  const customWallpapers = ref([]);
  const wpModalShow      = ref(false);
  const wpUrlInput       = ref('');

  function openWpModal()  { wpModalShow.value = true; wpUrlInput.value = ''; }
  function closeWpModal() { wpModalShow.value = false; }
  function selectWallpaper(wp) { store.settings.wallpaper = wp; saveSettings(); }
  function confirmWpUrl() {
    if (wpUrlInput.value.trim()) {
      const id = 'custom-' + Date.now();
      customWallpapers.value.push({ id, src: wpUrlInput.value.trim() });
      store.settings.wallpaper = id; saveSettings();
    }
    wpModalShow.value = false;
  }
  function onWpFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const id = 'custom-' + Date.now();
      customWallpapers.value.push({ id, src: ev.target.result });
      store.settings.wallpaper = id; wpModalShow.value = false; saveSettings();
    };
    reader.readAsDataURL(file);
  }

  // ===== 图标替换 =====
  const iconEditShow   = ref(false);
  const iconEditTarget = ref(null); // { id, name, color, icon }
  const iconUrlInput   = ref('');
  // 存储自定义图标 { appId: { type:'img'|'text', value } }
  const customIcons    = ref({});

  function openIconEdit(app) {
    iconEditTarget.value = { ...app };
    iconUrlInput.value   = '';
    iconEditShow.value   = true;
  }
  function closeIconEdit() { iconEditShow.value = false; }
  function confirmIconUrl() {
    if (!iconEditTarget.value) return;
    if (iconUrlInput.value.trim()) {
      customIcons.value[iconEditTarget.value.id] = { type:'img', value: iconUrlInput.value.trim() };
      saveSettings();
    }
    iconEditShow.value = false;
  }
  function onIconFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (!iconEditTarget.value) return;
      customIcons.value[iconEditTarget.value.id] = { type:'img', value: ev.target.result };
      iconEditShow.value = false; saveSettings();
    };
    reader.readAsDataURL(file);
  }

  // ===== 字体 =====
  const fontPresets        = ref([]);
  const currentFont        = ref('system');
  const fontUrlInput       = ref('');
  const fontPresetNameInput= ref('');

  function onFontFileChange(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const fontName = 'custom-' + Date.now();
      const style    = document.createElement('style');
      style.textContent = `@font-face{font-family:'${fontName}';src:url('${ev.target.result}');}`;
      document.head.appendChild(style);
      fontPresets.value.push({ id: fontName, name: file.name, src: ev.target.result });
      currentFont.value = fontName; applyFont(fontName); saveSettings();
    };
    reader.readAsDataURL(file);
  }
  function onFontUrlChange() {
    const url = fontUrlInput.value.trim(); if (!url) return;
    const fontName = 'custom-url-' + Date.now();
    const style    = document.createElement('style');
    style.textContent = `@font-face{font-family:'${fontName}';src:url('${url}');}`;
    document.head.appendChild(style);
    fontPresets.value.push({ id: fontName, name: url.split('/').pop(), src: url });
    currentFont.value = fontName; applyFont(fontName);
    fontUrlInput.value = ''; saveSettings();
  }
  function selectFont(id) { currentFont.value = id; applyFont(id); saveSettings(); }
  function applyFont(id) {
    document.getElementById('app').style.fontFamily = id === 'system' ? '' : `'${id}',sans-serif`;
  }
  function deleteFontPreset(id) {
    fontPresets.value = fontPresets.value.filter(f => f.id !== id);
    if (currentFont.value === id) { currentFont.value = 'system'; applyFont('system'); }
    saveSettings();
  }

  // ===== 全屏 & 夜间模式 =====
  const fullscreenMode = ref(false);
  const darkMode       = ref(false);

  function toggleFullscreen(val) {
    fullscreenMode.value = val;
    applyFullscreen(val);
    saveSettings();
  }
  function toggleDarkMode(val) {
    darkMode.value = val;
    applyDarkMode(val);
    saveSettings();
  }
  function applyFullscreen(val) {
    const shell  = document.querySelector('.phone-shell');
    const screen = document.querySelector('.phone-screen');
    if (!shell) return;
    if (val) {
      shell.style.width        = '100vw';
      shell.style.height       = '100vh';
      shell.style.borderRadius = '0';
      shell.style.boxShadow    = 'none';
      document.querySelectorAll('.key').forEach(k => { k.style.display = 'none'; });
      if (screen) screen.style.borderRadius = '0';
      document.querySelector('.phone-screen')?.classList.add('fullscreen-mode');
    } else {
      shell.style.width        = '';
      shell.style.height       = '';
      shell.style.borderRadius = '';
      shell.style.boxShadow    = '';
      document.querySelectorAll('.key').forEach(k => { k.style.display = ''; });
      if (screen) screen.style.borderRadius = '';
      document.querySelector('.phone-screen')?.classList.remove('fullscreen-mode');
    }
  }

  function applyDarkMode(val) {
    const app = document.getElementById('app');
    if (val) app.setAttribute('data-dark', '1');
    else     app.removeAttribute('data-dark');
  }

  // ===== 关闭所有弹窗 =====
  function closeAllModals() {
    avatarModalShow.value  = false;
    nicknameModalShow.value= false;
    wpModalShow.value      = false;
    modelListShow.value    = false;
    presetNameShow.value   = false;
    iconEditShow.value     = false;
  }

  // ===== 持久化 =====
  function saveSettings() {
    store.settings.accountUser      = JSON.parse(JSON.stringify(accountUser));
    store.settings.apiPresets       = JSON.parse(JSON.stringify(apiPresets.value));
    store.settings.customWallpapers = JSON.parse(JSON.stringify(customWallpapers.value));
    store.settings.fontPresets      = JSON.parse(JSON.stringify(fontPresets.value));
    store.settings.currentFont      = currentFont.value;
    store.settings.apiModel         = apiModel.value;
    store.settings.customIcons      = JSON.parse(JSON.stringify(customIcons.value));
    store.settings.fullscreenMode   = fullscreenMode.value;
    store.settings.darkMode         = darkMode.value;
    store.saveData();
  }
  function loadSettingsData() {
    const s = store.settings;
    if (s.accountUser)      Object.assign(accountUser, s.accountUser);
    if (s.apiPresets)       apiPresets.value       = s.apiPresets;
    if (s.customWallpapers) customWallpapers.value = s.customWallpapers;
    if (s.fontPresets)      fontPresets.value      = s.fontPresets;
    if (s.currentFont)      { currentFont.value    = s.currentFont; applyFont(s.currentFont); }
    if (s.apiModel)         apiModel.value         = s.apiModel;
    if (s.customIcons)      customIcons.value      = s.customIcons;
    if (s.fullscreenMode)   { fullscreenMode.value = s.fullscreenMode; applyFullscreen(s.fullscreenMode); }
    if (s.darkMode)         { darkMode.value       = s.darkMode;       applyDarkMode(s.darkMode); }
  }

  function clearAllData() {
    if (!confirm('确定清除所有数据？此操作不可恢复。')) return;
    store.clearAll();
  }

  return {
    settingsOpen, currentPage, pageStack,
    openSettings, closeSettings, pushPage, popPage,
    searchQuery, searchResults,
    accountUser,
    avatarModalShow, avatarUrlInput,
    nicknameModalShow, nicknameInput,
    openAvatarModal, closeAvatarModal, confirmAvatar,
    onAvatarFileChange, openNicknameModal, confirmNickname,
    apiModel, fetchedModels, modelListShow, fetchingModels, fetchModelErr,
    fetchModels, selectModel,
    apiPresets, presetNameShow, presetNameInput,
    openSavePreset, savePreset, loadPreset, deletePreset,
    customWallpapers, wpModalShow, wpUrlInput,
    openWpModal, closeWpModal, selectWallpaper, confirmWpUrl, onWpFileChange,
    iconEditShow, iconEditTarget, iconUrlInput, customIcons,
    openIconEdit, closeIconEdit, confirmIconUrl, onIconFileChange,
    fontPresets, currentFont, fontUrlInput, fontPresetNameInput,
    onFontFileChange, onFontUrlChange, selectFont, deleteFontPreset,
    fullscreenMode, darkMode, toggleFullscreen, toggleDarkMode,
    loadSettingsData, saveSettings, clearAllData,
  };
}
