/* ============================================================
 * 情绪岛小程序 - 数据持久化版本
 * 改动范围：仅数据层（存储/读取/新增/删除）
 * UI 逻辑零改动
 * ============================================================ */

const scenes = {
  happy: "/assets/happy.jpg",
  anxious: "/assets/anxious.jpg",
  calm: "/assets/calm.jpg",
  angry: "/assets/angry.jpg",
  sad: "/assets/sad.jpg",
  records: "/assets/records.jpg",
  profile: "/assets/profile.jpg"
};

const particlePresets = {
  happy: [
    { left: 17, top: 39, delay: 0 },
    { left: 29, top: 48, delay: 70 },
    { left: 44, top: 35, delay: 130 },
    { left: 59, top: 46, delay: 30 },
    { left: 75, top: 38, delay: 100 },
    { left: 63, top: 61, delay: 180 },
    { left: 37, top: 64, delay: 210 }
  ],
  anxious: [
    { left: 9, top: 31, delay: 0 },
    { left: 23, top: 38, delay: 120 },
    { left: 48, top: 34, delay: 60 },
    { left: 68, top: 43, delay: 180 },
    { left: 85, top: 37, delay: 80 },
    { left: 15, top: 52, delay: 220 },
    { left: 73, top: 60, delay: 160 }
  ],
  calm: [
    { left: 27, top: 39, delay: 0 },
    { left: 50, top: 49, delay: 100 },
    { left: 71, top: 42, delay: 180 },
    { left: 39, top: 64, delay: 240 },
    { left: 61, top: 67, delay: 320 }
  ],
  angry: [
    { left: 50, top: 38, delay: 0 },
    { left: 45, top: 41, delay: 80 },
    { left: 54, top: 42, delay: 160 },
    { left: 48, top: 46, delay: 220 },
    { left: 57, top: 47, delay: 280 },
    { left: 52, top: 51, delay: 360 }
  ],
  sad: [
    { left: 14, top: 18, delay: 0 },
    { left: 28, top: 15, delay: 80 },
    { left: 42, top: 20, delay: 160 },
    { left: 56, top: 16, delay: 40 },
    { left: 70, top: 19, delay: 120 },
    { left: 84, top: 14, delay: 200 },
    { left: 21, top: 38, delay: 260 },
    { left: 62, top: 35, delay: 320 }
  ]
};

/* ---------- 默认示例数据（保持 object 格式，兼容 ttml 中的 data-id）---------- */
const defaultRecords = {
  sadToday: {
    id: "sadToday",
    mood: "悲伤",
    moodKey: "sad",
    face: "☹",
    date: "05月20日",
    time: "14:30",
    strength: 4,
    thought: "有点难过的一天... 💧",
    feelings: ["失落", "孤单", "疲惫", "压力大"],
    scene: "学校 · 教室",
    doing: "写作业",
    note: "和朋友吵架了，心里不太舒服。"
  },
  calmYesterday: {
    id: "calmYesterday",
    mood: "平静",
    moodKey: "calm",
    face: "⌣",
    date: "05月19日",
    time: "20:30",
    strength: 2,
    thought: "感觉好多了，和朋友和好了。和朋友聊了聊天，心情变好了～",
    feelings: ["放松", "安心", "释然"],
    scene: "家",
    doing: "和朋友聊天",
    note: "昨天慢慢说开了，心里轻松很多。"
  }
};

/* ---------- 新增：情绪名称/表情映射 ---------- */
const moodNameMap = {
  happy: "开心",
  anxious: "焦虑",
  calm: "平静",
  angry: "愤怒",
  sad: "悲伤"
};

const moodFaceMap = {
  happy: "☺",
  anxious: "◰",
  calm: "⌣",
  angry: "◬",
  sad: "☹"
};

/* ---------- 本地存储 Key（v2 避免与旧数据冲突）---------- */
const STORAGE_RECORDS = "emotion-island-records-v2";
const STORAGE_MOOD = "emotion-island-mood";

const feelingLabels = ["失落", "孤单", "疲惫", "压力大", "难受", "委屈", "沮丧", "烦躁", "焦虑", "放松", "安心", "释然"];
const sceneLabels = [
  { label: "学校", icon: "🏫" },
  { label: "教室", icon: "▰" },
  { label: "实验室", icon: "⚗" },
  { label: "家", icon: "⌂" },
  { label: "图书馆", icon: "▥" },
  { label: "电影院", icon: "▣" },
  { label: "户外", icon: "♣" },
  { label: "自定义", icon: "+" }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeStrengthDots(strength) {
  return [1, 2, 3, 4, 5].map((value) => ({
    value,
    active: value <= strength
  }));
}

function makeFeelingTags(feelings) {
  const all = Array.from(new Set([...feelingLabels, ...(feelings || [])]));
  return all.map((label) => ({
    label,
    selected: (feelings || []).includes(label)
  }));
}

function makeSceneOptions(scene) {
  return sceneLabels.map((item) => ({
    ...item,
    selected: scene && scene.indexOf(item.label) !== -1
  }));
}

/* ---------- 新增：工具函数 ---------- */

/** 生成唯一记录 ID */
function genId() {
  return "r_" + Date.now();
}

/** 格式化日期为 "MM月DD日" */
function formatDate(d) {
  var m = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return m + "月" + day + "日";
}

/** 格式化时间为 "HH:MM" */
function formatTime(d) {
  var h = String(d.getHours()).padStart(2, "0");
  var min = String(d.getMinutes()).padStart(2, "0");
  return h + ":" + min;
}

/** 持久化写入记录 */
function persistRecords(records) {
  try {
    tt.setStorageSync(STORAGE_RECORDS, records);
  } catch (e) { /* 静默失败 */ }
}

/** 持久化写入心情 */
function persistMood(mood) {
  try {
    tt.setStorageSync(STORAGE_MOOD, mood);
  } catch (e) { /* 静默失败 */ }
}

/** 从本地存储读取记录，无数据时返回默认记录 */
function loadRecords() {
  try {
    var saved = tt.getStorageSync(STORAGE_RECORDS);
    if (saved && typeof saved === "object" && Object.keys(saved).length > 0) {
      return saved;
    }
  } catch (e) { /* 静默失败 */ }
  return clone(defaultRecords);
}

/** 从本地存储读取心情 */
function loadMood() {
  try {
    var saved = tt.getStorageSync(STORAGE_MOOD);
    if (saved && scenes[saved]) return saved;
  } catch (e) { /* 静默失败 */ }
  return "happy";
}

/* ============================================================
 * Page 定义
 * ============================================================ */
Page({
  data: {
    page: "island",
    mood: "happy",
    screenSrc: scenes.happy,
    pickerOpen: false,
    changing: false,
    shellClass: "",
    showScreen: true,
    showPlus: true,
    showSound: true,
    showNav: true,
    showRecordsHotspots: false,
    showProfileHotspots: false,
    showDetailPage: false,
    showEditPage: false,
    toastText: "",
    particles: [],
    records: clone(defaultRecords),
    currentRecordId: "sadToday",
    currentRecord: clone(defaultRecords.sadToday),
    relatedRecord: clone(defaultRecords.calmYesterday),
    editingRecordId: "sadToday",
    editDraft: clone(defaultRecords.sadToday),
    focusField: "",
    thoughtCount: defaultRecords.sadToday.thought.length,
    doingCount: defaultRecords.sadToday.doing.length,
    noteCount: defaultRecords.sadToday.note.length,
    strengthDots: makeStrengthDots(defaultRecords.sadToday.strength),
    feelingTags: makeFeelingTags(defaultRecords.sadToday.feelings),
    sceneOptions: makeSceneOptions(defaultRecords.sadToday.scene)
  },

  /* ---------- 生命周期：加载时从本地存储恢复数据 ---------- */
  onLoad() {
    var records = loadRecords();
    var mood = loadMood();

    // 取第一条记录作为当前记录，第二条作为关联记录
    var ids = Object.keys(records);
    var currentId = ids[0] || "sadToday";
    var current = records[currentId] || clone(defaultRecords.sadToday);
    var relatedId = ids[1] || ids[0] || "calmYesterday";
    var related = records[relatedId] || clone(defaultRecords.calmYesterday);

    this.setData({
      mood: mood,
      screenSrc: scenes[mood],
      records: records,
      currentRecordId: currentId,
      currentRecord: clone(current),
      relatedRecord: clone(related),
      editingRecordId: currentId,
      editDraft: clone(current),
      thoughtCount: current.thought.length,
      doingCount: current.doing.length,
      noteCount: current.note.length,
      strengthDots: makeStrengthDots(current.strength),
      feelingTags: makeFeelingTags(current.feelings),
      sceneOptions: makeSceneOptions(current.scene)
    });
  },

  /* ---------- 工具方法 ---------- */

  getScreenSrc(page, mood) {
    if (page === "records") return scenes.records;
    if (page === "profile") return scenes.profile;
    return scenes[mood];
  },

  /** 按 ID 查找记录，找不到则返回第一条 */
  getRecord(id) {
    if (this.data.records[id]) return this.data.records[id];
    var ids = Object.keys(this.data.records);
    return ids.length > 0 ? this.data.records[ids[0]] : clone(defaultRecords.sadToday);
  },

  /** 获取关联记录 ID（相邻的一条） */
  getRelatedId(id) {
    var ids = Object.keys(this.data.records);
    if (ids.length <= 1) return id; // 只有一条记录，返回自身
    var idx = ids.indexOf(id);
    if (idx < 0) idx = 0;
    // 返回下一条，如果是最后一条则返回前一条
    var nextIdx = idx < ids.length - 1 ? idx + 1 : idx - 1;
    return ids[nextIdx];
  },

  /** 同步当前/关联记录状态到视图 */
  syncRecordState(id) {
    var currentRecord = clone(this.getRecord(id));
    var relatedId = this.getRelatedId(id);
    var relatedRecord = clone(this.getRecord(relatedId));
    this.setData({
      currentRecordId: id,
      currentRecord: currentRecord,
      relatedRecord: relatedRecord
    });
  },

  /* ---------- 页面切换 ---------- */

  setPage(page) {
    this.setData({
      page: page,
      pickerOpen: false,
      showScreen: page === "island" || page === "records" || page === "profile",
      screenSrc: this.getScreenSrc(page, this.data.mood),
      showPlus: page === "island",
      showSound: page === "island",
      showNav: page === "island" || page === "records" || page === "profile",
      showRecordsHotspots: page === "records",
      showProfileHotspots: page === "profile",
      showDetailPage: page === "detail",
      showEditPage: page === "edit"
    });
  },

  showToast(message) {
    clearTimeout(this.toastTimer);
    this.setData({ toastText: message });
    this.toastTimer = setTimeout(() => {
      this.setData({ toastText: "" });
    }, 1800);
  },

  /* ---------- 情绪选择器 ---------- */

  openPicker() {
    if (this.data.changing || this.data.page !== "island") return;
    this.setData({ pickerOpen: true });
  },

  closePicker() {
    this.setData({ pickerOpen: false });
  },

  /** 选择情绪 → 切换岛屿画面 + 自动创建新记录 */
  selectMood(event) {
    var nextMood = event.currentTarget.dataset.mood;
    if (!scenes[nextMood] || this.data.changing) return;

    persistMood(nextMood);

    // 创建一条新的情绪记录
    var now = new Date();
    var newId = genId();
    var newRecord = {
      id: newId,
      mood: moodNameMap[nextMood] || nextMood,
      moodKey: nextMood,
      face: moodFaceMap[nextMood] || "◡",
      date: formatDate(now),
      time: formatTime(now),
      strength: 3,
      thought: "",
      feelings: [],
      scene: "",
      doing: "",
      note: ""
    };

    // 新记录插入最前面，持久化保存
    var records = {};
    records[newId] = newRecord;
    var oldIds = Object.keys(this.data.records);
    for (var i = 0; i < oldIds.length; i++) {
      records[oldIds[i]] = this.data.records[oldIds[i]];
    }
    persistRecords(records);

    // 关联记录 = 之前的最新一条
    var relatedRecord = oldIds.length > 0
      ? clone(this.data.records[oldIds[0]])
      : clone(newRecord);

    this.setData({
      page: "island",
      mood: nextMood,
      screenSrc: scenes[nextMood],
      pickerOpen: false,
      particles: particlePresets[nextMood] || [],
      changing: true,
      shellClass: "is-changing fx-" + nextMood,
      showScreen: true,
      showPlus: true,
      showSound: true,
      showNav: true,
      showRecordsHotspots: false,
      showProfileHotspots: false,
      showDetailPage: false,
      showEditPage: false,
      records: records,
      currentRecordId: newId,
      currentRecord: clone(newRecord),
      relatedRecord: relatedRecord
    });

    setTimeout(() => {
      this.setData({
        changing: false,
        shellClass: "",
        particles: []
      });
    }, 980);
  },

  /* ---------- 底部导航 ---------- */

  goIsland() {
    if (this.data.changing) return;
    this.setPage("island");
  },

  goRecords() {
    if (this.data.changing) return;
    this.setPage("records");
  },

  goProfile() {
    if (this.data.changing) return;
    this.setPage("profile");
  },

  /* ---------- 记录详情/编辑 ---------- */

  openRecordDetail(event) {
    var id = event.currentTarget.dataset.id || "sadToday";
    this.syncRecordState(id);
    this.setPage("detail");
  },

  openRelatedRecord() {
    var id = this.getRelatedId(this.data.currentRecordId);
    this.syncRecordState(id);
    this.setPage("detail");
  },

  openEditRecord() {
    this.openEditForRecord(this.data.currentRecordId, "");
  },

  openEditField(event) {
    this.openEditForRecord(this.data.currentRecordId, event.currentTarget.dataset.field || "");
  },

  recordRelatedMoment() {
    this.openEditForRecord(this.getRelatedId(this.data.currentRecordId), "");
  },

  openEditForRecord(id, focusField) {
    var draft = clone(this.getRecord(id));
    this.setData({
      editingRecordId: id,
      currentRecordId: id,
      editDraft: draft,
      focusField: focusField,
      thoughtCount: draft.thought.length,
      doingCount: draft.doing.length,
      noteCount: draft.note.length,
      strengthDots: makeStrengthDots(draft.strength),
      feelingTags: makeFeelingTags(draft.feelings),
      sceneOptions: makeSceneOptions(draft.scene)
    });
    this.setPage("edit");
  },

  backFromEdit() {
    this.syncRecordState(this.data.currentRecordId);
    this.setPage("detail");
  },

  /* ---------- 编辑表单交互（UI 逻辑不变）---------- */

  onEditInput(event) {
    var field = event.currentTarget.dataset.field;
    var value = event.detail.value;
    if (!field) return;
    var update = {};
    update["editDraft." + field] = value;
    update[field + "Count"] = value.length;
    this.setData(update);
  },

  setStrength(event) {
    var strength = Number(event.currentTarget.dataset.value);
    this.setData({
      "editDraft.strength": strength,
      strengthDots: makeStrengthDots(strength)
    });
  },

  toggleFeeling(event) {
    var label = event.currentTarget.dataset.label;
    var feelings = this.data.editDraft.feelings.slice();
    var index = feelings.indexOf(label);
    if (index >= 0) feelings.splice(index, 1);
    else feelings.push(label);
    this.setData({
      "editDraft.feelings": feelings,
      feelingTags: makeFeelingTags(feelings)
    });
  },

  addFeeling() {
    this.showToast("可继续选择：难受、委屈、沮丧、烦躁、焦虑");
  },

  selectScene(event) {
    var label = event.currentTarget.dataset.label;
    if (label === "自定义") {
      this.showToast("自定义场景入口已响应");
      return;
    }
    var scene = label === "学校" ? "学校 · 教室" : label;
    this.setData({
      "editDraft.scene": scene,
      sceneOptions: makeSceneOptions(scene)
    });
  },

  /** 保存编辑 → 持久化到本地存储 */
  saveEditRecord() {
    var id = this.data.editingRecordId;
    var records = {};
    // 复制所有现有记录
    var keys = Object.keys(this.data.records);
    for (var i = 0; i < keys.length; i++) {
      records[keys[i]] = this.data.records[keys[i]];
    }
    // 用编辑后的草稿覆盖当前记录
    records[id] = clone(this.data.editDraft);
    // 持久化
    persistRecords(records);
    this.setData({ records: records });
    this.syncRecordState(id);
    this.setPage("detail");
    this.showToast("记录已保存 ✓");
  },

  /* ---------- 其他操作 ---------- */

  toggleSound() {
    this.showToast("音效已切换");
  },

  sortRecords() {
    this.showToast("已按最新记录排序");
  },

  showMoreActions() {
    this.showToast("更多操作已打开");
  },

  /** 删除记录 → 真正从数据和存储中移除 */
  deleteRecord() {
    var id = this.data.currentRecordId;
    var records = {};
    var keys = Object.keys(this.data.records);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== id) {
        records[keys[i]] = this.data.records[keys[i]];
      }
    }
    // 至少保留一条记录，避免空数据
    if (Object.keys(records).length === 0) {
      records["sadToday"] = clone(defaultRecords.sadToday);
    }
    persistRecords(records);
    this.setData({ records: records });

    // 跳转到记录页，显示剩余第一条
    var firstId = Object.keys(records)[0];
    this.syncRecordState(firstId);
    this.setPage("records");
    this.showToast("记录已删除");
  },

  exportRecord() {
    this.showToast("记录已导出");
  },

  showProfileToast(event) {
    this.showToast(event.currentTarget.dataset.toast || "功能已响应");
  },

  onShareAppMessage() {
    return {
      title: "情绪岛记录",
      path: "/pages/index/index"
    };
  }
});
