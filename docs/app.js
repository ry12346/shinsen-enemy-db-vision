import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.112.2/+esm";

const config = window.SHINSEN_DB_CONFIG ?? {};
const app = document.getElementById("app");
const toastRegion = document.getElementById("toast-region");
const imageDialog = document.getElementById("image-dialog");
const dialogImage = document.getElementById("dialog-image");
const codeDialog = document.getElementById("code-dialog");
const issuedCodeOutput = document.getElementById("issued-code");
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
  enemySearch: "",
  uploadQueue: [],
  activeUploadId: null,
  draft: null,
  draftUploadId: null,
  rawOcrText: "",
  analysisCached: false,
  analysisHash: "",
  suggestions: { generals: [], tactics: [] },
  usage: null,
  admin: null,
  issuedCode: "",
  currentSeason: "未設定",
  systemStatus: null,
};

const OCR_SHEET_VERSION = "field-sheet-v2";
const OCR_SHEET_WIDTH = 1800;
const OCR_SHEET_MARGIN = 24;
const OCR_SHEET_ROW_HEIGHT = 96;
const OCR_SHEET_ROW_GAP = 12;
const OCR_SHEET_LABEL_WIDTH = 220;
const OCR_FIELD_KEYS = [
  "RESULT",
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
    id: "portrait-phone-fields-v2",
    // 紋章全体ではなく中央の勝敗文字だけを切り出し、OCR用画像で拡大する。
    result: makeRect(0.425, 0.575, 0.083, 0.122),
    meta: {
      left: {
        // 一門アイコンを避け、文字部分から切り出す。
        group: makeRect(0.082, 0.205, 0.126, 0.161),
        player: makeRect(0.235, 0.505, 0.126, 0.161),
      },
      right: {
        group: makeRect(0.62, 0.72, 0.126, 0.161),
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

function portraitGameOcrProfile() {
  const profile = portraitPhoneOcrProfile();
  return {
    ...profile,
    id: "portrait-game-fields-v2",
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
    id: "landscape-phone-fields-v2",
    result: makeRect(0.43, 0.53, 0.025, 0.095),
    meta: {
      left: {
        group: makeRect(0.155, 0.205, 0.085, 0.145),
        player: makeRect(0.34, 0.445, 0.085, 0.145),
      },
      right: {
        group: makeRect(0.72, 0.78, 0.085, 0.145),
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
      name: [0.365, 0.445],
      level: [0.405, 0.47],
      red: [0.42, 0.455],
      inherent: [0.53, 0.59],
      tactic1: [0.685, 0.74],
      tactic2: [0.835, 0.9],
    },
    jewel: { start: 0.5, step: 0.1, halfWidth: 0.035 },
  };
}

function landscapeGameOcrProfile() {
  return {
    id: "landscape-game-fields-v2",
    result: makeRect(0.43, 0.53, 0.025, 0.095),
    meta: {
      left: {
        group: makeRect(0.185, 0.222, 0.08, 0.145),
        player: makeRect(0.38, 0.46, 0.08, 0.145),
      },
      right: {
        group: makeRect(0.755, 0.81, 0.08, 0.145),
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
    return file.captureType === "game"
      ? portraitGameOcrProfile()
      : portraitPhoneOcrProfile();
  }
  if (file.captureType === "game") return landscapeGameOcrProfile();
  return landscapePhoneOcrProfile();
}

function buildOcrFieldRows(file) {
  const profile = getOcrProfile(file);
  const side = file.enemySide === "left" ? "left" : "right";
  const visualColumns = side === "right" ? [2, 1, 0] : [0, 1, 2];
  const rows = [
    { key: "RESULT", rect: profile.result, mode: "result" },
    { key: "GROUP", rect: profile.meta[side].group, mode: "light" },
    { key: "PLAYER", rect: profile.meta[side].player, mode: "light" },
  ];

  for (let slot = 1; slot <= 3; slot += 1) {
    const visualIndex = visualColumns[slot - 1];
    const [x1, x2] = profile.columns[side][visualIndex];
    const add = (suffix, yRange, mode = "light") => {
      rows.push({
        key: `G${slot}_${suffix}`,
        rect: yRange ? makeRect(x1, x2, yRange[0], yRange[1]) : null,
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


function rgbToHueSaturationValue(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  if (hue < 0) hue += 360;
  return {
    hue,
    saturation: max === 0 ? 0 : delta / max,
    value: max,
  };
}

function drawResultMaskIntoBox(context, image, rect, box) {
  if (!rect) {
    drawCropIntoBox(context, image, rect, box, "none");
    return;
  }
  const sx = clamp(Math.round(rect.x1 * image.naturalWidth), 0, image.naturalWidth - 1);
  const sy = clamp(Math.round(rect.y1 * image.naturalHeight), 0, image.naturalHeight - 1);
  const ex = clamp(Math.round(rect.x2 * image.naturalWidth), sx + 1, image.naturalWidth);
  const ey = clamp(Math.round(rect.y2 * image.naturalHeight), sy + 1, image.naturalHeight);
  const sw = Math.max(1, ex - sx);
  const sh = Math.max(1, ey - sy);
  const targetWidth = Math.min(box.w, Math.max(260, Math.round(box.h * 4.5)));
  const targetHeight = box.h;
  const temp = document.createElement("canvas");
  temp.width = targetWidth;
  temp.height = targetHeight;
  const tempContext = temp.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!tempContext) {
    drawCropIntoBox(context, image, rect, box, "grayscale(100%) contrast(230%) brightness(120%)");
    return;
  }
  tempContext.fillStyle = "#ffffff";
  tempContext.fillRect(0, 0, targetWidth, targetHeight);
  tempContext.imageSmoothingEnabled = true;
  tempContext.imageSmoothingQuality = "high";
  tempContext.drawImage(image, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

  const imageData = tempContext.getImageData(0, 0, targetWidth, targetHeight);
  const source = imageData.data;
  const mask = new Uint8Array(targetWidth * targetHeight);
  for (let index = 0; index < mask.length; index += 1) {
    const offset = index * 4;
    const hsv = rgbToHueSaturationValue(source[offset], source[offset + 1], source[offset + 2]);
    // 勝敗文字の赤～橙色だけを抽出し、背後の金色の盾を除く。
    if (
      hsv.saturation >= 0.28 &&
      hsv.value >= 0.30 &&
      (hsv.hue <= 32 || hsv.hue >= 345)
    ) {
      mask[index] = 1;
    }
  }

  const inkCount = mask.reduce((sum, value) => sum + value, 0);
  if (inkCount < mask.length * 0.005) {
    drawCropIntoBox(
      context,
      image,
      rect,
      box,
      "grayscale(100%) contrast(235%) brightness(118%)",
    );
    return;
  }

  // 細い筆画を1pxだけ太らせる。
  const dilated = new Uint8Array(mask.length);
  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      let ink = 0;
      for (let dy = -1; dy <= 1 && !ink; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= targetHeight) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if (nx >= 0 && nx < targetWidth && mask[ny * targetWidth + nx]) {
            ink = 1;
            break;
          }
        }
      }
      dilated[y * targetWidth + x] = ink;
    }
  }

  for (let index = 0; index < dilated.length; index += 1) {
    const value = dilated[index] ? 0 : 255;
    const offset = index * 4;
    source[offset] = value;
    source[offset + 1] = value;
    source[offset + 2] = value;
    source[offset + 3] = 255;
  }
  tempContext.putImageData(imageData, 0, 0);
  const dx = Math.round(box.x + (box.w - targetWidth) / 2);
  context.drawImage(temp, dx, box.y, targetWidth, targetHeight);
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
    if (row.mode === "result") {
      drawResultMaskIntoBox(
        context,
        image,
        row.rect,
        { x: secondBox.x, y: boxY, w: secondBox.w, h: boxH },
      );
    } else {
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
    }
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

function resultLabel(result) {
  return {
    win: "勝利",
    loss: "敗北",
    draw: "引分",
    unknown: "不明",
  }[result] ?? "不明";
}

function resultBadgeClass(result) {
  return {
    win: "success",
    loss: "danger",
    draw: "warning",
    unknown: "",
  }[result] ?? "";
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

function pageHtml({ title, subtitle = "", content, activeNav = state.view, backAction = "" }) {
  return `
    <main class="page-shell">
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
        <span class="badge role-pill">${escapeHtml(roleLabel(state.member?.role ?? ""))}</span>
      </header>
      ${content}
      ${navHtml(activeNav)}
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
    if (!token) throw new AppError("端末認証がありません。", "AUTH_REQUIRED");
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
  if (needsBootstrap) {
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
            <button type="button" class="secondary-button" data-action="cancel-bootstrap">アクセスコード入力へ戻る</button>
          </form>
        </section>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="auth-shell">
      <section class="auth-card">
        <div class="brand-mark">DB</div>
        <h1>${escapeHtml(config.appTitle || "敵部隊データベース")}</h1>
        <p class="muted">初回のみ、管理者から受け取った個別コードを入力します。</p>
        <form class="form-stack" data-form="redeem-code">
          <label class="field">
            <span>アクセスコード</span>
            <input name="code" inputmode="text" autocapitalize="characters" autocomplete="one-time-code" minlength="12" maxlength="32" required placeholder="XXXX-XXXX-XXXX-XXXX" />
          </label>
          <button type="submit" class="primary-button">この端末を認証</button>
        </form>
        <div class="notice info" style="margin-top:16px">
          認証後はこの端末にログイン状態が保存されます。Safariの履歴・Webサイトデータを削除すると、管理者によるコード再発行が必要です。
        </div>
        <button type="button" class="ghost-button" style="width:100%;margin-top:14px" data-action="show-bootstrap">最初の管理者登録</button>
      </section>
    </div>`;
}

async function initialize() {
  if (!isConfigured) {
    renderNotConfigured();
    return;
  }

  try {
    const { data } = await supabase.auth.getSession();
    state.session = data.session;

    if (state.session) {
      const status = await apiRequest("status");
      state.systemStatus = status;
      if (status.registered && status.member?.active) {
        state.member = status.member;
        await navigate("enemies");
        return;
      }
      renderAuth(Boolean(status.needsBootstrap));
      return;
    }

    // 初回表示だけでは匿名ユーザーを作成しない。コード入力または管理者初期登録時に作成する。
    renderAuth(false);
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
  else if (view === "usage") await renderUsage();
  else if (view === "settings") await renderSettings();
}

function latestGenerals(latest) {
  return [...(latest?.observation_generals ?? [])].sort((a, b) => a.slot - b.slot);
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
          const generals = latestGenerals(latest);
          return `
            <button type="button" class="enemy-card" data-action="open-enemy" data-enemy-id="${escapeAttr(enemy.id)}">
              <div class="enemy-card-top">
                <div class="enemy-name">
                  <strong>${escapeHtml(enemy.name)}</strong>
                  <span>${escapeHtml(enemy.groupName || "所属不明")}</span>
                </div>
                <span class="badge ${latest ? completenessBadgeClass(latest.completeness) : ""}">${latest ? relativeTime(latest.observed_at) : "編成なし"}</span>
              </div>
              ${
                latest
                  ? `<div class="badge-row" style="margin-top:9px">
                      <span class="badge ${completenessBadgeClass(latest.completeness)}">${completenessLabel(latest.completeness)}</span>
                      <span class="badge ${resultBadgeClass(latest.battle_result)}">${resultLabel(latest.battle_result)}</span>
                    </div>
                    <div class="lineup-summary">
                      ${[1, 2, 3]
                        .map((slot) => {
                          const general = generals.find((item) => item.slot === slot);
                          return `<div class="lineup-chip"><strong>${escapeHtml(general?.general_name || "未確認")}</strong><span>${escapeHtml(general?.tactic_1 || general?.inherent_tactic || "戦法不明")}</span></div>`;
                        })
                        .join("")}
                    </div>`
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

function observationCard(observation) {
  const generals = [...(observation.observation_generals ?? [])].sort((a, b) => a.slot - b.slot);
  return `
    <article class="observation-card">
      <div class="observation-header">
        <div>
          <strong>${escapeHtml(formatFullDateTime(observation.observed_at))}</strong>
          <small style="display:block;margin-top:3px">登録：${escapeHtml(observation.createdByName || "不明")}</small>
        </div>
        <div class="badge-row" style="justify-content:flex-end">
          <span class="badge info">${escapeHtml(observation.season_name || state.currentSeason)}</span>
          <span class="badge ${completenessBadgeClass(observation.completeness)}">${completenessLabel(observation.completeness)}</span>
          <span class="badge ${resultBadgeClass(observation.battle_result)}">戦報：${resultLabel(observation.battle_result)}</span>
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
                  <strong>${escapeHtml(general.general_name || "未確認")}${general.general_level ? ` Lv${general.general_level}` : ""}${Number.isInteger(general.red_level) ? ` 赤${general.red_level}` : ""}</strong>
                  <div class="tactic-lines">
                    <span>固有：${escapeHtml(general.inherent_tactic || "不明")}</span>
                    <span>第1：${escapeHtml(general.tactic_1 || "不明")}</span>
                    <span>第2：${escapeHtml(general.tactic_2 || "不明")}</span>
                  </div>
                </div>
              </div>`;
          })
          .join("")}
        ${
          state.member?.role === "admin"
            ? `<button type="button" class="danger-button" data-action="delete-observation" data-observation-id="${escapeAttr(observation.id)}">この観測記録を削除</button>`
            : ""
        }
      </div>
    </article>`;
}

function renderEnemyDetail() {
  const enemy = state.currentEnemy;
  if (!enemy) return;
  app.innerHTML = pageHtml({
    title: enemy.name,
    subtitle: enemy.groupName || "所属不明",
    activeNav: "enemies",
    backAction: "back-to-enemies",
    content: `
      <section class="page-content">
        ${enemy.memo ? `<div class="notice info">${escapeHtml(enemy.memo)}</div>` : ""}
        <div class="card">
          <div class="card-header">
            <div><h2>観測履歴</h2><small>${enemy.observations?.length ?? 0}件</small></div>
          </div>
          <div class="observation-list">
            ${
              enemy.observations?.length
                ? enemy.observations.map(observationCard).join("")
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
    battleResult: "unknown",
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
    if (["MEMBER_DAILY_LIMIT", "GLOBAL_DAILY_LIMIT", "GLOBAL_MONTHLY_LIMIT"].includes(error.code)) {
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
    content: `
      <section class="page-content">
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
          敵側の各文字欄を切り出して拡大したOCR結果です。勝敗と一門名の装飾記号を補正し、スマホ標準スクリーンショットでは赤度も色から判定します。内容は登録前に確認してください。横画面のゲーム内スクショでは第2戦法が画像外になる場合があります。
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
          <div class="form-grid-2">
            <label class="field">
              <span>確認日時</span>
              <input type="datetime-local" data-draft-path="observedAtLocal" value="${toDatetimeLocal(draft.observedAt)}" />
              <small>${escapeHtml(captureTimeSourceLabel(draft.observedAtSource ?? file?.capturedAtSource))}</small>
            </label>
            <label class="field">
              <span>戦報の表示結果</span>
              <select data-draft-path="battleResult">
                ${["unknown", "win", "loss", "draw"].map((value) => `<option value="${value}" ${draft.battleResult === value ? "selected" : ""}>${resultLabel(value)}</option>`).join("")}
              </select>
            </label>
          </div>
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
                    <span>赤度<span class="confidence-dot ${confidenceClass(general.confidence?.redLevel)}"></span></span>
                    <input type="number" inputmode="numeric" min="0" max="10" data-draft-path="generals.${actualIndex}.redLevel" value="${escapeAttr(general.redLevel ?? "")}" placeholder="0～5" />
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
    battleResult: draft.battleResult ?? "unknown",
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
    ${usageCard("自分・本日", usage.memberDaily, "1人による大量使用を防止")}
    ${usageCard("一門全体・本日", usage.globalDaily, "日単位の暴走を防止")}
    ${usageCard("一門全体・今月", usage.globalMonthly, `システム上の絶対上限は月${usage.globalMonthly.hardLimit ?? 900}枚`)}
    <div class="card">
      <div class="kpi-grid">
        <div class="kpi"><strong>${usage.maxBatchFiles}</strong><span>一度に選べる画像</span></div>
        <div class="kpi"><strong>${formatBytes(usage.maxImageBytes)}</strong><span>1画像の上限</span></div>
      </div>
    </div>`;
}

async function renderSettings() {
  app.innerHTML = pageHtml({
    title: "設定",
    subtitle: state.member?.displayName ?? "",
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
  const activeAdminCount = (adminData?.members ?? []).filter(
    (item) => item.active && item.role === "admin",
  ).length;

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
      member?.role === "admin" && adminData && activeAdminCount < 2
        ? `<div class="notice warning"><strong>予備管理者を1名登録してください。</strong><br>匿名認証は端末に保存されるため、唯一の管理者がSafariデータを削除・紛失すると通常画面から復旧できません。信頼できる幹部をもう1名「管理者」で追加してください。</div>`
        : ""
    }
    <div class="card">
      <div class="card-header"><div><h2>この端末</h2><small>認証は端末内に保存</small></div></div>
      <div class="kpi-grid">
        <div class="kpi"><strong>${escapeHtml(member?.displayName ?? "")}</strong><span>メンバー名</span></div>
        <div class="kpi"><strong>${escapeHtml(roleLabel(member?.role ?? ""))}</strong><span>権限</span></div>
      </div>
    </div>

    <div class="card install-hint">
      <h2>iPhoneのホーム画面へ追加</h2>
      <span>Safari下部の共有ボタン →「ホーム画面に追加」を選ぶと、アプリのように全画面で使えます。</span>
    </div>

    <details>
      <summary>端末認証について</summary>
      <div class="details-body">
        <p class="muted">Safariの履歴・Webサイトデータを削除した場合や別端末で使う場合は、管理者による新しいアクセスコードの発行が必要です。</p>
      </div>
    </details>

    ${
      member?.role === "admin" && adminData
        ? `
          <div class="card form-stack">
            <div class="card-header"><div><h2>シーズン・OCR上限</h2><small>月900枚を超える設定は不可</small></div></div>
            <form class="form-stack" data-form="update-limits">
              <label class="field"><span>現在のシーズン名</span><input name="currentSeason" maxlength="60" value="${escapeAttr(adminData.settings.current_season ?? state.currentSeason)}" placeholder="例：S3 九州争覇" required /></label>
              <div class="form-grid-3">
                <label class="field"><span>個人/日</span><input name="perMemberDaily" type="number" inputmode="numeric" min="1" max="50" value="${adminData.settings.per_member_daily_limit}" /></label>
                <label class="field"><span>全体/日</span><input name="globalDaily" type="number" inputmode="numeric" min="1" max="100" value="${adminData.settings.global_daily_limit}" /></label>
                <label class="field"><span>全体/月</span><input name="globalMonthly" type="number" inputmode="numeric" min="1" max="900" value="${adminData.settings.global_monthly_limit}" /></label>
              </div>
              <button type="submit" class="secondary-button">上限を更新</button>
            </form>
          </div>

          <div class="card form-stack">
            <div class="card-header"><div><h2>メンバー追加</h2><small>個別コードを1つ発行</small></div></div>
            <form class="form-stack" data-form="create-member">
              <label class="field"><span>表示名</span><input name="displayName" maxlength="40" required placeholder="ゲーム内名" /></label>
              <label class="field"><span>権限</span><select name="role"><option value="viewer">閲覧のみ</option><option value="editor" selected>閲覧＋OCR登録</option><option value="admin">管理者</option></select></label>
              <button type="submit" class="primary-button">追加してコード発行</button>
            </form>
          </div>

          <div class="card">
            <div class="card-header"><div><h2>メンバー管理</h2><small>${adminData.members?.length ?? 0}名</small></div></div>
            <div class="admin-member-list">
              ${(adminData.members ?? [])
                .map(
                  (item) => `
                    <div class="admin-member-card">
                      <div class="admin-member-top">
                        <div><strong>${escapeHtml(item.display_name)}</strong><div class="badge-row" style="margin-top:6px"><span class="badge">${roleLabel(item.role)}</span><span class="badge ${item.active ? "success" : "danger"}">${item.active ? "有効" : "停止"}</span><span class="badge">端末${item.deviceCount}</span><span class="badge info">OCR 今日${item.ocrToday ?? 0}</span><span class="badge info">今月${item.ocrMonth ?? 0}</span></div></div>
                        <small>${item.lastSeenAt ? relativeTime(item.lastSeenAt) : "未使用"}</small>
                      </div>
                      <div class="admin-role-row">
                        <select data-role-member-id="${item.id}" aria-label="${escapeAttr(item.display_name)}の権限" ${item.id === member.id ? "disabled" : ""}>
                          <option value="viewer" ${item.role === "viewer" ? "selected" : ""}>閲覧</option>
                          <option value="editor" ${item.role === "editor" ? "selected" : ""}>登録</option>
                          <option value="admin" ${item.role === "admin" ? "selected" : ""}>管理者</option>
                        </select>
                        <button type="button" class="compact-button" data-action="change-member-role" data-member-id="${item.id}" ${item.id === member.id ? "disabled" : ""}>権限変更</button>
                      </div>
                      <div class="admin-actions">
                        <button type="button" class="compact-button" data-action="issue-code" data-member-id="${item.id}" ${!item.active ? "disabled" : ""}>コード発行</button>
                        <button type="button" class="compact-button" data-action="reset-devices" data-member-id="${item.id}" ${item.id === member.id ? "disabled" : ""}>端末解除</button>
                        <button type="button" class="${item.active ? "danger-button" : "secondary-button"}" style="min-height:40px" data-action="toggle-member" data-member-id="${item.id}" data-active="${item.active ? "false" : "true"}" ${item.id === member.id ? "disabled" : ""}>${item.active ? "利用停止" : "再開"}</button>
                      </div>
                    </div>`,
                )
                .join("")}
            </div>
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

function showIssuedCode(code) {
  state.issuedCode = code;
  issuedCodeOutput.textContent = code;
  if (typeof codeDialog.showModal === "function") codeDialog.showModal();
  else codeDialog.setAttribute("open", "");
}

async function refreshAdmin() {
  state.admin = await apiRequest("admin_list");
  state.currentSeason = state.admin.settings?.current_season ?? state.currentSeason;
  renderSettingsBody();
}

let searchTimer = null;

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "enemy-search") {
    window.clearTimeout(searchTimer);
    state.enemySearch = target.value;
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

  if (form.dataset.form === "redeem-code") {
    showLoading("端末を認証中...");
    try {
      await ensureAnonymousSession();
      const status = await apiRequest("status");
      state.systemStatus = status;
      if (status.needsBootstrap) {
        renderAuth(true);
        showToast("先に初期管理者を登録してください。", "error");
        return;
      }
      const response = await apiRequest("redeem_code", { code: formData.get("code") });
      state.member = response.member;
      await navigate("enemies");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }

  if (form.dataset.form === "create-member") {
    showLoading("メンバーを追加中...");
    try {
      const response = await apiRequest("admin_create_member", {
        displayName: formData.get("displayName"),
        role: formData.get("role"),
      });
      showIssuedCode(response.accessCode);
      await refreshAdmin();
      form.reset();
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
        perMemberDaily: Number(formData.get("perMemberDaily")),
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
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;

  if (action === "reload-app") window.location.reload();
  if (action === "cancel-bootstrap") renderAuth(false);
  if (action === "show-bootstrap") {
    showLoading("初期状態を確認中...");
    try {
      await ensureAnonymousSession();
      const status = await apiRequest("status");
      state.systemStatus = status;
      if (status.needsBootstrap) renderAuth(true);
      else showToast("初期管理者は登録済みです。管理者からアクセスコードを受け取ってください。", "error");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }
  if (action === "navigate") await navigate(button.dataset.view);
  if (action === "open-enemy") await openEnemy(button.dataset.enemyId);
  if (action === "back-to-enemies") await navigate("enemies");
  if (action === "back-to-upload") renderUpload();

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

  if (action === "close-code-dialog") codeDialog.close();
  if (action === "copy-issued-code") {
    try {
      await navigator.clipboard.writeText(state.issuedCode);
      showToast("コードをコピーしました。", "success");
    } catch {
      showToast("コピーできませんでした。コードを長押ししてコピーしてください。", "error");
    }
  }

  if (action === "issue-code") {
    showLoading("コードを発行中...");
    try {
      const response = await apiRequest("admin_issue_code", { memberId: button.dataset.memberId });
      showIssuedCode(response.accessCode);
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }

  if (action === "reset-devices") {
    if (!window.confirm("このメンバーの登録端末をすべて解除しますか？新しいコードが必要になります。")) return;
    showLoading("端末を解除中...");
    try {
      await apiRequest("admin_reset_devices", { memberId: button.dataset.memberId });
      showToast("登録端末を解除しました。", "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }

  if (action === "change-member-role") {
    const roleSelect = document.querySelector(`[data-role-member-id="${button.dataset.memberId}"]`);
    const role = roleSelect?.value;
    if (!["viewer", "editor", "admin"].includes(role)) return;
    if (!window.confirm(`このメンバーの権限を「${roleLabel(role)}」へ変更しますか？`)) return;
    showLoading("権限を変更中...");
    try {
      await apiRequest("admin_set_member_role", { memberId: button.dataset.memberId, role });
      showToast("権限を変更しました。", "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }

  if (action === "toggle-member") {
    const active = button.dataset.active === "true";
    const verb = active ? "再開" : "停止";
    if (!window.confirm(`このメンバーの利用を${verb}しますか？`)) return;
    showLoading(`利用を${verb}中...`);
    try {
      await apiRequest("admin_set_member_active", { memberId: button.dataset.memberId, active });
      showToast(`利用を${verb}しました。`, "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
  }

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

codeDialog.addEventListener("click", (event) => {
  if (event.target === codeDialog) codeDialog.close();
});

window.addEventListener("beforeunload", () => {
  state.uploadQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
});

if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}

initialize();
