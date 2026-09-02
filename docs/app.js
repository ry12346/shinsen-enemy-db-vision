const APP_VERSION = "1.7.1";
const INTEL_TITLE_LEVELS = Object.freeze([
  { threshold: 30, label: "斥候" },
  { threshold: 80, label: "間者" },
  { threshold: 180, label: "忍頭" },
  { threshold: 350, label: "御庭番" },
  { threshold: 600, label: "諜報奉行" },
]);
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.2/+esm";

const config = window.SHINSEN_DB_CONFIG ?? {};
const app = document.getElementById("app");
const toastRegion = document.getElementById("toast-region");
const imageDialog = document.getElementById("image-dialog");
const dialogImage = document.getElementById("dialog-image");
const loadingTemplate = document.getElementById("loading-template");

const normalizedSupabaseUrl = String(config.supabaseUrl ?? "").trim().replace(/\/+$/, "");
const normalizedPublishableKey = String(config.supabasePublishableKey ?? "").trim();
const normalizedFunctionName = String(config.functionName || "api").trim() || "api";

const isConfigured =
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(normalizedSupabaseUrl) &&
  !normalizedPublishableKey.includes("YOUR_") &&
  normalizedPublishableKey.length > 20;

const supabase = isConfigured
  ? createClient(normalizedSupabaseUrl, normalizedPublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

const state = {
  session: null,
  member: null,
  view: "enemies",
  enemies: [],
  currentEnemy: null,
  editingObservationId: null,
  editDraft: null,
  enemySearch: "",
  uploadQueue: [],
  activeUploadId: null,
  draft: null,
  draftUploadId: null,
  rawOcrText: "",
  analysisCached: false,
  analysisHash: "",
  suggestions: { generals: [], tactics: [] },
  masters: { generals: [], tactics: [] },
  masterType: "general",
  masterSearch: "",
  usage: null,
  admin: null,
  currentSeason: "未設定",
  systemStatus: null,
  intel: null,
};

const OCR_SHEET_VERSION = "field-sheet-v4";
const OCR_SHEET_WIDTH = 1800;
const OCR_SHEET_MARGIN = 24;
const OCR_SHEET_ROW_HEIGHT = 96;
const OCR_SHEET_ROW_GAP = 12;
const OCR_SHEET_LABEL_WIDTH = 220;
const OCR_FIELD_KEYS = [
  "GROUP",
  "PLAYER",
  "G1_NAME",
  "G1_LEVEL",
  "G1_INHERENT",
  "G1_T1",
  "G1_T2",
  "G2_NAME",
  "G2_LEVEL",
  "G2_INHERENT",
  "G2_T1",
  "G2_T2",
  "G3_NAME",
  "G3_LEVEL",
  "G3_INHERENT",
  "G3_T1",
  "G3_T2",
];

function makeRect(x1, x2, y1, y2) {
  return { x1, x2, y1, y2 };
}

function portraitPhoneOcrProfile() {
  return {
    id: "portrait-phone-fields-v4",
    meta: {
      left: {
        // 長い一門名も途中で切れないよう、プレイヤー名の直前まで広く切り出す。
        group: makeRect(0.025, 0.228, 0.126, 0.161),
        player: makeRect(0.235, 0.505, 0.126, 0.161),
      },
      right: {
        group: makeRect(0.515, 0.732, 0.126, 0.161),
        player: makeRect(0.735, 0.992, 0.126, 0.161),
      },
    },
    columns: {
      left: [
        [0.05, 0.195],
        [0.198, 0.342],
        [0.345, 0.49],
      ],
      right: [
        [0.51, 0.655],
        [0.657, 0.802],
        [0.805, 0.95],
      ],
    },
    rows: {
      name: [0.263, 0.291],
      level: [0.284, 0.306],
      red: [0.285, 0.305],
      inherent: [0.326, 0.35],
      tactic1: [0.412, 0.438],
      tactic2: [0.5, 0.526],
    },
    jewel: { start: 0.5, step: 0.1, halfWidth: 0.035 },
  };
}

function isTallAndroidPortraitPhone(file) {
  if (!file || file.orientation !== "portrait" || file.captureType === "game") return false;
  const width = Number(file.width || 0);
  const height = Number(file.height || 0);
  if (!width || !height) return false;
  // Androidの20:9系スクリーンショットでは、ゲームUI上部（一門・プレイヤー名）が
  // iPhone系より約3%上へ寄る。一方カード本体の正規化座標はほぼ共通。
  // 既存iPhoneプロファイルを壊さないよう、縦横比が十分に縦長な端末だけ分岐する。
  return height / width >= 2.19;
}

function portraitAndroidPhoneOcrProfile() {
  const profile = portraitPhoneOcrProfile();
  return {
    ...profile,
    id: "portrait-phone-fields-v5",
    meta: {
      left: {
        // 紋章アイコンを避けつつ、長めの一門名をプレイヤー名直前まで確保する。
        group: makeRect(0.065, 0.268, 0.108, 0.135),
        player: makeRect(0.278, 0.505, 0.108, 0.135),
      },
      right: {
        group: makeRect(0.620, 0.790, 0.108, 0.135),
        player: makeRect(0.800, 0.990, 0.108, 0.135),
      },
    },
    // Android 20:9系では珠列がカード列内でiPhoneより右寄り。
    // IMG_2459で 2凸 / 3凸 / 4凸 を正しく分離できる位置へ補正。
    jewel: { start: 0.57, step: 0.095, halfWidth: 0.04 },
  };
}

function portraitGameOcrProfile() {
  const profile = portraitPhoneOcrProfile();
  return {
    ...profile,
    id: "portrait-game-fields-v4",
    // ゲーム内保存画像はロゴ帯の分だけ部隊欄が下へ寄る。
    rows: {
      name: [0.283, 0.311],
      level: [0.304, 0.326],
      red: [0.305, 0.325],
      inherent: [0.346, 0.37],
      tactic1: [0.432, 0.458],
      tactic2: [0.52, 0.546],
    },
  };
}

function landscapePhoneOcrProfile() {
  return {
    id: "landscape-phone-fields-v4",
    meta: {
      left: {
        group: makeRect(0.10, 0.325, 0.085, 0.145),
        player: makeRect(0.34, 0.445, 0.085, 0.145),
      },
      right: {
        group: makeRect(0.625, 0.875, 0.085, 0.145),
        player: makeRect(0.505, 0.615, 0.085, 0.145),
      },
    },
    columns: {
      left: [
        [0.145, 0.228],
        [0.23, 0.315],
        [0.317, 0.402],
      ],
      right: [
        [0.532, 0.615],
        [0.617, 0.705],
        [0.708, 0.795],
      ],
    },
    rows: {
      // 横画面では武将名のすぐ上に「潰走」やS3等の表示が重なる。
      // 名前の文字帯だけへ絞り、状態表示を武将名として拾わないようにする。
      name: [0.397, 0.435],
      level: [0.432, 0.47],
      red: [0.42, 0.455],
      // 戦法ボタンも上下を少し絞り、文字をOCR用シート上で大きくする。
      inherent: [0.535, 0.585],
      tactic1: [0.682, 0.735],
      tactic2: [0.836, 0.888],
    },
    jewel: { start: 0.5, step: 0.1, halfWidth: 0.035 },
  };
}

function landscapeGameOcrProfile() {
  return {
    id: "landscape-game-fields-v4",
    meta: {
      left: {
        group: makeRect(0.10, 0.33, 0.08, 0.145),
        player: makeRect(0.38, 0.46, 0.08, 0.145),
      },
      right: {
        group: makeRect(0.65, 0.88, 0.08, 0.145),
        player: makeRect(0.525, 0.64, 0.08, 0.145),
      },
    },
    columns: {
      left: [
        [0.173, 0.255],
        [0.258, 0.344],
        [0.347, 0.432],
      ],
      right: [
        [0.557, 0.644],
        [0.646, 0.733],
        [0.737, 0.825],
      ],
    },
    rows: {
      name: [0.37, 0.46],
      level: [0.415, 0.49],
      red: [0.425, 0.465],
      inherent: [0.545, 0.605],
      tactic1: [0.695, 0.755],
      // 横画面のゲーム内スクショでは第2戦法がロゴで隠れるため、切り出さない。
      tactic2: null,
    },
    jewel: { start: 0.5, step: 0.1, halfWidth: 0.035 },
  };
}

function getOcrProfile(file) {
  if (file.orientation === "portrait") {
    if (file.captureType === "game") return portraitGameOcrProfile();
    if (isTallAndroidPortraitPhone(file)) return portraitAndroidPhoneOcrProfile();
    return portraitPhoneOcrProfile();
  }
  if (file.captureType === "game") return landscapeGameOcrProfile();
  return landscapePhoneOcrProfile();
}

function buildOcrFieldRows(file) {
  const profile = getOcrProfile(file);
  const side = file.enemySide === "left" ? "left" : "right";
  const visualColumns = side === "right" ? [2, 1, 0] : [0, 1, 2];
  const rows = [
    { key: "GROUP", rect: profile.meta[side].group, mode: "light" },
    { key: "PLAYER", rect: profile.meta[side].player, mode: "light" },
  ];

  for (let slot = 1; slot <= 3; slot += 1) {
    const visualIndex = visualColumns[slot - 1];
    const [x1, x2] = profile.columns[side][visualIndex];
    const add = (suffix, yRange, mode = "light") => {
      let cropX1 = x1;
      let cropX2 = x2;
      // 横画面の戦法ボタン左端にはランク記号(S/A等)があり、
      // その記号が先頭文字と混ざるとGoogle Visionが「一力」などを落とすことがある。
      // スマホ標準スクショではボタン本文だけを広めに残して切り出す。
      if (
        file.orientation === "landscape" &&
        file.captureType !== "game" &&
        ["INHERENT", "T1", "T2"].includes(suffix)
      ) {
        const width = x2 - x1;
        cropX1 = x1 + width * 0.20;
        cropX2 = x2 - width * 0.02;
      }
      rows.push({
        key: `G${slot}_${suffix}`,
        rect: yRange ? makeRect(cropX1, cropX2, yRange[0], yRange[1]) : null,
        mode,
      });
    };
    add("NAME", profile.rows.name, "dark");
    add("LEVEL", profile.rows.level, "dark");
    add("INHERENT", profile.rows.inherent, "light");
    add("T1", profile.rows.tactic1, "light");
    add("T2", profile.rows.tactic2, "light");
  }

  return { profile, rows };
}

function drawCropIntoBox(context, image, rect, box, filter = "none") {
  if (!rect) {
    context.save();
    context.fillStyle = "#f3f4f6";
    context.fillRect(box.x, box.y, box.w, box.h);
    context.strokeStyle = "#d1d5db";
    context.strokeRect(box.x, box.y, box.w, box.h);
    context.fillStyle = "#6b7280";
    context.font = "600 26px system-ui, sans-serif";
    context.textBaseline = "middle";
    context.fillText("画像外", box.x + 18, box.y + box.h / 2);
    context.restore();
    return;
  }

  const sx = clamp(Math.round(rect.x1 * image.naturalWidth), 0, image.naturalWidth - 1);
  const sy = clamp(Math.round(rect.y1 * image.naturalHeight), 0, image.naturalHeight - 1);
  const ex = clamp(Math.round(rect.x2 * image.naturalWidth), sx + 1, image.naturalWidth);
  const ey = clamp(Math.round(rect.y2 * image.naturalHeight), sy + 1, image.naturalHeight);
  const sw = Math.max(1, ex - sx);
  const sh = Math.max(1, ey - sy);
  const scale = Math.min(box.w / sw, box.h / sh);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const dx = Math.round(box.x + (box.w - dw) / 2);
  const dy = Math.round(box.y + (box.h - dh) / 2);

  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if ("filter" in context) context.filter = filter;
  context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  context.restore();
}


function detectRedLevelFromCard(image, cardRect, redRange, jewel) {
  const sx = clamp(Math.round(cardRect[0] * image.naturalWidth), 0, image.naturalWidth - 1);
  const ex = clamp(Math.round(cardRect[1] * image.naturalWidth), sx + 1, image.naturalWidth);
  const sy = clamp(Math.round(redRange[0] * image.naturalHeight), 0, image.naturalHeight - 1);
  const ey = clamp(Math.round(redRange[1] * image.naturalHeight), sy + 1, image.naturalHeight);
  const width = Math.max(1, ex - sx);
  const height = Math.max(1, ey - sy);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) return { level: null, confidence: 0, jewels: [] };
  context.drawImage(image, sx, sy, width, height, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;
  const jewels = [];

  for (let slot = 0; slot < 5; slot += 1) {
    const center = (jewel.start + slot * jewel.step) * width;
    const startX = clamp(Math.floor(center - jewel.halfWidth * width), 0, width - 1);
    const endX = clamp(Math.ceil(center + jewel.halfWidth * width), startX + 1, width);
    let redPixels = 0;
    let goldPixels = 0;
    let totalPixels = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const offset = (y * width + x) * 4;
        const r = pixels[offset];
        const g = pixels[offset + 1];
        const b = pixels[offset + 2];
        totalPixels += 1;

        const isRed =
          r > 110 &&
          g < r * 0.62 &&
          b < r * 0.72 &&
          r - g > 35;
        const isGold =
          !isRed &&
          r > 120 &&
          g > 65 &&
          g < r * 0.93 &&
          b < g * 0.75 &&
          r - b > 70;
        if (isRed) redPixels += 1;
        else if (isGold) goldPixels += 1;
      }
    }

    const redRatio = totalPixels ? redPixels / totalPixels : 0;
    const goldRatio = totalPixels ? goldPixels / totalPixels : 0;
    let kind = "unknown";
    if (Math.max(redRatio, goldRatio) >= 0.045) {
      // 金色の珠にも赤い縁が含まれるため、赤と金の比率を比較して判定する。
      if (redRatio > 0.07 && (goldRatio < 0.08 || redRatio >= goldRatio * 0.8)) {
        kind = "red";
      } else if (goldRatio >= 0.05) {
        kind = "gold";
      } else if (redRatio > goldRatio) {
        kind = "red";
      }
    }
    jewels.push({ kind, redRatio, goldRatio, strength: Math.max(redRatio, goldRatio) });
  }

  if (jewels.some((item) => item.kind === "unknown")) {
    return { level: null, confidence: 0, jewels };
  }
  const averageStrength = jewels.reduce((sum, item) => sum + item.strength, 0) / jewels.length;
  return {
    level: jewels.filter((item) => item.kind === "red").length,
    confidence: clamp(0.72 + Math.min(0.24, averageStrength), 0, 0.96),
    jewels,
  };
}

function detectRedLevels(image, file, profile) {
  const side = file.enemySide === "left" ? "left" : "right";
  const visualColumns = side === "right" ? [2, 1, 0] : [0, 1, 2];
  const analyses = visualColumns.map((visualIndex) =>
    detectRedLevelFromCard(
      image,
      profile.columns[side][visualIndex],
      profile.rows.red,
      profile.jewel,
    )
  );
  return {
    levels: analyses.map((analysis) => analysis.level),
    confidence: analyses.map((analysis) => analysis.confidence),
    source: "color-jewel-v2",
  };
}

async function buildOcrSheet(file) {
  const { profile, rows } = buildOcrFieldRows(file);
  const cacheKey = `${OCR_SHEET_VERSION}|${profile.id}|${file.enemySide}|${file.captureType}`;
  if (file.ocrPrepared?.cacheKey === cacheKey) return file.ocrPrepared;

  if (file.ocrPrepared?.previewUrl) URL.revokeObjectURL(file.ocrPrepared.previewUrl);
  const image = await loadImage(file.previewUrl);
  const height =
    OCR_SHEET_MARGIN * 2 +
    OCR_SHEET_ROW_HEIGHT * OCR_FIELD_KEYS.length +
    OCR_SHEET_ROW_GAP * (OCR_FIELD_KEYS.length - 1);
  const canvas = document.createElement("canvas");
  canvas.width = OCR_SHEET_WIDTH;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new AppError("OCR用画像を作成できませんでした。");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "middle";

  const firstBox = { x: OCR_SHEET_LABEL_WIDTH + 20, w: 730 };
  const secondBox = { x: OCR_SHEET_LABEL_WIDTH + 790, w: 730 };

  rows.forEach((row, index) => {
    const y = OCR_SHEET_MARGIN + index * (OCR_SHEET_ROW_HEIGHT + OCR_SHEET_ROW_GAP);
    context.fillStyle = index % 2 === 0 ? "#ffffff" : "#fafafa";
    context.fillRect(0, y, canvas.width, OCR_SHEET_ROW_HEIGHT);
    context.fillStyle = "#111827";
    context.font = "700 28px system-ui, sans-serif";
    context.fillText(row.key, 16, y + OCR_SHEET_ROW_HEIGHT / 2);

    const boxY = y + 6;
    const boxH = OCR_SHEET_ROW_HEIGHT - 12;
    drawCropIntoBox(
      context,
      image,
      row.rect,
      { x: firstBox.x, y: boxY, w: firstBox.w, h: boxH },
      "none",
    );
    const enhancedFilter = row.mode === "dark"
      ? "grayscale(100%) contrast(205%) brightness(122%)"
      : "grayscale(100%) contrast(190%) brightness(112%)";
    drawCropIntoBox(
      context,
      image,
      row.rect,
      { x: secondBox.x, y: boxY, w: secondBox.w, h: boxH },
      enhancedFilter,
    );
  });

  const redLevelAnalysis = detectRedLevels(image, file, profile);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.93);
  const analysisHash = await sha256Text(
    `${file.hash}|${OCR_SHEET_VERSION}|${profile.id}|${file.enemySide}|${file.captureType}`,
  );
  const prepared = {
    cacheKey,
    profile: profile.id,
    blob,
    mimeType: "image/jpeg",
    width: canvas.width,
    height: canvas.height,
    hash: analysisHash,
    previewUrl: URL.createObjectURL(blob),
    redLevels: redLevelAnalysis.levels,
    redLevelConfidence: redLevelAnalysis.confidence,
    redLevelSource: redLevelAnalysis.source,
  };
  file.ocrPrepared = prepared;
  return prepared;
}


class AppError extends Error {
  constructor(message, code = "APP_ERROR", details = null) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roleLabel(role) {
  return {
    viewer: "閲覧",
    editor: "登録",
    admin: "管理者",
  }[role] ?? role;
}


function limitBreakOptions(value) {
  const current = value == null || value === "" ? "" : String(value);
  return [
    `<option value="" ${current === "" ? "selected" : ""}>未確認</option>`,
    ...[0, 1, 2, 3, 4, 5].map((item) =>
      `<option value="${item}" ${current === String(item) ? "selected" : ""}>${item}凸</option>`
    ),
  ].join("");
}


function completenessLabel(value) {
  return {
    complete: "情報十分",
    partial: "一部不足",
    manual: "手入力",
  }[value] ?? "一部不足";
}

function completenessBadgeClass(value) {
  return value === "complete" ? "success" : value === "manual" ? "info" : "warning";
}

function formatDateTime(value) {
  if (!value) return "日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFullDateTime(value) {
  if (!value) return "日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function relativeTime(value) {
  if (!value) return "未確認";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (!Number.isFinite(diff)) return "未確認";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "たった今";
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}日前`;
  return formatDateTime(value);
}

function toDatetimeLocal(value) {
  const date = value ? new Date(value) : new Date();
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDatetimeLocal(value) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function confidenceClass(value) {
  const confidence = Number(value ?? 0);
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.45) return "medium";
  return "";
}

function showToast(message, type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();
  toast.textContent = message;
  toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function showLoading(label = "処理中...") {
  const fragment = loadingTemplate.content.cloneNode(true);
  const overlay = fragment.querySelector(".loading-overlay");
  overlay.dataset.loadingOverlay = "true";
  overlay.querySelector("[data-loading-label]").textContent = label;
  document.body.appendChild(fragment);
}

function hideLoading() {
  document.querySelectorAll("[data-loading-overlay]").forEach((node) => node.remove());
}

function showIntelSaveResult(intel, duplicate = false) {
  document.querySelector("[data-intel-result-dialog]")?.remove();
  const dialog = document.createElement("dialog");
  dialog.className = "intel-result-dialog";
  dialog.dataset.intelResultDialog = "true";
  const linked = Boolean(intel?.linked);
  const breakdown = Array.isArray(intel?.breakdown) ? intel.breakdown : [];
  const awarded = Number(intel?.awardedPoints || 0);
  const eligible = Number(intel?.eligiblePoints || 0);
  const confirmation = intel?.confirmation ?? null;
  const confidenceChanged = confirmation &&
    confirmation.previousConfidence?.label !== confirmation.currentConfidence?.label;

  dialog.innerHTML = `
    <div class="intel-result-card">
      <div class="intel-result-head">
        <div>
          <small>${duplicate ? "重複確認" : "登録結果"}</small>
          <h2>${duplicate ? "同じ画像は登録済みです" : (awarded > 0 ? `+${awarded}pt` : "登録しました")}</h2>
        </div>
        <button type="button" class="icon-button" data-action="dismiss-intel-result" aria-label="閉じる">×</button>
      </div>
      ${duplicate
        ? `<div class="notice info">同じ画像のため、ポイント・確認回数とも加算しません。</div>`
        : ""}
      ${!duplicate && !linked && eligible > 0
        ? `<div class="notice warning">Discord未連携のため、今回の${eligible}pt相当は加算されません。登録データ自体は通常どおり保存されています。</div>`
        : ""}
      ${breakdown.length
        ? `<div class="intel-result-breakdown">${breakdown.map((item) => `
            <div><span>${escapeHtml(item.label || item.eventType || "")}</span><strong>+${linked ? Number(item.points || 0) : 0}pt</strong></div>`).join("")}</div>`
        : ""}
      ${confirmation
        ? `<div class="intel-confirmation-result">
            <div><span>確認回数</span><strong>${Number(confirmation.previousCount || 0)} → ${Number(confirmation.currentCount || 0)}</strong></div>
            <div><span>信頼度</span><strong>${escapeHtml(confirmation.previousConfidence?.label || "暫定")} → ${escapeHtml(confirmation.currentConfidence?.label || "暫定")}</strong></div>
          </div>`
        : ""}
      ${!duplicate && linked
        ? `<div class="intel-season-total"><span>今期合計</span><strong>${Number(intel?.seasonPoints || 0)}pt</strong></div>`
        : ""}
      <button type="button" class="primary-button" style="width:100%" data-action="dismiss-intel-result">閉じる</button>
    </div>`;
  document.body.appendChild(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function activeUpload() {
  return state.uploadQueue.find((item) => item.id === state.activeUploadId) ?? null;
}

function reviewUpload() {
  return state.uploadQueue.find((item) => item.id === state.draftUploadId) ?? null;
}

function navHtml(active) {
  const items = [
    ["enemies", "⌕", "敵一覧"],
    ["upload", "＋", "戦報登録"],
    ["intel", "◎", "諜報"],
    ["usage", "▥", "使用状況"],
    ["settings", "⚙", "設定"],
  ];
  return `
    <nav class="bottom-nav" aria-label="主要メニュー">
      ${items
        .map(
          ([view, icon, label]) => `
            <button type="button" class="nav-button ${active === view ? "active" : ""}" data-action="navigate" data-view="${view}">
              <span class="nav-icon" aria-hidden="true">${icon}</span>
              <span>${label}</span>
            </button>`,
        )
        .join("")}
    </nav>`;
}

function pageHtml({
  title,
  subtitle = "",
  content,
  activeNav = state.view,
  backAction = "",
  showNav = true,
  shellClass = "",
}) {
  return `
    <main class="page-shell ${escapeAttr(shellClass)}">
      <header class="page-header">
        ${
          backAction
            ? `<button type="button" class="icon-button" data-action="${backAction}" aria-label="戻る">‹</button>`
            : `<div class="brand-mark" style="width:44px;height:44px;border-radius:13px;font-size:.8rem;margin:0">DB</div>`
        }
        <div class="page-header-title">
          <h1>${escapeHtml(title)}</h1>
          ${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}
        </div>
        ${state.member?.role === "admin" ? `<span class="badge role-pill">管理者</span>` : `<span></span>`}
      </header>
      ${content}
      ${showNav ? navHtml(activeNav) : ""}
    </main>`;
}

async function apiRequest(action, payload = {}, { auth = true } = {}) {
  if (!isConfigured) {
    throw new AppError("config.jsが未設定です。", "NOT_CONFIGURED");
  }

  const headers = {
    "Content-Type": "application/json",
    apikey: normalizedPublishableKey,
  };

  if (auth) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new AppError(error.message, "SESSION_ERROR");
    const token = data.session?.access_token;
    if (!token) throw new AppError("利用セッションを開始できませんでした。", "AUTH_REQUIRED");
    state.session = data.session;
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 75_000);
  let response;
  try {
    response = await fetch(
      `${normalizedSupabaseUrl}/functions/v1/${normalizedFunctionName}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ action, ...payload }),
        signal: controller.signal,
      },
    );
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new AppError("通信が75秒を超えたため中断しました。電波状況を確認して再試行してください。", "REQUEST_TIMEOUT");
    }
    throw new AppError("サーバーへ接続できませんでした。通信状態と設定を確認してください。", "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timeoutId);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new AppError(`サーバー応答を読み取れませんでした（${response.status}）。`, "BAD_RESPONSE");
  }

  if (!response.ok || data?.ok === false) {
    const error = data?.error ?? {};
    throw new AppError(
      error.message ?? `処理に失敗しました（${response.status}）。`,
      error.code ?? "API_ERROR",
      error.details ?? null,
    );
  }

  return data;
}

async function ensureAnonymousSession() {
  const { data: current } = await supabase.auth.getSession();
  if (current.session) {
    state.session = current.session;
    return current.session;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    throw new AppError(
      error?.message ?? "匿名認証を開始できませんでした。Supabaseで匿名ログインを有効にしてください。",
      "ANON_SIGNIN_FAILED",
    );
  }
  state.session = data.session;
  return data.session;
}

function renderNotConfigured() {
  app.innerHTML = `
    <div class="auth-shell">
      <section class="auth-card">
        <div class="brand-mark">DB</div>
        <h1>初期設定が必要です</h1>
        <p class="muted">docs/config.js のSupabase URLとPublishable keyを書き換えてください。</p>
        <div class="notice warning">
          Secret keyやGoogle VisionのAPIキーをconfig.jsへ記載してはいけません。秘密情報はSupabase Edge FunctionのSecretsへ設定します。
        </div>
      </section>
    </div>`;
}

function renderAuth(needsBootstrap = false) {
  if (!needsBootstrap) {
    app.innerHTML = `
      <div class="center-screen">
        <div class="brand-mark">DB</div>
        <h1>${escapeHtml(config.appTitle || "敵部隊データベース")}</h1>
        <p class="muted">利用準備中...</p>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="auth-shell">
      <section class="auth-card">
        <div class="brand-mark">DB</div>
        <h1>管理者の初期登録</h1>
        <p class="muted">DatabaseとEdge Functionを設定した本人だけが行ってください。この画面は最初の1回だけ有効です。</p>
        <form class="form-stack" data-form="bootstrap">
          <label class="field">
            <span>管理者名</span>
            <input name="displayName" maxlength="40" autocomplete="nickname" required placeholder="ゲーム内名など" />
          </label>
          <label class="field">
            <span>BOOTSTRAP_SECRET</span>
            <input name="secret" type="password" maxlength="200" autocomplete="one-time-code" required placeholder="Supabaseに設定した秘密文字列" />
          </label>
          <button type="submit" class="primary-button">初期管理者として登録</button>
        </form>
      </section>
    </div>`;
}

async function initialize() {
  if (!isConfigured) {
    renderNotConfigured();
    return;
  }

  try {
    // 一般利用者にはコード入力を求めない。Supabaseの匿名セッションはAPI通信用に内部で自動作成する。
    await ensureAnonymousSession();
    const status = await apiRequest("status");
    state.systemStatus = status;

    if (status.needsBootstrap) {
      renderAuth(true);
      return;
    }

    if (!status.registered || !status.member?.active) {
      throw new AppError("一般利用の準備に失敗しました。再読み込みしてください。", "PUBLIC_JOIN_FAILED");
    }

    state.member = status.member;
    const discordParams = new URLSearchParams(window.location.search);
    const discordResult = discordParams.get("discord");
    const discordMessage = discordParams.get("discord_message") || "";
    if (discordResult) {
      window.history.replaceState({}, "", `${window.location.pathname}${window.location.hash || ""}`);
      await navigate("intel");
      if (discordResult === "connected") showToast("Discord連携が完了しました。", "success");
      else showToast(discordMessage || "Discord連携に失敗しました。", "error");
    } else {
      await navigate("enemies");
    }
  } catch (error) {
    app.innerHTML = `
      <div class="center-screen">
        <div class="brand-mark">!</div>
        <h1>接続できません</h1>
        <p class="muted">${escapeHtml(error.message)}</p>
        <button type="button" class="primary-button" data-action="reload-app">再読み込み</button>
      </div>`;
  }
}

async function navigate(view) {
  state.view = view;
  window.scrollTo({ top: 0, behavior: "auto" });
  if (view === "enemies") await renderEnemies();
  else if (view === "upload") renderUpload();
  else if (view === "intel") await renderIntel();
  else if (view === "usage") await renderUsage();
  else if (view === "settings") await renderSettings();
  else if (view === "masters") await renderMasters();
}

function latestGenerals(latest) {
  return [...(latest?.observation_generals ?? [])].sort((a, b) => a.slot - b.slot);
}

function generalTopMeta(general) {
  const levelRaw = general?.general_level;
  const levelNumber = levelRaw === null || levelRaw === undefined || levelRaw === ""
    ? null
    : Number(levelRaw);
  const levelText = Number.isFinite(levelNumber) && levelNumber > 0
    ? `Lv${Math.trunc(levelNumber)}`
    : "Lv不明";

  const limitRaw = general?.red_level;
  const limitNumber = limitRaw === null || limitRaw === undefined || limitRaw === ""
    ? null
    : Number(limitRaw);
  const limitText = Number.isFinite(limitNumber) && limitNumber >= 0 && limitNumber <= 5
    ? `${Math.trunc(limitNumber)}凸`
    : "凸不明";

  return `${levelText}・${limitText}`;
}

function freshnessBadgeClass(freshness) {
  const code = freshness?.code || "unknown";
  if (code === "latest" || code === "active") return "success";
  if (code === "aging") return "info";
  if (code === "old") return "warning";
  if (code === "recheck") return "danger";
  return "";
}

function confidenceBadgeClass(confidence) {
  const code = confidence?.code || "";
  if (code === "high") return "success";
  if (code === "confirmed") return "info";
  return "";
}

function renderEnemyTeamPreview(observation, index) {
  const generals = latestGenerals(observation);
  const intel = observation?.intel ?? {};
  const freshness = intel.freshness ?? null;
  const confidence = intel.confidence ?? null;
  return `
    <div class="enemy-team-preview">
      <div class="enemy-team-preview-head">
        <div class="enemy-team-intel-badges">
          ${freshness?.label ? `<span class="badge ${freshnessBadgeClass(freshness)}">${escapeHtml(freshness.label)}</span>` : ""}
          ${confidence?.label ? `<span class="badge ${confidenceBadgeClass(confidence)}">${escapeHtml(confidence.label)}</span>` : ""}
        </div>
        <span>${escapeHtml(relativeTime(observation?.observed_at))}</span>
      </div>
      <div class="lineup-summary">
        ${[1, 2, 3]
          .map((slot) => {
            const general = generals.find((item) => item.slot === slot);
            return `<div class="lineup-chip">
              <div class="lineup-chip-head">
                <strong>${escapeHtml(general?.general_name || "未確認")}</strong>
                <span>${escapeHtml(generalTopMeta(general))}</span>
              </div>
              <span>第1 ${escapeHtml(general?.tactic_1 || "不明")}</span>
              <span>第2 ${escapeHtml(general?.tactic_2 || "不明")}</span>
            </div>`;
          })
          .join("")}
      </div>
    </div>`;
}

async function renderEnemies() {
  app.innerHTML = pageHtml({
    title: "敵部隊一覧",
    subtitle: `対象：${state.currentSeason || "未設定"}`,
    activeNav: "enemies",
    content: `
      <div class="search-box">
        <input id="enemy-search" type="search" inputmode="search" value="${escapeAttr(state.enemySearch)}" placeholder="敵名・一門名で検索" aria-label="敵を検索" />
      </div>
      <section class="page-content">
        <div class="card"><p class="muted" style="margin:0">読み込み中...</p></div>
      </section>`,
  });

  try {
    const response = await apiRequest("list_enemies", { search: state.enemySearch });
    state.enemies = response.enemies ?? [];
    state.currentSeason = response.currentSeason ?? state.currentSeason;
    const subtitle = document.querySelector(".page-header-title small");
    if (subtitle) subtitle.textContent = `対象：${state.currentSeason || "未設定"}`;
    renderEnemyListBody();
  } catch (error) {
    showToast(error.message, "error");
    renderEnemyListBody(error.message);
  }
}

function renderEnemyListBody(errorMessage = "") {
  const content = document.querySelector(".page-content");
  if (!content) return;

  if (errorMessage) {
    content.innerHTML = `<div class="notice danger">${escapeHtml(errorMessage)}</div>`;
    return;
  }

  if (!state.enemies.length) {
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⌕</div>
        <strong>登録済みの敵はいません</strong>
        <span>${state.enemySearch ? "検索条件に一致する敵がいません。" : "戦報画像から最初の敵部隊を登録してください。"}</span>
        ${
          state.member?.role !== "viewer"
            ? `<button type="button" class="primary-button" data-action="navigate" data-view="upload">戦報を登録</button>`
            : ""
        }
      </div>`;
    return;
  }

  content.innerHTML = `
    <div class="enemy-list">
      ${state.enemies
        .map((enemy) => {
          const latest = enemy.latest;
          const teams = Array.isArray(enemy.latestTeams) && enemy.latestTeams.length
            ? enemy.latestTeams.slice(0, 2)
            : latest
              ? [latest]
              : [];
          const teamCount = Number.isFinite(Number(enemy.teamCount))
            ? Number(enemy.teamCount)
            : teams.length;
          const observationCount = Number.isFinite(Number(enemy.observationCount))
            ? Number(enemy.observationCount)
            : latest
              ? 1
              : 0;

          return `
            <button type="button" class="enemy-card" data-action="open-enemy" data-enemy-id="${escapeAttr(enemy.id)}">
              <div class="enemy-card-top">
                <div class="enemy-name">
                  <strong>${escapeHtml(enemy.name)}</strong>
                  <span>${escapeHtml(enemy.groupName || "所属不明")}</span>
                </div>
                ${
                  latest
                    ? `<div class="enemy-card-meta">
                        <span class="badge">${escapeHtml(relativeTime(latest.observed_at))}</span>
                        <span class="badge ${completenessBadgeClass(latest.completeness)}">${escapeHtml(completenessLabel(latest.completeness))}</span>
                      </div>`
                    : `<span class="badge">編成なし</span>`
                }
              </div>
              ${
                latest
                  ? `<div class="enemy-card-counts">${teamCount}部隊・観測${observationCount}件</div>
                    ${teams.map((team, index) => renderEnemyTeamPreview(team, index)).join("")}
                    ${teamCount > teams.length ? `<div class="enemy-more-teams">ほか${teamCount - teams.length}部隊は詳細で確認 →</div>` : ""}`
                  : `<p class="muted" style="margin:12px 0 0">観測編成はまだありません。</p>`
              }
            </button>`;
        })
        .join("")}
    </div>`;
}

async function openEnemy(enemyId) {
  showLoading("敵データを読み込み中...");
  try {
    const response = await apiRequest("get_enemy", { enemyId });
    state.currentEnemy = response.enemy;
    state.currentSeason = response.currentSeason ?? state.currentSeason;
    renderEnemyDetail();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoading();
  }
}

function canEditObservation(observation) {
  if (!observation || !state.member) return false;
  return ["editor", "admin"].includes(state.member.role);
}

function draftFromObservation(observation, enemy) {
  const rows = [...(observation.observation_generals ?? [])].sort((a, b) => Number(a.slot) - Number(b.slot));
  return {
    enemy: {
      name: enemy?.name ?? "",
      groupName: enemy?.groupName ?? "",
      memo: enemy?.memo ?? "",
    },
    observedAt: observation.observed_at ?? new Date().toISOString(),
    seasonName: observation.season_name ?? state.currentSeason ?? "未設定",
    completeness: observation.completeness ?? "partial",
    sourceLayout: observation.source_layout ?? "unknown",
    captureType: observation.capture_type ?? "unknown",
    enemySide: observation.enemy_side === "left" ? "left" : "right",
    summary: observation.report_summary && typeof observation.report_summary === "object" ? observation.report_summary : {},
    generals: [1, 2, 3].map((slot) => {
      const row = rows.find((item) => Number(item.slot) === slot) ?? {};
      return {
        slot,
        roleLabel: slot === 1 ? "大将" : "副将",
        name: row.general_name ?? "",
        level: row.general_level ?? null,
        redLevel: row.red_level ?? null,
        inherentTactic: row.inherent_tactic ?? "",
        tactic1: row.tactic_1 ?? "",
        tactic2: row.tactic_2 ?? "",
        confidence: {},
      };
    }),
  };
}

async function startEditObservation(observationId) {
  const observation = state.currentEnemy?.observations?.find((item) => item.id === observationId);
  if (!observation) {
    showToast("編集する観測記録が見つかりません。", "error");
    return;
  }
  if (!canEditObservation(observation)) {
    showToast("この記録を編集する権限がありません。", "error");
    return;
  }
  state.editingObservationId = observation.id;
  state.editDraft = draftFromObservation(observation, state.currentEnemy);
  await loadSuggestions();
  renderObservationEdit();
}

function renderObservationEdit() {
  const draft = state.editDraft;
  if (!draft || !state.editingObservationId) {
    if (state.currentEnemy) renderEnemyDetail();
    return;
  }
  const generals = draft.generals ?? [];
  const generalValues = [...new Set(state.suggestions.generals)].slice(0, 1000);
  const tacticValues = [...new Set(state.suggestions.tactics)].slice(0, 1500);
  app.innerHTML = pageHtml({
    title: "観測記録を編集",
    subtitle: `${draft.seasonName || "未設定"}・登録後の修正`,
    activeNav: "enemies",
    backAction: "cancel-edit-observation",
    showNav: false,
    shellClass: "review-shell",
    content: `
      <section class="page-content review-page-content">
        <datalist id="edit-general-suggestions">${generalValues.map((value) => `<option value="${escapeAttr(value)}"></option>`).join("")}</datalist>
        <datalist id="edit-tactic-suggestions">${tacticValues.map((value) => `<option value="${escapeAttr(value)}"></option>`).join("")}</datalist>
        <div class="notice info">登録済みデータを修正します。元の戦報画像は保存していないため、必要に応じて手元の画像と照合してください。シーズンは元の登録値を維持します。</div>

        <div class="card form-stack">
          <div class="card-header"><div><h2>敵プレイヤー</h2><small>必須</small></div></div>
          <label class="field">
            <span>プレイヤー名</span>
            <input data-edit-path="enemy.name" value="${escapeAttr(draft.enemy?.name ?? "")}" maxlength="80" required placeholder="敵プレイヤー名" />
          </label>
          <label class="field">
            <span>所属一門・陣営</span>
            <input data-edit-path="enemy.groupName" value="${escapeAttr(draft.enemy?.groupName ?? "")}" maxlength="80" placeholder="分かる場合のみ" />
          </label>
          <label class="field">
            <span>確認日時</span>
            <input type="datetime-local" data-edit-path="observedAtLocal" value="${toDatetimeLocal(draft.observedAt)}" />
          </label>
          <label class="field">
            <span>備考</span>
            <textarea data-edit-path="enemy.memo" maxlength="500" placeholder="主力、要注意、対策など">${escapeHtml(draft.enemy?.memo ?? "")}</textarea>
          </label>
        </div>

        ${[1, 2, 3].map((slot) => {
          const general = generals.find((item) => Number(item.slot) === slot) ?? {};
          const index = generals.findIndex((item) => Number(item.slot) === slot);
          const actualIndex = index >= 0 ? index : slot - 1;
          return `
            <section class="general-card">
              <div class="general-card-header"><h3>${slot === 1 ? "大将" : `副将${slot - 1}`}</h3><span class="badge">${slot}/3</span></div>
              <label class="field">
                <span>武将名</span>
                <input list="edit-general-suggestions" data-edit-path="generals.${actualIndex}.name" value="${escapeAttr(general.name ?? "")}" maxlength="40" placeholder="武将名" />
              </label>
              <div class="form-grid-2">
                <label class="field"><span>Lv</span><input type="number" inputmode="numeric" min="1" max="100" data-edit-path="generals.${actualIndex}.level" value="${escapeAttr(general.level ?? "")}" placeholder="例 50" /></label>
                <label class="field"><span>凸数</span><select data-edit-path="generals.${actualIndex}.redLevel">${limitBreakOptions(general.redLevel)}</select></label>
              </div>
              <label class="field"><span>固有戦法</span><input list="edit-tactic-suggestions" data-edit-path="generals.${actualIndex}.inherentTactic" value="${escapeAttr(general.inherentTactic ?? "")}" maxlength="50" placeholder="固有戦法" /></label>
              <label class="field"><span>第1戦法</span><input list="edit-tactic-suggestions" data-edit-path="generals.${actualIndex}.tactic1" value="${escapeAttr(general.tactic1 ?? "")}" maxlength="50" placeholder="第1戦法" /></label>
              <label class="field"><span>第2戦法</span><input list="edit-tactic-suggestions" data-edit-path="generals.${actualIndex}.tactic2" value="${escapeAttr(general.tactic2 ?? "")}" maxlength="50" placeholder="第2戦法" /></label>
            </section>`;
        }).join("")}

        <div class="review-sticky-bar">
          <button type="button" class="secondary-button" data-action="cancel-edit-observation">キャンセル</button>
          <button type="button" class="primary-button" data-action="save-edited-observation">変更を保存</button>
        </div>
      </section>`,
  });
}

async function saveEditedObservation() {
  const draft = state.editDraft;
  const observationId = state.editingObservationId;
  if (!draft || !observationId) return;
  if (!draft.enemy?.name?.trim()) {
    showToast("敵プレイヤー名を入力してください。", "error");
    document.querySelector('[data-edit-path="enemy.name"]')?.focus();
    return;
  }

  const completion = computeCompleteness(draft);
  const payload = {
    enemy: {
      name: draft.enemy.name.trim(),
      groupName: draft.enemy.groupName?.trim() ?? "",
      memo: draft.enemy.memo?.trim() ?? "",
    },
    observedAt: draft.observedAt ?? new Date().toISOString(),
    completeness: completion.completeness,
    summary: { ...(draft.summary ?? {}), completenessScore: completion.score },
    generals: (draft.generals ?? []).map((general, index) => ({
      slot: index + 1,
      roleLabel: index === 0 ? "大将" : "副将",
      name: general.name?.trim() ?? "",
      level: general.level === "" || general.level == null ? null : Number(general.level),
      redLevel: general.redLevel === "" || general.redLevel == null ? null : Number(general.redLevel),
      inherentTactic: general.inherentTactic?.trim() ?? "",
      tactic1: general.tactic1?.trim() ?? "",
      tactic2: general.tactic2?.trim() ?? "",
      confidence: general.confidence ?? {},
    })),
  };

  showLoading("変更を保存中...");
  try {
    const response = await apiRequest("update_observation", { observationId, payload });
    const enemyId = response.result?.enemyId ?? state.currentEnemy?.id;
    state.editingObservationId = null;
    state.editDraft = null;
    showToast("観測記録を更新しました。", "success");
    if (enemyId) await openEnemy(enemyId);
    else await navigate("enemies");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoading();
  }
}

function observationTeamIdentity(observation) {
  const generals = [...(observation?.observation_generals ?? [])].sort(
    (a, b) => Number(a.slot) - Number(b.slot),
  );
  const leader = String(
    generals.find((item) => Number(item.slot) === 1)?.general_name ?? "",
  ).replace(/\s+/g, "").trim();
  const deputies = [2, 3]
    .map((slot) => String(
      generals.find((item) => Number(item.slot) === slot)?.general_name ?? "",
    ).replace(/\s+/g, "").trim())
    .filter(Boolean)
    .sort();

  // 3武将すべて判明している場合だけ自動的に同一部隊へまとめる。
  // 不完全な観測を誤って別部隊と統合しないよう、欠損時は観測IDを含める。
  if (!leader || deputies.length !== 2) {
    return `incomplete:${observation?.id ?? Math.random().toString(36).slice(2)}`;
  }
  return `${leader}|${deputies[0]}|${deputies[1]}`;
}

function clientFreshnessInfo(observedAt) {
  const time = new Date(observedAt ?? "").getTime();
  if (!Number.isFinite(time)) return { code: "unknown", label: "不明", days: null };
  const days = Math.max(0, Math.floor((Date.now() - time) / 86400000));
  if (days <= 2) return { code: "latest", label: "最新", days };
  if (days <= 7) return { code: "active", label: "有効", days };
  if (days <= 14) return { code: "aging", label: "やや古い", days };
  if (days <= 29) return { code: "old", label: "古い", days };
  return { code: "recheck", label: "要再確認", days };
}

function clientConfidenceInfo(countRaw) {
  const count = Math.max(0, Number(countRaw ?? 0) || 0);
  if (count >= 3) return { code: "high", label: "高信頼", count };
  if (count >= 2) return { code: "confirmed", label: "確認済", count };
  return { code: "provisional", label: "暫定", count };
}

function groupEnemyObservations(observations) {
  const groups = new Map();
  const sorted = [...(observations ?? [])].sort(
    (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime(),
  );

  for (const observation of sorted) {
    const teamKey = observation.teamKey || observationTeamIdentity(observation);
    const seasonName = observation.season_name || "未設定";
    const groupKey = `${seasonName}::${teamKey}`;
    const group = groups.get(groupKey) ?? { key: teamKey, seasonName, observations: [] };
    group.observations.push(observation);
    groups.set(groupKey, group);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      latest: group.observations[0] ?? null,
      past: group.observations.slice(1),
      observationCount: group.observations.length,
      intel: {
        freshness: clientFreshnessInfo(group.observations[0]?.observed_at),
        confidence: clientConfidenceInfo(group.observations.length),
        discoveredAt: null,
        discoveredByName: "匿名ユーザー",
      },
    }))
    .sort(
      (a, b) => new Date(b.latest?.observed_at ?? 0).getTime() - new Date(a.latest?.observed_at ?? 0).getTime(),
    );
}

function teamDisplayName(observation) {
  const generals = latestGenerals(observation);
  return [1, 2, 3]
    .map((slot) => generals.find((item) => Number(item.slot) === slot)?.general_name || "未確認")
    .join(" / ");
}

function renderObservationTeam(group) {
  const latest = group?.latest;
  if (!latest) return "";
  const past = group.past ?? [];
  const intel = group.intel ?? {};
  const freshness = intel.freshness ?? clientFreshnessInfo(latest.observed_at);
  const confidence = intel.confidence ?? clientConfidenceInfo(group.observationCount);
  const discoveredBy = intel.discoveredByName || "匿名ユーザー";
  const discoveredAt = intel.discoveredAt ? formatFullDateTime(intel.discoveredAt) : "記録なし";
  return `
    <section class="enemy-detail-team">
      <div class="enemy-detail-team-head">
        <div>
          <strong>${escapeHtml(teamDisplayName(latest))}</strong>
          <small>${escapeHtml(group.seasonName || latest.season_name || state.currentSeason)}・最終観測 ${escapeHtml(relativeTime(latest.observed_at))}</small>
          <div class="team-intel-summary">
            <span class="badge ${freshnessBadgeClass(freshness)}">${escapeHtml(freshness.label || "不明")}</span>
            <span class="badge ${confidenceBadgeClass(confidence)}">信頼度：${escapeHtml(confidence.label || "暫定")}</span>
            <span class="team-intel-text">確認 ${Number(confidence.count ?? group.observationCount ?? 0)}回</span>
          </div>
          <div class="team-discovery-line">初発見：${escapeHtml(discoveredBy)}${intel.discoveredAt ? `・${escapeHtml(discoveredAt)}` : ""}</div>
        </div>
        <span>${group.observationCount}件</span>
      </div>
      ${observationCard(latest, { latest: true })}
      ${
        past.length
          ? `<details class="team-history-details">
              <summary>過去の観測 ${past.length}件</summary>
              <div class="team-history-list">
                ${past.map((observation) => observationCard(observation)).join("")}
              </div>
            </details>`
          : ""
      }
    </section>`;
}

function observationCard(observation, options = {}) {
  const generals = [...(observation.observation_generals ?? [])].sort((a, b) => a.slot - b.slot);
  return `
    <article class="observation-card">
      <div class="observation-header">
        <div>
          <strong>${options.latest ? "最新観測・" : ""}${escapeHtml(formatFullDateTime(observation.observed_at))}</strong>
          <small style="display:block;margin-top:3px">登録：${escapeHtml(observation.createdByName || "不明")}</small>
        </div>
        <div class="badge-row" style="justify-content:flex-end">
          <span class="badge info">${escapeHtml(observation.season_name || state.currentSeason)}</span>
          <span class="badge ${completenessBadgeClass(observation.completeness)}">${completenessLabel(observation.completeness)}</span>
        </div>
      </div>
      <div class="observation-body">
        ${[1, 2, 3]
          .map((slot) => {
            const general = generals.find((item) => item.slot === slot) ?? {};
            return `
              <div class="general-summary-row">
                <span class="role-label">${slot === 1 ? "大将" : `副将${slot - 1}`}</span>
                <div>
                  <strong>${escapeHtml(general.general_name || "未確認")}${general.general_level ? ` Lv${general.general_level}` : ""}${Number.isInteger(general.red_level) ? ` ${general.red_level}凸` : ""}</strong>
                  <div class="tactic-lines">
                    <span>固有：${escapeHtml(general.inherent_tactic || "不明")}</span>
                    <span>第1：${escapeHtml(general.tactic_1 || "不明")}</span>
                    <span>第2：${escapeHtml(general.tactic_2 || "不明")}</span>
                  </div>
                </div>
              </div>`;
          })
          .join("")}
        <div class="admin-actions" style="margin-top:14px">
          ${canEditObservation(observation) ? `<button type="button" class="secondary-button" style="min-height:44px" data-action="edit-observation" data-observation-id="${escapeAttr(observation.id)}">この記録を編集</button>` : ""}
          ${state.member?.role === "admin" ? `<button type="button" class="danger-button" style="min-height:44px" data-action="delete-observation" data-observation-id="${escapeAttr(observation.id)}">この観測記録を削除</button>` : ""}
        </div>
      </div>
    </article>`;
}

function renderEnemyDetail() {
  const enemy = state.currentEnemy;
  if (!enemy) return;

  const teams = Array.isArray(enemy.teams) && enemy.teams.length
    ? enemy.teams.map((team) => ({
        ...team,
        latest: team.latest ?? team.observations?.[0] ?? null,
        observations: team.observations ?? [],
        past: team.past ?? (team.observations ?? []).slice(1),
        observationCount: Number(team.observationCount) || (team.observations ?? []).length,
      }))
    : groupEnemyObservations(enemy.observations ?? []);
  const observationCount = Number.isFinite(Number(enemy.observationCount))
    ? Number(enemy.observationCount)
    : enemy.observations?.length ?? 0;

  app.innerHTML = pageHtml({
    title: enemy.name,
    subtitle: enemy.groupName || "所属不明",
    activeNav: "enemies",
    backAction: "back-to-enemies",
    content: `
      <section class="page-content">
        ${enemy.memo ? `<div class="notice info">${escapeHtml(enemy.memo)}</div>` : ""}
        <div class="card enemy-detail-summary">
          <div class="card-header">
            <div>
              <h2>確認済み部隊</h2>
              <small>${teams.length}部隊・観測${observationCount}件</small>
            </div>
          </div>
          <div class="enemy-detail-team-list">
            ${
              teams.length
                ? teams.map(renderObservationTeam).join("")
                : `<div class="empty-state"><span>観測履歴はありません。</span></div>`
            }
          </div>
        </div>
      </section>`,
  });
}

function renderUpload() {
  if (state.member?.role === "viewer") {
    app.innerHTML = pageHtml({
      title: "戦報登録",
      subtitle: "登録権限がありません",
      activeNav: "upload",
      content: `<section class="page-content"><div class="notice warning">現在の権限は閲覧のみです。管理者に「登録」権限への変更を依頼してください。</div></section>`,
    });
    return;
  }

  const current = activeUpload();
  app.innerHTML = pageHtml({
    title: "戦報登録",
    subtitle: "縦画面のスマホスクショ推奨",
    activeNav: "upload",
    content: `
      <section class="page-content">
        ${
          state.draft
            ? `<div class="notice info">
                <strong>確認途中の入力があります。</strong>
                <div class="button-row" style="margin-top:10px">
                  <button type="button" class="secondary-button" data-action="discard-draft">破棄</button>
                  <button type="button" class="primary-button" data-action="resume-review">確認を再開</button>
                </div>
              </div>`
            : ""
        }
        <div class="card">
          <label class="upload-zone">
            <input id="report-files" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <span class="upload-icon" aria-hidden="true">▧</span>
            <strong>戦報画像を選択</strong>
            <span class="muted">最大5枚。画像はOCR後に保存されません。</span>
          </label>
        </div>

        ${
          state.uploadQueue.length
            ? `<div class="card">
                <div class="card-header"><div><h2>選択した画像</h2><small>${state.uploadQueue.length}枚</small></div></div>
                <div class="file-queue">
                  ${state.uploadQueue
                    .map(
                      (item) => `
                        <div class="file-item" style="${item.id === state.activeUploadId ? "border-color:rgba(216,179,95,.58)" : ""}">
                          <button type="button" class="image-preview-button" style="border:0" data-action="select-upload" data-upload-id="${item.id}">
                            <img class="file-thumb" src="${item.previewUrl}" alt="${escapeAttr(item.name)}" />
                          </button>
                          <button type="button" class="ghost-button file-meta" style="border:0;padding:0;text-align:left;min-height:auto" data-action="select-upload" data-upload-id="${item.id}">
                            <strong>${escapeHtml(item.name)}</strong>
                            <small>${item.orientation === "portrait" ? "縦" : "横"}・${formatBytes(item.bytes)}</small>
                          </button>
                          <button type="button" class="icon-button" data-action="remove-upload" data-upload-id="${item.id}" aria-label="画像を削除">×</button>
                        </div>`,
                    )
                    .join("")}
                </div>
              </div>`
            : ""
        }

        ${
          current
            ? `<div class="card preview-card">
                <button type="button" class="image-preview-button" data-action="open-current-image">
                  <img src="${current.previewUrl}" alt="解析対象の戦報画像" />
                  <span class="image-preview-caption"><span>タップで拡大</span><span>${current.width}×${current.height}</span></span>
                </button>
                ${
                  current.orientation === "landscape"
                    ? `<div class="notice warning">横画面は第2戦法や下部数値が見切れる場合があります。不足項目は確認画面で修正してください。</div>`
                    : `<div class="notice success">縦画面です。敵部隊DB向けの情報を最も取り込みやすい形式です。</div>`
                }
                <div class="field">
                  <span class="field-label">敵はどちら側ですか</span>
                  <div class="segmented">
                    <button type="button" class="${current.enemySide === "left" ? "active" : ""}" data-action="set-enemy-side" data-side="left">左側が敵</button>
                    <button type="button" class="${current.enemySide === "right" ? "active" : ""}" data-action="set-enemy-side" data-side="right">右側が敵</button>
                  </div>
                </div>
                <div class="field">
                  <span class="field-label">画像の作成方法</span>
                  <div class="segmented three">
                    <button type="button" class="${current.captureType === "phone" ? "active" : ""}" data-action="set-capture-type" data-capture="phone">スマホ</button>
                    <button type="button" class="${current.captureType === "game" ? "active" : ""}" data-action="set-capture-type" data-capture="game">ゲーム内</button>
                    <button type="button" class="${current.captureType === "unknown" ? "active" : ""}" data-action="set-capture-type" data-capture="unknown">不明</button>
                  </div>
                </div>
                <div class="button-row">
                  <button type="button" class="secondary-button" data-action="manual-entry">OCRなしで入力</button>
                  <button type="button" class="primary-button" data-action="analyze-current">OCRで読み取る</button>
                </div>
              </div>`
            : `<div class="card"><button type="button" class="secondary-button" style="width:100%" data-action="manual-entry">画像なしで手入力</button></div>`
        }
      </section>`,
  });
}

async function prepareFiles(fileList) {
  const maxFiles = state.usage?.maxBatchFiles ?? 5;
  const files = Array.from(fileList).slice(0, Math.max(0, maxFiles - state.uploadQueue.length));
  if (!files.length) return;
  showLoading("画像をスマホ向けに準備中...");
  try {
    for (const file of files) {
      const prepared = await prepareImage(file);
      state.uploadQueue.push(prepared);
      if (!state.activeUploadId) state.activeUploadId = prepared.id;
    }
    renderUpload();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoading();
  }
}

function fileToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new AppError("画像ファイルを読み取れませんでした。"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new AppError("画像を開けませんでした。"));
    image.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AppError("画像の圧縮に失敗しました。"))),
      type,
      quality,
    );
  });
}

async function sha256Blob(blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function blobToBase64(blob) {
  const dataUrl = await fileToDataUrl(blob);
  return String(dataUrl).split(",", 2)[1] ?? "";
}


function parseImageDateText(value, offsetText = "") {
  const match = String(value ?? "").trim().match(
    /^(\d{4})[:\-](\d{2})[:\-](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/,
  );
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (
    year < 2000 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour > 23 || minute > 59 || second > 59
  ) return null;

  const normalizedOffset = /^[+\-]\d{2}:?\d{2}$/.test(offsetText)
    ? offsetText.includes(":")
      ? offsetText
      : `${offsetText.slice(0, 3)}:${offsetText.slice(3)}`
    : "";
  const date = normalizedOffset
    ? new Date(`${yearText}-${monthText}-${dayText}T${hourText}:${minuteText}:${secondText}${normalizedOffset}`)
    : new Date(year, month - 1, day, hour, minute, second);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function parseExifTiff(buffer, tiffOffset = 0) {
  try {
    const view = new DataView(buffer);
    if (tiffOffset + 8 > view.byteLength) return null;
    const byteOrder = String.fromCharCode(
      view.getUint8(tiffOffset),
      view.getUint8(tiffOffset + 1),
    );
    const littleEndian = byteOrder === "II";
    if (!littleEndian && byteOrder !== "MM") return null;
    const u16 = (offset) => view.getUint16(offset, littleEndian);
    const u32 = (offset) => view.getUint32(offset, littleEndian);
    if (u16(tiffOffset + 2) !== 42) return null;

    const readAscii = (entryOffset, count) => {
      if (!count || count > 512) return "";
      const valueOffset = count <= 4
        ? entryOffset + 8
        : tiffOffset + u32(entryOffset + 8);
      if (valueOffset < 0 || valueOffset + count > view.byteLength) return "";
      let result = "";
      for (let index = 0; index < count; index += 1) {
        const code = view.getUint8(valueOffset + index);
        if (!code) break;
        result += String.fromCharCode(code);
      }
      return result.trim();
    };

    const readIfd = (relativeOffset) => {
      const offset = tiffOffset + relativeOffset;
      if (offset < 0 || offset + 2 > view.byteLength) return new Map();
      const count = u16(offset);
      if (count > 512 || offset + 2 + count * 12 > view.byteLength) return new Map();
      const tags = new Map();
      for (let index = 0; index < count; index += 1) {
        const entryOffset = offset + 2 + index * 12;
        const tag = u16(entryOffset);
        const type = u16(entryOffset + 2);
        const valueCount = u32(entryOffset + 4);
        if (type === 2) tags.set(tag, readAscii(entryOffset, valueCount));
        else if (type === 4 && valueCount === 1) tags.set(tag, u32(entryOffset + 8));
        else if (type === 3 && valueCount === 1) tags.set(tag, u16(entryOffset + 8));
      }
      return tags;
    };

    const ifd0Offset = u32(tiffOffset + 4);
    const ifd0 = readIfd(ifd0Offset);
    const exifPointer = Number(ifd0.get(0x8769));
    const exif = Number.isFinite(exifPointer) && exifPointer > 0
      ? readIfd(exifPointer)
      : new Map();
    const dateText =
      exif.get(0x9003) ||
      exif.get(0x9004) ||
      ifd0.get(0x0132) ||
      "";
    const offsetText =
      exif.get(0x9011) ||
      exif.get(0x9012) ||
      exif.get(0x9010) ||
      "";
    return parseImageDateText(dateText, offsetText);
  } catch {
    return null;
  }
}

async function readEmbeddedCaptureTime(file) {
  const maxBytes = Math.min(file.size, 2_000_000);
  if (maxBytes < 16) return null;
  const buffer = await file.slice(0, maxBytes).arrayBuffer();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  if (file.type === "image/jpeg" && view.getUint16(0, false) === 0xffd8) {
    let offset = 2;
    while (offset + 4 <= view.byteLength) {
      if (view.getUint8(offset) !== 0xff) break;
      while (offset < view.byteLength && view.getUint8(offset) === 0xff) offset += 1;
      const marker = view.getUint8(offset);
      offset += 1;
      if (marker === 0xd9 || marker === 0xda) break;
      if (offset + 2 > view.byteLength) break;
      const length = view.getUint16(offset, false);
      if (length < 2 || offset + length > view.byteLength) break;
      const dataStart = offset + 2;
      if (
        marker === 0xe1 &&
        length >= 8 &&
        String.fromCharCode(...bytes.slice(dataStart, dataStart + 6)) === "Exif\u0000\u0000"
      ) {
        return parseExifTiff(buffer, dataStart + 6);
      }
      offset += length;
    }
  }

  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    file.type === "image/png" &&
    pngSignature.every((value, index) => bytes[index] === value)
  ) {
    let offset = 8;
    while (offset + 12 <= view.byteLength) {
      const length = view.getUint32(offset, false);
      const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd + 4 > view.byteLength) break;
      if (type === "eXIf") return parseExifTiff(buffer, dataStart);
      if (type === "tEXt") {
        const text = new TextDecoder("latin1").decode(bytes.slice(dataStart, dataEnd));
        const separator = text.indexOf("\u0000");
        const key = separator >= 0 ? text.slice(0, separator).toLowerCase() : "";
        const value = separator >= 0 ? text.slice(separator + 1) : "";
        if (key.includes("creation") || key.includes("date")) {
          const parsed = new Date(value);
          if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
        }
      }
      offset = dataEnd + 4;
    }
  }

  if (
    file.type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    let offset = 12;
    while (offset + 8 <= view.byteLength) {
      const type = String.fromCharCode(...bytes.slice(offset, offset + 4));
      const length = view.getUint32(offset + 4, true);
      const dataStart = offset + 8;
      const dataEnd = dataStart + length;
      if (dataEnd > view.byteLength) break;
      if (type === "EXIF") {
        const hasPrefix = String.fromCharCode(...bytes.slice(dataStart, dataStart + 6)) === "Exif\u0000\u0000";
        return parseExifTiff(buffer, dataStart + (hasPrefix ? 6 : 0));
      }
      offset = dataEnd + (length % 2);
    }
  }
  return null;
}

async function detectCaptureTime(file) {
  try {
    const embedded = await readEmbeddedCaptureTime(file);
    if (embedded) return { iso: embedded, source: "metadata" };
  } catch {
    // メタデータが壊れていても画像選択自体は継続する。
  }
  const modified = Number(file.lastModified);
  const lowerBound = new Date("2000-01-01T00:00:00Z").getTime();
  const upperBound = Date.now() + 24 * 60 * 60 * 1000;
  if (Number.isFinite(modified) && modified >= lowerBound && modified <= upperBound) {
    return { iso: new Date(modified).toISOString(), source: "file-last-modified" };
  }
  return { iso: new Date().toISOString(), source: "current-time" };
}

function captureTimeSourceLabel(source) {
  return {
    metadata: "画像内の撮影日時を使用",
    "file-last-modified": "画像ファイルの日時を使用（共有方法によっては保存日時）",
    "current-time": "撮影日時を取得できなかったため現在時刻",
  }[source] ?? "日時は登録前に確認してください";
}

async function prepareImage(file) {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    throw new AppError(`${file.name}はJPEG・PNG・WebPではありません。`);
  }

  const captureTime = await detectCaptureTime(file);
  const originalUrl = URL.createObjectURL(file);
  let image;
  try {
    image = await loadImage(originalUrl);
  } finally {
    URL.revokeObjectURL(originalUrl);
  }
  const maxDimension = 2800;
  let scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  let targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
  let targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));
  let quality = 0.94;
  let blob;

  // 小さなスクリーンショットは再圧縮せず、そのまま使って文字の輪郭を保つ。
  if (
    file.size <= 4_300_000 &&
    Math.max(image.naturalWidth, image.naturalHeight) <= maxDimension
  ) {
    blob = file;
    targetWidth = image.naturalWidth;
    targetHeight = image.naturalHeight;
  } else {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new AppError("画像処理を開始できませんでした。");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, targetWidth, targetHeight);
      context.drawImage(image, 0, 0, targetWidth, targetHeight);
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
      if (blob.size <= 4_300_000) break;
      if (quality > 0.80) quality -= 0.04;
      else {
        targetWidth = Math.round(targetWidth * 0.86);
        targetHeight = Math.round(targetHeight * 0.86);
      }
    }
  }

  if (!blob || blob.size > 5_000_000) {
    throw new AppError(`${file.name}を5MB以下にできませんでした。`);
  }

  const previewUrl = URL.createObjectURL(blob);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    previewUrl,
    blob,
    mimeType: blob.type,
    width: targetWidth,
    height: targetHeight,
    bytes: blob.size,
    hash: await sha256Blob(blob),
    orientation: targetWidth >= targetHeight ? "landscape" : "portrait",
    enemySide: "right",
    captureType: "phone",
    capturedAt: captureTime.iso,
    capturedAtSource: captureTime.source,
  };
}

function blankDraft(file = null) {
  return {
    enemy: { name: "", groupName: "", memo: "", confidence: 0 },
    enemySide: file?.enemySide ?? "right",
    sourceLayout: file ? `${file.orientation}-${file.captureType}` : "manual",
    captureType: file?.captureType ?? "unknown",
    completeness: "manual",
    completenessScore: 0,
    observedAt: file?.capturedAt ?? new Date().toISOString(),
    observedAtSource: file?.capturedAtSource ?? "current-time",
    seasonName: state.currentSeason || "未設定",
    generals: [1, 2, 3].map((slot) => ({
      slot,
      roleLabel: slot === 1 ? "大将" : "副将",
      name: "",
      level: null,
      redLevel: null,
      inherentTactic: "",
      tactic1: "",
      tactic2: "",
      confidence: {},
    })),
    candidates: [],
    summary: {},
  };
}

async function analyzeCurrent() {
  const file = activeUpload();
  if (!file) return;
  showLoading("敵側の文字を拡大してOCR中...");
  try {
    const ocrInput = await buildOcrSheet(file);
    const response = await apiRequest("analyze_report", {
      imageBase64: await blobToBase64(ocrInput.blob),
      imageHash: ocrInput.hash,
      mimeType: ocrInput.mimeType,
      width: ocrInput.width,
      height: ocrInput.height,
      enemySide: file.enemySide,
      captureType: file.captureType,
      ocrProfile: ocrInput.profile,
      sourceOrientation: file.orientation,
      redLevels: ocrInput.redLevels,
      redLevelConfidence: ocrInput.redLevelConfidence,
      observedAtHint: file.capturedAt,
      observedAtSource: file.capturedAtSource,
    });
    state.draft = response.draft ?? blankDraft(file);
    state.draftUploadId = file.id;
    state.draft.observedAt = file.capturedAt ?? state.draft.observedAt ?? new Date().toISOString();
    state.draft.observedAtSource = file.capturedAtSource ?? state.draft.observedAtSource ?? "current-time";
    (ocrInput.redLevels ?? []).forEach((value, index) => {
      if (value == null) return;
      const general = (state.draft.generals ?? []).find((item) => Number(item.slot) === index + 1);
      if (!general) return;
      general.redLevel = value;
      general.confidence = {
        ...(general.confidence ?? {}),
        redLevel: Number(ocrInput.redLevelConfidence?.[index] ?? 0),
      };
    });
    state.draft.summary = {
      ...(state.draft.summary ?? {}),
      observedAtSource: state.draft.observedAtSource,
      redLevelSource: ocrInput.redLevelSource,
    };
    state.rawOcrText = response.rawText ?? "";
    state.analysisCached = Boolean(response.cached);
    state.analysisHash = response.imageHash ?? ocrInput.hash;
    state.usage = response.usage ?? state.usage;
    await loadSuggestions();
    renderReview();
  } catch (error) {
    showToast(error.message, "error");
    if (["GLOBAL_DAILY_LIMIT", "GLOBAL_MONTHLY_LIMIT"].includes(error.code)) {
      state.draft = blankDraft(file);
      state.draftUploadId = file.id;
      state.rawOcrText = "";
      state.analysisCached = false;
      state.analysisHash = "";
      await loadSuggestions();
      renderReview();
    }
  } finally {
    hideLoading();
  }
}

async function startManualEntry() {
  const file = activeUpload();
  state.draft = blankDraft(file);
  state.draftUploadId = file?.id ?? null;
  state.rawOcrText = "";
  state.analysisCached = false;
  state.analysisHash = "";
  await loadSuggestions();
  renderReview();
}

async function loadSuggestions() {
  if (state.suggestions.generals.length || state.suggestions.tactics.length) return;
  try {
    const response = await apiRequest("suggestions");
    state.suggestions = response.suggestions ?? state.suggestions;
  } catch {
    // 入力候補がなくても登録は可能。
  }
}

function suggestionsHtml() {
  const ocrCandidates = state.draft?.candidates ?? [];
  const generalValues = [...new Set([...state.suggestions.generals, ...ocrCandidates])].slice(0, 1000);
  const tacticValues = [...new Set([...state.suggestions.tactics, ...ocrCandidates])].slice(0, 1500);
  return `
    <datalist id="general-suggestions">${generalValues.map((value) => `<option value="${escapeAttr(value)}"></option>`).join("")}</datalist>
    <datalist id="tactic-suggestions">${tacticValues.map((value) => `<option value="${escapeAttr(value)}"></option>`).join("")}</datalist>`;
}

function renderReview() {
  const draft = state.draft;
  const file = reviewUpload();
  if (!draft) return;
  const generals = draft.generals ?? [];

  app.innerHTML = pageHtml({
    title: "認識結果の確認",
    subtitle: state.analysisCached ? "同じ画像の保存済みOCR結果" : draft.completeness === "manual" ? "手入力" : "OCR結果は必ず確認",
    activeNav: "upload",
    backAction: "back-to-upload",
    showNav: false,
    shellClass: "review-shell",
    content: `
      <section class="page-content review-page-content">
        ${suggestionsHtml()}
        ${
          file
            ? `<div class="card preview-card">
                <button type="button" class="image-preview-button" data-action="open-review-image">
                  <img src="${file.previewUrl}" alt="確認用の戦報画像" />
                  <span class="image-preview-caption"><span>画像を拡大して照合</span><span>${file.orientation === "portrait" ? "縦画面" : "横画面"}</span></span>
                </button>
              </div>`
            : ""
        }
        <div class="notice ${draft.completenessScore >= 75 ? "success" : "warning"}">
          敵側の各文字欄を切り出して拡大したOCR結果です。一門名は長い名称まで広く切り出し、先頭の紋章記号を補正します。スマホ標準スクリーンショットでは凸数も珠の色から判定します。内容は登録前に確認してください。横画面のゲーム内スクショでは第2戦法が画像外になる場合があります。
          <div class="badge-row" style="margin-top:8px"><span class="badge info">シーズン：${escapeHtml(draft.seasonName || state.currentSeason || "未設定")}</span></div>
        </div>

        <div class="card form-stack">
          <div class="card-header"><div><h2>敵プレイヤー</h2><small>必須</small></div></div>
          <label class="field">
            <span>プレイヤー名<span class="confidence-dot ${confidenceClass(draft.enemy?.confidence)}"></span></span>
            <input data-draft-path="enemy.name" value="${escapeAttr(draft.enemy?.name ?? "")}" maxlength="80" required placeholder="敵プレイヤー名" />
          </label>
          <label class="field">
            <span>所属一門・陣営</span>
            <input data-draft-path="enemy.groupName" value="${escapeAttr(draft.enemy?.groupName ?? "")}" maxlength="80" placeholder="分かる場合のみ" />
          </label>
          <label class="field">
            <span>確認日時</span>
            <input type="datetime-local" data-draft-path="observedAtLocal" value="${toDatetimeLocal(draft.observedAt)}" />
            <small>${escapeHtml(captureTimeSourceLabel(draft.observedAtSource ?? file?.capturedAtSource))}</small>
          </label>
          <label class="field">
            <span>備考</span>
            <textarea data-draft-path="enemy.memo" maxlength="500" placeholder="主力、要注意、対策など">${escapeHtml(draft.enemy?.memo ?? "")}</textarea>
          </label>
        </div>

        ${[1, 2, 3]
          .map((slot) => {
            const general = generals.find((item) => Number(item.slot) === slot) ?? blankDraft().generals[slot - 1];
            const index = generals.findIndex((item) => Number(item.slot) === slot);
            const actualIndex = index >= 0 ? index : slot - 1;
            return `
              <section class="general-card">
                <div class="general-card-header">
                  <h3>${slot === 1 ? "大将" : `副将${slot - 1}`}</h3>
                  <span class="badge">${slot}/3</span>
                </div>
                <label class="field">
                  <span>武将名<span class="confidence-dot ${confidenceClass(general.confidence?.name)}"></span></span>
                  <input list="general-suggestions" data-draft-path="generals.${actualIndex}.name" value="${escapeAttr(general.name ?? "")}" maxlength="40" placeholder="武将名" />
                </label>
                <div class="form-grid-2">
                  <label class="field">
                    <span>Lv</span>
                    <input type="number" inputmode="numeric" min="1" max="100" data-draft-path="generals.${actualIndex}.level" value="${escapeAttr(general.level ?? "")}" placeholder="例 50" />
                  </label>
                  <label class="field">
                    <span>凸数<span class="confidence-dot ${confidenceClass(general.confidence?.redLevel)}"></span></span>
                    <select data-draft-path="generals.${actualIndex}.redLevel">${limitBreakOptions(general.redLevel)}</select>
                  </label>
                </div>
                <label class="field">
                  <span>固有戦法<span class="confidence-dot ${confidenceClass(general.confidence?.inherentTactic)}"></span></span>
                  <input list="tactic-suggestions" data-draft-path="generals.${actualIndex}.inherentTactic" value="${escapeAttr(general.inherentTactic ?? "")}" maxlength="50" placeholder="固有戦法" />
                </label>
                <label class="field">
                  <span>第1戦法<span class="confidence-dot ${confidenceClass(general.confidence?.tactic1)}"></span></span>
                  <input list="tactic-suggestions" data-draft-path="generals.${actualIndex}.tactic1" value="${escapeAttr(general.tactic1 ?? "")}" maxlength="50" placeholder="第1戦法" />
                </label>
                <label class="field">
                  <span>第2戦法<span class="confidence-dot ${confidenceClass(general.confidence?.tactic2)}"></span></span>
                  <input list="tactic-suggestions" data-draft-path="generals.${actualIndex}.tactic2" value="${escapeAttr(general.tactic2 ?? "")}" maxlength="50" placeholder="画像外なら空欄でも登録可能" />
                </label>
              </section>`;
          })
          .join("")}

        ${
          state.rawOcrText
            ? `<details><summary>OCRの診断情報</summary><div class="details-body">
                ${file?.ocrPrepared?.previewUrl ? `<button type="button" class="secondary-button" style="width:100%;margin-bottom:12px" data-action="open-ocr-image">OCR用に切り出した画像を確認</button>` : ""}
                <pre class="raw-ocr">${escapeHtml(state.rawOcrText)}</pre>
              </div></details>`
            : ""
        }

        <div class="review-sticky-bar">
          <button type="button" class="secondary-button" data-action="back-to-upload">戻る</button>
          <button type="button" class="primary-button" data-action="save-observation">確認して登録</button>
        </div>
      </section>`,
  });
}

function setByPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = /^\d+$/.test(parts[index]) ? Number(parts[index]) : parts[index];
    if (cursor[key] == null) cursor[key] = /^\d+$/.test(parts[index + 1]) ? [] : {};
    cursor = cursor[key];
  }
  const last = /^\d+$/.test(parts.at(-1)) ? Number(parts.at(-1)) : parts.at(-1);
  cursor[last] = value;
}

function computeCompleteness(draft) {
  let present = draft.enemy?.name ? 2 : 0;
  const generals = draft.generals ?? [];
  for (const general of generals) {
    if (general.name) present += 2;
    if (general.inherentTactic) present += 1;
    if (general.tactic1) present += 1;
    if (general.tactic2) present += 1;
  }
  const score = Math.round((present / 17) * 100);
  return { score, completeness: draft.completeness === "manual" ? "manual" : score >= 79 ? "complete" : "partial" };
}

async function saveObservation() {
  const draft = state.draft;
  if (!draft?.enemy?.name?.trim()) {
    showToast("敵プレイヤー名を入力してください。", "error");
    document.querySelector('[data-draft-path="enemy.name"]')?.focus();
    return;
  }
  if (!(draft.generals ?? []).some((general) => general.name?.trim())) {
    const proceed = window.confirm("武将名が1件もありません。このまま部分情報として登録しますか？");
    if (!proceed) return;
  }

  const file = reviewUpload();
  const completion = computeCompleteness(draft);
  const imageHash = file?.hash ?? (await sha256Text(`${crypto.randomUUID()}-${Date.now()}`));
  const payload = {
    enemy: {
      name: draft.enemy.name.trim(),
      groupName: draft.enemy.groupName?.trim() ?? "",
      memo: draft.enemy.memo?.trim() ?? "",
    },
    observedAt: draft.observedAt ?? new Date().toISOString(),
    seasonName: draft.seasonName ?? state.currentSeason ?? "未設定",
    imageHash,
    ocrCacheHash: state.rawOcrText && file ? state.analysisHash : "",
    sourceLayout: draft.sourceLayout ?? (file ? `${file.orientation}-${file.captureType}` : "manual"),
    captureType: draft.captureType ?? file?.captureType ?? "unknown",
    enemySide: draft.enemySide ?? file?.enemySide ?? "right",
    completeness: completion.completeness,
    summary: { ...(draft.summary ?? {}), completenessScore: completion.score },
    ocrDraft: state.rawOcrText ? draft : {},
    generals: (draft.generals ?? []).map((general, index) => ({
      slot: index + 1,
      roleLabel: index === 0 ? "大将" : "副将",
      name: general.name?.trim() ?? "",
      level: general.level === "" || general.level == null ? null : Number(general.level),
      redLevel: general.redLevel === "" || general.redLevel == null ? null : Number(general.redLevel),
      inherentTactic: general.inherentTactic?.trim() ?? "",
      tactic1: general.tactic1?.trim() ?? "",
      tactic2: general.tactic2?.trim() ?? "",
      confidence: general.confidence ?? {},
    })),
  };

  showLoading("敵部隊を保存中...");
  try {
    const response = await apiRequest("save_observation", { payload });
    const result = response.result ?? {};
    const intelResult = result.intel ?? null;
    showToast(result.duplicate ? "同じ画像の戦報は登録済みです。" : "敵部隊を登録しました。", "success");

    if (file) {
      URL.revokeObjectURL(file.previewUrl);
      if (file.ocrPrepared?.previewUrl) URL.revokeObjectURL(file.ocrPrepared.previewUrl);
      state.uploadQueue = state.uploadQueue.filter((item) => item.id !== file.id);
      state.activeUploadId = state.uploadQueue[0]?.id ?? null;
    }
    state.draft = null;
    state.draftUploadId = null;
    state.rawOcrText = "";
    state.analysisHash = "";

    if (state.uploadQueue.length) {
      renderUpload();
      showToast(`残り${state.uploadQueue.length}枚です。次の画像を確認してください。`, "success");
    } else if (result.enemyId) {
      await openEnemy(result.enemyId);
    } else {
      await navigate("enemies");
    }
    if (intelResult) showIntelSaveResult(intelResult, Boolean(result.duplicate));
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    hideLoading();
  }
}

async function sha256Text(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function rankingHtml(title, rows, currentContributorId = "") {
  const data = Array.isArray(rows) ? rows : [];
  return `
    <div class="card intel-ranking-card">
      <div class="card-header"><div><h2>${escapeHtml(title)}</h2><small>Discord連携済みユーザー</small></div></div>
      ${
        data.length
          ? `<div class="intel-ranking-list">${data.slice(0, 15).map((row) => `
              <div class="intel-ranking-row ${row.contributorId === currentContributorId ? "is-me" : ""}">
                <span class="intel-rank">${row.rank}</span>
                <strong>${escapeHtml(row.displayName || "不明")}</strong>
                <span>${Number(row.points || 0)}pt</span>
              </div>`).join("")}</div>`
          : `<p class="muted" style="margin:0">まだポイント獲得者はいません。</p>`
      }
    </div>`;
}

async function renderIntel() {
  app.innerHTML = pageHtml({
    title: "諜報",
    subtitle: `対象：${state.currentSeason || "未設定"}`,
    activeNav: "intel",
    content: `<section class="page-content"><div class="card"><p class="muted" style="margin:0">諜報情報を読み込み中...</p></div></section>`,
  });
  try {
    const response = await apiRequest("intel_dashboard");
    state.intel = response.intel ?? null;
    state.currentSeason = state.intel?.currentSeason ?? state.currentSeason;
    const subtitle = document.querySelector(".page-header-title small");
    if (subtitle) subtitle.textContent = `対象：${state.currentSeason || "未設定"}`;
    renderIntelBody();
  } catch (error) {
    showToast(error.message, "error");
    const content = document.querySelector(".page-content");
    if (content) content.innerHTML = `<div class="notice danger">${escapeHtml(error.message)}</div>`;
  }
}

function intelTitleProgress(pointsRaw) {
  const points = Math.max(0, Number(pointsRaw ?? 0) || 0);
  let current = null;
  let next = null;
  for (const level of INTEL_TITLE_LEVELS) {
    if (points >= level.threshold) current = level;
    else {
      next = level;
      break;
    }
  }
  if (!next) {
    return {
      current,
      next: null,
      percent: 100,
      remaining: 0,
      label: "最高位到達",
    };
  }
  const floor = current?.threshold ?? 0;
  const span = Math.max(1, next.threshold - floor);
  const percent = Math.max(0, Math.min(100, Math.round(((points - floor) / span) * 100)));
  return {
    current,
    next,
    percent,
    remaining: Math.max(0, next.threshold - points),
    label: `${next.label}まで ${Math.max(0, next.threshold - points)}pt`,
  };
}

function renderIntelBody() {
  const content = document.querySelector(".page-content");
  if (!content) return;
  const intel = state.intel ?? {};
  const linked = Boolean(intel.linked);
  const contributor = intel.contributor ?? null;
  const title = intel.title?.label || "称号なし";
  const achievements = Array.isArray(intel.achievements) ? intel.achievements : [];
  const feed = Array.isArray(intel.feed) ? intel.feed : [];
  const recentPoints = Array.isArray(intel.recentPoints) ? intel.recentPoints : [];
  const titleProgress = intelTitleProgress(intel.seasonPoints || 0);

  content.innerHTML = `
    ${
      linked
        ? `<div class="card intel-profile-card">
            <div class="intel-profile-top">
              <div>
                <small>Discord連携</small>
                <h2>${escapeHtml(contributor?.displayName || "連携ユーザー")}</h2>
              </div>
              <span class="badge success">${escapeHtml(title)}</span>
            </div>
            <div class="intel-point-stats">
              <div><strong>${Number(intel.seasonPoints || 0)}</strong><span>今期pt</span></div>
              <div><strong>${Number(intel.weeklyPoints || 0)}</strong><span>今週pt</span></div>
            </div>
            <div class="intel-title-status">
              <div class="intel-title-status-head">
                <span>${titleProgress.next ? "次の称号" : "称号進行"}</span>
                <strong>${escapeHtml(titleProgress.label)}</strong>
              </div>
              <div class="intel-title-track" aria-label="称号進捗"><i style="width:${titleProgress.percent}%"></i></div>
              <div class="intel-title-scale">
                <span>${titleProgress.current ? `${escapeHtml(titleProgress.current.label)} ${titleProgress.current.threshold}pt` : "開始 0pt"}</span>
                <span>${titleProgress.next ? `${escapeHtml(titleProgress.next.label)} ${titleProgress.next.threshold}pt` : "600pt+"}</span>
              </div>
            </div>
            <div class="intel-title-ladder" aria-label="称号基準">
              ${INTEL_TITLE_LEVELS.map((level) => `<span class="${Number(intel.seasonPoints || 0) >= level.threshold ? "reached" : ""}">${escapeHtml(level.label)} <b>${level.threshold}</b></span>`).join("")}
            </div>
            <button type="button" class="secondary-button intel-small-button" data-action="discord-disconnect">この端末のDiscord連携を解除</button>
          </div>`
        : `<div class="card intel-connect-card">
            <div class="card-header"><div><h2>Discord未連携</h2><small>連携しなくても閲覧・OCR・登録できます</small></div></div>
            <p class="muted">ポイント・ランキング・称号を利用する場合だけDiscordと連携してください。未連携中の登録にはポイントを後から遡って付与しません。</p>
            ${intel.discordOAuthConfigured
              ? `<button type="button" class="primary-button" style="width:100%" data-action="discord-connect">Discordと連携</button>`
              : `<div class="notice warning">管理者によるDiscord OAuth設定がまだ完了していません。</div>`}
          </div>`
    }

    <div class="card intel-feed-card">
      <div class="card-header"><div><h2>最近の発見</h2><small>価値のある発見・変更だけを表示</small></div></div>
      ${feed.length
        ? `<div class="intel-feed-list">${feed.map((item) => `
            <div class="intel-feed-item">
              <span>${escapeHtml(relativeTime(item.created_at))}</span>
              <p>${escapeHtml(item.message || "")}</p>
            </div>`).join("")}</div>`
        : `<p class="muted" style="margin:0">まだ発見フィードはありません。</p>`}
    </div>

    ${rankingHtml("今週のランキング", intel.weeklyRanking, contributor?.id || "")}
    ${rankingHtml("今期のランキング", intel.seasonRanking, contributor?.id || "")}

    ${linked ? `<div class="card intel-achievement-card">
      <div class="card-header"><div><h2>実績</h2><small>Web上だけで保持</small></div></div>
      <div class="intel-achievement-list">
        ${achievements.map((item) => {
          const current = Number(item.current || 0);
          const target = Math.max(1, Number(item.target || 1));
          const percent = Math.max(0, Math.min(100, Math.round((current / target) * 100)));
          return `<div class="intel-achievement ${item.unlocked ? "unlocked" : ""}">
            <div><strong>${item.unlocked ? "✓ " : ""}${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span></div>
            <small>${current} / ${target}</small>
            <div class="intel-progress"><i style="width:${percent}%"></i></div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div><h2>最近のポイント</h2><small>獲得理由の履歴</small></div></div>
      ${recentPoints.length
        ? `<div class="intel-point-history">${recentPoints.map((item) => `
            <div><span>${escapeHtml(relativeTime(item.created_at))}</span><strong>${escapeHtml(item.description || item.event_type)}</strong><b>+${Number(item.points || 0)}pt</b></div>`).join("")}</div>`
        : `<p class="muted" style="margin:0">まだポイント履歴はありません。</p>`}
    </div>` : ""}
  `;
}

async function renderUsage() {
  app.innerHTML = pageHtml({
    title: "OCR使用状況",
    subtitle: "課金防止の上限管理",
    activeNav: "usage",
    content: `<section class="page-content"><div class="card"><p class="muted" style="margin:0">読み込み中...</p></div></section>`,
  });
  try {
    const response = await apiRequest("usage");
    state.usage = response.usage;
    state.currentSeason = response.usage?.currentSeason ?? state.currentSeason;
    renderUsageBody();
  } catch (error) {
    showToast(error.message, "error");
  }
}

function progressClass(used, limit) {
  const ratio = limit ? used / limit : 0;
  if (ratio >= 0.9) return "danger";
  if (ratio >= 0.7) return "warning";
  return "";
}

function usageCard(title, metric, note = "") {
  const percent = metric.limit ? clamp((metric.used / metric.limit) * 100, 0, 100) : 0;
  return `
    <div class="card progress-card">
      <div class="progress-row"><strong>${escapeHtml(title)}</strong><span>${metric.used} / ${metric.limit}</span></div>
      <div class="progress-track"><div class="progress-fill ${progressClass(metric.used, metric.limit)}" style="width:${percent}%"></div></div>
      ${note ? `<small>${escapeHtml(note)}</small>` : ""}
    </div>`;
}

function renderUsageBody() {
  const content = document.querySelector(".page-content");
  if (!content || !state.usage) return;
  const usage = state.usage;
  content.innerHTML = `
    <div class="notice info">対象シーズン：${escapeHtml(usage.currentSeason || state.currentSeason)}。同一画像はOCRキャッシュを利用するため、無料枠を再消費しません。上限到達後も手入力は利用できます。</div>
    ${usageCard("一門全体・本日", usage.globalDaily, "日単位の暴走を防止")}
    ${usageCard("一門全体・今月", usage.globalMonthly, `システム上の絶対上限は月${usage.globalMonthly.hardLimit ?? 900}枚`)}
    <div class="card">
      <div class="kpi-grid">
        <div class="kpi"><strong>${usage.maxBatchFiles}</strong><span>一度に選べる画像</span></div>
        <div class="kpi"><strong>${formatBytes(usage.maxImageBytes)}</strong><span>1画像の上限</span></div>
      </div>
    </div>`;
}

function masterTypeLabel(type) {
  return type === "tactic" ? "戦法" : "武将";
}

async function loadMasters() {
  const response = await apiRequest("master_list");
  state.masters = response.masters ?? { generals: [], tactics: [] };
}

async function renderMasters() {
  app.innerHTML = pageHtml({
    title: "OCR補正マスタ",
    subtitle: "武将名・戦法名の補正に使用",
    activeNav: "settings",
    backAction: "back-to-settings",
    content: `<section class="page-content"><div class="card"><p class="muted" style="margin:0">読み込み中...</p></div></section>`,
  });
  try {
    await loadMasters();
    renderMastersBody();
  } catch (error) {
    const content = document.querySelector(".page-content");
    if (content) content.innerHTML = `<div class="notice danger">${escapeHtml(error.message)}</div>`;
  }
}

function normalizeMasterSearch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja")
    .replace(/[\s\u3000]+/g, "");
}

function applyMasterSearchFilter() {
  const input = document.getElementById("master-search");
  const root = document.querySelector(".page-content");
  if (!input || !root) return;

  const query = normalizeMasterSearch(input.value);
  state.masterSearch = input.value;
  let visibleCount = 0;
  root.querySelectorAll("[data-master-entry]").forEach((entry) => {
    const name = entry.dataset.masterSearchName ?? "";
    const visible = !query || name.includes(query);
    entry.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  const count = root.querySelector("[data-master-count]");
  if (count) count.textContent = `${visibleCount}件表示`;

  const empty = root.querySelector("[data-master-empty]");
  if (empty) {
    empty.hidden = visibleCount > 0;
    const message = empty.querySelector("[data-master-empty-message]");
    if (message) {
      message.textContent = query
        ? "検索条件を変更してください。"
        : "管理者が正しい名称を追加してください。";
    }
  }
}

function renderMastersBody() {
  const content = document.querySelector(".page-content");
  if (!content) return;
  const type = state.masterType === "tactic" ? "tactic" : "general";
  const source = type === "general" ? state.masters.generals ?? [] : state.masters.tactics ?? [];
  const isAdmin = state.member?.role === "admin";

  content.innerHTML = `
    <div class="notice info">
      ここに登録された名称をOCRの補正辞書として使用します。表示される名称はゲーム内で実際に装着・使用されているという意味ではありません。誤った名称がある場合は管理者が修正または補正対象から除外してください。登録済みの戦報データ自体は、敵詳細の「この記録を編集」から修正します。
    </div>
    <div class="form-grid-2">
      <button type="button" class="${type === "general" ? "primary-button" : "secondary-button"}" data-action="switch-master-type" data-master-type="general">武将マスタ (${state.masters.generals?.length ?? 0})</button>
      <button type="button" class="${type === "tactic" ? "primary-button" : "secondary-button"}" data-action="switch-master-type" data-master-type="tactic">戦法マスタ (${state.masters.tactics?.length ?? 0})</button>
    </div>
    <div class="search-box" style="margin-top:12px">
      <input id="master-search" type="search" inputmode="search" value="${escapeAttr(state.masterSearch)}" placeholder="${masterTypeLabel(type)}名で検索" aria-label="マスタを検索" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" />
    </div>
    ${isAdmin ? `
      <div class="card form-stack">
        <div class="card-header"><div><h2>${masterTypeLabel(type)}マスタへ追加</h2><small>OCR補正候補として追加</small></div></div>
        <form class="form-stack" data-form="add-master-entry">
          <label class="field"><span>${masterTypeLabel(type)}名</span><input name="name" maxlength="${type === "general" ? 40 : 50}" required placeholder="正しい名称" /></label>
          <button type="submit" class="primary-button">マスタへ追加</button>
        </form>
      </div>` : ""}
    <div class="card">
      <div class="card-header"><div><h2>${masterTypeLabel(type)}マスタ</h2><small data-master-count>0件表示</small></div></div>
      <div class="admin-member-list" data-master-list>
        ${source.map((item) => isAdmin ? `
          <div class="admin-member-card" data-master-entry data-master-search-name="${escapeAttr(normalizeMasterSearch(item.name))}">
            <div class="admin-member-top">
              <div><strong>${escapeHtml(item.name)}</strong><div class="badge-row" style="margin-top:6px"><span class="badge ${item.active ? "success" : "danger"}">${item.active ? "OCR補正対象" : "補正から除外中"}</span></div></div>
            </div>
            <div class="admin-role-row">
              <input data-master-name-id="${escapeAttr(item.id)}" value="${escapeAttr(item.name)}" maxlength="${type === "general" ? 40 : 50}" aria-label="${escapeAttr(item.name)}の名称" />
              <button type="button" class="compact-button" data-action="save-master-entry" data-master-id="${escapeAttr(item.id)}" data-master-type="${type}" data-master-active="${item.active ? "true" : "false"}">保存</button>
            </div>
            <div class="admin-actions">
              <button type="button" class="secondary-button" style="min-height:40px" data-action="toggle-master-entry" data-master-id="${escapeAttr(item.id)}" data-master-type="${type}" data-master-name="${escapeAttr(item.name)}" data-master-active="${item.active ? "false" : "true"}">${item.active ? "OCR補正から除外" : "OCR補正に戻す"}</button>
              <button type="button" class="danger-button" style="min-height:40px" data-action="delete-master-entry" data-master-id="${escapeAttr(item.id)}" data-master-type="${type}" data-master-name="${escapeAttr(item.name)}">削除</button>
            </div>
          </div>` : `
          <div class="admin-member-card" data-master-entry data-master-search-name="${escapeAttr(normalizeMasterSearch(item.name))}">
            <div class="admin-member-top"><strong>${escapeHtml(item.name)}</strong></div>
          </div>`).join("")}
      </div>
      <div class="empty-state" data-master-empty hidden>
        <div class="empty-icon">⌕</div>
        <strong>該当する${masterTypeLabel(type)}がありません</strong>
        <span data-master-empty-message></span>
      </div>
    </div>`;

  applyMasterSearchFilter();
}

async function refreshMasters() {
  await loadMasters();
  state.suggestions = { generals: [], tactics: [] };
  renderMastersBody();
}

async function renderSettings() {
  app.innerHTML = pageHtml({
    title: "設定",
    subtitle: state.member?.role === "admin" ? (state.member?.displayName ?? "") : "",
    activeNav: "settings",
    content: `<section class="page-content"><div class="card"><p class="muted" style="margin:0">読み込み中...</p></div></section>`,
  });

  if (state.member?.role === "admin") {
    try {
      state.admin = await apiRequest("admin_list");
      state.currentSeason = state.admin.settings?.current_season ?? state.currentSeason;
    } catch (error) {
      showToast(error.message, "error");
    }
  }
  renderSettingsBody();
}

function renderSettingsBody() {
  const content = document.querySelector(".page-content");
  if (!content) return;
  const member = state.member;
  const adminData = state.admin;

  content.innerHTML = `
    ${
      member?.role === "admin" && state.systemStatus?.visionConfigured === false
        ? `<div class="notice danger"><strong>Google Vision APIキーが未設定です。</strong><br>Supabase Edge FunctionのSecretsへ GOOGLE_VISION_API_KEY を登録してください。</div>`
        : ""
    }
    ${
      member?.role === "admin" && state.systemStatus?.originRestricted === false
        ? `<div class="notice warning"><strong>ALLOWED_ORIGINSが未制限です。</strong><br>GitHub Pagesのドメインだけを許可する設定へ変更してください。</div>`
        : ""
    }

    ${
      member?.role === "admin"
        ? `<div class="card">
            <div class="card-header"><div><h2>管理者</h2><small>初回登録した管理端末</small></div></div>
            <p class="muted" style="margin:0">一般利用者にはアクセスコードや個別認証を求めません。管理者権限だけ、この端末の内部セッションで保持します。</p>
          </div>`
        : ""
    }

    <div class="card install-hint">
      <h2>iPhoneのホーム画面へ追加</h2>
      <span>Safari下部の共有ボタン →「ホーム画面に追加」を選ぶと、アプリのように全画面で使えます。</span>
    </div>

    <div class="notice info" style="font-size:.8rem">アプリバージョン：${escapeHtml(APP_VERSION)}</div>

    <div class="card">
      <div class="card-header"><div><h2>武将・戦法マスタ</h2><small>OCRの誤読補正辞書</small></div></div>
      <p class="muted">OCRで読み取った名称を、登録済みの正しい武将名・戦法名へ近似照合します。閲覧は全員、修正は管理者のみ可能です。</p>
      <button type="button" class="secondary-button" style="width:100%" data-action="navigate" data-view="masters">マスタを確認</button>
    </div>

    ${
      member?.role === "admin" && adminData
        ? `<div class="card form-stack">
            <div class="card-header"><div><h2>シーズン・OCR上限</h2><small>月900枚を超える設定は不可</small></div></div>
            <form class="form-stack" data-form="update-limits">
              <label class="field"><span>現在のシーズン名</span><input name="currentSeason" maxlength="60" value="${escapeAttr(adminData.settings.current_season ?? state.currentSeason)}" placeholder="例：PK 四雄怒涛" required /></label>
              <div class="form-grid-2">
                <label class="field"><span>全体/日</span><input name="globalDaily" type="number" inputmode="numeric" min="1" max="100" value="${adminData.settings.global_daily_limit}" /></label>
                <label class="field"><span>全体/月</span><input name="globalMonthly" type="number" inputmode="numeric" min="1" max="900" value="${adminData.settings.global_monthly_limit}" /></label>
              </div>
              <button type="submit" class="secondary-button">上限を更新</button>
            </form>
          </div>`
        : ""
    }
    ${
      member?.role === "admin" && adminData
        ? `<div class="card form-stack">
            <div class="card-header"><div><h2>Discord連携・称号ロール</h2><small>${escapeHtml(state.currentSeason || "未設定")}用の設定</small></div></div>
            ${!adminData.discordOAuthConfigured ? `<div class="notice warning">DISCORD_CLIENT_ID / DISCORD_CLIENT_SECRET が未設定です。</div>` : `<div class="notice success">Discord OAuth：設定済み</div>`}
            ${!adminData.discordBotConfigured ? `<div class="notice warning">DISCORD_BOT_TOKEN が未設定のため、称号ロールの自動付与は行われません。</div>` : `<div class="notice success">Discord Bot：設定済み</div>`}
            <div class="discord-redirect-box"><span>Discord Developer PortalのRedirect URI</span><code>${escapeHtml(adminData.discordRedirectUri || "")}</code></div>
            <form class="form-stack" data-form="discord-config">
              <label class="field"><span>DiscordサーバーID</span><input name="guildId" inputmode="numeric" maxlength="30" value="${escapeAttr(adminData.discordConfig?.guild_id || "")}" placeholder="例：123456789012345678" /></label>
              <details>
                <summary>称号ロールIDを手動設定</summary>
                <div class="details-body form-stack">
                  <label class="field"><span>斥候</span><input name="roleScoutId" inputmode="numeric" value="${escapeAttr(adminData.discordConfig?.role_scout_id || "")}" /></label>
                  <label class="field"><span>間者</span><input name="roleSpyId" inputmode="numeric" value="${escapeAttr(adminData.discordConfig?.role_spy_id || "")}" /></label>
                  <label class="field"><span>忍頭</span><input name="roleNinjaHeadId" inputmode="numeric" value="${escapeAttr(adminData.discordConfig?.role_ninja_head_id || "")}" /></label>
                  <label class="field"><span>御庭番</span><input name="roleOniwabanId" inputmode="numeric" value="${escapeAttr(adminData.discordConfig?.role_oniwaban_id || "")}" /></label>
                  <label class="field"><span>諜報奉行</span><input name="roleIntelCommissionerId" inputmode="numeric" value="${escapeAttr(adminData.discordConfig?.role_intel_commissioner_id || "")}" /></label>
                </div>
              </details>
              <button type="submit" class="secondary-button">Discord設定を保存</button>
            </form>
            <button type="button" class="primary-button" style="width:100%" data-action="create-discord-roles" ${adminData.discordBotConfigured ? "" : "disabled"}>称号ロールを自動作成</button>
            <div class="title-threshold-note">
              <span>今期の称号基準</span>
              <div>${INTEL_TITLE_LEVELS.map((level) => `<b>${escapeHtml(level.label)} ${level.threshold}pt</b>`).join("")}</div>
            </div>
            <p class="muted" style="margin:0">新シーズンではサーバーIDを設定し直し、「称号ロールを自動作成」を押せば5つのロールを用意できます。Botの「ロールの管理」権限と、Botロールが称号ロールより上にあることが必要です。</p>
          </div>`
        : ""
    }
  `;
}

function openImage(url) {
  if (!url) return;
  dialogImage.src = url;
  if (typeof imageDialog.showModal === "function") imageDialog.showModal();
  else imageDialog.setAttribute("open", "");
}


async function refreshAdmin() {
  state.admin = await apiRequest("admin_list");
  state.currentSeason = state.admin.settings?.current_season ?? state.currentSeason;
  renderSettingsBody();
}

let searchTimer = null;

function scheduleEnemySearch() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(async () => {
    try {
      const response = await apiRequest("list_enemies", { search: state.enemySearch });
      state.enemies = response.enemies ?? [];
      state.currentSeason = response.currentSeason ?? state.currentSeason;
      renderEnemyListBody();
      document.getElementById("enemy-search")?.focus({ preventScroll: true });
    } catch (error) {
      showToast(error.message, "error");
    }
  }, 300);
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "enemy-search") {
    state.enemySearch = target.value;
    if (!event.isComposing && target.dataset.composing !== "true") {
      scheduleEnemySearch();
    }
    return;
  }

  if (target.id === "master-search") {
    state.masterSearch = target.value;
    if (!event.isComposing && target.dataset.composing !== "true") {
      applyMasterSearchFilter();
    }
    return;
  }

  const editPath = target.dataset?.editPath;
  if (editPath && state.editDraft) {
    if (editPath === "observedAtLocal") {
      state.editDraft.observedAt = fromDatetimeLocal(target.value);
      return;
    }
    let value = target.value;
    if (target.type === "number") value = value === "" ? null : Number(value);
    setByPath(state.editDraft, editPath, value);
    return;
  }

  const path = target.dataset?.draftPath;
  if (path && state.draft) {
    if (path === "observedAtLocal") {
      state.draft.observedAt = fromDatetimeLocal(target.value);
      return;
    }
    let value = target.value;
    if (target.type === "number") value = value === "" ? null : Number(value);
    setByPath(state.draft, path, value);
  }
});


document.addEventListener("compositionstart", (event) => {
  const target = event.target;
  if (target?.id === "master-search" || target?.id === "enemy-search") {
    target.dataset.composing = "true";
  }
});

document.addEventListener("compositionend", (event) => {
  const target = event.target;
  if (target?.id !== "master-search" && target?.id !== "enemy-search") return;
  delete target.dataset.composing;
  if (target.id === "master-search") {
    state.masterSearch = target.value;
    applyMasterSearchFilter();
    return;
  }
  state.enemySearch = target.value;
  scheduleEnemySearch();
});

function isTextEditingControl(element) {
  if (!(element instanceof HTMLElement)) return false;
  if (element instanceof HTMLTextAreaElement) return true;
  if (!(element instanceof HTMLInputElement)) return false;
  return ["text", "search", "number", "email", "password", "tel", "url"].includes(element.type);
}

function keepReviewFieldVisible(element) {
  if (!window.matchMedia("(pointer: coarse)").matches) return;
  if (!element.closest(".review-page-content")) return;
  const centerField = () => {
    if (document.activeElement === element) {
      element.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
    }
  };
  window.setTimeout(centerField, 180);
  window.setTimeout(centerField, 520);
}

document.addEventListener("focusin", (event) => {
  if (isTextEditingControl(event.target)) keepReviewFieldVisible(event.target);
});

document.addEventListener("focusout", () => {
  // OCR確認/編集画面では固定フッターを使わないため、
  // キーボード表示の有無でナビを退避させる必要はない。
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.id === "report-files") {
    await prepareFiles(target.files);
  }
});

document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) return;
  event.preventDefault();
  const formData = new FormData(form);

  if (form.dataset.form === "bootstrap") {
    showLoading("初期管理者を登録中...");
    try {
      await ensureAnonymousSession();
      const response = await apiRequest("bootstrap", {
        displayName: formData.get("displayName"),
        secret: formData.get("secret"),
      });
      state.member = response.member;
      try {
        state.systemStatus = await apiRequest("status");
      } catch {
        // 初期登録は完了しているため、状態表示の再取得に失敗しても利用を続ける。
      }
      await navigate("enemies");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }


  if (form.dataset.form === "add-master-entry") {
    showLoading("マスタへ追加中...");
    try {
      await apiRequest("admin_master_save", {
        masterType: state.masterType,
        name: formData.get("name"),
        active: true,
      });
      showToast(`${masterTypeLabel(state.masterType)}マスタへ追加しました。`, "success");
      form.reset();
      await refreshMasters();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }


  if (form.dataset.form === "update-limits") {
    showLoading("上限を更新中...");
    try {
      await apiRequest("admin_update_limits", {
        globalDaily: Number(formData.get("globalDaily")),
        globalMonthly: Number(formData.get("globalMonthly")),
        currentSeason: formData.get("currentSeason"),
      });
      showToast("設定を更新しました。", "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }

  if (form.dataset.form === "discord-config") {
    showLoading("Discord設定を保存中...");
    try {
      await apiRequest("admin_discord_config_save", {
        guildId: formData.get("guildId"),
        roleScoutId: formData.get("roleScoutId"),
        roleSpyId: formData.get("roleSpyId"),
        roleNinjaHeadId: formData.get("roleNinjaHeadId"),
        roleOniwabanId: formData.get("roleOniwabanId"),
        roleIntelCommissionerId: formData.get("roleIntelCommissionerId"),
      });
      showToast("Discord設定を保存しました。", "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "reload-app") window.location.reload();
  if (action === "navigate") await navigate(button.dataset.view);
  if (action === "back-to-settings") await navigate("settings");
  if (action === "dismiss-intel-result") {
    const dialog = button.closest("dialog");
    if (dialog?.close) dialog.close();
    dialog?.remove();
  }
  if (action === "discord-connect") {
    showLoading("Discordへ移動中...");
    try {
      const returnUrl = `${window.location.origin}${window.location.pathname}`;
      const response = await apiRequest("discord_oauth_start", { returnUrl });
      if (!response.authorizeUrl) throw new AppError("Discord認証URLを取得できませんでした。", "DISCORD_URL_MISSING");
      window.location.assign(response.authorizeUrl);
      return;
    } catch (error) {
      showToast(error.message, "error");
      hideLoading();
    }
  }
  if (action === "discord-disconnect") {
    if (!window.confirm("このブラウザ/PWAのDiscord連携を解除しますか？既に獲得したポイントは残ります。")) return;
    showLoading("Discord連携を解除中...");
    try {
      await apiRequest("discord_disconnect");
      state.intel = null;
      showToast("この端末のDiscord連携を解除しました。", "success");
      await renderIntel();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }
  if (action === "create-discord-roles") {
    const guildInput = document.querySelector('[data-form="discord-config"] [name="guildId"]');
    const guildId = guildInput?.value?.trim() || "";
    if (!guildId) { showToast("DiscordサーバーIDを入力してください。", "error"); return; }
    showLoading("Discord称号ロールを作成中...");
    try {
      await apiRequest("admin_discord_create_roles", { guildId });
      showToast("称号ロールを作成・設定しました。", "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }
  if (action === "switch-master-type") {
    state.masterType = button.dataset.masterType === "tactic" ? "tactic" : "general";
    state.masterSearch = "";
    renderMastersBody();
  }
  if (action === "save-master-entry") {
    const input = document.querySelector(`[data-master-name-id="${button.dataset.masterId}"]`);
    const name = input?.value?.trim() ?? "";
    if (!name) { showToast("名称を入力してください。", "error"); return; }
    showLoading("マスタを更新中...");
    try {
      await apiRequest("admin_master_save", {
        id: button.dataset.masterId,
        masterType: button.dataset.masterType,
        name,
        active: button.dataset.masterActive === "true",
      });
      showToast("マスタを更新しました。", "success");
      await refreshMasters();
    } catch (error) {
      showToast(error.message, "error");
    } finally { hideLoading(); }
  }
  if (action === "toggle-master-entry") {
    const active = button.dataset.masterActive === "true";
    showLoading("マスタを更新中...");
    try {
      await apiRequest("admin_master_save", {
        id: button.dataset.masterId,
        masterType: button.dataset.masterType,
        name: button.dataset.masterName,
        active,
      });
      showToast(active ? "OCR補正に戻しました。" : "OCR補正から除外しました。", "success");
      await refreshMasters();
    } catch (error) {
      showToast(error.message, "error");
    } finally { hideLoading(); }
  }
  if (action === "delete-master-entry") {
    if (!window.confirm(`「${button.dataset.masterName}」をマスタから削除しますか？登録済み戦報データは削除されません。`)) return;
    showLoading("マスタから削除中...");
    try {
      await apiRequest("admin_master_delete", { id: button.dataset.masterId, masterType: button.dataset.masterType });
      showToast("マスタから削除しました。", "success");
      await refreshMasters();
    } catch (error) {
      showToast(error.message, "error");
    } finally { hideLoading(); }
  }
  if (action === "open-enemy") await openEnemy(button.dataset.enemyId);
  if (action === "back-to-enemies") await navigate("enemies");
  if (action === "back-to-upload") renderUpload();
  if (action === "edit-observation") await startEditObservation(button.dataset.observationId);
  if (action === "cancel-edit-observation") {
    state.editingObservationId = null;
    state.editDraft = null;
    renderEnemyDetail();
  }
  if (action === "save-edited-observation") await saveEditedObservation();

  if (action === "select-upload") {
    state.activeUploadId = button.dataset.uploadId;
    renderUpload();
  }

  if (action === "remove-upload") {
    const item = state.uploadQueue.find((entry) => entry.id === button.dataset.uploadId);
    if (item) {
      URL.revokeObjectURL(item.previewUrl);
      if (item.ocrPrepared?.previewUrl) URL.revokeObjectURL(item.ocrPrepared.previewUrl);
    }
    state.uploadQueue = state.uploadQueue.filter((entry) => entry.id !== button.dataset.uploadId);
    if (state.activeUploadId === button.dataset.uploadId) state.activeUploadId = state.uploadQueue[0]?.id ?? null;
    if (state.draftUploadId === button.dataset.uploadId) {
      state.draft = null;
      state.draftUploadId = null;
      state.rawOcrText = "";
      state.analysisHash = "";
    }
    renderUpload();
  }

  if (action === "set-enemy-side") {
    const item = activeUpload();
    if (item) {
      item.enemySide = button.dataset.side;
      if (item.ocrPrepared?.previewUrl) URL.revokeObjectURL(item.ocrPrepared.previewUrl);
      item.ocrPrepared = null;
    }
    renderUpload();
  }

  if (action === "set-capture-type") {
    const item = activeUpload();
    if (item) {
      item.captureType = button.dataset.capture;
      if (item.ocrPrepared?.previewUrl) URL.revokeObjectURL(item.ocrPrepared.previewUrl);
      item.ocrPrepared = null;
    }
    renderUpload();
  }

  if (action === "open-current-image") openImage(activeUpload()?.previewUrl);
  if (action === "open-review-image") openImage(reviewUpload()?.previewUrl);
  if (action === "open-ocr-image") openImage(reviewUpload()?.ocrPrepared?.previewUrl);
  if (action === "resume-review") {
    if (state.draftUploadId && reviewUpload()) state.activeUploadId = state.draftUploadId;
    renderReview();
  }
  if (action === "discard-draft") {
    if (window.confirm("確認途中の入力を破棄しますか？")) {
      state.draft = null;
      state.draftUploadId = null;
      state.rawOcrText = "";
      state.analysisHash = "";
      renderUpload();
    }
  }
  if (action === "close-image-dialog") imageDialog.close();
  if (action === "analyze-current") await analyzeCurrent();
  if (action === "manual-entry") await startManualEntry();
  if (action === "save-observation") await saveObservation();

  if (action === "delete-observation") {
    if (!window.confirm("この観測記録を削除しますか？元に戻せません。")) return;
    showLoading("観測記録を削除中...");
    try {
      await apiRequest("admin_delete_observation", { observationId: button.dataset.observationId });
      showToast("観測記録を削除しました。", "success");
      await openEnemy(state.currentEnemy.id);
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }
});

imageDialog.addEventListener("click", (event) => {
  if (event.target === imageDialog) imageDialog.close();
});


window.addEventListener("beforeunload", () => {
  state.uploadQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
});

if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: "none" });
      await registration.update();
    } catch {
      // Service Workerの更新失敗だけでアプリ本体は停止させない。
    }
  });
}

initialize();
