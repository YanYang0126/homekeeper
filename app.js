const STORAGE_KEY = "family-home-page-v1";
const NOTIFY_KEY = "family-home-page-notified-v1";
const REMINDER_ENABLED_KEY = "family-home-page-reminder-enabled-v1";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = loadData();
const CLOSET_TYPES = ["上装", "下装", "裙子", "外套", "鞋子"];
const DATE_TYPES = [
  { value: "生日", icon: "🎂", accent: "#ff9eb8" },
  { value: "纪念日", icon: "💗", accent: "#f7a1c4" },
  { value: "证件", icon: "🪪", accent: "#9fc7ff" },
  { value: "缴费", icon: "💳", accent: "#ffd17a" },
  { value: "医疗", icon: "🩺", accent: "#9fdcb4" },
  { value: "自定义", icon: "⭐", accent: "#c7a6ff" },
];
const DATE_FILTERS = ["全部", "生日", "纪念日", "证件", "自定义"];
const REMINDER_DAY_OPTIONS = [1, 3, 7, 15, 30];
const FILE_TYPES = [
  { value: "证件", icon: "证" },
  { value: "保险", icon: "保" },
  { value: "医疗", icon: "医" },
  { value: "发票", icon: "票" },
  { value: "其他", icon: "其" },
];
const dateUiState = {
  filter: "全部",
  calendarDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  selectedDate: toDateInputValue(new Date()),
};
const outfitSelection = {
  top: "",
  bottom: "",
  coat: "",
  shoes: "",
};

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
  bindClothesAutoType();
  ensureFridgeExperience();
  useRealFridgeImages();
  useRealClosetImages();
  ensureClosetExperience();
  ensureDatesExperience();
  useRealFileImages();
  ensureFileExperience();
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
      <div class="closet-category-overlay" id="closetCategoryOverlay" aria-label="衣橱分类区域"></div>
    `;
  }
}

function useRealFileImages() {
  const stage = $(".photo-cabinet-button .cabinet-photo-stage");
  if (stage && stage.dataset.realFileReady !== "true") {
    stage.removeAttribute("aria-hidden");
    stage.dataset.realFileReady = "true";
    stage.innerHTML = `
      <img class="cabinet-photo cabinet-photo-closed" src="assets/main/file-cabinet-closed.jpg" alt="" loading="eager" />
      <img class="cabinet-photo cabinet-photo-open" src="assets/main/file-cabinet-open.jpg" alt="" loading="eager" />
      <div class="file-category-overlay" id="fileCategoryOverlay" aria-label="文件分类"></div>
    `;
  }
}

function ensureClosetExperience() {
  const section = $("#tab-clothes");
  const scene = $(".closet-scene", section);
  if (!section || !scene) return;

  const eyebrow = $(".section-heading .eyebrow", section);
  const title = $(".section-heading h2", section);
  if (eyebrow) eyebrow.textContent = "拍照归档 · 自由搭配";
  if (title) title.textContent = "兔兔衣橱";

  if (!$(".closet-helper-panel", scene)) {
    scene.insertAdjacentHTML(
      "beforeend",
      `
        <aside class="closet-helper-panel" aria-label="衣橱操作面板">
          <section class="closet-quick-card">
            <div class="closet-panel-head">
              <span>添加衣服</span>
              <b>自动归类</b>
            </div>
            <p>拍照或选择本地照片，再补充衣服名称；系统会按关键词放进上装、下装、裙子、外套或鞋子。</p>
            <div class="closet-upload-actions">
              <button type="button" data-photo-trigger="clothesPhotoInput" data-photo-mode="camera">拍照上传</button>
              <button type="button" data-photo-trigger="clothesPhotoInput" data-photo-mode="album">本地照片</button>
              <button type="button" data-closet-form>填写详情</button>
            </div>
          </section>
          <section class="closet-quick-card">
            <div class="closet-panel-head">
              <span>衣橱分类</span>
              <b id="closetTotalCount">0 件</b>
            </div>
            <div class="closet-category-summary" id="closetCategorySummary"></div>
          </section>
          <section class="closet-quick-card closet-tip-card">
            <div class="closet-panel-head">
              <span>搭配提示</span>
              <b>一键搭配</b>
            </div>
            <p id="closetTipText">打开衣橱后，点衣服就能组合今天的穿搭。</p>
            <button class="closet-soft-button" type="button" data-outfit-random>帮我搭一套</button>
          </section>
        </aside>
      `
    );
  }
}

function ensureFileExperience() {
  const section = $("#tab-storage");
  const scene = $(".cabinet-scene", section);
  if (!section || !scene) return;

  const eyebrow = $(".section-heading .eyebrow", section);
  const title = $(".section-heading h2", section);
  if (eyebrow) eyebrow.textContent = "重要资料";
  if (title) title.textContent = "文件管理";
  const listTitle = $("#storageList")?.closest("div")?.querySelector(".list-head h3");
  if (listTitle) listTitle.textContent = "文件清单";

  const form = elements.storageForm;
  if (form && form.dataset.fileExperienceReady !== "true") {
    form.dataset.fileExperienceReady = "true";
    const nameLabel = form.elements.name?.closest("label");
    const typeField = form.elements.type;
    const ownerLabel = form.elements.owner?.closest("label");
    const roomLabel = form.elements.room?.closest("label");
    const spotLabel = form.elements.spot?.closest("label");
    const noteLabel = form.elements.note?.closest("label");
    const photoLabel = elements.storagePhotoInput?.closest("label");

    if (nameLabel) $("span", nameLabel).textContent = "文件名称";
    if (form.elements.name) form.elements.name.placeholder = "例如：身份证、保险单、体检报告";
    if (typeField) {
      typeField.innerHTML = FILE_TYPES.map((type) => `<option>${type.value}</option>`).join("");
    }
    if (ownerLabel) ownerLabel.classList.add("file-hidden-field");
    if (roomLabel) roomLabel.classList.add("file-hidden-field");
    if (spotLabel) {
      $("span", spotLabel).textContent = "保存位置";
      form.elements.spot.required = false;
      form.elements.spot.placeholder = "例如：文件柜第一层，也可以不填";
    }
    if (photoLabel) {
      $("span", photoLabel).textContent = "文件照片 / PDF";
      const buttons = $$(".photo-choice", photoLabel);
      if (buttons[0]) buttons[0].textContent = "拍照";
      if (buttons[1]) buttons[1].textContent = "选照片 / PDF";
    }
    if (elements.storagePhotoInput) {
      elements.storagePhotoInput.accept = "image/*,application/pdf";
    }
    if (noteLabel) {
      $("span", noteLabel).textContent = "备注";
      form.elements.note.placeholder = "编号、有效期、需要注意的事";
    }
    setSubmitText(form, "保存文件");
  }

  const copy = $(".scene-copy", scene);
  if (copy) {
    const heading = $("h3", copy);
    const text = $("p", copy);
    if (heading) heading.textContent = "我的文件柜";
    if (text) text.textContent = "证件、保险、医疗、发票和其他资料都放在这里。";
  }

  if (!$(".file-action-bar", scene)) {
    scene.insertAdjacentHTML(
      "beforeend",
      `
        <div class="file-action-bar">
          <button class="file-add-button" type="button" data-file-add>＋ 添加文件</button>
          <button class="file-organize-button" type="button" data-file-organize>整理文件</button>
        </div>
      `
    );
  }
}

function ensureDatesExperience() {
  const section = $("#tab-dates");
  const scene = $(".reminder-scene", section);
  if (!section || !scene) return;

  const eyebrow = $(".section-heading .eyebrow", section);
  const title = $(".section-heading h2", section);
  if (eyebrow) eyebrow.textContent = "倒计时 · 手机日历";
  if (title) title.textContent = "重要日期";

  const notice = $(".notice-line", section);
  if (notice) {
    notice.textContent = "记录生日、纪念日、证件到期、缴费和医疗日期；导出日历后，手机会按你设置的提前天数提醒。";
  }

  if (!$(".dates-side-panel", scene)) {
    scene.insertAdjacentHTML(
      "beforeend",
      `
        <aside class="dates-side-panel" aria-label="重要日期统计">
          <section class="date-stat-card">
            <span>重要日期</span>
            <strong id="dateTotalCount">0</strong>
            <small id="dateNearestText">还没有日期</small>
          </section>
          <section class="date-stat-card date-stat-card-hot">
            <span>即将到来</span>
            <strong id="dateSoonCount">0</strong>
            <small id="dateSoonText">7 天内暂无提醒</small>
          </section>
        </aside>
      `
    );
  }

  if (!$(".dates-workbench", section)) {
    scene.insertAdjacentHTML(
      "afterend",
      `
        <div class="dates-workbench" aria-label="重要日期管理">
          <div class="date-filter-row" id="dateFilterRow"></div>
          <div class="date-manager-grid">
            <section class="date-list-panel">
              <div class="date-panel-head">
                <div>
                  <p class="eyebrow">最近提醒</p>
                  <h3>倒计时清单</h3>
                </div>
                <button class="date-add-mini" type="button" data-date-add>＋ 添加</button>
              </div>
              <div class="date-list-modern" id="dateModernList"></div>
            </section>
            <section class="date-calendar-panel">
              <div class="date-calendar-head">
                <button type="button" data-date-prev aria-label="上个月">‹</button>
                <strong id="dateCalendarTitle"></strong>
                <button type="button" data-date-next aria-label="下个月">›</button>
              </div>
              <div class="date-calendar-weekdays" aria-hidden="true">
                <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
              </div>
              <div class="date-calendar-grid" id="dateCalendarGrid"></div>
              <div class="date-selected-detail" id="dateSelectedDetail"></div>
            </section>
          </div>
          <div class="date-bottom-actions">
            <button class="date-primary-action" type="button" data-date-add>＋ 添加重要日期</button>
          </div>
        </div>
      `
    );
  }

  if (!$("#dateModal")) {
    section.insertAdjacentHTML(
      "beforeend",
      `
        <div class="date-modal hidden" id="dateModal" role="dialog" aria-modal="true" aria-label="添加重要日期">
          <form class="date-modal-panel" id="dateQuickForm">
            <button class="date-modal-close" type="button" data-date-close aria-label="关闭">×</button>
            <input name="id" type="hidden" />
            <div class="date-modal-title">
              <span>重要日期</span>
              <strong id="dateModalTitle">添加重要日期</strong>
            </div>
            <label>
              <span>标题</span>
              <input name="name" required placeholder="例如：妈妈生日、护照到期" />
            </label>
            <div class="two-fields">
              <label>
                <span>分类</span>
                <select name="type">
                  ${DATE_TYPES.map((type) => `<option>${type.value}</option>`).join("")}
                </select>
              </label>
              <label>
                <span>日期</span>
                <input name="date" type="date" required />
              </label>
            </div>
            <label>
              <span>提醒时间</span>
              <select name="remindDays">
                ${REMINDER_DAY_OPTIONS.map((day) => `<option value="${day}">提前 ${day} 天提醒</option>`).join("")}
              </select>
            </label>
            <label>
              <span>备注</span>
              <textarea name="note" rows="3" placeholder="需要准备什么、联系人、地址"></textarea>
            </label>
            <button class="date-submit-button" type="submit">保存重要日期</button>
          </form>
        </div>
      `
    );
  }

  const quickForm = $("#dateQuickForm");
  if (quickForm && quickForm.dataset.bound !== "true") {
    quickForm.dataset.bound = "true";
    quickForm.addEventListener("submit", handleDateQuickSubmit);
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
    const closetFormButton = event.target.closest("[data-closet-form]");
    const furnitureButton = event.target.closest("[data-furniture]");
    const restockPreset = event.target.closest("[data-restock-preset]");
    const fridgeAddButton = event.target.closest("[data-fridge-add]");
    const fridgeOrganizeButton = event.target.closest("[data-fridge-organize]");
    const fridgePanelButton = event.target.closest("[data-fridge-overview], [data-fridge-today], [data-fridge-tip]");
    const outfitPickButton = event.target.closest("[data-outfit-pick]");
    const outfitRemoveButton = event.target.closest("[data-outfit-remove]");
    const outfitSaveButton = event.target.closest("[data-outfit-save]");
    const outfitClearButton = event.target.closest("[data-outfit-clear]");
    const outfitRandomButton = event.target.closest("[data-outfit-random]");
    const outfitHistoryButton = event.target.closest("[data-open-outfit]");
    const dateAddButton = event.target.closest("[data-date-add]");
    const dateCloseButton = event.target.closest("[data-date-close]");
    const dateFilterButton = event.target.closest("[data-date-filter]");
    const datePrevButton = event.target.closest("[data-date-prev]");
    const dateNextButton = event.target.closest("[data-date-next]");
    const dateDayButton = event.target.closest("[data-date-day]");
    const fileAddButton = event.target.closest("[data-file-add]");
    const fileOrganizeButton = event.target.closest("[data-file-organize]");
    const fileCategoryButton = event.target.closest("[data-file-category]");
    const fileOpenButton = event.target.closest("[data-open-file]");

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

    if (closetFormButton) {
      focusClothesForm();
      return;
    }

    if (outfitPickButton) {
      pickOutfitItem(outfitPickButton.dataset.outfitPick, outfitPickButton.dataset.id);
      return;
    }

    if (outfitRemoveButton) {
      removeOutfitItem(outfitRemoveButton.dataset.outfitRemove);
      return;
    }

    if (outfitSaveButton) {
      saveCurrentOutfit();
      return;
    }

    if (outfitClearButton) {
      clearOutfitSelection();
      return;
    }

    if (outfitRandomButton) {
      randomOutfit();
      return;
    }

    if (outfitHistoryButton) {
      loadSavedOutfit(outfitHistoryButton.dataset.openOutfit);
      return;
    }

    if (dateAddButton) {
      openDateModal();
      return;
    }

    if (dateCloseButton) {
      closeDateModal();
      return;
    }

    if (dateFilterButton) {
      dateUiState.filter = dateFilterButton.dataset.dateFilter || "全部";
      renderDatesExperience();
      return;
    }

    if (datePrevButton || dateNextButton) {
      const direction = dateNextButton ? 1 : -1;
      dateUiState.calendarDate = new Date(
        dateUiState.calendarDate.getFullYear(),
        dateUiState.calendarDate.getMonth() + direction,
        1
      );
      renderDatesExperience();
      return;
    }

    if (dateDayButton) {
      dateUiState.selectedDate = dateDayButton.dataset.dateDay;
      renderDatesExperience();
      return;
    }

    if (fileAddButton) {
      focusStorageForm();
      return;
    }

    if (fileOrganizeButton) {
      organizeFiles();
      return;
    }

    if (fileCategoryButton) {
      focusStorageForm(fileCategoryButton.dataset.fileCategory);
      return;
    }

    if (fileOpenButton) {
      openFileAttachment(fileOpenButton.dataset.openFile, fileOpenButton.dataset.fileName || "赛博小管家文件");
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
    const outfitCard = event.target.closest("[data-outfit-pick]");
    if (!["Enter", " "].includes(event.key)) return;
    if (card) {
      event.preventDefault();
      editItem(card.dataset.editKind, card.dataset.id);
    }
    if (outfitCard) {
      event.preventDefault();
      pickOutfitItem(outfitCard.dataset.outfitPick, outfitCard.dataset.id);
    }
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
    outfits: [],
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
    outfits: Array.isArray(data?.outfits) ? data.outfits : [],
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

function ensureClosetOpen() {
  const closetButton = $('[data-furniture="closet"]');
  if (closetButton && !closetButton.classList.contains("door-open")) {
    toggleFurnitureDoor(closetButton);
  }
  return closetButton;
}

function ensureFileOpen() {
  const cabinetButton = $('[data-furniture="cabinet"]');
  if (cabinetButton && !cabinetButton.classList.contains("door-open")) {
    toggleFurnitureDoor(cabinetButton);
  }
  return cabinetButton;
}

function focusClothesForm() {
  setActiveTab("clothes");
  ensureClosetOpen();
  const nameField = elements.clothesForm.elements.name;
  elements.clothesForm.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => nameField?.focus(), 260);
}

function focusStorageForm(type = "") {
  setActiveTab("storage");
  ensureFileOpen();
  $("#tab-storage")?.classList.add("file-editing");
  if (type && elements.storageForm.elements.type) {
    elements.storageForm.elements.type.value = normalizeFileType(type);
  }
  const nameField = elements.storageForm.elements.name;
  elements.storageForm.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => nameField?.focus(), 260);
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

function organizeFiles() {
  state.storage.sort((a, b) => {
    const orderA = FILE_TYPES.findIndex((type) => type.value === normalizeFileType(a.type));
    const orderB = FILE_TYPES.findIndex((type) => type.value === normalizeFileType(b.type));
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });
  if (!saveData()) return;
  render();
  ensureFileOpen();
  focusMainVisual("storage");
  showFridgeToast("文件已按分类整理");
}

async function handleClothesSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.clothesForm);
  const previous = state.clothes.find((item) => item.id === data.id);
  const file = elements.clothesPhotoInput.files[0];
  const photo = file ? await compressImage(file, 1100, 0.8) : previous?.photo || "";
  const detectedType = normalizeClothesType(data.type) || detectClothesType(`${data.name} ${data.note} ${file?.name || previous?.name || ""}`) || "上装";

  upsert("clothes", {
    ...data,
    type: detectedType,
    photo,
  });
  if (saveData()) {
    resetClothesForm();
    render();
    ensureClosetOpen();
    focusMainVisual("clothes");
  }
}

function handleDateSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.dateForm);
  upsert("dates", {
    ...data,
    type: normalizeDateType(data.type),
    remindDays: data.remindDays || "1",
  });
  if (saveData()) {
    resetDateForm();
    render();
    checkBrowserNotifications(true);
  }
}

function handleDateQuickSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = getFormData(form);
  upsert("dates", {
    ...data,
    type: normalizeDateType(data.type),
    remindDays: data.remindDays || "1",
  });
  if (saveData()) {
    closeDateModal();
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
  const fileType = file?.type || previous?.fileType || "";
  const fileName = file?.name || previous?.fileName || "";

  upsert("storage", {
    ...data,
    type: normalizeFileType(data.type),
    photo,
    fileType,
    fileName,
  });
  if (saveData()) {
    resetStorageForm();
    render();
    ensureFileOpen();
    focusMainVisual("storage");
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
    renderClosetStudio();
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
              <span class="tag blue">${escapeHtml(getClothesDisplayType(item) || "衣服")}</span>
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
  renderClosetStudio();
}

function renderClosetStudio() {
  renderClosetCategories();
  renderClosetStats();
  renderOutfitPreview();
  renderOutfitHistory();
}

function renderClosetCategories() {
  const overlay = $("#closetCategoryOverlay");
  if (!overlay) return;

  overlay.innerHTML = CLOSET_TYPES
    .map((type) => {
      const items = state.clothes.filter((item) => getClothesDisplayType(item) === type);
      const slot = outfitSlotForType(type);
      const cards = items.length
        ? items
            .map((item) => {
              const active = Object.values(outfitSelection).includes(item.id);
              const photo = item.photo
                ? `<img src="${item.photo}" alt="${escapeAttr(item.name || type)}" />`
                : `<span class="closet-item-icon" aria-hidden="true">${clothesTypeIcon(type)}</span>`;
              return `
                <span class="closet-clothes-chip ${active ? "selected" : ""}" role="button" tabindex="0" data-outfit-pick="${slot}" data-id="${escapeAttr(item.id)}">
                  ${photo}
                  <b>${escapeHtml(item.name || type)}</b>
                </span>
              `;
            })
            .join("")
        : `<span class="closet-zone-empty">还没有${escapeHtml(type)}</span>`;

      return `
        <section class="closet-zone closet-zone-${escapeAttr(type)}">
          <header>${escapeHtml(type)}</header>
          <div class="closet-zone-items">${cards}</div>
        </section>
      `;
    })
    .join("");
}

function renderOutfitPreview() {
  const container = $("#outfitPreview");
  if (!container) return;
  const slots = [
    ["top", "上装"],
    ["bottom", "下装/裙子"],
    ["coat", "外套"],
    ["shoes", "鞋子"],
  ];

  container.innerHTML = slots
    .map(([slot, label]) => {
      const item = getClothesById(outfitSelection[slot]);
      const content = item
        ? item.photo
          ? `<img src="${item.photo}" alt="${escapeAttr(item.name || label)}" />`
          : `<span aria-hidden="true">${clothesTypeIcon(item.type)}</span>`
        : `<span aria-hidden="true">＋</span>`;
      return `
        <div class="outfit-slot ${item ? "filled" : ""}" data-slot="${slot}">
          <div class="outfit-slot-photo">${content}</div>
          <strong>${escapeHtml(label)}</strong>
          <p>${escapeHtml(item?.name || "点衣橱里的衣服选择")}</p>
          ${item ? `<button class="text-button" type="button" data-outfit-remove="${slot}">移除</button>` : ""}
        </div>
      `;
    })
    .join("");
}

function renderOutfitHistory() {
  const history = $("#outfitHistory");
  const meta = $("#outfitHistoryMeta");
  if (meta) meta.textContent = `${state.outfits.length} 套`;
  if (!history) return;
  if (!state.outfits.length) {
    history.innerHTML = `<div class="closet-empty-note">保存搭配后，会出现在这里。</div>`;
    return;
  }

  history.innerHTML = state.outfits
    .slice()
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 12)
    .map((outfit) => {
      const items = outfitItemIds(outfit)
        .map(getClothesById)
        .filter(Boolean);
      const thumbs = items
        .map((item) =>
          item.photo
            ? `<img src="${item.photo}" alt="${escapeAttr(item.name || "衣服")}" />`
            : `<span aria-hidden="true">${clothesTypeIcon(item.type)}</span>`
        )
        .join("");
      return `
        <button class="outfit-history-card" type="button" data-open-outfit="${escapeAttr(outfit.id)}">
          <span class="outfit-history-thumbs">${thumbs || "暂无"}</span>
          <b>${escapeHtml(outfit.name || "搭配方案")}</b>
          <small>${escapeHtml(formatDateLabel(outfit.createdAt))}</small>
        </button>
      `;
    })
    .join("");
}

function renderClosetStats() {
  setText($("#closetTotalCount"), `${state.clothes.length} 件`);

  const summary = $("#closetCategorySummary");
  if (summary) {
    summary.innerHTML = CLOSET_TYPES.map((type) => {
      const count = state.clothes.filter((item) => getClothesDisplayType(item) === type).length;
      return `
        <span>
          <b>${escapeHtml(type)}</b>
          <em>${count} 件</em>
        </span>
      `;
    }).join("");
  }

  const tip = $("#closetTipText");
  if (!tip) return;
  const topCount = state.clothes.filter((item) => getClothesDisplayType(item) === "上装").length;
  const bottomCount = state.clothes.filter((item) => ["下装", "裙子"].includes(getClothesDisplayType(item))).length;
  const shoeCount = state.clothes.filter((item) => getClothesDisplayType(item) === "鞋子").length;
  if (!state.clothes.length) {
    tip.textContent = "先拍几件常穿衣服，兔兔衣橱就能开始帮你搭配。";
  } else if (!topCount || !bottomCount || !shoeCount) {
    tip.textContent = "想要一键搭配更完整，建议补充上装、下装或裙子、鞋子。";
  } else {
    tip.textContent = "分类已经准备好了，点衣橱里的衣服，中央会生成完整穿搭。";
  }
}

function pickOutfitItem(slot, id) {
  if (!slot || !id || !(slot in outfitSelection)) return;
  outfitSelection[slot] = id;
  renderClosetStudio();
  showClosetToast("已加入今日穿搭");
}

function removeOutfitItem(slot) {
  if (!(slot in outfitSelection)) return;
  outfitSelection[slot] = "";
  renderClosetStudio();
}

function clearOutfitSelection() {
  Object.keys(outfitSelection).forEach((slot) => {
    outfitSelection[slot] = "";
  });
  renderClosetStudio();
}

function randomOutfit() {
  const pick = (types) => {
    const items = state.clothes.filter((item) => types.includes(getClothesDisplayType(item)));
    return items.length ? items[Math.floor(Math.random() * items.length)].id : "";
  };
  outfitSelection.top = pick(["上装"]);
  outfitSelection.bottom = pick(["下装", "裙子"]);
  outfitSelection.coat = pick(["外套"]);
  outfitSelection.shoes = pick(["鞋子"]);
  renderClosetStudio();
  if (outfitItemIds(outfitSelection).length) {
    ensureClosetOpen();
    showClosetToast("已帮你搭好一套");
  } else {
    alert("衣橱里还没有可搭配的衣服，先拍照添加几件吧。");
  }
}

function saveCurrentOutfit() {
  const ids = outfitItemIds(outfitSelection);
  if (!ids.length) {
    alert("请先在打开的衣橱里选择衣服，再保存搭配。");
    return;
  }
  const now = new Date().toISOString();
  state.outfits.unshift({
    id: uid(),
    name: `搭配 ${state.outfits.length + 1}`,
    ...outfitSelection,
    createdAt: now,
    updatedAt: now,
  });
  if (saveData()) {
    renderClosetStudio();
    showClosetToast("搭配已保存");
  }
}

function showClosetToast(message) {
  let toast = $(".closet-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "closet-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showClosetToast.timer);
  showClosetToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1700);
}

function loadSavedOutfit(id) {
  const outfit = state.outfits.find((item) => item.id === id);
  if (!outfit) return;
  Object.keys(outfitSelection).forEach((slot) => {
    outfitSelection[slot] = outfit[slot] || "";
  });
  setActiveTab("clothes");
  ensureClosetOpen();
  renderClosetStudio();
  focusMainVisual("clothes");
}

function outfitItemIds(source) {
  return ["top", "bottom", "coat", "shoes"].map((slot) => source[slot]).filter(Boolean);
}

function getClothesById(id) {
  return state.clothes.find((item) => item.id === id);
}

function outfitSlotForType(type) {
  const normalized = normalizeClothesType(type);
  if (normalized === "上装") return "top";
  if (normalized === "外套") return "coat";
  if (normalized === "鞋子") return "shoes";
  return "bottom";
}

function normalizeClothesType(type) {
  const text = cleanText(type);
  if (CLOSET_TYPES.includes(text)) return text;
  if (["上衣", "衬衫", "毛衣", "T恤", "短袖", "卫衣"].includes(text)) return "上装";
  if (["裤子", "短裤", "长裤", "半身裙"].includes(text)) return "下装";
  if (["连衣裙", "裙"].includes(text)) return "裙子";
  if (["大衣", "夹克", "风衣", "羽绒服"].includes(text)) return "外套";
  if (["鞋", "鞋履"].includes(text)) return "鞋子";
  return "";
}

function detectClothesType(text) {
  const value = cleanText(text).toLowerCase();
  if (!value) return "";
  const rules = [
    ["鞋子", ["鞋", "靴", "sneaker", "shoe", "boot", "loafer"]],
    ["外套", ["外套", "大衣", "风衣", "羽绒服", "夹克", "西装", "coat", "jacket", "blazer"]],
    ["裙子", ["裙", "连衣裙", "dress", "skirt"]],
    ["下装", ["裤", "牛仔裤", "短裤", "长裤", "pants", "jeans", "trousers", "shorts"]],
    ["上装", ["上衣", "衬衫", "t恤", "T恤", "短袖", "毛衣", "卫衣", "背心", "shirt", "top", "tee", "sweater", "hoodie"]],
  ];
  const matched = rules.find(([, keywords]) => keywords.some((keyword) => value.includes(keyword.toLowerCase())));
  return matched ? matched[0] : "";
}

function getClothesDisplayType(item) {
  return normalizeClothesType(item?.type) || detectClothesType(`${item?.name || ""} ${item?.note || ""}`) || "上装";
}

function clothesTypeIcon(type) {
  const icons = {
    上装: "上",
    下装: "下",
    裙子: "裙",
    外套: "外",
    鞋子: "鞋",
  };
  return icons[normalizeClothesType(type)] || "衣";
}

function formatDateLabel(value) {
  if (!value) return "刚刚";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "刚刚";
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function renderDates() {
  const list = filterBySearch(state.dates)
    .slice()
    .sort((a, b) => sortByDate(a.date, b.date));

  $("#dateListMeta").textContent = `${list.length} 个`;
  if (!list.length) {
    renderEmpty(elements.dateList, "还没有重要日期");
    renderDatesExperience();
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
            normalizeDateType(item.type),
            formatReminderLabel(item.remindDays)
          ])}
          ${cardActions("dates", item.id)}
        </article>
      `;
    })
    .join("");
  renderDatesExperience();
}

function renderDatesExperience() {
  if (!$("#dateModernList")) return;
  const allDates = state.dates.slice().sort((a, b) => sortByDate(a.date, b.date));
  const upcoming = allDates.filter((item) => daysUntil(item.date) >= 0);
  const soon = upcoming.filter((item) => daysUntil(item.date) <= 7);
  const nearest = upcoming[0];

  setText($("#dateTotalCount"), allDates.length);
  setText($("#dateSoonCount"), soon.length);
  setText($("#dateNearestText"), nearest ? `${nearest.name}（${getDateStatus(nearest).text}）` : "还没有日期");
  setText($("#dateSoonText"), soon.length ? `最近：${soon[0].name}` : "7 天内暂无提醒");

  renderDateFilters();
  renderModernDateList();
  renderDateCalendar();
}

function renderDateFilters() {
  const row = $("#dateFilterRow");
  if (!row) return;
  row.innerHTML = DATE_FILTERS.map((filter) => {
    const active = dateUiState.filter === filter;
    return `
      <button class="${active ? "active" : ""}" type="button" data-date-filter="${escapeAttr(filter)}">
        ${escapeHtml(filter)}
      </button>
    `;
  }).join("");
}

function renderModernDateList() {
  const container = $("#dateModernList");
  if (!container) return;
  const list = filterBySearch(state.dates)
    .filter((item) => dateMatchesFilter(item, dateUiState.filter))
    .slice()
    .sort((a, b) => sortByDate(a.date, b.date));

  if (!list.length) {
    container.innerHTML = `
      <div class="date-empty-card">
        <strong>还没有重要日期哦</strong>
        <span>添加生日、纪念日、证件到期等日期，起司会帮你排好倒计时。</span>
      </div>
    `;
    return;
  }

  container.innerHTML = list
    .map((item) => {
      const config = getDateTypeConfig(item.type);
      const status = getDateStatus(item);
      const urgent = status.level === "danger" || status.level === "warn" || daysUntil(item.date) <= Number(item.remindDays || 1);
      return `
        <article class="date-modern-card ${urgent ? "is-urgent" : ""}" style="--date-accent:${config.accent}">
          <div class="date-modern-icon" aria-hidden="true">${config.icon}</div>
          <div class="date-modern-main">
            <strong>${escapeHtml(item.name)}</strong>
            <span>${escapeHtml(formatDateDisplay(item.date))}</span>
            <small>${escapeHtml(formatReminderLabel(item.remindDays))}</small>
          </div>
          <div class="date-countdown">
            <b>${escapeHtml(status.text)}</b>
            <span>${escapeHtml(normalizeDateType(item.type))}</span>
          </div>
          <div class="date-modern-actions">
            <button type="button" data-edit-kind="dates" data-id="${escapeAttr(item.id)}">编辑</button>
            <button type="button" data-delete-kind="dates" data-id="${escapeAttr(item.id)}">删除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDateCalendar() {
  const title = $("#dateCalendarTitle");
  const grid = $("#dateCalendarGrid");
  if (!title || !grid) return;

  const monthDate = dateUiState.calendarDate;
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  title.textContent = `${year} 年 ${month + 1} 月`;

  const firstDay = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const today = toDateInputValue(new Date());
  const cells = [];

  for (let i = 0; i < firstDay; i += 1) {
    cells.push(`<span class="date-day-cell muted"></span>`);
  }

  for (let day = 1; day <= dayCount; day += 1) {
    const value = toDateInputValue(new Date(year, month, day));
    const items = state.dates.filter((item) => item.date === value);
    const selected = dateUiState.selectedDate === value;
    cells.push(`
      <button class="date-day-cell ${value === today ? "today" : ""} ${selected ? "selected" : ""} ${items.length ? "has-date" : ""}" type="button" data-date-day="${value}">
        <span>${day}</span>
        ${items.length ? `<i>${items.length}</i>` : ""}
      </button>
    `);
  }

  grid.innerHTML = cells.join("");
  renderSelectedDateDetail();
}

function renderSelectedDateDetail() {
  const container = $("#dateSelectedDetail");
  if (!container) return;
  const items = state.dates
    .filter((item) => item.date === dateUiState.selectedDate)
    .sort((a, b) => sortByDate(a.date, b.date));

  if (!items.length) {
    container.innerHTML = `
      <strong>${escapeHtml(formatDateDisplay(dateUiState.selectedDate))}</strong>
      <span>这一天还没有记录。</span>
    `;
    return;
  }

  container.innerHTML = `
    <strong>${escapeHtml(formatDateDisplay(dateUiState.selectedDate))}</strong>
    ${items
      .map((item) => {
        const config = getDateTypeConfig(item.type);
        return `<button type="button" data-edit-kind="dates" data-id="${escapeAttr(item.id)}">${config.icon} ${escapeHtml(item.name)} · ${escapeHtml(getDateStatus(item).text)}</button>`;
      })
      .join("")}
  `;
}

function openDateModal(item = {}) {
  setActiveTab("dates");
  const modal = $("#dateModal");
  const form = $("#dateQuickForm");
  if (!modal || !form) return;

  form.reset();
  form.elements.id.value = item.id || "";
  form.elements.name.value = item.name || "";
  form.elements.type.value = normalizeDateType(item.type || "生日");
  form.elements.date.value = item.date || dateUiState.selectedDate || toDateInputValue(new Date());
  form.elements.remindDays.value = String(item.remindDays || "1");
  form.elements.note.value = item.note || "";
  setText($("#dateModalTitle"), item.id ? "编辑重要日期" : "添加重要日期");
  modal.classList.remove("hidden");
  window.setTimeout(() => form.elements.name?.focus(), 80);
}

function closeDateModal() {
  const modal = $("#dateModal");
  const form = $("#dateQuickForm");
  if (!modal || !form) return;
  modal.classList.add("hidden");
  form.reset();
  form.elements.id.value = "";
}

function normalizeDateType(type) {
  const text = cleanText(type);
  if (["生日", "纪念日", "证件", "缴费", "医疗", "自定义"].includes(text)) return text;
  if (["证件到期", "身份证", "护照", "驾驶证", "签证"].includes(text)) return "证件";
  if (["健康", "体检", "复查", "预约检查"].includes(text)) return "医疗";
  if (["房租", "保险续费", "会员续费", "车险续费"].includes(text)) return "缴费";
  if (["结婚纪念日", "恋爱纪念日", "相识纪念日"].includes(text)) return "纪念日";
  return "自定义";
}

function getDateTypeConfig(type) {
  const normalized = normalizeDateType(type);
  return DATE_TYPES.find((item) => item.value === normalized) || DATE_TYPES[DATE_TYPES.length - 1];
}

function normalizeFileType(type) {
  const text = cleanText(type);
  if (FILE_TYPES.some((item) => item.value === text)) return text;
  if (["身份证", "护照", "驾驶证", "签证", "户口本", "证书"].includes(text)) return "证件";
  if (["保单", "车险", "保险单", "保险合同"].includes(text)) return "保险";
  if (["体检", "复查", "病历", "检查报告", "医疗报告", "处方"].includes(text)) return "医疗";
  if (["票据", "收据", "小票", "报销", "账单"].includes(text)) return "发票";
  return "其他";
}

function fileTypeIcon(type) {
  return FILE_TYPES.find((item) => item.value === normalizeFileType(type))?.icon || "📁";
}

function isPdfAttachment(item) {
  const src = typeof item === "string" ? item : item?.photo || "";
  const fileType = typeof item === "string" ? "" : item?.fileType || "";
  const fileName = typeof item === "string" ? "" : item?.fileName || "";
  return /^data:application\/pdf/i.test(src) || fileType === "application/pdf" || /\.pdf$/i.test(fileName);
}

function dateMatchesFilter(item, filter) {
  if (!filter || filter === "全部") return true;
  return normalizeDateType(item.type) === filter;
}

function formatDateDisplay(value) {
  if (!value) return "未填日期";
  const date = parseLocalDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatReminderLabel(value) {
  const days = Number(value || 1);
  return `提前 ${days} 天提醒`;
}

function renderStorage() {
  const list = filterBySearch(state.storage);
  renderFileCategories(list);
  $("#storageListMeta").textContent = `${list.length} 个文件`;
  if (!list.length) {
    elements.storageList.innerHTML = `
      <div class="empty-state file-empty-state">
        <strong>还没有文件哦</strong>
        <span>添加证件、保险、医疗等重要资料，统一整理更方便。</span>
      </div>
    `;
    return;
  }

  elements.storageList.innerHTML = list
    .map((item) => {
      const normalizedType = normalizeFileType(item.type);
      const attachmentBlock = item.photo
        ? isPdfAttachment(item)
          ? `<button class="text-button" type="button" data-open-file="${escapeAttr(item.photo)}" data-file-name="${escapeAttr(item.fileName || `${item.name || "文件"}.pdf`)}">打开 PDF</button>`
          : `<button class="text-button" type="button" data-open-photo="${escapeAttr(item.photo)}" data-caption="${escapeAttr(item.name || "文件照片")}">看文件照片</button>`
        : "";
      return `
        <article class="item-card storage-file-card" data-item-kind="storage" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4><span aria-hidden="true">${fileTypeIcon(normalizedType)}</span>${escapeHtml(item.name)}</h4>
            <span class="tag">${escapeHtml(normalizedType)}</span>
          </div>
          ${compactMeta([
            item.spot ? `位置 ${item.spot}` : "",
            item.fileName ? `附件 ${item.fileName}` : ""
          ])}
          <div class="card-actions">
            ${attachmentBlock}
            <button class="text-button" type="button" data-edit-kind="storage" data-id="${escapeAttr(item.id)}">编辑</button>
            <button class="text-button danger" type="button" data-delete-kind="storage" data-id="${escapeAttr(item.id)}">删除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderFileCategories(list = state.storage) {
  const overlay = $("#fileCategoryOverlay");
  if (!overlay) return;
  overlay.innerHTML = FILE_TYPES.map((type) => `
    <button type="button" data-file-category="${escapeAttr(type.value)}">
      <span aria-hidden="true">${type.icon}</span>
      <b>${escapeHtml(type.value)}</b>
    </button>
  `).join("");
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
  const tabByFurniture = {
    fridge: "fridge",
    closet: "clothes",
    clock: "dates",
    cabinet: "storage",
    pantry: "restock",
  };
  const tabName = tabByFurniture[button.dataset.furniture];
  if (tabName) {
    window.setTimeout(() => focusMainVisual(tabName), 160);
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

  if (input === elements.storagePhotoInput) {
    if (button.dataset.photoMode === "camera") {
      input.accept = "image/*";
      input.setAttribute("capture", "environment");
    } else {
      input.accept = "image/*,application/pdf";
      input.removeAttribute("capture");
    }
    input.value = "";
    input.click();
    return;
  }

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
    ensureClosetOpen();
    formToShow = elements.clothesForm;
  }

  if (kind === "dates") {
    if ($("#dateModal")) {
      openDateModal(item);
      return;
    }
    fillForm(elements.dateForm, item);
    setSubmitText(elements.dateForm, "更新日期");
    setActiveTab("dates");
    formToShow = elements.dateForm;
  }

  if (kind === "storage") {
    fillForm(elements.storageForm, item);
    showPreview(elements.storagePhotoPreview, item.photo);
    setSubmitText(elements.storageForm, "更新文件");
    setActiveTab("storage");
    $("#tab-storage")?.classList.add("file-editing");
    ensureFileOpen();
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
  setSubmitText(elements.storageForm, "保存文件");
  $("#tab-storage")?.classList.remove("file-editing");
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

function bindClothesAutoType() {
  const form = elements.clothesForm;
  if (!form) return;
  const nameField = form.elements.name;
  const typeField = form.elements.type;
  const noteField = form.elements.note;
  const applyDetectedType = () => {
    if (!typeField || typeField.value) return;
    const fileName = elements.clothesPhotoInput.files[0]?.name || "";
    const detected = detectClothesType(`${nameField?.value || ""} ${noteField?.value || ""} ${fileName}`);
    if (detected) typeField.value = detected;
  };

  nameField?.addEventListener("input", applyDetectedType);
  noteField?.addEventListener("input", applyDetectedType);
  elements.clothesPhotoInput?.addEventListener("change", () => {
    applyDetectedType();
    if (elements.clothesPhotoInput.files[0]) {
      ensureClosetOpen();
      window.setTimeout(() => {
        elements.clothesForm.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 220);
    }
  });
}

function showPreview(preview, dataUrl) {
  if (!dataUrl) {
    preview.classList.add("hidden");
    preview.style.backgroundImage = "";
    preview.textContent = "";
    preview.classList.remove("pdf-preview");
    return;
  }
  if (/^data:application\/pdf/i.test(dataUrl)) {
    preview.classList.remove("hidden");
    preview.classList.add("pdf-preview");
    preview.style.backgroundImage = "";
    preview.textContent = "PDF 文件已选择";
    return;
  }
  preview.classList.remove("hidden");
  preview.classList.remove("pdf-preview");
  preview.textContent = "";
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

function openFileAttachment(src, fileName = "赛博小管家文件") {
  if (!src) return;
  const link = document.createElement("a");
  link.href = src;
  link.target = "_blank";
  link.rel = "noopener";
  link.download = fileName || "赛博小管家文件";
  document.body.appendChild(link);
  link.click();
  link.remove();
  showFridgeToast("文件已打开，如未弹出请查看浏览器下载");
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
  const dueToday = state.dates.filter((item) => daysUntil(item.date) === Number(item.remindDays || 1));

  dueToday.forEach((item) => {
    const key = `${todayKey}-${item.id}-${item.date}`;
    if (notified[key]) return;
    const remindDays = Number(item.remindDays || 1);
    new Notification(`${remindDays} 天后有重要日期：${item.name}`, {
      body: item.note || `${item.date}，请提前准备。`,
    });
    notified[key] = true;
  });

  localStorage.setItem(NOTIFY_KEY, JSON.stringify(notified));

  if (showEmptyTip && !dueToday.length) {
    alert("当前没有需要现在提醒的重要日期。");
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
      const remindDays = Number(item.remindDays || 1);
      const description = [
        `类型：${normalizeDateType(item.type)}`,
        `提醒：提前 ${remindDays} 天`,
        item.note ? `备注：${item.note}` : "",
      ]
        .filter(Boolean)
        .join("\\n");

      return [
        "BEGIN:VEVENT",
        `UID:${icsEscape(item.id)}@family-home-page`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(item.name)}`,
        `DESCRIPTION:${icsEscape(description)}`,
        "BEGIN:VALARM",
        `TRIGGER;RELATED=START:-P${remindDays}D`,
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(`${remindDays} 天后：${item.name}`)}`,
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
    alert("已生成手机日历文件。iPhone 请用 Safari 打开并选择加入日历；每个日期会按你设置的提前天数提醒。若当前浏览器提示文件打开失败，请点右上角选择用 Safari 打开。");
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
