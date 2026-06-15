const STORAGE_KEY = "family-home-page-v1";
const NOTIFY_KEY = "family-home-page-notified-v1";
const REMINDER_ENABLED_KEY = "family-home-page-reminder-enabled-v1";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = loadData();

const elements = {
  searchInput: $("#searchInput"),
  alertPanel: $("#alertPanel"),
  fridgeForm: $("#fridgeForm"),
  clothesForm: $("#clothesForm"),
  dateForm: $("#dateForm"),
  storageForm: $("#storageForm"),
  restockForm: $("#restockForm"),
  fridgeList: $("#fridgeList"),
  clothesList: $("#clothesList"),
  dateList: $("#dateList"),
  storageList: $("#storageList"),
  restockList: $("#restockList"),
  clothesPhotoInput: $("#clothesPhotoInput"),
  storagePhotoInput: $("#storagePhotoInput"),
  clothesPhotoPreview: $("#clothesPhotoPreview"),
  storagePhotoPreview: $("#storagePhotoPreview"),
  imageDialog: $("#imageDialog"),
  dialogImage: $("#dialogImage"),
  dialogCaption: $("#dialogCaption"),
};

init();

function init() {
  document.body.dataset.activeTab = $(".tab-button.active")?.dataset.tab || "fridge";
  registerServiceWorker();
  bindImageFallbacks();
  bindTabs();
  bindForms();
  bindButtons();
  bindPhotoPreview(elements.clothesPhotoInput, elements.clothesPhotoPreview);
  bindPhotoPreview(elements.storagePhotoInput, elements.storagePhotoPreview);
  ensureFridgeExperience();
  useRealFridgeImages();
  useRealClosetImages();
  updateReminderButton();
  render();
  checkBrowserNotifications(false);
}

function ensureFridgeExperience() {
  const stage = $(".photo-fridge-button .fridge-photo-stage");
  if (stage && !$(".fridge-closed-art", stage)) {
    stage.insertAdjacentHTML(
      "beforeend",
      `
        <div class="fridge-closed-art" aria-hidden="true">
          <span class="fridge-ear fridge-ear-left"></span>
          <span class="fridge-ear fridge-ear-right"></span>
          <div class="fridge-face">
            <span class="fridge-eye fridge-eye-left"></span>
            <span class="fridge-eye fridge-eye-right"></span>
            <span class="fridge-nose"></span>
            <span class="fridge-smile"></span>
          </div>
          <span class="fridge-door-line"></span>
          <span class="fridge-handle fridge-handle-left"></span>
          <span class="fridge-handle fridge-handle-right"></span>
          <span class="fridge-drawer-egg"></span>
          <span class="fridge-foot fridge-foot-left"></span>
          <span class="fridge-foot fridge-foot-right"></span>
        </div>
        <div class="fridge-live-layout" aria-hidden="true">
          <div class="fridge-open-shell">
            <div class="fridge-live-top">
              <span>保鲜区</span>
              <b id="fridgeLiveCount">0/80</b>
            </div>
            <div class="fridge-live-shelves" id="fridgePreviewGrid"></div>
          </div>
        </div>
      `
    );
  }

  const visual = $("#tab-fridge .scene-visual");
  if (visual && !$(".fridge-action-bar", visual)) {
    visual.insertAdjacentHTML(
      "beforeend",
      `
        <div class="fridge-action-bar">
          <button class="fridge-add-button" type="button" data-fridge-add>+ 添加食材</button>
          <button class="fridge-organize-button" type="button" data-fridge-organize>整理冰箱</button>
        </div>
      `
    );
  }

  const scene = $(".fridge-scene");
  if (scene && !$(".fridge-dashboard", scene)) {
    scene.insertAdjacentHTML(
      "beforeend",
      `
        <aside class="fridge-dashboard" aria-label="冰箱功能面板">
          <section class="fridge-widget fridge-overview-card">
            <div class="fridge-widget-title">
              <button class="fridge-panel-title" type="button" data-fridge-add>我的冰箱</button>
              <button class="fridge-icon-button" type="button" data-fridge-add aria-label="添加食材">✎</button>
            </div>
            <div class="fridge-capacity">
              <b id="fridgeOverviewCapacity">0/80</b>
              <span id="fridgeOverviewPercent">0%</span>
            </div>
            <div class="fridge-progress"><i id="fridgeOverviewBar"></i></div>
            <dl class="fridge-stats">
              <div><dt>物品总数</dt><dd><span id="fridgeOverviewTotal">0</span> 个</dd></div>
              <div><dt>快过期（3天内）</dt><dd><span id="fridgeOverviewSoon">0</span> 件</dd></div>
              <div><dt>已过期</dt><dd><span id="fridgeOverviewExpired">0</span> 件</dd></div>
              <div><dt>剩余空间</dt><dd><span id="fridgeOverviewSpace">80</span> 格</dd></div>
            </dl>
          </section>
          <section class="fridge-widget">
            <div class="fridge-widget-title">
              <span>今日提醒</span>
              <button class="fridge-icon-button" type="button" data-fridge-organize aria-label="整理冰箱">›</button>
            </div>
            <div class="fridge-today-list" id="fridgeTodayList"></div>
          </section>
          <section class="fridge-widget fridge-tip-card">
            <div class="fridge-widget-title">
              <span>冰箱小贴士</span>
              <i aria-hidden="true">🐾</i>
            </div>
            <p id="fridgeTipText">添加食材后，这里会自动给出整理建议。</p>
          </section>
        </aside>
      `
    );
  }
}

function useRealFridgeImages() {
  const scene = $(".fridge-scene");
  const stage = $(".photo-fridge-button .fridge-photo-stage");
  if (stage && stage.dataset.realFridgeReady !== "true") {
    stage.removeAttribute("aria-hidden");
    stage.dataset.realFridgeReady = "true";
    stage.innerHTML = `
      <div class="fridge-image-stack">
        <img class="fridge-photo fridge-photo-closed" src="assets/main/fridge-closed.jpg" alt="" loading="eager" />
        <img class="fridge-photo fridge-photo-open" src="assets/main/fridge-open.jpg" alt="" loading="eager" />
        <div class="fridge-food-overlay" id="fridgePreviewGrid" aria-label="冰箱里的食材"></div>
      </div>
    `;
  }

  const visual = $("#tab-fridge .scene-visual");
  let actionBar = scene ? $(".fridge-action-bar", scene) : null;
  if (!actionBar && visual) actionBar = $(".fridge-action-bar", visual);
  if (scene && actionBar && actionBar.parentElement !== scene) {
    scene.appendChild(actionBar);
  }
  if (actionBar) {
    actionBar.innerHTML = `
      <button class="fridge-add-button" type="button" data-fridge-add>+ 添加食材</button>
      <button class="fridge-organize-button" type="button" data-fridge-organize>整理冰箱</button>
    `;
  }

  $$(".fridge-image-hotspots").forEach((node) => node.remove());

  const dashboard = $(".fridge-dashboard");
  if (dashboard && dashboard.dataset.realFridgeDashboard !== "true") {
    dashboard.dataset.realFridgeDashboard = "true";
    dashboard.innerHTML = `
      <section class="fridge-widget fridge-overview-card">
        <div class="fridge-widget-title">
          <button class="fridge-panel-title" type="button" data-fridge-overview>我的冰箱</button>
          <button class="fridge-icon-button" type="button" data-fridge-add aria-label="添加食材">✎</button>
        </div>
        <div class="fridge-capacity">
          <b id="fridgeOverviewCapacity">0/80</b>
          <span id="fridgeOverviewPercent">0%</span>
        </div>
        <div class="fridge-progress"><i id="fridgeOverviewBar"></i></div>
        <dl class="fridge-stats">
          <div><dt>物品总数</dt><dd><span id="fridgeOverviewTotal">0</span> 个</dd></div>
          <div><dt>快过期（3天内）</dt><dd><span id="fridgeOverviewSoon">0</span> 件</dd></div>
          <div><dt>已过期</dt><dd><span id="fridgeOverviewExpired">0</span> 件</dd></div>
          <div><dt>剩余空间</dt><dd><span id="fridgeOverviewSpace">80</span> 格</dd></div>
        </dl>
      </section>
      <section class="fridge-widget fridge-today-card">
        <div class="fridge-widget-title">
          <button class="fridge-panel-title" type="button" data-fridge-today>今日提醒</button>
          <button class="fridge-icon-button" type="button" data-fridge-organize aria-label="整理冰箱">›</button>
        </div>
        <div class="fridge-today-list" id="fridgeTodayList"></div>
      </section>
      <section class="fridge-widget fridge-tip-card">
        <div class="fridge-widget-title">
          <button class="fridge-panel-title" type="button" data-fridge-tip>冰箱小贴士</button>
          <i aria-hidden="true">🐾</i>
        </div>
        <p id="fridgeTipText">添加食材后，这里会自动给出整理建议。</p>
      </section>
    `;
  }
}

function useRealClosetImages() {
  const stage = $(".photo-closet-button .closet-photo-stage");
  if (stage && stage.dataset.realClosetReady !== "true") {
    stage.removeAttribute("aria-hidden");
    stage.dataset.realClosetReady = "true";
    stage.innerHTML = `
      <img class="closet-photo closet-photo-closed" src="assets/main/closet-closed.jpg" alt="" loading="eager" />
      <img class="closet-photo closet-photo-open" src="assets/main/closet-open.jpg" alt="" loading="eager" />
    `;
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(window.location.protocol)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });

  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "sw-updated") {
      const refresh = document.createElement("div");
      refresh.style.cssText =
        "position:fixed;bottom:80px;left:50%;z-index:999;transform:translateX(-50%);padding:10px 20px;border-radius:8px;background:#8b5cf6;color:#fff;font-weight:700;box-shadow:0 12px 30px rgba(124,58,237,0.3);cursor:pointer;";
      refresh.textContent = "有新版本，点击刷新";
      refresh.addEventListener("click", () => window.location.reload());
      document.body.appendChild(refresh);
      window.setTimeout(() => refresh.remove(), 15000);
    }
  });
}

function bindImageFallbacks() {
  $$(".qisi-corner").forEach((image) => {
    image.addEventListener("error", () => {
      const fallbackSrc = image.dataset.fallbackSrc;
      if (fallbackSrc && image.src.indexOf(fallbackSrc) === -1) {
        image.src = fallbackSrc;
        image.dataset.fallbackSrc = "";
        return;
      }
      image.classList.add("image-missing");
      const fallback = $(".qisi-fallback");
      if (fallback) fallback.classList.add("show");
    });
  });
}

function bindTabs() {
  $$(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.remove("opening");
      void button.offsetWidth;
      button.classList.add("opening");
      window.setTimeout(() => button.classList.remove("opening"), 720);
      setActiveTab(button.dataset.tab, true);
    });
  });
}

function bindForms() {
  elements.fridgeForm.addEventListener("submit", handleFridgeSubmit);
  elements.clothesForm.addEventListener("submit", handleClothesSubmit);
  elements.dateForm.addEventListener("submit", handleDateSubmit);
  elements.storageForm.addEventListener("submit", handleStorageSubmit);
  elements.restockForm.addEventListener("submit", handleRestockSubmit);
  elements.searchInput.addEventListener("input", render);
}

function bindButtons() {
  $("#clearFridgeForm").addEventListener("click", () => resetAndShowMain("fridge", resetFridgeForm));
  $("#clearClothesForm").addEventListener("click", () => resetAndShowMain("clothes", resetClothesForm));
  $("#clearDateForm").addEventListener("click", () => resetAndShowMain("dates", resetDateForm));
  $("#clearStorageForm").addEventListener("click", () => resetAndShowMain("storage", resetStorageForm));
  $("#clearRestockForm").addEventListener("click", () => resetAndShowMain("restock", resetRestockForm));
  $("#exportClothesImageButton").addEventListener("click", exportClothesImage);
  $("#exportCalendarButton").addEventListener("click", exportCalendarFile);
  $("#notifyButton").addEventListener("click", toggleNotifications);
  $("#closeImageDialog").addEventListener("click", closeImageDialog);

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-kind]");
    const deleteButton = event.target.closest("[data-delete-kind]");
    const photoButton = event.target.closest("[data-open-photo]");
    const storedItemButton = event.target.closest("[data-open-kind]");
    const photoTrigger = event.target.closest("[data-photo-trigger]");
    const furnitureButton = event.target.closest("[data-furniture]");
    const restockPreset = event.target.closest("[data-restock-preset]");
    const fridgeAddButton = event.target.closest("[data-fridge-add]");
    const fridgeOrganizeButton = event.target.closest("[data-fridge-organize]");
    const fridgePanelButton = event.target.closest("[data-fridge-overview], [data-fridge-today], [data-fridge-tip]");

    if (editButton) {
      editItem(editButton.dataset.editKind, editButton.dataset.id);
      return;
    }

    if (deleteButton) {
      handleDeleteButton(deleteButton);
      return;
    }

    if (fridgeAddButton) {
      focusFridgeForm();
      return;
    }

    if (fridgeOrganizeButton) {
      organizeFridge();
      return;
    }

    if (fridgePanelButton) {
      if (fridgePanelButton.hasAttribute("data-fridge-today")) {
        openFridgePanel("today");
      } else if (fridgePanelButton.hasAttribute("data-fridge-tip")) {
        openFridgePanel("tip");
      } else {
        openFridgePanel("overview");
      }
      return;
    }

    if (furnitureButton) {
      toggleFurnitureDoor(furnitureButton);
      return;
    }

    if (photoTrigger) {
      openPhotoPicker(photoTrigger);
      return;
    }

    if (restockPreset) {
      fillRestockPreset(restockPreset);
      return;
    }

    if (storedItemButton) {
      openStoredItem(storedItemButton.dataset.openKind, storedItemButton.dataset.id);
      return;
    }

    if (photoButton) {
      openImageDialog(photoButton.dataset.openPhoto, photoButton.dataset.caption || "照片");
      return;
    }
  });

  elements.imageDialog.addEventListener("click", (event) => {
    if (event.target === elements.imageDialog) closeImageDialog();
  });

  document.addEventListener("keydown", (event) => {
    const card = event.target.closest(".fridge-food-card[data-edit-kind]");
    if (!card || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    editItem(card.dataset.editKind, card.dataset.id);
  });
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return normalizeData(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

function emptyData() {
  return {
    fridge: [],
    clothes: [],
    dates: [],
    storage: [],
    restock: [],
  };
}

function normalizeData(value) {
  const data = value && value.data ? value.data : value;
  return {
    fridge: Array.isArray(data?.fridge) ? data.fridge : [],
    clothes: Array.isArray(data?.clothes) ? data.clothes : [],
    dates: Array.isArray(data?.dates) ? data.dates : [],
    storage: Array.isArray(data?.storage) ? data.storage : [],
    restock: Array.isArray(data?.restock) ? data.restock : [],
  };
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    alert("保存失败：浏览器本地空间可能满了。可以删除一些照片后继续使用。");
    return false;
  }
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanText(value) {
  return String(value || "").trim();
}

function getFormData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") data[key] = cleanText(data[key]);
  });
  return data;
}

function upsert(kind, item) {
  const now = new Date().toISOString();
  const list = state[kind];
  const existingIndex = list.findIndex((entry) => entry.id === item.id);
  const previous = existingIndex >= 0 ? list[existingIndex] : null;
  const next = {
    ...previous,
    ...item,
    id: item.id || uid(),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    list[existingIndex] = next;
  } else {
    list.unshift(next);
  }
}

function setActiveTab(tabName, shouldScroll = false) {
  document.body.dataset.activeTab = tabName;
  $$(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  $$(".tab-section").forEach((section) => {
    section.classList.toggle("active", section.id === `tab-${tabName}`);
  });

  if (shouldScroll) {
    window.setTimeout(() => focusMainVisual(tabName), 80);
  }
}

function focusMainVisual(tabName) {
  const activeSection = $(`#tab-${tabName}`);
  if (!activeSection) return;
  const target = $(".scene-visual", activeSection) || activeSection;
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeSceneFurniture(tabName) {
  const activeSection = $(`#tab-${tabName}`);
  if (!activeSection) return;
  $$("[data-furniture]", activeSection).forEach((button) => {
    if (button.classList.contains("door-open")) toggleFurnitureDoor(button);
  });
}

function resetAndShowMain(tabName, resetter) {
  resetter();
  closeSceneFurniture(tabName);
  focusMainVisual(tabName);
}

function handleFridgeSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.fridgeForm);
  upsert("fridge", {
    ...data,
    shelfLifeDays: Number(data.shelfLifeDays || 0),
  });
  if (saveData()) {
    resetFridgeForm();
    render();
    ensureFridgeOpen();
    focusMainVisual("fridge");
  }
}

function focusFridgeForm() {
  setActiveTab("fridge");
  $("#tab-fridge")?.classList.add("fridge-editing");
  ensureFridgeOpen();
  const nameField = elements.fridgeForm.elements.name;
  elements.fridgeForm.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => nameField?.focus(), 260);
}

function ensureFridgeOpen() {
  const fridgeButton = $('[data-furniture="fridge"]');
  if (fridgeButton && !fridgeButton.classList.contains("door-open")) {
    toggleFurnitureDoor(fridgeButton);
  }
  return fridgeButton;
}

function openFridgePanel(panel) {
  setActiveTab("fridge");
  ensureFridgeOpen();
  focusMainVisual("fridge");

  const panelMap = {
    overview: [".fridge-overview-card", "我的冰箱已打开"],
    today: [".fridge-today-list", "今日提醒已打开"],
    tip: [".fridge-tip-card", "冰箱小贴士已打开"],
  };
  const [selector, fallbackMessage] = panelMap[panel] || panelMap.overview;
  const message = {
    overview: "\u6211\u7684\u51b0\u7bb1\u5df2\u6253\u5f00",
    today: "\u4eca\u65e5\u63d0\u9192\u5df2\u6253\u5f00",
    tip: "\u51b0\u7bb1\u5c0f\u8d34\u58eb\u5df2\u6253\u5f00",
  }[panel] || fallbackMessage;
  const target = $(selector);
  if (target) {
    target.classList.remove("fridge-panel-flash");
    void target.offsetWidth;
    target.classList.add("fridge-panel-flash");
    window.setTimeout(() => target.classList.remove("fridge-panel-flash"), 1400);
  }
  showFridgeToast(message);
}

function organizeFridge() {
  state.fridge.sort((a, b) => {
    const byExpiry = sortByDate(expiryDate(a), expiryDate(b));
    if (byExpiry !== 0) return byExpiry;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
  if (!saveData()) return;
  render();
  ensureFridgeOpen();
  focusMainVisual("fridge");
  showFridgeToast("已按到期时间整理冰箱");
}

async function handleClothesSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.clothesForm);
  const previous = state.clothes.find((item) => item.id === data.id);
  const file = elements.clothesPhotoInput.files[0];
  const photo = file ? await compressImage(file, 1100, 0.8) : previous?.photo || "";

  upsert("clothes", {
    ...data,
    photo,
  });
  if (saveData()) {
    resetClothesForm();
    render();
  }
}

function handleDateSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.dateForm);
  upsert("dates", data);
  if (saveData()) {
    resetDateForm();
    render();
    checkBrowserNotifications(true);
  }
}

async function handleStorageSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.storageForm);
  const previous = state.storage.find((item) => item.id === data.id);
  const file = elements.storagePhotoInput.files[0];
  const photo = file ? await compressImage(file, 1000, 0.78) : previous?.photo || "";

  upsert("storage", {
    ...data,
    photo,
  });
  if (saveData()) {
    resetStorageForm();
    render();
  }
}

function handleRestockSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.restockForm);
  upsert("restock", data);
  if (saveData()) {
    resetRestockForm();
    render();
  }
}

function render() {
  renderScenes();
  renderAlerts();
  renderFridge();
  renderClothes();
  renderDates();
  renderStorage();
  renderRestock();
}

function renderScenes() {
  renderSceneItems("#fridgeSceneItems", "fridge", state.fridge, (item) => item.name, "冰箱还是空的");
  renderSceneItems("#clothesSceneItems", "clothes", state.clothes, (item) => item.name, "衣柜还没有记录");
  renderSceneItems("#dateSceneItems", "dates", getFutureDates(), (item) => {
    const diff = daysUntil(item.date);
    return diff >= 0 ? `${item.name} · ${diff === 0 ? "今天" : `${diff}天`}` : item.name;
  }, "还没有提醒事项");
  renderSceneItems("#storageSceneItems", "storage", state.storage, (item) => item.name, "柜子里还没有记录");
  renderSceneItems("#restockSceneItems", "restock", state.restock, (item) => item.name, "暂时没有补货项");
}

function renderSceneItems(selector, kind, list, getLabel, emptyText) {
  const container = $(selector);
  if (!container) return;
  const items = list;
  if (!items.length) {
    container.innerHTML = `<span class="scene-empty">${escapeHtml(emptyText)}</span>`;
    syncSceneOverlay(container);
    return;
  }

  const chips = items.map((item) => `
    <button type="button" data-open-kind="${escapeAttr(kind)}" data-id="${escapeAttr(item.id)}">
      ${escapeHtml(getLabel(item) || "未命名")}
    </button>
  `);
  container.innerHTML = chips.join("");
  syncSceneOverlay(container);
}

function syncSceneOverlay(container) {
  const scene = container.closest(".scene-card");
  const visual = scene ? $(".scene-visual", scene) : null;
  if (!visual) return;

  let overlay = $(".scene-storage-overlay", visual);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "scene-storage-overlay";
    overlay.setAttribute("aria-label", "打开后显示的收纳内容");
    visual.appendChild(overlay);
  }

  overlay.innerHTML = container.innerHTML;
}

function renderAlerts() {
  const lines = [];

  state.dates.forEach((item) => {
    const diff = daysUntil(item.date);
    if (diff === 1) lines.push(`明天是「${item.name}」，请提前准备。`);
    if (diff === 0) lines.push(`今天是「${item.name}」。`);
  });

  state.fridge.forEach((item) => {
    const status = getFridgeStatus(item);
    if (status.level === "danger" || status.level === "warn") {
      lines.push(`冰箱里的「${item.name}」${status.text}。`);
    }
  });

  state.restock.forEach((item) => {
    if (isRestockNeeded(item)) {
      const stockText = item.stock ? `当前库存：${item.stock}，` : "";
      lines.push(`补货清单里的「${item.name}」${stockText}少于 2 个时需要补货。`);
    }
  });

  if (!lines.length) {
    elements.alertPanel.classList.add("hidden");
    elements.alertPanel.innerHTML = "";
    return;
  }

  elements.alertPanel.classList.remove("hidden");
  elements.alertPanel.innerHTML = `
    <strong>今天需要留意</strong>
    <ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  `;
}

function renderFridge() {
  const allItems = state.fridge
    .slice()
    .sort((a, b) => sortByDate(expiryDate(a), expiryDate(b)));
  renderFridgeDashboard(allItems);

  const list = filterBySearch(state.fridge)
    .slice()
    .sort((a, b) => sortByDate(expiryDate(a), expiryDate(b)));

  $("#fridgeListMeta").textContent = `${list.length} 项`;
  if (!list.length) {
    renderEmpty(elements.fridgeList, "还没有冰箱记录");
    return;
  }

  elements.fridgeList.innerHTML = list
    .map((item) => {
      const status = getFridgeStatus(item);
      const expiry = expiryDate(item);
      return `
        <article class="item-card" data-item-kind="fridge" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag ${status.className}">${escapeHtml(status.text)}</span>
          </div>
          ${compactMeta([
            item.amount ? `数量 ${item.amount}` : "未填数量",
            item.place ? `位置 ${item.place}` : "未填位置",
            expiry ? `到期 ${expiry}` : "未计算到期"
          ])}
          ${cardActions("fridge", item.id)}
        </article>
      `;
    })
    .join("");
}

function renderFridgeDashboard(items) {
  const capacity = 80;
  const records = items.map((item) => {
    const expiry = expiryDate(item);
    const diff = expiry ? daysUntil(expiry) : Number.NaN;
    return { item, expiry, diff, status: getFridgeStatus(item) };
  });
  const expired = records.filter((entry) => Number.isFinite(entry.diff) && entry.diff < 0);
  const soon = records.filter((entry) => Number.isFinite(entry.diff) && entry.diff >= 0 && entry.diff <= 3);
  const percent = Math.min(100, Math.round((items.length / capacity) * 100));

  setText($("#fridgeLiveCount"), `${items.length}/${capacity}`);
  setText($("#fridgeOverviewCapacity"), `${items.length}/${capacity}`);
  setText($("#fridgeOverviewPercent"), `${percent}%`);
  setText($("#fridgeOverviewTotal"), items.length);
  setText($("#fridgeOverviewSoon"), soon.length);
  setText($("#fridgeOverviewExpired"), expired.length);
  setText($("#fridgeOverviewSpace"), Math.max(0, capacity - items.length));
  const bar = $("#fridgeOverviewBar");
  if (bar) bar.style.width = `${percent}%`;

  const previewGrid = $("#fridgePreviewGrid");
  if (previewGrid) {
    const previewItems = items.slice(0, 20);
    if (!previewItems.length) {
      previewGrid.innerHTML = `<span class="fridge-empty-shelf">添加食材后，会自动摆进冰箱小格子里。</span>`;
    } else {
      previewGrid.innerHTML = previewItems
        .map((item) => {
          const status = getFridgeStatus(item);
          return `
            <span class="fridge-food-card ${fridgeFoodTone(item.name)}" role="button" tabindex="0" data-edit-kind="fridge" data-id="${escapeAttr(item.id)}">
              <i aria-hidden="true">${fridgeFoodIcon(item.name)}</i>
              <b>${escapeHtml(item.name || "未命名")}</b>
              <em>${escapeHtml(status.text)}</em>
            </span>
          `;
        })
        .join("");
    }
  }

  const todayList = $("#fridgeTodayList");
  if (todayList) {
    const reminders = records
      .filter((entry) => Number.isFinite(entry.diff) && entry.diff <= 3)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);

    todayList.innerHTML = reminders.length
      ? reminders
          .map((entry) => `
            <button class="fridge-reminder-row" type="button" data-open-kind="fridge" data-id="${escapeAttr(entry.item.id)}">
              <span aria-hidden="true">${fridgeFoodIcon(entry.item.name)}</span>
              <b>${escapeHtml(entry.item.name || "未命名")}</b>
              <em>${escapeHtml(entry.status.text)}</em>
            </button>
          `)
          .join("")
      : `<div class="fridge-reminder-empty">今天没有需要特别处理的食材。</div>`;
  }

  const tip = $("#fridgeTipText");
  if (tip) {
    let text = "冰箱状态不错，常用食材放在视线最前面，会更容易记得吃。";
    if (!items.length) {
      text = "先添加牛奶、鸡蛋、蔬菜和水果，冰箱会自动帮你排队显示。";
    } else if (expired.length) {
      text = `有 ${expired.length} 个食材已经过期，建议今天先清理，再补充新鲜食材。`;
    } else if (soon.length) {
      text = `有 ${soon.length} 个食材 3 天内到期，适合放到最前排优先吃。`;
    }
    tip.textContent = text;
  }
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function fridgeFoodIcon(name) {
  const text = String(name || "").toLowerCase();
  if (/牛奶|奶|酸奶|milk/.test(text)) return "🥛";
  if (/鸡蛋|蛋|egg/.test(text)) return "🥚";
  if (/生菜|青菜|蔬菜|西兰花|菜|broccoli|lettuce/.test(text)) return "🥬";
  if (/番茄|西红柿|tomato/.test(text)) return "🍅";
  if (/苹果|橙|水果|蓝莓|葡萄|柠檬|牛油果|banana|apple|orange|fruit/.test(text)) return "🍎";
  if (/肉|鱼|虾|鸡胸|三文鱼|牛肉|猪肉|meat|fish/.test(text)) return "🥩";
  if (/水|可乐|气泡|饮料|果汁|drink|cola/.test(text)) return "🥤";
  if (/芝士|奶酪|黄油|cheese|butter/.test(text)) return "🧀";
  if (/饼干|零食|薯片|snack|pocky/.test(text)) return "🍪";
  return "🍱";
}

function fridgeFoodTone(name) {
  const text = String(name || "").toLowerCase();
  if (/牛奶|奶|酸奶|milk/.test(text)) return "tone-milk";
  if (/鸡蛋|蛋|egg/.test(text)) return "tone-egg";
  if (/生菜|青菜|蔬菜|西兰花|菜|broccoli|lettuce/.test(text)) return "tone-veg";
  if (/苹果|橙|水果|蓝莓|葡萄|柠檬|牛油果|番茄|西红柿|fruit|tomato/.test(text)) return "tone-fruit";
  if (/肉|鱼|虾|鸡胸|三文鱼|牛肉|猪肉|meat|fish/.test(text)) return "tone-meat";
  if (/水|可乐|气泡|饮料|果汁|drink|cola/.test(text)) return "tone-drink";
  return "tone-default";
}

function showFridgeToast(message) {
  let toast = $(".fridge-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "fridge-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showFridgeToast.timer);
  showFridgeToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function renderClothes() {
  const list = filterBySearch(state.clothes);
  $("#clothesListMeta").textContent = `${list.length} 件`;
  if (!list.length) {
    renderEmpty(elements.clothesList, "还没有衣服照片");
    return;
  }

  elements.clothesList.innerHTML = list
    .map((item) => {
      const photoContent = item.photo
        ? `<img src="${item.photo}" alt="${escapeAttr(item.name)}" />`
        : `<div class="photo-placeholder">暂无照片</div>`;
      return `
        <article class="photo-card" data-item-kind="clothes" data-item-id="${escapeAttr(item.id)}">
          <button class="photo-open" type="button" data-open-photo="${escapeAttr(item.photo || "")}" data-caption="${escapeAttr(item.name || "衣服照片")}" ${item.photo ? "" : "disabled"}>
            ${photoContent}
          </button>
          <div class="photo-body">
            <div class="card-top">
              <h4>${escapeHtml(item.name)}</h4>
              <span class="tag blue">${escapeHtml(item.type || "衣服")}</span>
            </div>
            ${compactMeta([
              item.season || "未填季节",
              item.color ? `颜色 ${item.color}` : "",
              item.place ? `位置 ${item.place}` : "未填位置"
            ])}
            ${cardActions("clothes", item.id)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDates() {
  const list = filterBySearch(state.dates)
    .slice()
    .sort((a, b) => sortByDate(a.date, b.date));

  $("#dateListMeta").textContent = `${list.length} 个`;
  if (!list.length) {
    renderEmpty(elements.dateList, "还没有重要日期");
    return;
  }

  elements.dateList.innerHTML = list
    .map((item) => {
      const status = getDateStatus(item);
      return `
        <article class="item-card" data-item-kind="dates" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag ${status.className}">${escapeHtml(status.text)}</span>
          </div>
          ${compactMeta([
            item.date ? `日期 ${item.date}` : "未填日期",
            item.type || "其他",
            "提前一天提醒"
          ])}
          ${cardActions("dates", item.id)}
        </article>
      `;
    })
    .join("");
}

function renderStorage() {
  const list = filterBySearch(state.storage);
  $("#storageListMeta").textContent = `${list.length} 项`;
  if (!list.length) {
    renderEmpty(elements.storageList, "还没有位置记录");
    return;
  }

  elements.storageList.innerHTML = list
    .map((item) => {
      const photoBlock = item.photo
        ? `<button class="text-button" type="button" data-open-photo="${escapeAttr(item.photo)}" data-caption="${escapeAttr(item.name || "位置照片")}">看位置照片</button>`
        : "";
      return `
        <article class="item-card" data-item-kind="storage" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag">${escapeHtml(item.type || "物品")}</span>
          </div>
          ${compactMeta([
            item.room ? `房间 ${item.room}` : "未填房间",
            item.spot ? `位置 ${item.spot}` : "未填位置",
            item.owner ? `负责人 ${item.owner}` : ""
          ])}
          <div class="card-actions">
            ${photoBlock}
            <button class="text-button" type="button" data-edit-kind="storage" data-id="${escapeAttr(item.id)}">编辑</button>
            <button class="text-button danger" type="button" data-delete-kind="storage" data-id="${escapeAttr(item.id)}">删除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRestock() {
  const list = filterBySearch(state.restock)
    .slice()
    .sort((a, b) => getRestockRank(a) - getRestockRank(b));

  $("#restockListMeta").textContent = `${list.length} 项`;
  if (!list.length) {
    renderEmpty(elements.restockList, "还没有补货记录");
    return;
  }

  elements.restockList.innerHTML = list
    .map((item) => {
      const status = getRestockStatus(item);
      return `
        <article class="item-card" data-item-kind="restock" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag ${status.className}">${escapeHtml(status.text)}</span>
          </div>
          ${compactMeta([
            item.category || "其他",
            item.stock ? `库存 ${item.stock}` : "未填库存",
            item.place ? `位置 ${item.place}` : ""
          ])}
          ${cardActions("restock", item.id)}
        </article>
      `;
    })
    .join("");
}

function cardActions(kind, id) {
  return `
    <div class="card-actions">
      <button class="text-button" type="button" data-edit-kind="${kind}" data-id="${escapeAttr(id)}">编辑</button>
      <button class="text-button danger" type="button" data-delete-kind="${kind}" data-id="${escapeAttr(id)}">删除</button>
    </div>
  `;
}

function compactMeta(parts) {
  const items = parts.filter((part) => cleanText(part));
  if (!items.length) return "";
  return `<div class="compact-meta">${items.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</div>`;
}

function toggleFurnitureDoor(button) {
  button.classList.toggle("door-open");
  const isOpen = button.classList.contains("door-open");
  button.setAttribute("aria-pressed", isOpen ? "true" : "false");
  const scene = button.closest(".scene-card");
  if (scene) scene.classList.toggle("main-open", isOpen);
  if (button.dataset.furniture === "fridge") {
    button.setAttribute("aria-label", isOpen ? "关闭我的冰箱" : "打开我的冰箱");
  }
  if (button.dataset.furniture === "closet") {
    button.setAttribute("aria-label", isOpen ? "关闭我的衣柜" : "打开我的衣柜");
  }
  if (button.dataset.furniture === "cabinet") {
    button.setAttribute("aria-label", isOpen ? "关闭重要物品柜" : "打开重要物品柜");
  }
  if (button.dataset.furniture === "pantry") {
    button.setAttribute("aria-label", isOpen ? "关闭补货购物车" : "打开补货购物车");
  }
  if (button.dataset.furniture === "clock") {
    button.setAttribute("aria-label", isOpen ? "关闭提醒时钟" : "打开提醒时钟");
  }
}

function renderEmpty(container, title) {
  container.innerHTML = `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>从左侧表单添加第一条。</span>
    </div>
  `;
}

function openStoredItem(kind, id) {
  if (!state[kind]?.some((item) => item.id === id)) return;

  setActiveTab(kind);
  if (elements.searchInput.value.trim()) {
    elements.searchInput.value = "";
    render();
  }

  requestAnimationFrame(() => {
    const card = $$("[data-item-kind]").find((item) => item.dataset.itemKind === kind && item.dataset.itemId === id);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("item-focus");
    void card.offsetWidth;
    card.classList.add("item-focus");
    window.setTimeout(() => card.classList.remove("item-focus"), 1800);
  });
}

function openPhotoPicker(button) {
  const input = $(`#${button.dataset.photoTrigger}`);
  if (!input) return;

  if (button.dataset.photoMode === "camera") {
    input.setAttribute("capture", "environment");
  } else {
    input.removeAttribute("capture");
  }

  input.value = "";
  input.click();
}

function filterBySearch(list) {
  const query = elements.searchInput.value.trim().toLowerCase();
  if (!query) return list;
  return list.filter((item) => {
    const { photo, ...searchable } = item;
    return JSON.stringify(searchable).toLowerCase().includes(query);
  });
}

function sortByDate(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`);
}

function getFutureDates() {
  return state.dates
    .filter((item) => daysUntil(item.date) >= 0)
    .slice()
    .sort((a, b) => sortByDate(a.date, b.date));
}

function expiryDate(item) {
  if (!item.productionDate || !Number(item.shelfLifeDays)) return "";
  const date = parseLocalDate(item.productionDate);
  date.setDate(date.getDate() + Number(item.shelfLifeDays));
  return toDateInputValue(date);
}

function getFridgeStatus(item) {
  const expiry = expiryDate(item);
  if (!expiry) return { text: "未计算", className: "", level: "muted" };
  const diff = daysUntil(expiry);
  if (diff < 0) return { text: `已过期 ${Math.abs(diff)} 天`, className: "danger", level: "danger" };
  if (diff === 0) return { text: "今天到期", className: "danger", level: "danger" };
  if (diff === 1) return { text: "明天到期", className: "warn", level: "warn" };
  if (diff <= 3) return { text: `临期 ${diff} 天`, className: "warn", level: "warn" };
  if (diff <= 7) return { text: `还有 ${diff} 天`, className: "blue", level: "blue" };
  return { text: `还有 ${diff} 天`, className: "good", level: "good" };
}

function getDateStatus(item) {
  const diff = daysUntil(item.date);
  if (Number.isNaN(diff)) return { text: "未填写", className: "", level: "muted" };
  if (diff < 0) return { text: `已过 ${Math.abs(diff)} 天`, className: "", level: "muted" };
  if (diff === 0) return { text: "今天", className: "danger", level: "danger" };
  if (diff === 1) return { text: "明天", className: "warn", level: "warn" };
  if (diff <= 7) return { text: `还有 ${diff} 天`, className: "blue", level: "blue" };
  return { text: `还有 ${diff} 天`, className: "good", level: "good" };
}

function getRestockStatus(item) {
  const stockCount = getRestockStockCount(item);
  if (Number.isFinite(stockCount)) {
    if (stockCount < 2) return { text: "少于 2，需补货", className: "danger", level: "danger" };
    return { text: "库存够用", className: "good", level: "good" };
  }
  if (item.status === "已备足") return { text: "已备足", className: "good", level: "good" };
  if (item.status === "下次再看") return { text: "下次再看", className: "blue", level: "blue" };
  if (item.status === "库存偏低") return { text: "库存偏低", className: "warn", level: "warn" };
  return { text: item.status || "需要补货", className: "danger", level: "danger" };
}

function isRestockNeeded(item) {
  const stockCount = getRestockStockCount(item);
  if (Number.isFinite(stockCount)) return stockCount < 2;
  return item.status === "需要补货" || item.status === "库存偏低" || !item.status;
}

function getRestockRank(item) {
  const stockCount = getRestockStockCount(item);
  if (Number.isFinite(stockCount)) return stockCount < 2 ? 0 : 3;
  const ranks = {
    需要补货: 0,
    库存偏低: 1,
    下次再看: 2,
    已备足: 3,
  };
  return ranks[item.status] ?? 0;
}

function getRestockStockCount(item) {
  const text = String(item.stock || "").replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 65248)
  );
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function daysUntil(value) {
  if (!value) return Number.NaN;
  const target = parseLocalDate(value);
  const today = startOfDay(new Date());
  return Math.round((target - today) / 86400000);
}

function parseLocalDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function editItem(kind, id) {
  const item = state[kind].find((entry) => entry.id === id);
  if (!item) return;
  let formToShow = null;

  if (kind === "fridge") {
    fillForm(elements.fridgeForm, item);
    setSubmitText(elements.fridgeForm, "更新冰箱记录");
    setActiveTab("fridge");
    $("#tab-fridge")?.classList.add("fridge-editing");
    ensureFridgeOpen();
    formToShow = elements.fridgeForm;
  }

  if (kind === "clothes") {
    fillForm(elements.clothesForm, item);
    showPreview(elements.clothesPhotoPreview, item.photo);
    setSubmitText(elements.clothesForm, "更新衣服");
    setActiveTab("clothes");
    formToShow = elements.clothesForm;
  }

  if (kind === "dates") {
    fillForm(elements.dateForm, item);
    setSubmitText(elements.dateForm, "更新日期");
    setActiveTab("dates");
    formToShow = elements.dateForm;
  }

  if (kind === "storage") {
    fillForm(elements.storageForm, item);
    showPreview(elements.storagePhotoPreview, item.photo);
    setSubmitText(elements.storageForm, "更新位置");
    setActiveTab("storage");
    formToShow = elements.storageForm;
  }

  if (kind === "restock") {
    fillForm(elements.restockForm, item);
    setSubmitText(elements.restockForm, "更新补货项");
    setActiveTab("restock");
    formToShow = elements.restockForm;
  }

  if (formToShow) {
    formToShow.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function handleDeleteButton(button) {
  deleteItem(button.dataset.deleteKind, button.dataset.id);
}

function deleteItem(kind, id) {
  state[kind] = state[kind].filter((item) => item.id !== id);
  if (saveData()) render();
}

function fillForm(form, item) {
  $$("[name]", form).forEach((field) => {
    if (field.type === "file") {
      field.value = "";
      return;
    }
    field.value = item[field.name] ?? "";
  });
}

function setSubmitText(form, text) {
  const button = $('button[type="submit"]', form);
  if (button) button.textContent = text;
}

function resetFridgeForm() {
  elements.fridgeForm.reset();
  elements.fridgeForm.elements.id.value = "";
  setSubmitText(elements.fridgeForm, "保存到冰箱");
  $("#tab-fridge")?.classList.remove("fridge-editing");
}

function resetClothesForm() {
  elements.clothesForm.reset();
  elements.clothesForm.elements.id.value = "";
  showPreview(elements.clothesPhotoPreview, "");
  setSubmitText(elements.clothesForm, "保存衣服");
}

function resetDateForm() {
  elements.dateForm.reset();
  elements.dateForm.elements.id.value = "";
  setSubmitText(elements.dateForm, "保存日期");
}

function resetStorageForm() {
  elements.storageForm.reset();
  elements.storageForm.elements.id.value = "";
  showPreview(elements.storagePhotoPreview, "");
  setSubmitText(elements.storageForm, "保存位置");
}

function resetRestockForm() {
  elements.restockForm.reset();
  elements.restockForm.elements.id.value = "";
  setSubmitText(elements.restockForm, "保存补货项");
}

function fillRestockPreset(button) {
  resetRestockForm();
  elements.restockForm.elements.name.value = button.dataset.restockPreset || "";
  elements.restockForm.elements.category.value = button.dataset.restockCategory || "其他";
  elements.restockForm.elements.status.value = "需要补货";
  elements.restockForm.elements.name.focus();
}

function bindPhotoPreview(input, preview) {
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) {
      showPreview(preview, "");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    showPreview(preview, dataUrl);
  });
}

function showPreview(preview, dataUrl) {
  if (!dataUrl) {
    preview.classList.add("hidden");
    preview.style.backgroundImage = "";
    return;
  }
  preview.classList.remove("hidden");
  preview.style.backgroundImage = `url("${dataUrl}")`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file, maxSize, quality) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl).catch(() => null);
  if (!image) return dataUrl;

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function openImageDialog(src, caption) {
  if (!src) return;
  elements.dialogImage.src = src;
  elements.dialogCaption.textContent = caption;
  if (elements.imageDialog.showModal) {
    elements.imageDialog.showModal();
  } else {
    elements.imageDialog.setAttribute("open", "");
  }
}

function closeImageDialog() {
  if (elements.imageDialog.close) {
    elements.imageDialog.close();
  } else {
    elements.imageDialog.removeAttribute("open");
  }
  elements.dialogImage.src = "";
}

function remindersEnabled() {
  return localStorage.getItem(REMINDER_ENABLED_KEY) === "true";
}

function setRemindersEnabled(enabled) {
  localStorage.setItem(REMINDER_ENABLED_KEY, enabled ? "true" : "false");
  updateReminderButton();
}

function updateReminderButton() {
  const button = $("#notifyButton");
  if (!button) return;
  const enabled = remindersEnabled();
  button.textContent = enabled ? "关闭提醒" : "开启提醒";
  button.classList.toggle("primary-button", enabled);
  button.classList.toggle("ghost-button", !enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
}

async function toggleNotifications() {
  if (remindersEnabled()) {
    setRemindersEnabled(false);
    alert("已关闭系统通知提醒。网页里的红色提醒事项仍会正常显示。");
    return;
  }

  if (!("Notification" in window)) {
    alert("这个浏览器不支持系统通知。网页里的红色提醒事项仍会正常显示。");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    setRemindersEnabled(true);
    alert("已开启系统通知提醒。网页打开时，如果明天有重要日期，会弹出提醒。");
    checkBrowserNotifications(true);
  } else {
    setRemindersEnabled(false);
    alert("提醒权限没有开启。网页里的红色提醒事项仍会正常显示。");
  }
}

function checkBrowserNotifications(showEmptyTip) {
  if (!remindersEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const todayKey = toDateInputValue(new Date());
  const notified = loadNotified();
  const dueTomorrow = state.dates.filter((item) => daysUntil(item.date) === 1);

  dueTomorrow.forEach((item) => {
    const key = `${todayKey}-${item.id}-${item.date}`;
    if (notified[key]) return;
    new Notification(`明天有重要日期：${item.name}`, {
      body: item.note || `${item.date}，请提前准备。`,
    });
    notified[key] = true;
  });

  localStorage.setItem(NOTIFY_KEY, JSON.stringify(notified));

  if (showEmptyTip && !dueTomorrow.length) {
    alert("当前没有明天到期的重要日期。");
  }
}

function loadNotified() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_KEY)) || {};
  } catch {
    return {};
  }
}

function exportCalendarFile() {
  const dateItems = state.dates.filter((item) => item.date);
  if (!dateItems.length) {
    alert("请先添加重要日期。");
    return;
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const events = dateItems
    .map((item) => {
      const start = item.date.replaceAll("-", "");
      const endDate = parseLocalDate(item.date);
      endDate.setDate(endDate.getDate() + 1);
      const end = toDateInputValue(endDate).replaceAll("-", "");
      const description = [`类型：${item.type || "其他"}`, item.note ? `备注：${item.note}` : ""].filter(Boolean).join("\\n");

      return [
        "BEGIN:VEVENT",
        `UID:${icsEscape(item.id)}@family-home-page`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(item.name)}`,
        `DESCRIPTION:${icsEscape(description)}`,
        "BEGIN:VALARM",
        "TRIGGER;RELATED=START:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(`明天：${item.name}`)}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cyber Homekeeper//ZH-CN//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:赛博小管家重要日期",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
  openCalendarImport(content);
}

function openCalendarImport(content) {
  const blob = new Blob(["\ufeff" + content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "赛博小管家重要日期.ics";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  window.setTimeout(() => {
    alert("已生成手机日历文件。iPhone 请用 Safari 打开并选择加入日历；每个日期都已设置提前一天提醒。若当前浏览器提示文件打开失败，请点右上角选择用 Safari 打开。");
  }, 300);
}

async function exportClothesImage() {
  if (!state.clothes.length) {
    alert("请先添加衣服记录。");
    return;
  }

  const items = state.clothes.slice();
  const columns = 3;
  const cardWidth = 340;
  const cardHeight = 410;
  const gap = 24;
  const padding = 42;
  const headerHeight = 110;
  const rows = Math.ceil(items.length / columns);
  const canvas = document.createElement("canvas");
  canvas.width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
  canvas.height = padding * 2 + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap;

  const context = canvas.getContext("2d");
  context.fillStyle = "#f5f8f7";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#14211f";
  context.font = "700 42px Microsoft YaHei, Arial";
  context.fillText("家里衣服清单", padding, 62);
  context.fillStyle = "#66736f";
  context.font = "24px Microsoft YaHei, Arial";
  context.fillText(`生成时间：${new Date().toLocaleString("zh-CN")} · 共 ${items.length} 件`, padding, 100);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + col * (cardWidth + gap);
    const y = padding + headerHeight + row * (cardHeight + gap);
    await drawClothesCard(context, item, x, y, cardWidth, cardHeight);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, "衣服图片清单.png", "image/png");
  });
}

async function drawClothesCard(context, item, x, y, width, height) {
  context.save();
  drawRoundRect(context, x, y, width, height, 8, "#ffffff", "#dce7e3");

  const imageHeight = 230;
  if (item.photo) {
    const image = await loadImage(item.photo).catch(() => null);
    if (image) {
      drawImageCover(context, image, x + 14, y + 14, width - 28, imageHeight);
    } else {
      drawPhotoPlaceholder(context, x + 14, y + 14, width - 28, imageHeight);
    }
  } else {
    drawPhotoPlaceholder(context, x + 14, y + 14, width - 28, imageHeight);
  }

  context.fillStyle = "#14211f";
  context.font = "700 24px Microsoft YaHei, Arial";
  wrapText(context, item.name || "未命名衣服", x + 18, y + imageHeight + 54, width - 36, 30, 2);

  context.fillStyle = "#66736f";
  context.font = "18px Microsoft YaHei, Arial";
  const meta = [
    `类别：${item.type || "未填写"}`,
    `季节：${item.season || "未填写"}`,
    `颜色：${item.color || "未填写"}`,
    `位置：${item.place || "未填写"}`,
  ];
  meta.forEach((line, index) => {
    context.fillText(line, x + 18, y + imageHeight + 116 + index * 26);
  });

  context.restore();
}

function drawRoundRect(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.stroke();
}

function drawPhotoPlaceholder(context, x, y, width, height) {
  drawRoundRect(context, x, y, width, height, 8, "#eef7f4", "#dce7e3");
  context.fillStyle = "#66736f";
  context.font = "700 22px Microsoft YaHei, Arial";
  context.textAlign = "center";
  context.fillText("暂无照片", x + width / 2, y + height / 2);
  context.textAlign = "start";
}

function drawImageCover(context, image, x, y, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  context.restore();
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = Array.from(String(text));
  let line = "";
  let lines = 0;

  chars.forEach((char, index) => {
    const testLine = line + char;
    const isLast = index === chars.length - 1;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines += 1;
      context.fillText(lines === maxLines ? `${line.slice(0, -1)}...` : line, x, y);
      y += lineHeight;
      line = char;
      if (lines >= maxLines) line = "";
    } else {
      line = testLine;
    }

    if (isLast && line && lines < maxLines) {
      context.fillText(line, x, y);
    }
  });
}

function exportAllData() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  downloadBlob(JSON.stringify(payload, null, 2), "赛博小管家数据.json", "application/json;charset=utf-8");
}

async function importAllData(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const imported = normalizeData(JSON.parse(text));
    if (!confirm("导入会替换当前浏览器里的数据，确定继续吗？")) return;

    state.fridge = imported.fridge;
    state.clothes = imported.clothes;
    state.dates = imported.dates;
    state.storage = imported.storage;
    state.restock = imported.restock;
    if (saveData()) render();
  } catch {
    alert("导入失败：请选择之前导出的 JSON 文件。");
  }
}

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function icsEscape(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
