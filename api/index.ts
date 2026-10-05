import { createClient } from "npm:@supabase/supabase-js@2.112.2";

type JsonObject = Record<string, any>;
type Member = {
  id: string;
  display_name: string;
  role: "viewer" | "editor" | "admin";
  active: boolean;
};

type OcrToken = {
  text: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
  confidence: number;
};

const HARD_MONTHLY_LIMIT = 900;
const PUBLIC_MEMBER_ID = "00000000-0000-4000-8000-000000000001";
const HARD_IMAGE_BYTES = 5_000_000;
const PARSE_VERSION = 6;
const OCR_CACHE_RETENTION_DAYS = 180;
const INVITE_VALID_DAYS = 7;
const FUNCTION_VERSION = "1.8.0";

function readKeySet(name: string): string | null {
  const raw = Deno.env.get(name);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed.default ?? Object.values(parsed)[0] ?? null;
  } catch {
    return null;
  }
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_PUBLISHABLE_KEY =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  readKeySet("SUPABASE_PUBLISHABLE_KEYS") ??
  "";
const SUPABASE_SECRET_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  readKeySet("SUPABASE_SECRET_KEYS") ??
  "";

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error("Supabaseのサーバー用環境変数を取得できません。");
}

const admin = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "*")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function isOriginAllowed(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (configuredOrigins.includes("*")) return true;
  if (configuredOrigins.includes(origin)) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = configuredOrigins.includes("*")
    ? "*"
    : configuredOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ? origin
      : configuredOrigins[0] ?? "null";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function respond(
  req: Request,
  status: number,
  body: JsonObject,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function ok(req: Request, data: JsonObject = {}): Response {
  return respond(req, 200, { ok: true, ...data });
}

function fail(
  req: Request,
  status: number,
  code: string,
  message: string,
  details?: JsonObject,
): Response {
  return respond(req, status, {
    ok: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

function cleanString(value: unknown, max = 200): string {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeAccessCode(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 64);
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomAccessCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const raw = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

async function getAuthUser(req: Request): Promise<any | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function getMemberByUserId(userId: string): Promise<Member | null> {
  const { data: device, error: deviceError } = await admin
    .from("member_devices")
    .select("member_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (deviceError || !device?.member_id) return null;

  const { data: member, error: memberError } = await admin
    .from("members")
    .select("id, display_name, role, active")
    .eq("id", device.member_id)
    .maybeSingle();

  if (memberError || !member) return null;

  await admin
    .from("member_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("user_id", userId);

  return member as Member;
}

async function ensurePublicMemberForUser(userId: string): Promise<Member | null> {
  const existing = await getMemberByUserId(userId);
  if (existing?.active && existing.role === "admin") return existing;

  // 初期管理者がまだいない間は、一般利用者を先に作らない。
  const { count: adminCount, error: adminCountError } = await admin
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .eq("active", true);
  if (adminCountError) throw adminCountError;
  if ((adminCount ?? 0) === 0) return null;

  // 一般利用者は全員この共有メンバーとして扱う。画面上のコード入力は不要。
  const { data: guest, error: guestError } = await admin
    .from("members")
    .select("id, display_name, role, active")
    .eq("id", PUBLIC_MEMBER_ID)
    .maybeSingle();
  if (guestError) throw guestError;
  if (!guest?.active) throw new Error("PUBLIC_MEMBER_NOT_CONFIGURED");

  const { error: bindError } = await admin
    .from("member_devices")
    .upsert(
      {
        user_id: userId,
        member_id: PUBLIC_MEMBER_ID,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (bindError) throw bindError;

  return guest as Member;
}

async function requireMember(
  req: Request,
  roles?: Member["role"][],
): Promise<{ user: any; member: Member } | Response> {
  const user = await getAuthUser(req);
  if (!user) {
    return fail(req, 401, "AUTH_REQUIRED", "端末認証が必要です。");
  }

  const member = await getMemberByUserId(user.id);
  if (!member || !member.active) {
    return fail(
      req,
      403,
      "MEMBER_NOT_REGISTERED",
      "この端末は有効なメンバーに登録されていません。",
    );
  }

  if (roles && !roles.includes(member.role)) {
    return fail(req, 403, "ROLE_FORBIDDEN", "この操作を行う権限がありません。");
  }

  return { user, member };
}

function jstDateParts(): { day: string; month: string } {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const day = jst.toISOString().slice(0, 10);
  return { day, month: `${day.slice(0, 7)}-01` };
}

async function readSettings(): Promise<any> {
  const { data, error } = await admin
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return {
    ...data,
    global_monthly_limit: Math.min(
      Number(data.global_monthly_limit ?? HARD_MONTHLY_LIMIT),
      HARD_MONTHLY_LIMIT,
    ),
    max_image_bytes: Math.min(
      Number(data.max_image_bytes ?? HARD_IMAGE_BYTES),
      HARD_IMAGE_BYTES,
    ),
  };
}

async function readUsage(_memberId?: string): Promise<JsonObject> {
  const { day, month } = jstDateParts();
  const settings = await readSettings();
  // Google Visionへ新規送信した試行は、成功・失敗を問わず全体上限へ算入する。
  const countedStatuses = ["reserved", "success", "failed"];

  const [dayCount, monthCount] = await Promise.all([
    admin
      .from("ocr_requests")
      .select("id", { count: "exact", head: true })
      .eq("usage_day", day)
      .in("status", countedStatuses),
    admin
      .from("ocr_requests")
      .select("id", { count: "exact", head: true })
      .eq("usage_month", month)
      .in("status", countedStatuses),
  ]);

  return {
    day,
    month,
    globalDaily: {
      used: dayCount.count ?? 0,
      limit: settings.global_daily_limit,
    },
    globalMonthly: {
      used: monthCount.count ?? 0,
      limit: settings.global_monthly_limit,
      hardLimit: HARD_MONTHLY_LIMIT,
    },
    maxImageBytes: settings.max_image_bytes,
    maxBatchFiles: settings.max_batch_files,
    currentSeason: settings.current_season,
  };
}

const STOP_WORDS = new Set([
  "防衛",
  "攻撃",
  "大将",
  "副将",
  "発動",
  "撃破",
  "救援",
  "通常攻撃",
  "戦法詳細",
  "一覧",
  "統計",
  "図表",
  "詳細",
  "共有",
  "位置",
  "お気に入り",
  "チャット送信",
  "経験値",
  "一門経験値",
  "戦功",
  "兵",
  "傷",
  "死",
  "戦死",
  "敗北",
  "勝利",
  "引分",
  "引き分け",
  "木材",
  "鉄鉱",
  "兵糧",
  "返却される資源",
  "軍備回復の印",
]);

function normalizeOcrText(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[｜|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTacticGrade(value: string): string {
  return normalizeOcrText(value)
    .replace(/^[SABC]\s*/i, "")
    .replace(/^通常攻撃$/, "")
    .trim();
}

function isJapaneseCandidate(value: string): boolean {
  const text = stripTacticGrade(value);
  if (!text || text.length < 2 || text.length > 18) return false;
  if (STOP_WORDS.has(text)) return false;
  if (/^[0-9+\-/.:%]+$/.test(text)) return false;
  if (/^(LV|Lv|lv)\s*\d*$/i.test(text)) return false;
  if (/^(PK|S\d+)\d*$/i.test(text)) return false;
  if (/^(QOOKKA|GAMES|KOEI|TECMO)$/i.test(text)) return false;
  return /[\u3040-\u30ff\u3400-\u9fff々〆ヶ]/.test(text);
}

function annotationTokens(
  annotations: any[],
  width: number,
  height: number,
): OcrToken[] {
  if (!Array.isArray(annotations) || width <= 0 || height <= 0) return [];

  return annotations.slice(1).flatMap((annotation: any) => {
    const text = normalizeOcrText(annotation?.description ?? "");
    if (!text) return [];
    const vertices = annotation?.boundingPoly?.vertices ?? [];
    const xs = vertices.map((v: any) => Number(v?.x ?? 0));
    const ys = vertices.map((v: any) => Number(v?.y ?? 0));
    if (!xs.length || !ys.length) return [];
    const minX = Math.max(0, Math.min(...xs));
    const maxX = Math.min(width, Math.max(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxY = Math.min(height, Math.max(...ys));
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    return [
      {
        text,
        x: minX / width,
        y: minY / height,
        w: w / width,
        h: h / height,
        cx: (minX + maxX) / 2 / width,
        cy: (minY + maxY) / 2 / height,
        confidence: Number.isFinite(Number(annotation?.confidence))
          ? Number(annotation.confidence)
          : 0.5,
      },
    ];
  });
}

function fullTextAnnotationTokens(
  fullTextAnnotation: any,
  width: number,
  height: number,
): OcrToken[] {
  if (!fullTextAnnotation || width <= 0 || height <= 0) return [];
  const result: OcrToken[] = [];
  const pages = fullTextAnnotation.pages ?? [];
  for (const page of pages) {
    for (const block of page.blocks ?? []) {
      for (const paragraph of block.paragraphs ?? []) {
        for (const word of paragraph.words ?? []) {
          const text = normalizeOcrText(
            (word.symbols ?? []).map((symbol: any) => symbol.text ?? "").join(""),
          );
          if (!text) continue;
          const vertices = word.boundingBox?.vertices ?? word.boundingPoly?.vertices ?? [];
          const xs = vertices.map((vertex: any) => Number(vertex?.x ?? 0));
          const ys = vertices.map((vertex: any) => Number(vertex?.y ?? 0));
          if (!xs.length || !ys.length) continue;
          const minX = Math.max(0, Math.min(...xs));
          const maxX = Math.min(width, Math.max(...xs));
          const minY = Math.max(0, Math.min(...ys));
          const maxY = Math.min(height, Math.max(...ys));
          const tokenWidth = Math.max(1, maxX - minX);
          const tokenHeight = Math.max(1, maxY - minY);
          result.push({
            text,
            x: minX / width,
            y: minY / height,
            w: tokenWidth / width,
            h: tokenHeight / height,
            cx: (minX + maxX) / 2 / width,
            cy: (minY + maxY) / 2 / height,
            confidence: Number.isFinite(Number(word?.confidence))
              ? Number(word.confidence)
              : Number.isFinite(Number(paragraph?.confidence))
                ? Number(paragraph.confidence)
                : 0.5,
          });
        }
      }
    }
  }
  return result;
}

function clampNumber(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of values) {
    const value = stripTacticGrade(raw);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function detectTeamBounds(
  tokens: OcrToken[],
  orientation: "portrait" | "landscape",
): {
  left: { start: number; end: number };
  right: { start: number; end: number };
} {
  const defense = tokens
    .filter((token) => token.text.includes("防衛"))
    .sort((a, b) => a.y - b.y)[0];
  const attack = tokens
    .filter((token) => token.text.includes("攻撃"))
    .sort((a, b) => a.y - b.y)[0];

  let panelLeft = defense
    ? clampNumber(defense.x - 0.018, 0, 0.25)
    : orientation === "portrait"
      ? 0.025
      : 0.13;
  let panelRight = attack
    ? clampNumber(attack.x + attack.w + 0.018, 0.75, 1)
    : orientation === "portrait"
      ? 0.94
      : 0.84;

  if (panelRight - panelLeft < 0.55) {
    panelLeft = orientation === "portrait" ? 0.025 : 0.13;
    panelRight = orientation === "portrait" ? 0.94 : 0.84;
  }

  if (orientation === "landscape") {
    // 横画面は左右3列の間に、経験値・戦功などの中央列が入る。
    const teamWidth = ((panelRight - panelLeft) * 3) / 7;
    return {
      left: { start: panelLeft, end: panelLeft + teamWidth },
      right: { start: panelRight - teamWidth, end: panelRight },
    };
  }

  const midpoint = (panelLeft + panelRight) / 2;
  return {
    left: { start: panelLeft, end: midpoint },
    right: { start: midpoint, end: panelRight },
  };
}

function choosePlayerCandidate(
  tokens: OcrToken[],
  sideStart: number,
  sideEnd: number,
  reportTop: number,
): { name: string; groupName: string; confidence: number } {
  const sideCenter = (sideStart + sideEnd) / 2;
  const topCandidates = tokens
    .filter(
      (token) =>
        token.cx >= sideStart &&
        token.cx <= sideEnd &&
        token.cy >= Math.max(0.02, reportTop - 0.15) &&
        token.cy <= reportTop + 0.015 &&
        isJapaneseCandidate(token.text),
    )
    .map((token) => ({
      ...token,
      clean: stripTacticGrade(token.text),
      centerDistance: Math.abs(token.cx - sideCenter),
    }))
    .sort((a, b) => {
      const scoreA = a.centerDistance - a.w * 0.25;
      const scoreB = b.centerDistance - b.w * 0.25;
      return scoreA - scoreB;
    });

  const name = topCandidates[0]?.clean ?? "";
  const groupCandidate = topCandidates
    .slice(1)
    .sort((a, b) => Math.abs(b.cx - sideCenter) - Math.abs(a.cx - sideCenter))[0];

  return {
    name,
    groupName: groupCandidate?.clean ?? "",
    confidence: name ? 0.62 : 0,
  };
}

function chooseGeneralDraft(
  tokens: OcrToken[],
  slot: number,
  sideStart: number,
  sideEnd: number,
  reportTop: number,
  reportBottom: number,
  orientation: "portrait" | "landscape",
): JsonObject {
  const sideWidth = sideEnd - sideStart;
  // 右側部隊は画面上で大将が右端に置かれるため、論理順を反転する。
  const visualIndex = sideStart >= 0.45 ? 3 - slot : slot - 1;
  const slotStart = sideStart + (visualIndex * sideWidth) / 3;
  const slotEnd = sideStart + ((visualIndex + 1) * sideWidth) / 3;
  const slotCenter = (slotStart + slotEnd) / 2;

  const slotTokens = tokens.filter(
    (token) => token.cx >= slotStart - 0.015 && token.cx <= slotEnd + 0.015,
  );

  const nameMinOffset = orientation === "portrait" ? 0.035 : 0.075;
  const nameMaxOffset = orientation === "portrait" ? 0.185 : 0.31;
  const nameTargetOffset = orientation === "portrait" ? 0.105 : 0.22;
  const tacticStartOffset = orientation === "portrait" ? 0.175 : 0.30;

  const nameCandidates = slotTokens
    .filter(
      (token) =>
        token.cy >= reportTop + nameMinOffset &&
        token.cy <= Math.min(reportBottom, reportTop + nameMaxOffset) &&
        isJapaneseCandidate(token.text),
    )
    .map((token) => ({
      ...token,
      clean: stripTacticGrade(token.text),
      score:
        Math.abs(token.cx - slotCenter) +
        Math.abs(token.cy - (reportTop + nameTargetOffset)) * 0.8,
    }))
    .sort((a, b) => a.score - b.score);

  const name = nameCandidates[0]?.clean ?? "";

  const numberCandidates = slotTokens
    .filter(
      (token) =>
        token.cy >= reportTop + 0.08 &&
        token.cy <= reportTop + 0.32 &&
        /^\d{1,2}$/.test(token.text),
    )
    .map((token) => Number(token.text))
    .filter((value) => value >= 20 && value <= 99);

  const level = numberCandidates.length
    ? Math.max(...numberCandidates.filter((value) => value <= 60)) || null
    : null;

  const tacticCandidates = uniqueStrings(
    slotTokens
      .filter(
        (token) =>
          token.cy >= reportTop + tacticStartOffset &&
          token.cy <= Math.min(
            reportBottom - 0.02,
            reportTop + (orientation === "portrait" ? 0.67 : 0.76),
          ) &&
          isJapaneseCandidate(token.text),
      )
      .sort((a, b) => a.cy - b.cy || a.cx - b.cx)
      .map((token) => token.text)
      .filter((text) => stripTacticGrade(text) !== name),
  ).slice(0, 3);

  return {
    slot,
    roleLabel: slot === 1 ? "大将" : "副将",
    name,
    level,
    redLevel: null,
    inherentTactic: tacticCandidates[0] ?? "",
    tactic1: tacticCandidates[1] ?? "",
    tactic2: tacticCandidates[2] ?? "",
    confidence: {
      name: name ? 0.58 : 0,
      level: level ? 0.45 : 0,
      inherentTactic: tacticCandidates[0] ? 0.48 : 0,
      tactic1: tacticCandidates[1] ? 0.45 : 0,
      tactic2: tacticCandidates[2] ? 0.42 : 0,
    },
  };
}

const FIELD_SHEET_KEYS = [
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
] as const;
const FIELD_SHEET_MARGIN = 24;
const FIELD_SHEET_ROW_HEIGHT = 96;
const FIELD_SHEET_ROW_GAP = 12;
const FIELD_SHEET_CONTENT_MIN_X = 0.12;
const FIELD_SHEET_VARIANT_SPLIT_X = 0.565;

type FieldCandidate = {
  text: string;
  confidence: number;
  variant: "color" | "enhanced";
};

function compactFieldText(value: string): string {
  return normalizeOcrText(value)
    .replace(/\s+/g, "")
    .replace(/[|｜]/g, "")
    .trim();
}

function cleanJapaneseField(value: string): string {
  return compactFieldText(value)
    .replace(/^(?:S\d*|[SABC])+/i, "")
    .replace(/(?:LV|Lv|lv)\d*/g, "")
    .replace(/[0-9+\-/:.%]+/g, "")
    .replace(/[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶー・]/gu, "")
    .trim();
}

function cleanFreeTextField(value: string): string {
  return compactFieldText(value)
    .replace(/^(?:GROUP|PLAYER)$/i, "")
    .replace(/[\u{1F000}-\u{1FAFF}]/gu, "")
    .trim();
}

function cleanGroupName(value: string): string {
  const decorations = "◎◉○●◯◍◈◇◆◊⊙⊚⦿⭕□■▣▢▰▱△▲▽▼☆★♢♦♧♣♤♠※⚔⚑⚐∙•";
  const escaped = decorations.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return cleanFreeTextField(value)
    .replace(new RegExp(`^[${escaped}]+`, "u"), "")
    .replace(new RegExp(`[${escaped}]+$`, "u"), "")
    .replace(/^[\s:：|｜]+|[\s:：|｜]+$/g, "")
    .trim();
}

function fieldRowBounds(index: number, imageHeight: number): { minY: number; maxY: number } {
  const start = FIELD_SHEET_MARGIN + index * (FIELD_SHEET_ROW_HEIGHT + FIELD_SHEET_ROW_GAP);
  return {
    minY: (start + 3) / imageHeight,
    maxY: (start + FIELD_SHEET_ROW_HEIGHT - 3) / imageHeight,
  };
}

function joinFieldTokens(tokens: OcrToken[]): { text: string; confidence: number } {
  if (!tokens.length) return { text: "", confidence: 0 };
  const sorted = [...tokens].sort((a, b) => a.cx - b.cx || a.cy - b.cy);
  const text = sorted.map((token) => token.text).join("");
  const totalWeight = sorted.reduce((sum, token) => sum + Math.max(1, token.text.length), 0);
  const confidence = totalWeight
    ? sorted.reduce(
        (sum, token) => sum + (Number.isFinite(Number(token.confidence)) ? boundedConfidence(token.confidence) : 0.5) * Math.max(1, token.text.length),
        0,
      ) / totalWeight
    : 0;
  return { text, confidence };
}

function collectFieldCandidates(
  tokens: OcrToken[],
  rowIndex: number,
  imageHeight: number,
): FieldCandidate[] {
  const { minY, maxY } = fieldRowBounds(rowIndex, imageHeight);
  const rowTokens = tokens.filter(
    (token) =>
      token.cy >= minY &&
      token.cy <= maxY &&
      token.cx >= FIELD_SHEET_CONTENT_MIN_X,
  );
  const variants: Array<{ name: "color" | "enhanced"; minX: number; maxX: number }> = [
    { name: "color", minX: FIELD_SHEET_CONTENT_MIN_X, maxX: FIELD_SHEET_VARIANT_SPLIT_X },
    { name: "enhanced", minX: FIELD_SHEET_VARIANT_SPLIT_X, maxX: 0.995 },
  ];

  const candidates: FieldCandidate[] = [];
  for (const variant of variants) {
    const selected = rowTokens.filter(
      (token) => token.cx >= variant.minX && token.cx < variant.maxX,
    );
    if (!selected.length) continue;

    // 1行の切り出しだが、OCRが上下2行へ分けた場合に備えて近いYごとにまとめる。
    const lines: OcrToken[][] = [];
    for (const token of [...selected].sort((a, b) => a.cy - b.cy || a.cx - b.cx)) {
      const line = lines.find((items) => {
        const center = items.reduce((sum, item) => sum + item.cy, 0) / items.length;
        return Math.abs(center - token.cy) <= Math.max(0.012, token.h * 0.7);
      });
      if (line) line.push(token);
      else lines.push([token]);
    }

    for (const line of lines) {
      const joined = joinFieldTokens(line);
      if (joined.text) {
        candidates.push({ text: joined.text, confidence: joined.confidence, variant: variant.name });
      }
    }
  }
  return candidates;
}


function chooseTroopLevelFromSheet(
  tokens: OcrToken[],
  imageHeight: number,
): { value: number | null; confidence: number } {
  // フロントはGROUP行のラベル領域（x<12%）へ兵種アイコン+Lv表示を埋め込む。
  // 通常フィールド候補はx>=12%だけを見るため、既存17項目のOCRには干渉しない。
  const { minY, maxY } = fieldRowBounds(0, imageHeight);
  const selected = tokens.filter(
    (token) => token.cy >= minY && token.cy <= maxY && token.cx >= 0.002 && token.cx < FIELD_SHEET_CONTENT_MIN_X,
  );
  if (!selected.length) return { value: null, confidence: 0 };
  const joined = joinFieldTokens(selected);
  const compact = compactFieldText(joined.text).toUpperCase();
  const afterLv = compact.match(/L[VY]?(10|[1-9])/i) ?? compact.match(/LV(10|[1-9])/i);
  if (afterLv) {
    const value = Number(afterLv[1]);
    if (value >= 1 && value <= 10) {
      return { value, confidence: boundedConfidence(Math.max(0.72, joined.confidence || 0.55)) };
    }
  }
  // LVの文字自体が落ちても、狭い専用クロップ内に1〜10だけが残る場合は採用する。
  const numbers = compact.match(/\d{1,3}/g) ?? [];
  const valid = numbers.map(Number).filter((value) => value >= 1 && value <= 10);
  const unique = [...new Set(valid)];
  if (unique.length === 1) {
    return { value: unique[0], confidence: boundedConfidence(Math.max(0.52, joined.confidence || 0.45)) };
  }
  return { value: null, confidence: 0 };
}

function levenshteinDistance(a: string, b: string): number {
  const left = Array.from(a);
  const right = Array.from(b);
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j < current.length; j += 1) previous[j] = current[j];
  }
  return previous[right.length];
}

function stringSimilarity(a: string, b: string): number {
  const left = compactFieldText(a);
  const right = compactFieldText(b);
  const maximum = Math.max(Array.from(left).length, Array.from(right).length);
  if (!maximum) return 1;
  return 1 - levenshteinDistance(left, right) / maximum;
}

const OCR_CANONICAL_ALIASES: Record<string, string> = {
  // Google Visionが中央の「天」を落とす実例への補正。
  "回転運": "回天転運",
  // 横画面の戦法ボタンで先頭2文字が落ちる実例への補正。
  "当先": "一力当先",
  "力当先": "一力当先",
};

function matchKnownValue(value: string, knownValues: string[]): { value: string; similarity: number } {
  if (!value || !knownValues.length) return { value, similarity: 0 };
  const normalized = compactFieldText(value);

  const aliasTarget = OCR_CANONICAL_ALIASES[normalized];
  if (aliasTarget) {
    const canonical = knownValues.find((item) => compactFieldText(item) === compactFieldText(aliasTarget));
    return { value: canonical ?? aliasTarget, similarity: 0.98 };
  }

  const exact = knownValues.find((item) => compactFieldText(item) === normalized);
  if (exact) return { value: exact, similarity: 1 };

  const normalizedLength = Array.from(normalized).length;

  // OCRは装飾文字の端を落とすだけでなく、両端を同時に落として中央だけを返すことがある。
  // 2文字以上が正規マスタ内にそのまま含まれ、欠落が合計1～2文字、かつ候補が1件だけなら補完する。
  // 例: 「当先」→「一力当先」、「勘助」→「山本勘助」、「富虎」→「飯富虎昌」。
  if (normalizedLength >= 2) {
    const containedMatches = knownValues
      .map((item) => ({ item, compact: compactFieldText(item) }))
      .filter(({ compact }) => {
        const candidateLength = Array.from(compact).length;
        const missing = candidateLength - normalizedLength;
        return missing >= 1 && missing <= 2 && compact.includes(normalized);
      });
    if (containedMatches.length === 1) {
      const target = containedMatches[0];
      const targetLength = Math.max(1, Array.from(target.compact).length);
      return {
        value: target.item,
        similarity: Math.max(0.86, normalizedLength / targetLength),
      };
    }
  }

  const ranked = knownValues.map((item) => {
    const candidate = compactFieldText(item);
    const candidateLength = Array.from(candidate).length;
    const distance = levenshteinDistance(normalized, candidate);
    const maximum = Math.max(normalizedLength, candidateLength);
    const similarity = maximum ? 1 - distance / maximum : 1;
    return { item, candidateLength, distance, similarity };
  }).sort((a, b) => b.similarity - a.similarity);

  // 3文字以上の語で、正規マスタとの違いが1文字だけかつ候補が一意なら、
  // OCRが1文字を脱落・誤読したものとして補正する。
  const oneEditCandidates = ranked.filter((candidate) =>
    normalizedLength >= 3 &&
    candidate.candidateLength >= 3 &&
    Math.abs(candidate.candidateLength - normalizedLength) <= 1 &&
    candidate.distance === 1
  );
  if (oneEditCandidates.length === 1) {
    const candidate = oneEditCandidates[0];
    return { value: candidate.item, similarity: Math.max(0.86, candidate.similarity) };
  }

  const best = ranked[0];
  const bestValue = best?.item ?? value;
  const bestSimilarity = best?.similarity ?? 0;
  const minimum = normalizedLength <= 3 ? 0.8 : 0.72;
  return bestSimilarity >= minimum
    ? { value: bestValue, similarity: bestSimilarity }
    : { value, similarity: bestSimilarity };
}

function chooseTextCandidate(
  candidates: FieldCandidate[],
  kind: "free" | "japanese",
  knownValues: string[] = [],
): { value: string; confidence: number } {
  const cleaned = candidates
    .map((candidate) => ({
      ...candidate,
      clean: kind === "japanese"
        ? cleanJapaneseField(candidate.text)
        : cleanFreeTextField(candidate.text),
    }))
    .filter((candidate) => {
      if (!candidate.clean) return false;
      const length = Array.from(candidate.clean).length;
      if (kind === "japanese") return length >= 2 && length <= 18;
      return length >= 1 && length <= 40;
    });
  if (!cleaned.length) return { value: "", confidence: 0 };

  // 色版と高コントラスト版が一致した場合は最優先。
  const agreement = cleaned.find((candidate, index) =>
    cleaned.some(
      (other, otherIndex) =>
        otherIndex !== index &&
        other.variant !== candidate.variant &&
        other.clean === candidate.clean,
    )
  );

  // マスタがある武将名/戦法名は、OCR信頼度だけでなくマスタ一致度も加味する。
  // 片方の画像が「一力当先」、もう片方が「当先」と読めた場合に、
  // 高信頼度の短い誤読より正規マスタへ一致する候補を優先する。
  const evaluated = cleaned.map((candidate) => {
    const matched = knownValues.length
      ? matchKnownValue(candidate.clean, knownValues)
      : { value: candidate.clean, similarity: 0 };
    const exactMaster = knownValues.length > 0 && matched.similarity === 1;
    const changedByMaster = matched.value !== candidate.clean;
    const masterBonus = exactMaster
      ? 0.55
      : changedByMaster
        ? Math.max(0, matched.similarity) * 0.34
        : 0;
    const lengthBonus = Math.min(0.18, Array.from(candidate.clean).length * 0.015);
    return {
      ...candidate,
      matched,
      score: candidate.confidence + lengthBonus + masterBonus,
    };
  });

  let selected = agreement
    ? evaluated.find(
        (candidate) =>
          candidate.variant === agreement.variant &&
          candidate.clean === agreement.clean,
      ) ?? evaluated[0]
    : [...evaluated].sort((a, b) => b.score - a.score)[0];

  // 異なる画像版が同じ正規マスタへ収束するなら、その候補をさらに優先する。
  if (knownValues.length) {
    const canonicalAgreement = evaluated.find((candidate, index) =>
      candidate.matched.value &&
      candidate.matched.similarity >= 0.86 &&
      evaluated.some(
        (other, otherIndex) =>
          otherIndex !== index &&
          other.variant !== candidate.variant &&
          other.matched.value === candidate.matched.value &&
          other.matched.similarity >= 0.86,
      )
    );
    if (canonicalAgreement) selected = canonicalAgreement;
  }

  let value = selected.clean;
  let confidence = selected.confidence;
  if (agreement) confidence = Math.max(confidence, 0.86);
  if (knownValues.length) {
    const matched = selected.matched ?? matchKnownValue(value, knownValues);
    if (matched.value !== value) {
      value = matched.value;
      confidence = Math.max(confidence, 0.66 + matched.similarity * 0.28);
    } else if (matched.similarity === 1) {
      confidence = Math.max(confidence, 0.94);
    }
  }
  return { value, confidence: boundedConfidence(confidence) };
}

function chooseLevelCandidate(
  candidates: FieldCandidate[],
): { value: number | null; confidence: number } {
  const values: Array<{ value: number; confidence: number }> = [];
  for (const candidate of candidates) {
    const matches = compactFieldText(candidate.text).match(/\d{1,2}/g) ?? [];
    for (const match of matches) {
      const value = Number(match);
      if (value >= 20 && value <= 60) values.push({ value, confidence: candidate.confidence });
    }
  }
  if (!values.length) return { value: null, confidence: 0 };
  const counts = new Map<number, { count: number; confidence: number }>();
  for (const item of values) {
    const current = counts.get(item.value) ?? { count: 0, confidence: 0 };
    current.count += 1;
    current.confidence = Math.max(current.confidence, item.confidence);
    counts.set(item.value, current);
  }
  const selected = [...counts.entries()].sort((a, b) => {
    if (b[1].count !== a[1].count) return b[1].count - a[1].count;
    return b[1].confidence - a[1].confidence;
  })[0];
  return {
    value: selected[0],
    confidence: boundedConfidence(selected[1].count >= 2 ? 0.9 : (Number.isFinite(selected[1].confidence) ? selected[1].confidence : 0.45)),
  };
}

function parseFieldSheet(
  rawText: string,
  tokens: OcrToken[],
  imageHeight: number,
  enemySide: "left" | "right",
  captureType: string,
  ocrProfile: string,
  sourceOrientation: string,
  suggestions: { generals: string[]; tactics: string[]; groups?: string[] },
): JsonObject {
  const rowCandidates = new Map<string, FieldCandidate[]>();
  FIELD_SHEET_KEYS.forEach((key, index) => {
    rowCandidates.set(key, collectFieldCandidates(tokens, index, imageHeight));
  });

  const group = chooseTextCandidate(
    rowCandidates.get("GROUP") ?? [],
    "free",
    suggestions.groups ?? [],
  );
  const player = chooseTextCandidate(rowCandidates.get("PLAYER") ?? [], "free");
  const troopLevel = chooseTroopLevelFromSheet(tokens, imageHeight);
  const cleanedGroup = cleanGroupName(group.value);
  const generals = [1, 2, 3].map((slot) => {
    const name = chooseTextCandidate(
      rowCandidates.get(`G${slot}_NAME`) ?? [],
      "japanese",
      suggestions.generals,
    );
    const level = chooseLevelCandidate(rowCandidates.get(`G${slot}_LEVEL`) ?? []);
    const inherent = chooseTextCandidate(
      rowCandidates.get(`G${slot}_INHERENT`) ?? [],
      "japanese",
      suggestions.tactics,
    );
    const tactic1 = chooseTextCandidate(
      rowCandidates.get(`G${slot}_T1`) ?? [],
      "japanese",
      suggestions.tactics,
    );
    const tactic2 = chooseTextCandidate(
      rowCandidates.get(`G${slot}_T2`) ?? [],
      "japanese",
      suggestions.tactics,
    );
    return {
      slot,
      roleLabel: slot === 1 ? "大将" : "副将",
      name: name.value,
      level: level.value,
      redLevel: null,
      inherentTactic: inherent.value,
      tactic1: tactic1.value,
      tactic2: tactic2.value,
      confidence: {
        name: name.confidence,
        level: level.confidence,
        inherentTactic: inherent.confidence,
        tactic1: tactic1.confidence,
        tactic2: tactic2.confidence,
      },
    };
  });

  let score = player.value ? 2 : 0;
  for (const general of generals) {
    if (general.name) score += 2;
    if (general.inherentTactic) score += 1;
    if (general.tactic1) score += 1;
    if (general.tactic2) score += 1;
  }
  const maxScore = 17;
  const candidates = uniqueStrings(
    [...rowCandidates.values()]
      .flat()
      .map((item) => cleanJapaneseField(item.text))
      .filter(Boolean),
  ).slice(0, 100);

  return {
    enemy: {
      name: player.value,
      groupName: cleanedGroup,
      memo: "",
      confidence: player.confidence,
    },
    troopType: "",
    troopLevel: troopLevel.value,
    troopConfidence: { type: 0, level: troopLevel.confidence },
    enemySide,
    sourceLayout: `${sourceOrientation || "unknown"}-${captureType || "unknown"}-${ocrProfile}`,
    captureType: captureType || "unknown",
    completeness: score >= 11 ? "complete" : "partial",
    completenessScore: Math.round((score / maxScore) * 100),
    observedAt: new Date().toISOString(),
    generals,
    candidates,
    summary: {
      orientation: sourceOrientation || "unknown",
      ocrProfile,
      ocrCharacterCount: rawText.length,
      parser: "field-sheet-v6-troop-compatible",
    },
  };
}


function parseDraft(
  rawText: string,
  tokens: OcrToken[],
  width: number,
  height: number,
  enemySide: "left" | "right",
  captureType: string,
): JsonObject {
  const orientation = width >= height ? "landscape" : "portrait";
  const layout = `${orientation}-${captureType || "unknown"}`;

  const headerTokens = tokens.filter(
    (token) => token.text.includes("防衛") || token.text.includes("攻撃"),
  );
  const reportTop = headerTokens.length
    ? Math.max(0.08, Math.min(...headerTokens.map((token) => token.y)) - 0.015)
    : orientation === "portrait"
      ? 0.17
      : 0.16;

  const footerTokens = tokens.filter(
    (token) =>
      token.text.includes("戦法詳細") ||
      token.text.includes("チャット送信") ||
      token.text === "一覧",
  );
  const reportBottom = footerTokens.length
    ? Math.min(0.9, Math.min(...footerTokens.map((token) => token.y)) - 0.015)
    : orientation === "portrait"
      ? 0.78
      : 0.83;

  const teamBounds = detectTeamBounds(tokens, orientation);
  const selectedBounds = enemySide === "left" ? teamBounds.left : teamBounds.right;
  const sideStart = selectedBounds.start;
  const sideEnd = selectedBounds.end;
  const player = choosePlayerCandidate(tokens, sideStart, sideEnd, reportTop);
  const generals = [1, 2, 3].map((slot) =>
    chooseGeneralDraft(
      tokens,
      slot,
      sideStart,
      sideEnd,
      reportTop,
      reportBottom,
      orientation,
    )
  );

  const candidates = uniqueStrings(
    tokens
      .filter((token) => isJapaneseCandidate(token.text))
      .sort((a, b) => a.cy - b.cy || a.cx - b.cx)
      .map((token) => token.text),
  ).slice(0, 100);

  let score = player.name ? 2 : 0;
  for (const general of generals) {
    if (general.name) score += 2;
    if (general.inherentTactic) score += 1;
    if (general.tactic1) score += 1;
    if (general.tactic2) score += 1;
  }
  const maxScore = 17;
  const completeness = score >= 11 ? "complete" : "partial";

  return {
    enemy: {
      name: player.name,
      groupName: player.groupName,
      memo: "",
      confidence: player.confidence,
    },
    enemySide,
    sourceLayout: layout,
    captureType: captureType || "unknown",
    completeness,
    completenessScore: Math.round((score / maxScore) * 100),
    observedAt: new Date().toISOString(),
    generals,
    candidates,
    summary: {
      orientation,
      reportTop,
      reportBottom,
      teamBounds,
      ocrCharacterCount: rawText.length,
    },
  };
}

function isFieldSheetProfile(value: string): boolean {
  return /^(?:portrait-fields-v1|portrait-(?:phone|game)-fields-v\d+|landscape-(?:phone|game)-fields-v\d+)$/.test(value);
}

async function callGoogleVision(
  imageBase64: string,
  width: number,
  height: number,
  enemySide: "left" | "right",
  captureType: string,
  ocrProfile: string,
  sourceOrientation: string,
): Promise<{ rawText: string; tokens: OcrToken[]; draft: JsonObject }> {
  const apiKey = Deno.env.get("GOOGLE_VISION_API_KEY") ?? "";
  if (!apiKey) throw new Error("GOOGLE_VISION_API_KEY_NOT_SET");

  const isFieldSheet = isFieldSheetProfile(ocrProfile);
  const configuredFeature = Deno.env.get("VISION_FEATURE") ?? "";
  const featureType = isFieldSheet
    ? "DOCUMENT_TEXT_DETECTION"
    : configuredFeature === "DOCUMENT_TEXT_DETECTION"
      ? "DOCUMENT_TEXT_DETECTION"
      : "TEXT_DETECTION";

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageBase64 },
            features: [{ type: featureType, maxResults: 1000 }],
            imageContext: { languageHints: ["ja"] },
          },
        ],
      }),
    },
  );

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `VISION_HTTP_${response.status}`);
  }

  const annotation = payload?.responses?.[0];
  if (annotation?.error) {
    throw new Error(annotation.error.message ?? "VISION_ANNOTATION_ERROR");
  }

  const annotations = annotation?.textAnnotations ?? [];
  const rawText =
    annotation?.fullTextAnnotation?.text ?? annotations?.[0]?.description ?? "";
  const fullTokens = fullTextAnnotationTokens(annotation?.fullTextAnnotation, width, height);
  const legacyTokens = annotationTokens(annotations, width, height);
  // 高密度OCRの階層化された単語を優先する。取得できない場合のみ旧形式を使う。
  const tokens = fullTokens.length ? fullTokens : legacyTokens;

  let draft: JsonObject;
  if (isFieldSheet) {
    let suggestions: { generals: string[]; tactics: string[]; groups: string[] } = {
      generals: [],
      tactics: [],
      groups: [],
    };
    try {
      suggestions = (await getSuggestions()) as { generals: string[]; tactics: string[]; groups: string[] };
    } catch (error) {
      console.warn("OCR dictionary lookup failed", (error as Error).message);
    }
    draft = parseFieldSheet(
      rawText,
      tokens,
      height,
      enemySide,
      captureType,
      ocrProfile,
      sourceOrientation,
      suggestions,
    );
  } else {
    draft = parseDraft(rawText, tokens, width, height, enemySide, captureType);
  }

  return { rawText, tokens, draft };
}

function observationTeamKey(observation: any): string {
  const generals = [...(observation?.observation_generals ?? [])]
    .sort((a: any, b: any) => Number(a.slot) - Number(b.slot));
  const leader = cleanString(
    generals.find((general: any) => Number(general.slot) === 1)?.general_name,
    80,
  ).replace(/\s+/g, "");
  const deputies = [2, 3]
    .map((slot) => cleanString(
      generals.find((general: any) => Number(general.slot) === slot)?.general_name,
      80,
    ).replace(/\s+/g, ""))
    .filter(Boolean)
    .sort();

  // 大将は固定、副将2人は表示順が入れ替わっても同一部隊とみなす。
  // 3武将が揃っていない観測は誤統合を避けるため個別扱いにする。
  if (!leader || deputies.length !== 2) {
    return `incomplete:${cleanString(observation?.id, 100) || crypto.randomUUID()}`;
  }
  return `${leader}|${deputies[0]}|${deputies[1]}`;
}

function groupObservationsByTeam(observations: any[]): any[] {
  const groups = new Map<string, { key: string; seasonName: string; rows: any[] }>();
  const sorted = [...(observations ?? [])].sort(
    (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime(),
  );

  for (const observation of sorted) {
    const teamKey = observationTeamKey(observation);
    const seasonName = cleanString(observation?.season_name, 60) || "未設定";
    const groupKey = `${seasonName}::${teamKey}`;
    const group = groups.get(groupKey) ?? { key: teamKey, seasonName, rows: [] };
    group.rows.push({ ...observation, teamKey });
    groups.set(groupKey, group);
  }

  return [...groups.values()]
    .map(({ key, seasonName, rows }) => ({
      key,
      seasonName,
      latest: rows[0] ?? null,
      observations: rows,
      past: rows.slice(1),
      observationCount: rows.length,
    }))
    .sort(
      (a, b) => new Date(b.latest?.observed_at ?? 0).getTime() - new Date(a.latest?.observed_at ?? 0).getTime(),
    );
}

async function listEnemies(
  searchText: string,
  currentSeason: string,
): Promise<any[]> {
  const { data: enemies, error } = await admin
    .from("enemy_players")
    .select("id, name, group_name, memo, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;

  const normalizedSearch = searchText.replace(/\s+/g, "").toLowerCase();
  const filtered = (enemies ?? []).filter((enemy: any) => {
    if (!normalizedSearch) return true;
    return `${enemy.name}${enemy.group_name}`
      .replace(/\s+/g, "")
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const ids = filtered.map((enemy: any) => enemy.id);
  if (!ids.length) return [];

  const idChunks: string[][] = [];
  for (let index = 0; index < ids.length; index += 100) idChunks.push(ids.slice(index, index + 100));

  const [observationResults, discoveryResults] = await Promise.all([
    Promise.all(
      idChunks.map((chunk) =>
        admin
          .from("enemy_observations")
          .select(
            "id, enemy_player_id, season_name, observed_at, completeness, source_layout, capture_type, report_summary, created_at, contributor_id, observation_generals(slot, role_label, general_name, general_level, red_level, inherent_tactic, tactic_1, tactic_2)",
          )
          .in("enemy_player_id", chunk)
          .eq("season_name", currentSeason)
          .order("observed_at", { ascending: false })
      ),
    ),
    Promise.all(
      idChunks.map((chunk) =>
        admin
          .from("intel_team_discoveries")
          .select("season_name, enemy_player_id, team_key, discovered_at, discovered_by_contributor_id")
          .in("enemy_player_id", chunk)
          .eq("season_name", currentSeason)
      ),
    ),
  ]);

  const observations: any[] = [];
  for (const result of observationResults) {
    if (result.error) throw result.error;
    observations.push(...(result.data ?? []));
  }
  observations.sort((a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime());

  const discoveries: any[] = [];
  for (const result of discoveryResults) {
    if (result.error) throw result.error;
    discoveries.push(...(result.data ?? []));
  }
  const discoveryContributorNames = await contributorNameMap(
    discoveries.map((row: any) => row.discovered_by_contributor_id).filter(Boolean),
  );
  const discoveryMap = new Map<string, any>();
  for (const row of discoveries) discoveryMap.set(`${row.enemy_player_id}::${row.team_key}`, row);

  const latest = new Map<string, any>();
  const observationsByEnemy = new Map<string, any[]>();
  for (const observation of observations) {
    if (!latest.has(observation.enemy_player_id)) latest.set(observation.enemy_player_id, observation);
    const rows = observationsByEnemy.get(observation.enemy_player_id) ?? [];
    rows.push(observation);
    observationsByEnemy.set(observation.enemy_player_id, rows);
  }

  const rows = filtered.map((enemy: any) => {
    const enemyObservations = observationsByEnemy.get(enemy.id) ?? [];
    const teams = groupObservationsByTeam(enemyObservations).map((team: any) => {
      const discovery = discoveryMap.get(`${enemy.id}::${team.key}`) ?? null;
      const intel = {
        freshness: freshnessInfo(team.latest?.observed_at),
        confidence: confidenceInfo(team.observationCount),
        discoveredAt: discovery?.discovered_at ?? null,
        discoveredByName: discovery
          ? (discoveryContributorNames.get(discovery.discovered_by_contributor_id) ?? "匿名ユーザー")
          : "匿名ユーザー",
      };
      return { ...team, intel };
    });
    const latestTeams = teams.slice(0, 2).map((team: any) => ({
      ...team.latest,
      teamKey: team.key,
      intel: team.intel,
      observationCount: team.observationCount,
    }));

    return {
      id: enemy.id,
      name: enemy.name,
      groupName: enemy.group_name,
      memo: enemy.memo,
      latest: latest.get(enemy.id) ?? null,
      latestTeams,
      teamCount: teams.length,
      observationCount: enemyObservations.length,
    };
  });

  // 通常表示では現在シーズンに観測がある敵だけを表示する。
  // 検索時は過去シーズンだけに存在する敵も見つけられるよう残す。
  return normalizedSearch ? rows : rows.filter((enemy: any) => enemy.latest);
}

async function getEnemyDetail(enemyId: string): Promise<JsonObject | null> {
  const { data: enemy, error } = await admin
    .from("enemy_players")
    .select("id, name, group_name, memo, created_at, updated_at")
    .eq("id", enemyId)
    .maybeSingle();
  if (error) throw error;
  if (!enemy) return null;

  const { data: observations, error: observationError } = await admin
    .from("enemy_observations")
    .select(
      "id, season_name, observed_at, source_layout, capture_type, enemy_side, completeness, report_summary, created_at, created_by, contributor_id, observation_generals(slot, role_label, general_name, general_level, red_level, inherent_tactic, tactic_1, tactic_2)",
    )
    .eq("enemy_player_id", enemyId)
    .order("observed_at", { ascending: false })
    .limit(500);
  if (observationError) throw observationError;

  const memberIds = Array.from(
    new Set((observations ?? []).map((row: any) => row.created_by).filter(Boolean)),
  );
  const memberMap = new Map<string, string>();
  if (memberIds.length) {
    const { data: members } = await admin
      .from("members")
      .select("id, display_name")
      .in("id", memberIds);
    for (const member of members ?? []) memberMap.set(member.id, member.display_name);
  }
  const contributorMap = await contributorNameMap(
    (observations ?? []).map((row: any) => row.contributor_id).filter(Boolean),
  );

  const enrichedObservations = (observations ?? []).map((row: any) => ({
    ...row,
    createdByName: row.contributor_id
      ? (contributorMap.get(row.contributor_id) ?? "匿名ユーザー")
      : (memberMap.get(row.created_by) ?? "匿名ユーザー"),
  }));
  const teams = await intelForTeamGroups(groupObservationsByTeam(enrichedObservations), enemyId);

  return {
    id: enemy.id,
    name: enemy.name,
    groupName: enemy.group_name,
    memo: enemy.memo,
    observations: enrichedObservations,
    teams,
    teamCount: teams.length,
    observationCount: enrichedObservations.length,
  };
}

async function getObservedSuggestions(): Promise<{ generals: string[]; tactics: string[]; groups: string[] }> {
  const [{ data: rows, error }, { data: enemyRows, error: enemyError }] = await Promise.all([
    admin
      .from("observation_generals")
      .select("general_name, inherent_tactic, tactic_1, tactic_2")
      .order("created_at", { ascending: false })
      .limit(3000),
    admin
      .from("enemy_players")
      .select("group_name")
      .not("group_name", "is", null)
      .limit(3000),
  ]);
  if (error) throw error;
  if (enemyError) throw enemyError;

  const generals = new Set<string>();
  const tactics = new Set<string>();
  const groups = new Set<string>();
  for (const row of rows ?? []) {
    if (row.general_name) generals.add(row.general_name);
    for (const value of [row.inherent_tactic, row.tactic_1, row.tactic_2]) {
      if (value) tactics.add(value);
    }
  }
  for (const row of enemyRows ?? []) {
    const groupName = cleanString(row.group_name, 80);
    if (groupName) groups.add(groupName);
  }
  return {
    generals: Array.from(generals).sort((a, b) => a.localeCompare(b, "ja")),
    tactics: Array.from(tactics).sort((a, b) => a.localeCompare(b, "ja")),
    groups: Array.from(groups).sort((a, b) => a.localeCompare(b, "ja")),
  };
}

async function getSuggestions(): Promise<JsonObject> {
  // 武将・戦法は専用マスタを使用。一門名は登録済み敵プレイヤーから候補を作り、
  // 「亡国家」→「亡賽国家」のような1文字欠落を既存一門名へ安全に寄せる。
  const [generalResult, tacticResult, groupResult] = await Promise.all([
    admin.from("general_master").select("name").eq("active", true).order("name"),
    admin.from("tactic_master").select("name").eq("active", true).order("name"),
    admin.from("enemy_players").select("group_name").not("group_name", "is", null).limit(3000),
  ]);

  if (generalResult.error || tacticResult.error) {
    const observed = await getObservedSuggestions();
    return { ...observed, source: "observations-fallback" };
  }

  const groups = new Set<string>();
  if (!groupResult.error) {
    for (const row of groupResult.data ?? []) {
      const groupName = cleanString(row.group_name, 80);
      if (groupName) groups.add(groupName);
    }
  }

  return {
    generals: (generalResult.data ?? []).map((row: any) => cleanString(row.name, 40)).filter(Boolean),
    tactics: (tacticResult.data ?? []).map((row: any) => cleanString(row.name, 50)).filter(Boolean),
    groups: Array.from(groups).sort((a, b) => a.localeCompare(b, "ja")),
    source: "master",
  };
}

function masterTable(masterType: string): "general_master" | "tactic_master" | null {
  if (masterType === "general") return "general_master";
  if (masterType === "tactic") return "tactic_master";
  return null;
}

async function getMasterList(includeInactive: boolean): Promise<JsonObject> {
  let generalQuery = admin
    .from("general_master")
    .select("id, name, active, created_at, updated_at")
    .order("name", { ascending: true });
  let tacticQuery = admin
    .from("tactic_master")
    .select("id, name, active, created_at, updated_at")
    .order("name", { ascending: true });
  if (!includeInactive) {
    generalQuery = generalQuery.eq("active", true);
    tacticQuery = tacticQuery.eq("active", true);
  }
  const [generalResult, tacticResult] = await Promise.all([generalQuery, tacticQuery]);
  if (generalResult.error || tacticResult.error) {
    const reason = generalResult.error?.message ?? tacticResult.error?.message ?? "MASTER_TABLE_ERROR";
    throw new Error(`MASTER_TABLE_NOT_READY: ${reason}`);
  }
  return {
    generals: generalResult.data ?? [],
    tactics: tacticResult.data ?? [],
  };
}

async function adminMemberList(): Promise<any[]> {
  const { day, month } = jstDateParts();
  const [{ data: members, error }, { data: devices }, { data: invites }, { data: ocrRows }] =
    await Promise.all([
      admin
        .from("members")
        .select("id, display_name, role, active, created_at, updated_at")
        .order("created_at", { ascending: true }),
      admin.from("member_devices").select("member_id, last_seen_at"),
      admin
        .from("invite_codes")
        .select("member_id, active, used_count, max_uses, expires_at, created_at"),
      admin
        .from("ocr_requests")
        .select("member_id, usage_day, usage_month, status")
        .eq("usage_month", month)
        .in("status", ["reserved", "success", "failed"]),
    ]);
  if (error) throw error;

  return (members ?? []).map((member: any) => {
    const memberDevices = (devices ?? []).filter(
      (device: any) => device.member_id === member.id,
    );
    const memberInvites = (invites ?? []).filter(
      (invite: any) => invite.member_id === member.id,
    );
    return {
      ...member,
      deviceCount: memberDevices.length,
      lastSeenAt:
        memberDevices
          .map((device: any) => device.last_seen_at)
          .filter(Boolean)
          .sort()
          .at(-1) ?? null,
      activeInviteCount: memberInvites.filter((invite: any) => invite.active).length,
      ocrToday: (ocrRows ?? []).filter(
        (row: any) => row.member_id === member.id && row.usage_day === day,
      ).length,
      ocrMonth: (ocrRows ?? []).filter(
        (row: any) => row.member_id === member.id,
      ).length,
    };
  });
}

async function createInviteForMember(
  memberId: string,
  createdBy: string,
): Promise<string> {
  // 未使用の旧コードは無効化し、常に最新の1件だけを有効にする。
  const { error: revokeError } = await admin
    .from("invite_codes")
    .update({ active: false })
    .eq("member_id", memberId)
    .eq("active", true);
  if (revokeError) throw revokeError;

  const expiresAt = new Date(
    Date.now() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomAccessCode();
    const codeHash = await sha256Hex(normalizeAccessCode(code));
    const { error } = await admin.from("invite_codes").insert({
      member_id: memberId,
      code_hash: codeHash,
      max_uses: 1,
      active: true,
      expires_at: expiresAt,
      created_by: createdBy,
    });
    if (!error) return code;
    if (error.code !== "23505") throw error;
  }
  throw new Error("招待コードを生成できませんでした。");
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.trunc(parsed)));
}

function optionalBoundedInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(minimum, Math.min(maximum, Math.trunc(parsed)));
}

function validIsoTimestamp(value: unknown): string {
  const raw = cleanString(value, 80);
  const date = new Date(raw);
  return raw && Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString();
}

function boundedConfidence(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(1, parsed));
}

function optionalIsoTimestamp(value: unknown): string | null {
  const raw = cleanString(value, 80);
  if (!raw) return null;
  const date = new Date(raw);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return null;
  const minimum = Date.UTC(2000, 0, 1);
  const maximum = Date.now() + 24 * 60 * 60 * 1000;
  if (timestamp < minimum || timestamp > maximum) return null;
  return date.toISOString();
}

function applyAnalysisHints(
  draft: JsonObject,
  redLevelsRaw: unknown,
  redConfidenceRaw: unknown,
  observedAtRaw: unknown,
  observedAtSourceRaw: unknown,
): JsonObject {
  const redLevels = Array.isArray(redLevelsRaw)
    ? redLevelsRaw.slice(0, 3).map((value) => optionalBoundedInteger(value, 0, 5))
    : [null, null, null];
  const redConfidence = Array.isArray(redConfidenceRaw)
    ? redConfidenceRaw.slice(0, 3).map((value) => boundedConfidence(value))
    : [0, 0, 0];
  if (Array.isArray(draft.generals)) {
    draft.generals.slice(0, 3).forEach((general: JsonObject, index: number) => {
      const redLevel = redLevels[index];
      if (redLevel !== null) {
        general.redLevel = redLevel;
        general.confidence = general.confidence && typeof general.confidence === "object"
          ? general.confidence
          : {};
        general.confidence.redLevel = redConfidence[index] || 0.72;
      }
    });
  }

  const observedAt = optionalIsoTimestamp(observedAtRaw);
  if (observedAt) draft.observedAt = observedAt;
  const observedAtSource = ["metadata", "file-last-modified", "current-time"].includes(
      cleanString(observedAtSourceRaw, 40),
    )
    ? cleanString(observedAtSourceRaw, 40)
    : observedAt
      ? "file-last-modified"
      : "current-time";
  draft.observedAtSource = observedAtSource;
  draft.summary = draft.summary && typeof draft.summary === "object" ? draft.summary : {};
  draft.summary.observedAtSource = observedAtSource;
  draft.summary.redLevelParser = redLevels.some((value) => value !== null)
    ? "color-jewel-v2"
    : "manual";
  return draft;
}

async function cleanupOldOcrCache(): Promise<void> {
  const cutoff = new Date(
    Date.now() - OCR_CACHE_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error } = await admin.from("ocr_cache").delete().lt("last_used_at", cutoff);
  if (error) console.warn("OCR cache cleanup failed", error.message);
}

// ---- v1.7.1 諜報ポイント / Discord連携 -------------------------------------
const INTEL_POINTS = Object.freeze({
  enemyFirst: 10,
  teamFirst: 8,
  tacticFirst: 3,
  fieldFill: 1,
  teamComplete: 3,
  tacticChange: 4,
  redChange: 2,
  levelChange: 1,
  staleReconfirm: 2,
  ocrCorrection: 1,
});

const INTEL_TITLES = [
  { threshold: 30, code: "scout", label: "斥候", roleField: "role_scout_id" },
  { threshold: 80, code: "spy", label: "間者", roleField: "role_spy_id" },
  { threshold: 180, code: "ninja_head", label: "忍頭", roleField: "role_ninja_head_id" },
  { threshold: 350, code: "oniwaban", label: "御庭番", roleField: "role_oniwaban_id" },
  { threshold: 600, code: "intel_commissioner", label: "諜報奉行", roleField: "role_intel_commissioner_id" },
] as const;

const DISCORD_CLIENT_ID = cleanString(Deno.env.get("DISCORD_CLIENT_ID"), 100);
const DISCORD_CLIENT_SECRET = cleanString(Deno.env.get("DISCORD_CLIENT_SECRET"), 300);
const DISCORD_BOT_TOKEN = cleanString(Deno.env.get("DISCORD_BOT_TOKEN"), 300);
const DISCORD_REDIRECT_URI = cleanString(
  Deno.env.get("DISCORD_REDIRECT_URI"),
  500,
) || `${SUPABASE_URL}/functions/v1/discord-callback`;

function normalizeIntelName(value: unknown): string {
  return cleanString(value, 80).replace(/\s+/g, "");
}

function payloadTeamIdentity(payload: any): {
  key: string;
  leader: string;
  deputies: string[];
  display: string;
} | null {
  const generals = Array.isArray(payload?.generals) ? payload.generals : [];
  const leader = normalizeIntelName(generals.find((row: any) => Number(row.slot) === 1)?.name);
  const deputies = [2, 3]
    .map((slot) => normalizeIntelName(generals.find((row: any) => Number(row.slot) === slot)?.name))
    .filter(Boolean)
    .sort();
  if (!leader || deputies.length !== 2) return null;
  return {
    key: `${leader}|${deputies[0]}|${deputies[1]}`,
    leader,
    deputies,
    display: [leader, ...deputies].join("／"),
  };
}

function freshnessInfo(observedAt: unknown): JsonObject {
  const time = new Date(String(observedAt ?? "")).getTime();
  if (!Number.isFinite(time)) return { code: "unknown", label: "不明", days: null };
  const days = Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
  if (days <= 2) return { code: "latest", label: "最新", days };
  if (days <= 7) return { code: "active", label: "有効", days };
  if (days <= 14) return { code: "aging", label: "やや古い", days };
  if (days <= 29) return { code: "old", label: "古い", days };
  return { code: "recheck", label: "要再確認", days };
}

function confidenceInfo(countRaw: unknown): JsonObject {
  const count = Math.max(0, Number(countRaw ?? 0) || 0);
  if (count >= 3) return { code: "high", label: "高信頼", count };
  if (count >= 2) return { code: "confirmed", label: "確認済", count };
  return { code: "provisional", label: "暫定", count };
}

function titleForPoints(pointsRaw: unknown): JsonObject | null {
  const points = Math.max(0, Number(pointsRaw ?? 0) || 0);
  let selected: any = null;
  for (const title of INTEL_TITLES) {
    if (points >= title.threshold) selected = title;
  }
  return selected ? { ...selected } : null;
}

function contributorLabel(contributor: any): string {
  return cleanString(contributor?.display_name, 80) ||
    cleanString(contributor?.discord_username, 80) ||
    "匿名ユーザー";
}

async function getContributorForUserId(userId: string): Promise<any | null> {
  if (!userId) return null;
  const { data: device, error: deviceError } = await admin
    .from("intel_contributor_devices")
    .select("contributor_id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (deviceError) throw deviceError;
  if (!device?.contributor_id) return null;

  const { data: contributor, error: contributorError } = await admin
    .from("intel_contributors")
    .select("id, discord_user_id, display_name, discord_username, discord_avatar, discord_linked_at")
    .eq("id", device.contributor_id)
    .maybeSingle();
  if (contributorError) throw contributorError;
  if (!contributor) return null;

  await admin
    .from("intel_contributor_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("auth_user_id", userId);
  return contributor;
}

async function contributorNameMap(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data, error } = await admin
    .from("intel_contributors")
    .select("id, display_name, discord_username")
    .in("id", unique);
  if (error) throw error;
  for (const row of data ?? []) map.set(row.id, contributorLabel(row));
  return map;
}

async function contributorSeasonPoints(contributorId: string, seasonName: string): Promise<number> {
  if (!contributorId) return 0;
  const { data, error } = await admin
    .from("intel_point_events")
    .select("points")
    .eq("contributor_id", contributorId)
    .eq("season_name", seasonName);
  if (error) throw error;
  return (data ?? []).reduce((sum: number, row: any) => sum + (Number(row.points) || 0), 0);
}

function jstWeekStartIso(): string {
  const shifted = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const date = shifted.getUTCDate();
  const mondayOffset = (shifted.getUTCDay() + 6) % 7;
  const jstMidnightUtcMs = Date.UTC(year, month, date - mondayOffset, 0, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(jstMidnightUtcMs).toISOString();
}

function randomStateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeReturnUrl(value: unknown): string | null {
  const raw = cleanString(value, 500);
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url.origin)) {
      return null;
    }
    const originAllowed = configuredOrigins.includes("*") ||
      configuredOrigins.includes(url.origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url.origin);
    return originAllowed ? url.toString() : null;
  } catch {
    return null;
  }
}


async function getDiscordSeasonConfig(seasonName: string): Promise<any> {
  const { data, error } = await admin
    .from("discord_season_configs")
    .select("*")
    .eq("season_name", seasonName)
    .maybeSingle();
  if (error) throw error;
  return data ?? {
    season_name: seasonName,
    guild_id: "",
    role_scout_id: "",
    role_spy_id: "",
    role_ninja_head_id: "",
    role_oniwaban_id: "",
    role_intel_commissioner_id: "",
  };
}

async function discordBotRequest(path: string, init: RequestInit = {}): Promise<Response> {
  if (!DISCORD_BOT_TOKEN) throw new Error("DISCORD_BOT_TOKEN_NOT_CONFIGURED");
  const headers = new Headers(init.headers ?? {});
  headers.set("Authorization", `Bot ${DISCORD_BOT_TOKEN}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(`https://discord.com/api/v10${path}`, { ...init, headers });
}

async function syncDiscordTitleRole(contributor: any, seasonName: string): Promise<void> {
  if (!DISCORD_BOT_TOKEN || !contributor?.discord_user_id) return;
  try {
    const config = await getDiscordSeasonConfig(seasonName);
    if (!config?.guild_id) return;
    const points = await contributorSeasonPoints(contributor.id, seasonName);
    const title = titleForPoints(points);
    const roleIds = INTEL_TITLES
      .map((item) => cleanString(config[item.roleField], 80))
      .filter(Boolean);
    const targetRoleId = title ? cleanString(config[title.roleField], 80) : "";

    for (const roleId of roleIds) {
      const shouldHave = roleId === targetRoleId;
      const response = await discordBotRequest(
        `/guilds/${encodeURIComponent(config.guild_id)}/members/${encodeURIComponent(contributor.discord_user_id)}/roles/${encodeURIComponent(roleId)}`,
        { method: shouldHave ? "PUT" : "DELETE" },
      );
      if (!response.ok && response.status !== 404) {
        console.warn("Discord role sync failed", response.status, await response.text());
      }
    }
  } catch (error) {
    // Discord側の設定不備で戦報登録そのものを失敗させない。
    console.warn("Discord title sync skipped", (error as Error).message);
  }
}

async function syncAllDiscordTitlesForSeason(seasonName: string): Promise<void> {
  if (!DISCORD_BOT_TOKEN) return;
  const { data, error } = await admin
    .from("intel_contributors")
    .select("id, discord_user_id, display_name, discord_username")
    .not("discord_user_id", "is", null)
    .limit(500);
  if (error) throw error;
  for (const contributor of data ?? []) {
    await syncDiscordTitleRole(contributor, seasonName);
  }
}

function unwrapRpcResult(data: any): any {
  if (Array.isArray(data)) return data[0] ?? {};
  return data && typeof data === "object" ? data : {};
}

async function savedObservationByHash(imageHash: string): Promise<any | null> {
  const { data, error } = await admin
    .from("enemy_observations")
    .select("id, enemy_player_id, season_name, observed_at, completeness, source_image_hash, contributor_id")
    .eq("source_image_hash", imageHash)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

async function enemyNameById(enemyId: string): Promise<string> {
  const { data, error } = await admin
    .from("enemy_players")
    .select("name")
    .eq("id", enemyId)
    .maybeSingle();
  if (error) throw error;
  return cleanString(data?.name, 80) || "敵プレイヤー";
}

async function observationsForEnemySeason(enemyId: string, seasonName: string): Promise<any[]> {
  const { data, error } = await admin
    .from("enemy_observations")
    .select("id, enemy_player_id, season_name, observed_at, completeness, source_image_hash, contributor_id, observation_generals(slot, role_label, general_name, general_level, red_level, inherent_tactic, tactic_1, tactic_2)")
    .eq("enemy_player_id", enemyId)
    .eq("season_name", seasonName)
    .order("observed_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

function generalByName(observation: any, generalName: string): any | null {
  const normalized = normalizeIntelName(generalName);
  if (!normalized) return null;
  return (observation?.observation_generals ?? []).find(
    (row: any) => normalizeIntelName(row.general_name) === normalized,
  ) ?? null;
}

function currentGeneralRows(payload: any): any[] {
  return (Array.isArray(payload?.generals) ? payload.generals : []).map((row: any) => ({
    slot: Number(row.slot),
    name: cleanString(row.name, 40),
    level: row.level === null || row.level === undefined ? null : Number(row.level),
    redLevel: row.redLevel === null || row.redLevel === undefined ? null : Number(row.redLevel),
    tactic1: cleanString(row.tactic1, 50),
    tactic2: cleanString(row.tactic2, 50),
  }));
}

function payloadIntelComplete(payload: any): boolean {
  const rows = currentGeneralRows(payload);
  if (rows.length < 3) return false;
  return [1, 2, 3].every((slot) => {
    const row = rows.find((item: any) => Number(item.slot) === slot);
    return Boolean(
      row?.name &&
      Number.isFinite(row?.level) &&
      Number.isFinite(row?.redLevel) &&
      row?.tactic1 &&
      row?.tactic2
    );
  });
}

function observationIntelComplete(observation: any): boolean {
  const rows = Array.isArray(observation?.observation_generals)
    ? observation.observation_generals
    : [];
  return [1, 2, 3].every((slot) => {
    const row = rows.find((item: any) => Number(item.slot) === slot);
    return Boolean(
      cleanString(row?.general_name, 40) &&
      row?.general_level !== null && row?.general_level !== undefined &&
      Number.isFinite(Number(row.general_level)) &&
      row?.red_level !== null && row?.red_level !== undefined &&
      Number.isFinite(Number(row.red_level)) &&
      cleanString(row?.tactic_1, 50) &&
      cleanString(row?.tactic_2, 50)
    );
  });
}

function historicalFieldValues(history: any[], generalName: string, field: string): any[] {
  const values: any[] = [];
  for (const observation of [...history].sort(
    (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime(),
  )) {
    const general = generalByName(observation, generalName);
    if (!general) continue;
    const value = general[field];
    if (value === null || value === undefined || String(value).trim() === "") continue;
    values.push(value);
  }
  return values;
}

async function tryInsertRow(table: string, row: JsonObject): Promise<boolean> {
  const { error } = await admin.from(table).insert(row);
  if (!error) return true;
  if ((error as any).code === "23505") return false;
  throw error;
}

async function insertPointEvent(row: JsonObject): Promise<boolean> {
  return tryInsertRow("intel_point_events", row);
}

async function insertFeedEvent(row: JsonObject): Promise<boolean> {
  return tryInsertRow("intel_feed_events", row);
}

async function loadOcrCorrectionCandidates(payload: any): Promise<Array<{ label: string; key: string; metadata: JsonObject }>> {
  const cacheHash = cleanString(payload?.ocrCacheHash, 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(cacheHash)) return [];
  const { data: cache, error: cacheError } = await admin
    .from("ocr_cache")
    .select("draft")
    .eq("image_hash", cacheHash)
    .maybeSingle();
  if (cacheError) throw cacheError;
  const original = cache?.draft;
  if (!original || typeof original !== "object") return [];

  const [{ data: generalMaster, error: generalError }, { data: tacticMaster, error: tacticError }] = await Promise.all([
    admin.from("general_master").select("name").eq("active", true),
    admin.from("tactic_master").select("name").eq("active", true),
  ]);
  if (generalError) throw generalError;
  if (tacticError) throw tacticError;
  const generalSet = new Set((generalMaster ?? []).map((row: any) => cleanString(row.name, 80)));
  const tacticSet = new Set((tacticMaster ?? []).map((row: any) => cleanString(row.name, 80)));
  const finalRows = currentGeneralRows(payload);
  const originalRows = Array.isArray(original.generals) ? original.generals : [];
  const corrections: Array<{ label: string; key: string; metadata: JsonObject }> = [];

  for (const finalGeneral of finalRows) {
    const slot = Number(finalGeneral.slot);
    const originalGeneral = originalRows.find((row: any) => Number(row.slot) === slot) ?? {};
    const checks = [
      { field: "name", final: finalGeneral.name, original: cleanString(originalGeneral.name, 40), master: generalSet, label: "武将名" },
      { field: "tactic1", final: finalGeneral.tactic1, original: cleanString(originalGeneral.tactic1, 50), master: tacticSet, label: "第1戦法" },
      { field: "tactic2", final: finalGeneral.tactic2, original: cleanString(originalGeneral.tactic2, 50), master: tacticSet, label: "第2戦法" },
    ];
    for (const check of checks) {
      const originalNormalized = normalizeIntelName(check.original);
      const finalNormalized = normalizeIntelName(check.final);
      if (
        !originalNormalized ||
        !finalNormalized ||
        finalNormalized === originalNormalized ||
        !check.master.has(check.final)
      ) continue;

      // ポイント目的で正しいOCR結果を無関係な別マスタへ書き換える行為を抑止する。
      // 文字欠落・1文字誤読・「富虎 → 飯富虎昌」のような部分一致は救済する。
      const maximumLength = Math.max(originalNormalized.length, finalNormalized.length);
      const similarity = maximumLength
        ? 1 - levenshteinDistance(originalNormalized, finalNormalized) / maximumLength
        : 0;
      const related =
        similarity >= 0.45 ||
        (originalNormalized.length >= 2 && finalNormalized.includes(originalNormalized)) ||
        (finalNormalized.length >= 2 && originalNormalized.includes(finalNormalized));
      if (!related) continue;

      corrections.push({
        label: `OCR修正（${check.label}）`,
        key: `${slot}:${check.field}`,
        metadata: { slot, field: check.field, from: check.original, to: check.final },
      });
      if (corrections.length >= 2) return corrections;
    }
  }
  return corrections;
}

async function evaluateIntelForSavedObservation(
  userId: string,
  payload: any,
  observationId: string,
  enemyId: string,
): Promise<JsonObject> {
  const contributor = await getContributorForUserId(userId);
  const actorLabel = contributor ? contributorLabel(contributor) : "匿名ユーザー";
  const seasonName = cleanString(payload.seasonName, 60) || "未設定";
  const team = payloadTeamIdentity(payload);
  const enemyName = await enemyNameById(enemyId);
  const beforePoints = contributor ? await contributorSeasonPoints(contributor.id, seasonName) : 0;
  const breakdown: JsonObject[] = [];
  let awardedPoints = 0;
  let eligiblePoints = 0;

  const record = async (
    eventType: string,
    points: number,
    label: string,
    eventKey: string,
    metadata: JsonObject = {},
    feedMessage = "",
  ) => {
    eligiblePoints += points;
    let awarded = false;
    if (contributor) {
      awarded = await insertPointEvent({
        season_name: seasonName,
        contributor_id: contributor.id,
        observation_id: observationId,
        enemy_player_id: enemyId,
        team_key: team?.key ?? null,
        event_type: eventType,
        points,
        event_key: eventKey,
        description: label,
        metadata,
      });
      if (awarded) awardedPoints += points;
    }
    breakdown.push({ eventType, label, points: contributor && awarded ? points : 0, eligiblePoints: points });
    if (feedMessage) {
      await insertFeedEvent({
        season_name: seasonName,
        actor_contributor_id: contributor?.id ?? null,
        actor_label: actorLabel,
        enemy_player_id: enemyId,
        observation_id: observationId,
        team_key: team?.key ?? null,
        event_type: eventType,
        event_key: `feed:${eventKey}`,
        message: feedMessage,
        metadata,
      });
    }
  };

  const discoveredAt = new Date().toISOString();
  const enemyFirst = await tryInsertRow("intel_enemy_discoveries", {
    season_name: seasonName,
    enemy_player_id: enemyId,
    first_observation_id: observationId,
    discovered_by_contributor_id: contributor?.id ?? null,
    discovered_at: discoveredAt,
  });
  if (enemyFirst) {
    await record(
      "enemy_first",
      INTEL_POINTS.enemyFirst,
      "敵プレイヤー初登録",
      `${seasonName}:enemy:${enemyId}:first`,
      { enemyName },
      `${actorLabel}は${enemyName}を初登録しました。`,
    );
  }

  let teamFirst = false;
  if (team) {
    teamFirst = await tryInsertRow("intel_team_discoveries", {
      season_name: seasonName,
      enemy_player_id: enemyId,
      team_key: team.key,
      leader_name: team.leader,
      deputy_1_name: team.deputies[0],
      deputy_2_name: team.deputies[1],
      first_observation_id: observationId,
      discovered_by_contributor_id: contributor?.id ?? null,
      discovered_at: discoveredAt,
    });
    if (teamFirst) {
      await record(
        "team_first",
        INTEL_POINTS.teamFirst,
        "未登録部隊を初発見",
        `${seasonName}:team:${enemyId}:${team.key}:first`,
        { enemyName, teamDisplay: team.display, leader: team.leader },
        `${actorLabel}は${enemyName}の部隊「${team.display}」を初発見しました。`,
      );
    }
  }

  const allObservations = await observationsForEnemySeason(enemyId, seasonName);
  const history = team
    ? allObservations.filter((row: any) => row.id !== observationId && observationTeamKey(row) === team.key)
    : [];
  const currentObservedTime = new Date(payload.observedAt).getTime();
  const previousLatest = [...history]
    .filter((row: any) => new Date(row.observed_at).getTime() < currentObservedTime)
    .sort((a: any, b: any) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime())[0] ?? null;
  const maxPreviousTime = history.reduce(
    (max: number, row: any) => Math.max(max, new Date(row.observed_at).getTime() || 0),
    0,
  );
  const isChronologicallyNewest = !history.length || currentObservedTime > maxPreviousTime;

  if (team && !teamFirst && history.length) {
    const currentRows = currentGeneralRows(payload);
    for (const current of currentRows) {
      if (!current.name) continue;
      const fields = [
        { field: "tactic_1", current: current.tactic1, firstPoints: INTEL_POINTS.tacticFirst, changePoints: INTEL_POINTS.tacticChange, label: "第1戦法" },
        { field: "tactic_2", current: current.tactic2, firstPoints: INTEL_POINTS.tacticFirst, changePoints: INTEL_POINTS.tacticChange, label: "第2戦法" },
      ];
      for (const item of fields) {
        if (!item.current) continue;
        const priorValues = historicalFieldValues(history, current.name, item.field).map((value) => cleanString(value, 50));
        if (!priorValues.length) {
          await record(
            "tactic_first",
            item.firstPoints,
            `${current.name}の${item.label}を初確認`,
            `${observationId}:tactic-first:${current.name}:${item.field}`,
            { generalName: current.name, field: item.field, value: item.current },
            `${actorLabel}は${enemyName}の${team.leader}部隊で${current.name}の${item.label}「${item.current}」を初確認しました。`,
          );
        } else if (isChronologicallyNewest && priorValues[0] !== item.current) {
          await record(
            "tactic_change",
            item.changePoints,
            `${current.name}の${item.label}変更を発見`,
            `${observationId}:tactic-change:${current.name}:${item.field}`,
            { generalName: current.name, field: item.field, from: priorValues[0], to: item.current },
            `${actorLabel}は${enemyName}の${team.leader}部隊で${current.name}の${item.label}変更を発見しました。`,
          );
        }
      }

      const priorLevels = historicalFieldValues(history, current.name, "general_level").map(Number).filter(Number.isFinite);
      if (current.level !== null && Number.isFinite(current.level)) {
        if (!priorLevels.length) {
          await record(
            "field_fill",
            INTEL_POINTS.fieldFill,
            `${current.name}のLvを補完`,
            `${observationId}:fill:${current.name}:level`,
            { generalName: current.name, field: "level", value: current.level },
          );
        } else if (isChronologicallyNewest && priorLevels[0] !== current.level) {
          await record(
            "level_change",
            INTEL_POINTS.levelChange,
            `${current.name}のLv変化を確認`,
            `${observationId}:level-change:${current.name}`,
            { generalName: current.name, from: priorLevels[0], to: current.level },
          );
        }
      }

      const priorRed = historicalFieldValues(history, current.name, "red_level").map(Number).filter(Number.isFinite);
      if (current.redLevel !== null && Number.isFinite(current.redLevel)) {
        if (!priorRed.length) {
          await record(
            "field_fill",
            INTEL_POINTS.fieldFill,
            `${current.name}の凸数を補完`,
            `${observationId}:fill:${current.name}:red`,
            { generalName: current.name, field: "redLevel", value: current.redLevel },
          );
        } else if (isChronologicallyNewest && priorRed[0] !== current.redLevel) {
          await record(
            "red_change",
            INTEL_POINTS.redChange,
            `${current.name}の凸数変化を確認`,
            `${observationId}:red-change:${current.name}`,
            { generalName: current.name, from: priorRed[0], to: current.redLevel },
          );
        }
      }
    }
  }

  if (team && payloadIntelComplete(payload) && !history.some((row: any) => observationIntelComplete(row))) {
    await record(
      "team_complete",
      INTEL_POINTS.teamComplete,
      "部隊情報を初めて完成",
      `${seasonName}:team:${enemyId}:${team.key}:complete`,
      { teamDisplay: team.display },
      // 「情報を完成」は新規登録時の発見フィードには出さない。
      // 既存記録を編集して不足項目を埋めた場合だけ update_observation 側で表示する。
      "",
    );
  }

  if (team && previousLatest && isChronologicallyNewest) {
    const gapDays = (currentObservedTime - new Date(previousLatest.observed_at).getTime()) / 86_400_000;
    if (gapDays >= 7) {
      await record(
        "stale_reconfirm",
        INTEL_POINTS.staleReconfirm,
        "1週間以上未確認の部隊を再確認",
        `${observationId}:stale-reconfirm`,
        { previousObservedAt: previousLatest.observed_at, gapDays: Number(gapDays.toFixed(2)) },
      );
    }
  }

  for (const correction of await loadOcrCorrectionCandidates(payload)) {
    await record(
      "ocr_correction",
      INTEL_POINTS.ocrCorrection,
      correction.label,
      `${observationId}:ocr:${correction.key}`,
      correction.metadata,
    );
  }

  const afterPoints = contributor ? beforePoints + awardedPoints : 0;
  const beforeTitle = contributor ? titleForPoints(beforePoints) : null;
  const afterTitle = contributor ? titleForPoints(afterPoints) : null;
  if (contributor && afterTitle && afterTitle.code !== beforeTitle?.code) {
    await insertFeedEvent({
      season_name: seasonName,
      actor_contributor_id: contributor.id,
      actor_label: actorLabel,
      enemy_player_id: enemyId,
      observation_id: observationId,
      team_key: team?.key ?? null,
      event_type: "title_earned",
      event_key: `feed:${seasonName}:title:${contributor.id}:${afterTitle.code}`,
      message: `${actorLabel}は称号「${afterTitle.label}」を獲得しました。`,
      metadata: { title: afterTitle.label, threshold: afterTitle.threshold },
    });
    await syncDiscordTitleRole(contributor, seasonName);
  }

  const currentTeamRows = team
    ? allObservations.filter((row: any) => observationTeamKey(row) === team.key)
    : [];
  const previousCount = history.length;
  const currentCount = currentTeamRows.length;
  const latestObservedAt = currentTeamRows.reduce((latest: string, row: any) => {
    if (!latest) return row.observed_at;
    return new Date(row.observed_at).getTime() > new Date(latest).getTime() ? row.observed_at : latest;
  }, "");

  return {
    linked: Boolean(contributor),
    contributor: contributor ? { id: contributor.id, displayName: actorLabel } : null,
    awardedPoints,
    eligiblePoints,
    seasonPoints: contributor ? afterPoints : null,
    breakdown,
    teamFirst,
    enemyFirst,
    confirmation: team
      ? {
          previousCount,
          currentCount,
          previousConfidence: confidenceInfo(previousCount),
          currentConfidence: confidenceInfo(currentCount),
        }
      : null,
    freshness: freshnessInfo(latestObservedAt || payload.observedAt),
    title: afterTitle,
  };
}

async function buildIntelDashboard(userId: string): Promise<JsonObject> {
  const settings = await readSettings();
  const seasonName = settings.current_season;
  const contributor = await getContributorForUserId(userId);

  const { data: feedRows, error: feedError } = await admin
    .from("intel_feed_events")
    .select("id, actor_label, event_type, message, created_at, metadata")
    .eq("season_name", seasonName)
    .order("created_at", { ascending: false })
    .limit(30);
  if (feedError) throw feedError;

  const { data: seasonEvents, error: seasonEventsError } = await admin
    .from("intel_point_events")
    .select("contributor_id, points, created_at")
    .eq("season_name", seasonName)
    .order("created_at", { ascending: false })
    .limit(10000);
  if (seasonEventsError) throw seasonEventsError;

  const weekStart = jstWeekStartIso();
  const seasonTotals = new Map<string, number>();
  const weekTotals = new Map<string, number>();
  for (const row of seasonEvents ?? []) {
    const id = row.contributor_id;
    seasonTotals.set(id, (seasonTotals.get(id) ?? 0) + (Number(row.points) || 0));
    if (new Date(row.created_at).getTime() >= new Date(weekStart).getTime()) {
      weekTotals.set(id, (weekTotals.get(id) ?? 0) + (Number(row.points) || 0));
    }
  }
  const rankingContributorIds = [...new Set([...seasonTotals.keys(), ...weekTotals.keys()])];
  const nameMap = await contributorNameMap(rankingContributorIds);
  const toRanking = (totals: Map<string, number>) => [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || (nameMap.get(a[0]) ?? "").localeCompare(nameMap.get(b[0]) ?? "", "ja"))
    .slice(0, 30)
    .map(([contributorId, points], index) => ({
      rank: index + 1,
      contributorId,
      displayName: nameMap.get(contributorId) ?? "不明",
      points,
    }));

  if (!contributor) {
    return {
      currentSeason: seasonName,
      linked: false,
      discordOAuthConfigured: Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET),
      feed: feedRows ?? [],
      weeklyRanking: toRanking(weekTotals),
      seasonRanking: toRanking(seasonTotals),
      achievements: [],
      recentPoints: [],
    };
  }

  const seasonPoints = seasonTotals.get(contributor.id) ?? 0;
  const weeklyPoints = weekTotals.get(contributor.id) ?? 0;
  const { data: lifetimeEvents, error: lifetimeError } = await admin
    .from("intel_point_events")
    .select("event_type, points")
    .eq("contributor_id", contributor.id)
    .limit(20000);
  if (lifetimeError) throw lifetimeError;
  const eventCounts = new Map<string, number>();
  for (const event of lifetimeEvents ?? []) {
    eventCounts.set(event.event_type, (eventCounts.get(event.event_type) ?? 0) + 1);
  }
  const { data: contributedObservations, error: observationCountError } = await admin
    .from("enemy_observations")
    .select("id, enemy_player_id, season_name, observation_generals(slot, general_name)")
    .eq("contributor_id", contributor.id)
    .limit(10000);
  if (observationCountError) throw observationCountError;
  const observedTeams = new Set();
  for (const observation of contributedObservations ?? []) {
    const teamKey = observationTeamKey(observation);
    if (!teamKey.startsWith("incomplete:")) {
      observedTeams.add(`${observation.season_name}::${observation.enemy_player_id}::${teamKey}`);
    }
  }
  const observedTeamCount = observedTeams.size;

  // 「完全把握」は、同じ敵プレイヤーについて10個目の異なる部隊を
  // 自分が初発見した時に解除する。シーズンをまたいだ水増しを避けるため
  // season_name + enemy_player_id 単位で数え、その最大値を進捗として表示する。
  const { data: firstDiscoveryRows, error: firstDiscoveryError } = await admin
    .from("intel_team_discoveries")
    .select("season_name, enemy_player_id, team_key")
    .eq("discovered_by_contributor_id", contributor.id)
    .limit(20000);
  if (firstDiscoveryError) throw firstDiscoveryError;
  const discoveriesByEnemy = new Map<string, Set<string>>();
  for (const row of firstDiscoveryRows ?? []) {
    const key = `${cleanString(row.season_name, 60)}::${cleanString(row.enemy_player_id, 80)}`;
    const set = discoveriesByEnemy.get(key) ?? new Set<string>();
    const teamKey = cleanString(row.team_key, 300);
    if (teamKey) set.add(teamKey);
    discoveriesByEnemy.set(key, set);
  }
  const maxFirstDiscoveredTeamsForOneEnemy = Math.max(
    0,
    ...[...discoveriesByEnemy.values()].map((set) => set.size),
  );

  const totalPointEvents = lifetimeEvents?.length ?? 0;
  const achievementDefinitions = [
    { code: "first_job", label: "初仕事", description: "初めてポイント対象情報を登録", target: 1, current: totalPointEvents },
    { code: "pioneer", label: "先駆者", description: "5部隊を初発見", target: 5, current: eventCounts.get("team_first") ?? 0 },
    { code: "trailblazer", label: "開拓者", description: "20部隊を初発見", target: 20, current: eventCounts.get("team_first") ?? 0 },
    { code: "enemy_expert", label: "敵情通", description: "50部隊を観測", target: 50, current: observedTeamCount },
    { code: "keen_eye", label: "目利き", description: "OCR修正20件", target: 20, current: eventCounts.get("ocr_correction") ?? 0 },
    { code: "recheck_master", label: "再確認の達人", description: "1週間以上古い部隊を20回再確認", target: 20, current: eventCounts.get("stale_reconfirm") ?? 0 },
    { code: "complete_intel", label: "完全把握", description: "同じ敵プレイヤーの10部隊目を初発見", target: 10, current: maxFirstDiscoveredTeamsForOneEnemy },
  ].map((item) => ({ ...item, unlocked: item.current >= item.target }));

  const { data: recentPoints, error: recentError } = await admin
    .from("intel_point_events")
    .select("id, event_type, points, description, created_at, metadata")
    .eq("contributor_id", contributor.id)
    .order("created_at", { ascending: false })
    .limit(25);
  if (recentError) throw recentError;

  return {
    currentSeason: seasonName,
    linked: true,
    discordOAuthConfigured: Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET),
    contributor: {
      id: contributor.id,
      displayName: contributorLabel(contributor),
      discordUsername: contributor.discord_username,
    },
    seasonPoints,
    weeklyPoints,
    title: titleForPoints(seasonPoints),
    feed: feedRows ?? [],
    weeklyRanking: toRanking(weekTotals),
    seasonRanking: toRanking(seasonTotals),
    achievements: achievementDefinitions,
    recentPoints: recentPoints ?? [],
  };
}

async function intelForTeamGroups(groups: any[], enemyId: string): Promise<any[]> {
  if (!groups.length) return groups;
  const { data: discoveries, error } = await admin
    .from("intel_team_discoveries")
    .select("season_name, enemy_player_id, team_key, discovered_at, discovered_by_contributor_id")
    .eq("enemy_player_id", enemyId);
  if (error) throw error;
  const nameMap = await contributorNameMap(
    (discoveries ?? []).map((row: any) => row.discovered_by_contributor_id).filter(Boolean),
  );
  const discoveryMap = new Map<string, any>();
  for (const row of discoveries ?? []) {
    discoveryMap.set(`${row.season_name}::${row.team_key}`, row);
  }
  return groups.map((group: any) => {
    const seasonName = cleanString(group.seasonName ?? group.latest?.season_name, 60);
    const discovery = discoveryMap.get(`${seasonName}::${group.key}`) ?? null;
    return {
      ...group,
      intel: {
        freshness: freshnessInfo(group.latest?.observed_at),
        confidence: confidenceInfo(group.observationCount),
        discoveredAt: discovery?.discovered_at ?? null,
        discoveredByName: discovery
          ? (nameMap.get(discovery.discovered_by_contributor_id) ?? "匿名ユーザー")
          : "匿名ユーザー",
      },
    };
  });
}


function sanitizeObservationPayload(payload: any, currentSeason: string): JsonObject {
  const imageHash = cleanString(payload?.imageHash, 64).toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(imageHash)) {
    throw new Error("INVALID_IMAGE_HASH");
  }

  const rawCacheHash = cleanString(payload?.ocrCacheHash, 64).toLowerCase();
  const ocrCacheHash = /^[a-f0-9]{64}$/.test(rawCacheHash) ? rawCacheHash : "";
  const generals = Array.isArray(payload?.generals)
    ? payload.generals.slice(0, 3).map((general: any, index: number) => ({
        slot: index + 1,
        roleLabel: index === 0 ? "大将" : "副将",
        name: cleanString(general?.name, 40),
        level: optionalBoundedInteger(general?.level, 1, 100),
        redLevel: optionalBoundedInteger(general?.redLevel, 0, 5),
        inherentTactic: cleanString(general?.inherentTactic, 50),
        tactic1: cleanString(general?.tactic1, 50),
        tactic2: cleanString(general?.tactic2, 50),
        confidence:
          general?.confidence && typeof general.confidence === "object"
            ? {
                name: boundedConfidence(general.confidence.name),
                level: boundedConfidence(general.confidence.level),
                inherentTactic: boundedConfidence(general.confidence.inherentTactic),
                tactic1: boundedConfidence(general.confidence.tactic1),
                tactic2: boundedConfidence(general.confidence.tactic2),
                redLevel: boundedConfidence(general.confidence.redLevel),
              }
            : {},
      }))
    : [];

  while (generals.length < 3) {
    const index = generals.length;
    generals.push({
      slot: index + 1,
      roleLabel: index === 0 ? "大将" : "副将",
      name: "",
      level: null,
      redLevel: null,
      inherentTactic: "",
      tactic1: "",
      tactic2: "",
      confidence: {},
    });
  }

  const captureType = ["phone", "game", "unknown"].includes(payload?.captureType)
    ? payload.captureType
    : "unknown";
  const enemySide = payload?.enemySide === "left" ? "left" : "right";
  const requestedManual = payload?.completeness === "manual";
  const orientation = ["portrait", "landscape"].includes(payload?.summary?.orientation)
    ? payload.summary.orientation
    : "unknown";

  let completenessPoints = cleanString(payload?.enemy?.name, 80) ? 2 : 0;
  for (const general of generals) {
    if (general.name) completenessPoints += 2;
    if (general.inherentTactic) completenessPoints += 1;
    if (general.tactic1) completenessPoints += 1;
    if (general.tactic2) completenessPoints += 1;
  }
  const completenessScore = Math.round((completenessPoints / 17) * 100);
  const completeness = requestedManual
    ? "manual"
    : completenessScore >= 79
      ? "complete"
      : "partial";

  return {
    enemy: {
      name: cleanString(payload?.enemy?.name, 80),
      groupName: cleanGroupName(cleanString(payload?.enemy?.groupName, 80)),
      memo: cleanString(payload?.enemy?.memo, 500),
    },
    observedAt: validIsoTimestamp(payload?.observedAt),
    seasonName: cleanString(currentSeason, 60) || "未設定",
    imageHash,
    ocrCacheHash,
    sourceLayout: cleanString(payload?.sourceLayout, 50) || "unknown",
    captureType,
    enemySide,
    completeness,
    summary: {
      orientation,
      completenessScore,
      troopType: ["infantry", "siege", "cavalry", "bow", "gun"].includes(payload?.summary?.troopType)
        ? payload.summary.troopType
        : "",
      troopLevel: optionalBoundedInteger(payload?.summary?.troopLevel, 1, 10),
    },
    // OCRの原文と詳細下書きはocr_cacheに保持するため、観測側には確定値だけを保存する。
    ocrDraft: {},
    generals,
  };
}


// ============================================================
// マイ編成 / Qookka所持情報同期
// ============================================================

const QOOKKA_CFG_URL = "https://p11386-media-cdn.qookkagames.com/P11386/sns/public_config/release/cfg.json";
const QOOKKA_SNAPSHOT_API = "https://p11386-platform.qookkagames.com/sns/web/api/cache/get_player_share_snapshot";
let qookkaCfgCache: { value: any; expiresAt: number } | null = null;

function parseQookkaSnapshotId(input: unknown): string | null {
  const raw = cleanString(input, 1000);
  if (/^[0-9a-f]{24}$/i.test(raw)) return raw.toLowerCase();
  try {
    const url = new URL(raw);
    const hash = url.hash ?? "";
    const queryAt = hash.indexOf("?");
    if (queryAt >= 0) {
      const params = new URLSearchParams(hash.slice(queryAt + 1));
      const id = params.get("snapshot_id");
      if (id && /^[0-9a-f]{24}$/i.test(id)) return id.toLowerCase();
    }
    const id = url.searchParams.get("snapshot_id");
    if (id && /^[0-9a-f]{24}$/i.test(id)) return id.toLowerCase();
  } catch {
    // URLでない文字列は下の正規表現へフォールバックする。
  }
  const match = raw.match(/snapshot_id=([0-9a-f]{24})/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function qookkaSnapshotUrl(snapshotId: string, dataViewType: "hero" | "skill"): string {
  const payload = {
    game_id: "s11",
    selectors: [{ selector_type: "view", data_view_type: dataViewType }],
    snapshot_id: snapshotId,
  };
  return `${QOOKKA_SNAPSHOT_API}?_json=${encodeURIComponent(JSON.stringify(payload))}`;
}

async function fetchJson(url: string, timeoutMs = 25_000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getQookkaCfg(): Promise<any> {
  const now = Date.now();
  if (qookkaCfgCache && qookkaCfgCache.expiresAt > now) return qookkaCfgCache.value;
  const value = await fetchJson(QOOKKA_CFG_URL, 30_000);
  qookkaCfgCache = { value, expiresAt: now + 6 * 60 * 60 * 1000 };
  return value;
}

function qookkaTranslator(cfg: any): (value: unknown) => string {
  const map = new Map<string, string>();
  for (const row of cfg?.multi_lang ?? []) {
    const ja = cleanString(row?.ja, 160);
    if (!ja) continue;
    const zh = cleanString(row?.["zh-hans"], 160);
    const id = cleanString(row?.id, 160);
    if (zh) map.set(zh, ja);
    if (id) map.set(id, ja);
  }
  return (value: unknown) => {
    const key = cleanString(value, 160);
    return map.get(key) ?? key;
  };
}

async function loadQookkaSnapshot(snapshotId: string): Promise<{
  generals: any[];
  tactics: any[];
  cfgVersion: string;
}> {
  const [cfg, heroResponse, skillResponse] = await Promise.all([
    getQookkaCfg(),
    fetchJson(qookkaSnapshotUrl(snapshotId, "hero")),
    fetchJson(qookkaSnapshotUrl(snapshotId, "skill")),
  ]);
  const translate = qookkaTranslator(cfg);
  const heroConfig = new Map<string, any>((cfg?.hero ?? []).map((row: any) => [String(row?.id ?? ""), row]));
  const skillConfig = new Map<string, any>((cfg?.skill ?? []).map((row: any) => [String(row?.id ?? ""), row]));
  const skillByZhName = new Map<string, any>((cfg?.skill ?? []).map((row: any) => [String(row?.show_name ?? row?.name ?? ""), row]));
  const heroPlayer = heroResponse?.data?.[0]?.player_data ?? {};
  const skillPlayer = skillResponse?.data?.[0]?.player_data ?? {};

  const generals = (heroPlayer?.heros ?? [])
    .map((row: any) => {
      const id = String(row?.id ?? row?.type ?? "");
      const config = heroConfig.get(id) ?? {};
      const born = skillByZhName.get(String(config?.born_skill ?? ""));
      return {
        qookkaId: id,
        name: translate(config?.show_name ?? config?.name ?? id),
        inherentTacticName: translate(config?.born_skill ?? born?.show_name ?? born?.name ?? ""),
        level: Number.isFinite(Number(row?.level)) ? Number(row.level) : null,
      };
    })
    .filter((row: any) => row.qookkaId && row.name);

  const tactics = (skillPlayer?.skills ?? [])
    .map((row: any) => {
      const id = String(row?.id ?? row?.type ?? "");
      const config = skillConfig.get(id) ?? {};
      return {
        qookkaId: id,
        name: translate(config?.show_name ?? config?.name ?? id),
      };
    })
    .filter((row: any) => row.qookkaId && row.name);

  if (!generals.length && !tactics.length) {
    throw new Error("QOOKKA_SNAPSHOT_EMPTY");
  }
  return { generals, tactics, cfgVersion: cleanString(cfg?.version, 80) };
}

async function privateOwnerKey(userId: string): Promise<string> {
  const authKey = `auth:${userId}`;
  const { data: existingLink, error: linkError } = await admin
    .from("user_private_owner_links")
    .select("owner_key")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (linkError) throw linkError;

  const contributor = await getContributorForUserId(userId);
  if (contributor?.id) {
    const contributorKey = `contributor:${contributor.id}`;
    const previousKey = cleanString(existingLink?.owner_key, 160) || authKey;
    if (previousKey !== contributorKey) await migratePrivateOwner(previousKey, contributorKey);
    const { error } = await admin.from("user_private_owner_links").upsert(
      { auth_user_id: userId, owner_key: contributorKey, updated_at: new Date().toISOString() },
      { onConflict: "auth_user_id" },
    );
    if (error) throw error;
    return contributorKey;
  }

  // Discord連携を解除しても、一度確定したowner_keyは変えない。
  if (existingLink?.owner_key) return String(existingLink.owner_key);
  const { error } = await admin.from("user_private_owner_links").insert({
    auth_user_id: userId,
    owner_key: authKey,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return authKey;
}

async function migratePrivateOwner(fromKey: string, toKey: string): Promise<void> {
  if (!fromKey || !toKey || fromKey === toKey) return;
  const [{ data: fromGenerals }, { data: toGenerals }, { data: fromTactics }, { data: toTactics }] = await Promise.all([
    admin.from("user_owned_generals").select("*").eq("owner_key", fromKey),
    admin.from("user_owned_generals").select("*").eq("owner_key", toKey),
    admin.from("user_owned_tactics").select("*").eq("owner_key", fromKey),
    admin.from("user_owned_tactics").select("*").eq("owner_key", toKey),
  ]);
  if ((fromGenerals ?? []).length) {
    const current = new Map((toGenerals ?? []).map((row: any) => [row.qookka_id, row]));
    const merged = (fromGenerals ?? []).map((row: any) => {
      const existing = current.get(row.qookka_id);
      return {
        owner_key: toKey,
        qookka_id: row.qookka_id,
        name: row.name,
        inherent_tactic_name: row.inherent_tactic_name ?? "",
        dupe_count: Math.max(Number(existing?.dupe_count ?? 0), Number(row.dupe_count ?? 0)),
        qookka_level: row.qookka_level ?? existing?.qookka_level ?? null,
        is_owned: Boolean(row.is_owned || existing?.is_owned),
        last_seen_at: row.last_seen_at,
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await admin.from("user_owned_generals").upsert(merged, { onConflict: "owner_key,qookka_id" });
    if (error) throw error;
    await admin.from("user_owned_generals").delete().eq("owner_key", fromKey);
  }
  if ((fromTactics ?? []).length) {
    const current = new Map((toTactics ?? []).map((row: any) => [row.qookka_id, row]));
    const merged = (fromTactics ?? []).map((row: any) => {
      const existing = current.get(row.qookka_id);
      return {
        owner_key: toKey,
        qookka_id: row.qookka_id,
        name: row.name,
        is_owned: Boolean(row.is_owned || existing?.is_owned),
        last_seen_at: row.last_seen_at,
        updated_at: new Date().toISOString(),
      };
    });
    const { error } = await admin.from("user_owned_tactics").upsert(merged, { onConflict: "owner_key,qookka_id" });
    if (error) throw error;
    await admin.from("user_owned_tactics").delete().eq("owner_key", fromKey);
  }
  await Promise.all([
    admin.from("user_inventory_imports").update({ owner_key: toKey }).eq("owner_key", fromKey),
    admin.from("user_formations").update({ owner_key: toKey }).eq("owner_key", fromKey),
  ]);
}

function diffNames(previous: any[], incoming: any[]): { added: string[]; removed: string[] } {
  const before = new Map(previous.map((row: any) => [String(row.qookka_id), String(row.name)]));
  const after = new Map(incoming.map((row: any) => [String(row.qookkaId), String(row.name)]));
  return {
    added: [...after.entries()].filter(([id]) => !before.has(id)).map(([, name]) => name),
    removed: [...before.entries()].filter(([id]) => !after.has(id)).map(([, name]) => name),
  };
}

async function syncUserInventory(ownerKey: string, snapshotId: string): Promise<any> {
  const snapshot = await loadQookkaSnapshot(snapshotId);
  const now = new Date().toISOString();
  const [{ data: previousGenerals, error: generalReadError }, { data: previousTactics, error: tacticReadError }] = await Promise.all([
    admin.from("user_owned_generals").select("qookka_id,name,dupe_count,is_owned").eq("owner_key", ownerKey).eq("is_owned", true),
    admin.from("user_owned_tactics").select("qookka_id,name,is_owned").eq("owner_key", ownerKey).eq("is_owned", true),
  ]);
  if (generalReadError) throw generalReadError;
  if (tacticReadError) throw tacticReadError;
  const generalDiff = diffNames(previousGenerals ?? [], snapshot.generals);
  const tacticDiff = diffNames(previousTactics ?? [], snapshot.tactics);

  const incomingGeneralIds = new Set(snapshot.generals.map((row: any) => row.qookkaId));
  const incomingTacticIds = new Set(snapshot.tactics.map((row: any) => row.qookkaId));
  const removedGeneralIds = (previousGenerals ?? []).map((row: any) => String(row.qookka_id)).filter((id: string) => !incomingGeneralIds.has(id));
  const removedTacticIds = (previousTactics ?? []).map((row: any) => String(row.qookka_id)).filter((id: string) => !incomingTacticIds.has(id));

  if (removedGeneralIds.length) {
    const { error } = await admin.from("user_owned_generals").update({ is_owned: false, updated_at: now }).eq("owner_key", ownerKey).in("qookka_id", removedGeneralIds);
    if (error) throw error;
  }
  if (removedTacticIds.length) {
    const { error } = await admin.from("user_owned_tactics").update({ is_owned: false, updated_at: now }).eq("owner_key", ownerKey).in("qookka_id", removedTacticIds);
    if (error) throw error;
  }

  if (snapshot.generals.length) {
    const rows = snapshot.generals.map((row: any) => ({
      owner_key: ownerKey,
      qookka_id: row.qookkaId,
      name: row.name,
      inherent_tactic_name: row.inherentTacticName ?? "",
      qookka_level: row.level,
      is_owned: true,
      last_seen_at: now,
      updated_at: now,
    }));
    const { error } = await admin.from("user_owned_generals").upsert(rows, { onConflict: "owner_key,qookka_id" });
    if (error) throw error;
  }
  if (snapshot.tactics.length) {
    const rows = snapshot.tactics.map((row: any) => ({
      owner_key: ownerKey,
      qookka_id: row.qookkaId,
      name: row.name,
      is_owned: true,
      last_seen_at: now,
      updated_at: now,
    }));
    const { error } = await admin.from("user_owned_tactics").upsert(rows, { onConflict: "owner_key,qookka_id" });
    if (error) throw error;
  }

  const importRow = {
    owner_key: ownerKey,
    snapshot_id: snapshotId,
    general_count: snapshot.generals.length,
    tactic_count: snapshot.tactics.length,
    added_generals: generalDiff.added,
    removed_generals: generalDiff.removed,
    added_tactics: tacticDiff.added,
    removed_tactics: tacticDiff.removed,
    imported_at: now,
  };
  const { error: importError } = await admin.from("user_inventory_imports").insert(importRow);
  if (importError) throw importError;
  return {
    snapshotId,
    cfgVersion: snapshot.cfgVersion,
    generalCount: snapshot.generals.length,
    tacticCount: snapshot.tactics.length,
    addedGenerals: generalDiff.added,
    removedGenerals: generalDiff.removed,
    addedTactics: tacticDiff.added,
    removedTactics: tacticDiff.removed,
    importedAt: now,
  };
}

async function readUserInventory(ownerKey: string): Promise<any> {
  const [{ data: generals, error: generalError }, { data: tactics, error: tacticError }, { data: lastImport, error: importError }] = await Promise.all([
    admin.from("user_owned_generals").select("qookka_id,name,inherent_tactic_name,dupe_count,qookka_level,is_owned,last_seen_at").eq("owner_key", ownerKey).eq("is_owned", true).order("name"),
    admin.from("user_owned_tactics").select("qookka_id,name,is_owned,last_seen_at").eq("owner_key", ownerKey).eq("is_owned", true).order("name"),
    admin.from("user_inventory_imports").select("snapshot_id,general_count,tactic_count,imported_at").eq("owner_key", ownerKey).order("imported_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (generalError) throw generalError;
  if (tacticError) throw tacticError;
  if (importError) throw importError;
  return {
    generals: (generals ?? []).map((row: any) => ({
      qookkaId: row.qookka_id,
      name: row.name,
      inherentTacticName: row.inherent_tactic_name ?? "",
      dupeCount: Number(row.dupe_count ?? 0),
      level: row.qookka_level,
    })),
    tactics: (tactics ?? []).map((row: any) => ({ qookkaId: row.qookka_id, name: row.name })),
    lastImport: lastImport
      ? { snapshotId: lastImport.snapshot_id, generalCount: lastImport.general_count, tacticCount: lastImport.tactic_count, importedAt: lastImport.imported_at }
      : null,
  };
}

function cleanTroopType(value: unknown): string {
  const raw = cleanString(value, 30);
  return ["infantry", "siege", "cavalry", "bow", "gun"].includes(raw) ? raw : "";
}

function normalizeFormationMembers(value: unknown): any[] {
  const list = Array.isArray(value) ? value : [];
  const slots = [1, 2, 3];
  return slots.map((slot) => {
    const row = list.find((item: any) => Number(item?.slot) === slot) ?? {};
    return {
      slot,
      generalQookkaId: cleanString(row.generalQookkaId, 80),
      generalName: cleanString(row.generalName, 80),
      tactic1QookkaId: cleanString(row.tactic1QookkaId, 80),
      tactic1Name: cleanString(row.tactic1Name, 100),
      tactic2QookkaId: cleanString(row.tactic2QookkaId, 80),
      tactic2Name: cleanString(row.tactic2Name, 100),
    };
  });
}

async function hydrateFormation(row: any): Promise<any> {
  const members = [...(row?.user_formation_members ?? [])].sort((a: any, b: any) => Number(a.slot) - Number(b.slot));
  const { data: inventory } = await admin
    .from("user_owned_generals")
    .select("qookka_id,dupe_count,inherent_tactic_name,is_owned")
    .eq("owner_key", row.owner_key);
  const inventoryMap = new Map((inventory ?? []).map((item: any) => [String(item.qookka_id), item]));
  return {
    id: row.id,
    name: row.name,
    troopType: row.troop_type ?? "",
    troopLevel: row.troop_level,
    note: row.note ?? "",
    isShared: Boolean(row.is_shared),
    shareToken: row.is_shared ? row.share_token : null,
    updatedAt: row.updated_at,
    members: members.map((item: any) => {
      const current = inventoryMap.get(String(item.general_qookka_id));
      return {
        slot: Number(item.slot),
        generalQookkaId: item.general_qookka_id,
        generalName: item.general_name,
        dupeCount: Number(current?.dupe_count ?? 0),
        inherentTacticName: current?.inherent_tactic_name ?? "",
        currentlyOwned: current ? Boolean(current.is_owned) : false,
        tactic1QookkaId: item.tactic_1_qookka_id,
        tactic1Name: item.tactic_1_name,
        tactic2QookkaId: item.tactic_2_qookka_id,
        tactic2Name: item.tactic_2_name,
      };
    }),
  };
}

async function listUserFormations(ownerKey: string): Promise<any[]> {
  const { data, error } = await admin
    .from("user_formations")
    .select("*, user_formation_members(*)")
    .eq("owner_key", ownerKey)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return Promise.all((data ?? []).map(hydrateFormation));
}

async function saveUserFormation(ownerKey: string, payload: any): Promise<any> {
  const id = cleanString(payload?.id, 80);
  const name = cleanString(payload?.name, 60) || "名称未設定の編成";
  const note = cleanString(payload?.note, 500);
  const troopType = cleanTroopType(payload?.troopType);
  const troopLevelRaw = Number(payload?.troopLevel);
  const troopLevel = Number.isInteger(troopLevelRaw) && troopLevelRaw >= 1 && troopLevelRaw <= 10 ? troopLevelRaw : null;
  const members = normalizeFormationMembers(payload?.members);
  if (!members.some((row) => row.generalQookkaId && row.generalName)) {
    throw new Error("FORMATION_GENERAL_REQUIRED");
  }

  const generalIds = [...new Set(members.map((row) => row.generalQookkaId).filter(Boolean))];
  if (generalIds.length !== members.filter((row) => row.generalQookkaId).length) {
    throw new Error("FORMATION_DUPLICATE_GENERAL");
  }
  const generalNameMap = new Map<string, string>();
  if (generalIds.length) {
    const { data: owned } = await admin.from("user_owned_generals").select("qookka_id,name").eq("owner_key", ownerKey).eq("is_owned", true).in("qookka_id", generalIds);
    if ((owned ?? []).length !== generalIds.length) throw new Error("FORMATION_GENERAL_NOT_OWNED");
    for (const row of owned ?? []) generalNameMap.set(String(row.qookka_id), String(row.name));
  }
  const rawTacticIds = members.flatMap((row) => [row.tactic1QookkaId, row.tactic2QookkaId]).filter(Boolean);
  const tacticIds = [...new Set(rawTacticIds)];
  if (tacticIds.length !== rawTacticIds.length) throw new Error("FORMATION_DUPLICATE_TACTIC");
  const tacticNameMap = new Map<string, string>();
  if (tacticIds.length) {
    const { data: owned } = await admin.from("user_owned_tactics").select("qookka_id,name").eq("owner_key", ownerKey).eq("is_owned", true).in("qookka_id", tacticIds);
    if ((owned ?? []).length !== tacticIds.length) throw new Error("FORMATION_TACTIC_NOT_OWNED");
    for (const row of owned ?? []) tacticNameMap.set(String(row.qookka_id), String(row.name));
  }
  for (const row of members) {
    if (row.generalQookkaId) row.generalName = generalNameMap.get(row.generalQookkaId) ?? row.generalName;
    if (row.tactic1QookkaId) row.tactic1Name = tacticNameMap.get(row.tactic1QookkaId) ?? row.tactic1Name;
    if (row.tactic2QookkaId) row.tactic2Name = tacticNameMap.get(row.tactic2QookkaId) ?? row.tactic2Name;
  }

  const now = new Date().toISOString();
  let formationId = id;
  if (formationId) {
    const { data: existing } = await admin.from("user_formations").select("id").eq("id", formationId).eq("owner_key", ownerKey).maybeSingle();
    if (!existing) throw new Error("FORMATION_NOT_FOUND");
    const { error } = await admin.from("user_formations").update({ name, note, troop_type: troopType, troop_level: troopLevel, updated_at: now }).eq("id", formationId).eq("owner_key", ownerKey);
    if (error) throw error;
  } else {
    const { data: created, error } = await admin.from("user_formations").insert({ owner_key: ownerKey, name, note, troop_type: troopType, troop_level: troopLevel, updated_at: now }).select("id").single();
    if (error) throw error;
    formationId = created.id;
  }
  const { error: deleteError } = await admin.from("user_formation_members").delete().eq("formation_id", formationId);
  if (deleteError) throw deleteError;
  const rows = members
    .filter((row) => row.generalQookkaId && row.generalName)
    .map((row) => ({
      formation_id: formationId,
      slot: row.slot,
      general_qookka_id: row.generalQookkaId,
      general_name: row.generalName,
      tactic_1_qookka_id: row.tactic1QookkaId,
      tactic_1_name: row.tactic1Name,
      tactic_2_qookka_id: row.tactic2QookkaId,
      tactic_2_name: row.tactic2Name,
      updated_at: now,
    }));
  if (rows.length) {
    const { error } = await admin.from("user_formation_members").insert(rows);
    if (error) throw error;
  }
  const { data: formation, error } = await admin.from("user_formations").select("*, user_formation_members(*)").eq("id", formationId).single();
  if (error) throw error;
  return hydrateFormation(formation);
}

function randomShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function setFormationShared(ownerKey: string, id: string, shared: boolean): Promise<any> {
  const { data: existing, error: readError } = await admin.from("user_formations").select("id").eq("id", id).eq("owner_key", ownerKey).maybeSingle();
  if (readError) throw readError;
  if (!existing) throw new Error("FORMATION_NOT_FOUND");
  const patch = shared
    ? { is_shared: true, share_token: randomShareToken(), shared_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    : { is_shared: false, share_token: null, shared_at: null, updated_at: new Date().toISOString() };
  const { data, error } = await admin.from("user_formations").update(patch).eq("id", id).eq("owner_key", ownerKey).select("*, user_formation_members(*)").single();
  if (error) throw error;
  return hydrateFormation(data);
}

async function getSharedFormation(token: string): Promise<any | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null;
  const { data, error } = await admin
    .from("user_formations")
    .select("*, user_formation_members(*)")
    .eq("share_token", token)
    .eq("is_shared", true)
    .maybeSingle();
  if (error) throw error;
  return data ? await hydrateFormation(data) : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  if (req.method !== "POST") {
    return fail(req, 405, "METHOD_NOT_ALLOWED", "POSTのみ利用できます。");
  }

  if (!isOriginAllowed(req)) {
    return fail(req, 403, "ORIGIN_FORBIDDEN", "許可されていないサイトからの要求です。");
  }

  let body: JsonObject;
  try {
    body = await req.json();
  } catch {
    return fail(req, 400, "INVALID_JSON", "送信内容を読み取れませんでした。");
  }

  const action = cleanString(body.action, 80);

  try {
    if (action === "status") {
      const user = await getAuthUser(req);
      if (!user) {
        return ok(req, { authenticated: false, registered: false, needsBootstrap: false });
      }

      const { count: adminCount, error: adminCountError } = await admin
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("active", true);
      if (adminCountError) throw adminCountError;

      const needsBootstrap = (adminCount ?? 0) === 0;
      const member = needsBootstrap ? await getMemberByUserId(user.id) : await ensurePublicMemberForUser(user.id);

      return ok(req, {
        authenticated: true,
        registered: Boolean(member?.active),
        needsBootstrap,
        version: FUNCTION_VERSION,
        originRestricted: !configuredOrigins.includes("*"),
        visionConfigured: Boolean(Deno.env.get("GOOGLE_VISION_API_KEY")),
        discordOAuthConfigured: Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET),
        discordBotConfigured: Boolean(DISCORD_BOT_TOKEN),
        member: member
          ? {
              id: member.id,
              displayName: member.display_name,
              role: member.role,
              active: member.active,
            }
          : null,
      });
    }

    if (action === "bootstrap") {
      const user = await getAuthUser(req);
      if (!user) {
        return fail(req, 401, "AUTH_REQUIRED", "匿名認証の開始に失敗しました。");
      }

      const { count } = await admin
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("active", true);
      if ((count ?? 0) > 0) {
        return fail(req, 409, "ALREADY_BOOTSTRAPPED", "初期管理者は登録済みです。");
      }

      // Supabase Secretsの値に誤って前後空白や改行が入っても、
      // 利用者が画面へ入力した値と同じ扱いになるよう双方を正規化する。
      const expectedSecret = cleanString(Deno.env.get("BOOTSTRAP_SECRET"), 200);
      const submittedSecret = cleanString(body.secret, 200);
      if (!expectedSecret) {
        return fail(
          req,
          503,
          "BOOTSTRAP_SECRET_NOT_CONFIGURED",
          "SupabaseのEdge Function SecretsにBOOTSTRAP_SECRETが設定されていません。",
        );
      }
      if (submittedSecret !== expectedSecret) {
        return fail(req, 403, "INVALID_BOOTSTRAP_SECRET", "初期設定用の秘密文字列が違います。");
      }

      const displayName = cleanString(body.displayName, 40);
      if (!displayName) {
        return fail(req, 400, "INVALID_DISPLAY_NAME", "管理者名を入力してください。");
      }

      const { data: member, error: bootstrapError } = await admin.rpc(
        "bootstrap_admin",
        { p_user_id: user.id, p_display_name: displayName },
      );
      if (bootstrapError) {
        if (String(bootstrapError.message ?? "").includes("ALREADY_BOOTSTRAPPED")) {
          return fail(req, 409, "ALREADY_BOOTSTRAPPED", "初期管理者は登録済みです。");
        }
        throw bootstrapError;
      }

      return ok(req, { member });
    }

    if (action === "redeem_code") {
      const user = await getAuthUser(req);
      if (!user) {
        return fail(req, 401, "AUTH_REQUIRED", "匿名認証の開始に失敗しました。");
      }
      const normalizedCode = normalizeAccessCode(body.code);
      if (normalizedCode.length < 12) {
        return fail(req, 400, "INVALID_INVITE", "アクセスコードの形式が違います。");
      }
      const codeHash = await sha256Hex(normalizedCode);
      const { data, error } = await admin.rpc("redeem_invite_code", {
        p_user_id: user.id,
        p_code_hash: codeHash,
      });
      if (error) {
        const message = String(error.message ?? "");
        const code =
          [
            "INVALID_INVITE",
            "INVITE_INACTIVE",
            "INVITE_EXPIRED",
            "INVITE_USED",
            "MEMBER_INACTIVE",
          ].find((candidate) => message.includes(candidate)) ?? "INVITE_FAILED";
        return fail(req, 403, code, "アクセスコードが無効、使用済み、または停止されています。");
      }
      return ok(req, { member: data });
    }

    const authResult = await requireMember(req);
    if (authResult instanceof Response) return authResult;
    const { member, user } = authResult;

    if (action === "me") {
      return ok(req, {
        member: {
          id: member.id,
          displayName: member.display_name,
          role: member.role,
          active: member.active,
        },
      });
    }

    if (action === "usage") {
      return ok(req, { usage: await readUsage(member.id) });
    }

    if (action === "intel_dashboard") {
      return ok(req, { intel: await buildIntelDashboard(user.id) });
    }


    if (action === "my_inventory") {
      const ownerKey = await privateOwnerKey(user.id);
      return ok(req, { inventory: await readUserInventory(ownerKey) });
    }

    if (action === "my_inventory_sync") {
      const snapshotId = parseQookkaSnapshotId(body.url ?? body.snapshotId);
      if (!snapshotId) return fail(req, 400, "INVALID_QOOKKA_URL", "Qookka共有URLまたはsnapshot_idを確認してください。");
      const ownerKey = await privateOwnerKey(user.id);
      try {
        const result = await syncUserInventory(ownerKey, snapshotId);
        return ok(req, { result, inventory: await readUserInventory(ownerKey) });
      } catch (error) {
        const message = String((error as Error)?.message ?? "");
        if (message.includes("QOOKKA_SNAPSHOT_EMPTY") || message.includes("HTTP_404")) {
          return fail(req, 422, "QOOKKA_SNAPSHOT_UNAVAILABLE", "共有URLの有効期限が切れているか、所持情報を取得できませんでした。");
        }
        throw error;
      }
    }

    if (action === "my_general_dupe") {
      const ownerKey = await privateOwnerKey(user.id);
      const qookkaId = cleanString(body.qookkaId, 80);
      const dupeCount = Number(body.dupeCount);
      if (!qookkaId || !Number.isInteger(dupeCount) || dupeCount < 0 || dupeCount > 5) {
        return fail(req, 400, "INVALID_DUPE", "凸は0〜5で指定してください。");
      }
      const { data, error } = await admin
        .from("user_owned_generals")
        .update({ dupe_count: dupeCount, updated_at: new Date().toISOString() })
        .eq("owner_key", ownerKey)
        .eq("qookka_id", qookkaId)
        .eq("is_owned", true)
        .select("qookka_id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return fail(req, 404, "GENERAL_NOT_FOUND", "所持武将が見つかりません。");
      return ok(req, { dupeCount });
    }

    if (action === "my_formations") {
      const ownerKey = await privateOwnerKey(user.id);
      return ok(req, { formations: await listUserFormations(ownerKey) });
    }

    if (action === "my_formation_save") {
      const ownerKey = await privateOwnerKey(user.id);
      try {
        return ok(req, { formation: await saveUserFormation(ownerKey, body.formation ?? {}) });
      } catch (error) {
        const code = String((error as Error)?.message ?? "");
        const messages: Record<string, string> = {
          FORMATION_GENERAL_REQUIRED: "武将を1人以上選択してください。",
          FORMATION_DUPLICATE_GENERAL: "同じ武将を同一編成へ重複登録できません。",
          FORMATION_DUPLICATE_TACTIC: "同じ戦法を同一編成へ重複配置できません。",
          FORMATION_GENERAL_NOT_OWNED: "現在の所持武将にない武将が含まれています。所持情報を再同期してください。",
          FORMATION_TACTIC_NOT_OWNED: "現在の所持戦法にない戦法が含まれています。所持情報を再同期してください。",
          FORMATION_NOT_FOUND: "編成が見つかりません。",
        };
        if (messages[code]) return fail(req, 400, code, messages[code]);
        throw error;
      }
    }

    if (action === "my_formation_delete") {
      const ownerKey = await privateOwnerKey(user.id);
      const id = cleanString(body.id, 80);
      const { data, error } = await admin.from("user_formations").delete().eq("id", id).eq("owner_key", ownerKey).select("id").maybeSingle();
      if (error) throw error;
      if (!data) return fail(req, 404, "FORMATION_NOT_FOUND", "編成が見つかりません。");
      return ok(req, {});
    }

    if (action === "my_formation_share") {
      const ownerKey = await privateOwnerKey(user.id);
      const id = cleanString(body.id, 80);
      try {
        return ok(req, { formation: await setFormationShared(ownerKey, id, true) });
      } catch (error) {
        if (String((error as Error)?.message ?? "") === "FORMATION_NOT_FOUND") return fail(req, 404, "FORMATION_NOT_FOUND", "編成が見つかりません。");
        throw error;
      }
    }

    if (action === "my_formation_unshare") {
      const ownerKey = await privateOwnerKey(user.id);
      const id = cleanString(body.id, 80);
      try {
        return ok(req, { formation: await setFormationShared(ownerKey, id, false) });
      } catch (error) {
        if (String((error as Error)?.message ?? "") === "FORMATION_NOT_FOUND") return fail(req, 404, "FORMATION_NOT_FOUND", "編成が見つかりません。");
        throw error;
      }
    }

    if (action === "shared_formation") {
      const token = cleanString(body.token, 100);
      const formation = await getSharedFormation(token);
      if (!formation) return fail(req, 404, "SHARED_FORMATION_NOT_FOUND", "共有編成が見つからないか、共有が解除されています。");
      return ok(req, { formation });
    }

    if (action === "discord_oauth_start") {
      if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
        return fail(req, 503, "DISCORD_OAUTH_NOT_CONFIGURED", "Discord連携がまだ設定されていません。");
      }
      const returnUrl = safeReturnUrl(body.returnUrl);
      if (!returnUrl) {
        return fail(req, 400, "INVALID_RETURN_URL", "Discord連携後の戻り先URLが不正です。");
      }
      const stateToken = randomStateToken();
      const stateHash = await sha256Hex(stateToken);
      const now = Date.now();
      await admin.from("discord_oauth_states").delete().lt("expires_at", new Date(now).toISOString());
      const { error: stateInsertError } = await admin.from("discord_oauth_states").insert({
        state_hash: stateHash,
        auth_user_id: user.id,
        return_url: returnUrl,
        expires_at: new Date(now + 10 * 60 * 1000).toISOString(),
      });
      if (stateInsertError) throw stateInsertError;
      const query = new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        response_type: "code",
        redirect_uri: DISCORD_REDIRECT_URI,
        scope: "identify",
        state: stateToken,
      });
      return ok(req, { authorizeUrl: `https://discord.com/oauth2/authorize?${query.toString()}` });
    }

    if (action === "discord_disconnect") {
      const { error } = await admin
        .from("intel_contributor_devices")
        .delete()
        .eq("auth_user_id", user.id);
      if (error) throw error;
      return ok(req, {});
    }

    if (action === "list_enemies") {
      const search = cleanString(body.search, 80);
      const settings = await readSettings();
      return ok(req, {
        enemies: await listEnemies(search, settings.current_season),
        currentSeason: settings.current_season,
      });
    }

    if (action === "get_enemy") {
      const enemyId = cleanString(body.enemyId, 80);
      const enemy = await getEnemyDetail(enemyId);
      if (!enemy) return fail(req, 404, "ENEMY_NOT_FOUND", "敵データが見つかりません。");
      const settings = await readSettings();
      return ok(req, { enemy, currentSeason: settings.current_season });
    }

    if (action === "suggestions") {
      return ok(req, { suggestions: await getSuggestions() });
    }

    if (action === "analyze_report") {
      if (!["editor", "admin"].includes(member.role)) {
        return fail(req, 403, "ROLE_FORBIDDEN", "OCR登録権限がありません。");
      }

      const rawImageBase64 = typeof body.imageBase64 === "string"
        ? body.imageBase64.trim()
        : "";
      if (rawImageBase64.length > 7_200_000) {
        return fail(req, 413, "IMAGE_TOO_LARGE", "画像データが大きすぎます。画面側で圧縮してから再送してください。");
      }
      const imageBase64 = rawImageBase64;
      const imageHash = cleanString(body.imageHash, 64).toLowerCase();
      const mimeType = cleanString(body.mimeType, 60).toLowerCase();
      const width = Number(body.width ?? 0);
      const height = Number(body.height ?? 0);
      const enemySide = body.enemySide === "left" ? "left" : "right";
      const captureType = ["phone", "game", "unknown"].includes(body.captureType)
        ? body.captureType
        : "unknown";
      const requestedOcrProfile = cleanString(body.ocrProfile, 80);
      const ocrProfile = requestedOcrProfile === "full-screen" || isFieldSheetProfile(requestedOcrProfile)
        ? requestedOcrProfile
        : "full-screen";
      const sourceOrientation = body.sourceOrientation === "landscape"
        ? "landscape"
        : body.sourceOrientation === "portrait"
          ? "portrait"
          : "unknown";
      const redLevelsHint = Array.isArray(body.redLevels) ? body.redLevels : [];
      const redLevelConfidenceHint = Array.isArray(body.redLevelConfidence)
        ? body.redLevelConfidence
        : [];
      const observedAtHint = body.observedAtHint;
      const observedAtSourceHint = body.observedAtSource;

      if (!/^[a-f0-9]{64}$/.test(imageHash)) {
        return fail(req, 400, "INVALID_IMAGE_HASH", "画像識別値が不正です。");
      }
      if (
        !imageBase64 ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 100 ||
        height < 100 ||
        width > 12_000 ||
        height > 12_000
      ) {
        return fail(req, 400, "INVALID_IMAGE", "画像データを読み取れませんでした。");
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
        return fail(req, 400, "UNSUPPORTED_IMAGE", "JPEG、PNG、WebPのみ利用できます。");
      }

      if (!Deno.env.get("GOOGLE_VISION_API_KEY")) {
        return fail(
          req,
          503,
          "VISION_NOT_CONFIGURED",
          "Google Vision APIキーが未設定です。管理者がSupabase Secretsを確認してください。",
        );
      }

      const estimatedBytes = Math.floor((imageBase64.length * 3) / 4);
      const settings = await readSettings();
      if (estimatedBytes > Math.min(settings.max_image_bytes, HARD_IMAGE_BYTES)) {
        return fail(
          req,
          413,
          "IMAGE_TOO_LARGE",
          "画像が大きすぎます。画面側で圧縮してから再送してください。",
          { maxBytes: Math.min(settings.max_image_bytes, HARD_IMAGE_BYTES) },
        );
      }

      const { data: reservation, error: reservationError } = await admin.rpc(
        "reserve_ocr_quota",
        { p_member_id: member.id, p_image_hash: imageHash },
      );
      if (reservationError) throw reservationError;
      if (!reservation?.allowed) {
        const messages: Record<string, string> = {
          GLOBAL_DAILY_LIMIT: "本日の一門全体OCR上限に達しました。手入力は利用できます。",
          GLOBAL_MONTHLY_LIMIT: "今月のOCR上限に達したため、自動解析を停止しました。",
          OCR_COOLDOWN: "連続送信を防止しています。数秒待って再試行してください。",
          OCR_IN_PROGRESS: "同じ画像を解析中です。少し待ってから再試行してください。",
          ROLE_FORBIDDEN: "OCR登録権限がありません。",
          MEMBER_INACTIVE: "メンバーが停止されています。",
        };
        const code = reservation?.code ?? "OCR_LIMIT";
        return fail(req, 429, code, messages[code] ?? "OCRを実行できませんでした。", reservation);
      }

      const requestId = reservation.requestId;
      if (reservation.cached) {
        const { data: cache, error: cacheError } = await admin
          .from("ocr_cache")
          .select("image_hash, source_layout, image_width, image_height, raw_text, vision_tokens, draft, parse_version")
          .eq("image_hash", imageHash)
          .single();
        if (cacheError) throw cacheError;

        const cachedTokens = Array.isArray(cache.vision_tokens)
          ? (cache.vision_tokens as OcrToken[])
          : [];
        const cachedWidth = Number(cache.image_width ?? width);
        const cachedHeight = Number(cache.image_height ?? height);
        let reparsedDraft = cache.draft;
        if (cachedTokens.length) {
          if (isFieldSheetProfile(ocrProfile)) {
            let suggestions: { generals: string[]; tactics: string[]; groups: string[] } = {
              generals: [],
              tactics: [],
              groups: [],
            };
            try {
              suggestions = (await getSuggestions()) as { generals: string[]; tactics: string[]; groups: string[] };
            } catch (error) {
              console.warn("OCR dictionary lookup failed", (error as Error).message);
            }
            reparsedDraft = parseFieldSheet(
              cache.raw_text ?? "",
              cachedTokens,
              cachedHeight,
              enemySide,
              captureType,
              ocrProfile,
              sourceOrientation,
              suggestions,
            );
          } else {
            reparsedDraft = parseDraft(
              cache.raw_text ?? "",
              cachedTokens,
              cachedWidth,
              cachedHeight,
              enemySide,
              captureType,
            );
          }
        }

        reparsedDraft = applyAnalysisHints(
          reparsedDraft,
          redLevelsHint,
          redLevelConfidenceHint,
          observedAtHint,
          observedAtSourceHint,
        );
        return ok(req, {
          cached: true,
          imageHash,
          rawText: cache.raw_text,
          draft: reparsedDraft,
          usage: await readUsage(member.id),
        });
      }

      try {
        const result = await callGoogleVision(
          imageBase64,
          width,
          height,
          enemySide,
          captureType,
          ocrProfile,
          sourceOrientation,
        );

        const analyzedDraft = applyAnalysisHints(
          result.draft,
          redLevelsHint,
          redLevelConfidenceHint,
          observedAtHint,
          observedAtSourceHint,
        );
        const sourceLayout = analyzedDraft.sourceLayout ?? "unknown";
        const compactTokens = result.tokens.slice(0, 1200).map((token) => ({
          text: token.text,
          x: Number(token.x.toFixed(5)),
          y: Number(token.y.toFixed(5)),
          w: Number(token.w.toFixed(5)),
          h: Number(token.h.toFixed(5)),
          cx: Number(token.cx.toFixed(5)),
          cy: Number(token.cy.toFixed(5)),
          confidence: Number(boundedConfidence(token.confidence).toFixed(4)),
        }));

        const { error: cacheError } = await admin.from("ocr_cache").upsert({
          image_hash: imageHash,
          source_layout: sourceLayout,
          image_width: width,
          image_height: height,
          raw_text: result.rawText.slice(0, 100_000),
          vision_tokens: compactTokens,
          draft: analyzedDraft,
          parse_version: PARSE_VERSION,
          created_by: member.id,
          last_used_at: new Date().toISOString(),
        });
        if (cacheError) throw cacheError;

        await admin
          .from("ocr_requests")
          .update({ status: "success", completed_at: new Date().toISOString() })
          .eq("id", requestId);

        await cleanupOldOcrCache();

        return ok(req, {
          cached: false,
          imageHash,
          rawText: result.rawText,
          draft: analyzedDraft,
          usage: await readUsage(member.id),
        });
      } catch (error) {
        await admin
          .from("ocr_requests")
          .update({
            status: "failed",
            error_code: cleanString((error as Error).message, 300),
            completed_at: new Date().toISOString(),
          })
          .eq("id", requestId);
        return fail(
          req,
          502,
          "OCR_FAILED",
          "OCR解析に失敗しました。画像を確認するか、手入力を利用してください。",
          { reason: cleanString((error as Error).message, 300) },
        );
      }
    }

    if (action === "save_observation") {
      if (!["editor", "admin"].includes(member.role)) {
        return fail(req, 403, "ROLE_FORBIDDEN", "敵部隊を登録する権限がありません。");
      }
      const settings = await readSettings();
      let payload: JsonObject;
      try {
        payload = sanitizeObservationPayload(body.payload ?? {}, settings.current_season);
      } catch (error) {
        if ((error as Error).message === "INVALID_IMAGE_HASH") {
          return fail(req, 400, "INVALID_IMAGE_HASH", "画像識別値が不正です。");
        }
        throw error;
      }
      if (!payload.enemy.name) {
        return fail(req, 400, "ENEMY_NAME_REQUIRED", "敵プレイヤー名を入力してください。");
      }
      const { data, error } = await admin.rpc("save_enemy_observation", {
        p_member_id: member.id,
        p_payload: payload,
      });
      if (error) {
        return fail(req, 400, "SAVE_FAILED", "敵部隊を保存できませんでした。", {
          reason: cleanString(error.message, 300),
        });
      }

      const rpcResult = unwrapRpcResult(data);
      const saved = await savedObservationByHash(payload.imageHash);
      const enemyId = cleanString(
        rpcResult.enemyId ?? rpcResult.enemy_id ?? saved?.enemy_player_id,
        80,
      );
      const observationId = cleanString(
        rpcResult.observationId ?? rpcResult.observation_id ?? saved?.id,
        80,
      );
      const duplicate = Boolean(rpcResult.duplicate);
      if (!enemyId) {
        return fail(req, 500, "SAVE_RESULT_INVALID", "登録結果から敵プレイヤーを特定できませんでした。");
      }

      let intel: JsonObject = {
        linked: Boolean(await getContributorForUserId(user.id)),
        duplicate,
        awardedPoints: 0,
        eligiblePoints: 0,
        breakdown: [],
      };

      if (!duplicate && observationId) {
        const contributor = await getContributorForUserId(user.id);
        if (contributor) {
          const { error: contributorUpdateError } = await admin
            .from("enemy_observations")
            .update({ contributor_id: contributor.id })
            .eq("id", observationId);
          if (contributorUpdateError) throw contributorUpdateError;
        }
        intel = await evaluateIntelForSavedObservation(
          user.id,
          payload,
          observationId,
          enemyId,
        );
      } else if (duplicate) {
        intel = {
          ...intel,
          message: "同じ画像は登録済みのため、ポイント・確認回数とも加算しません。",
        };
      }

      return ok(req, {
        result: {
          ...rpcResult,
          enemyId,
          observationId,
          duplicate,
          intel,
        },
      });
    }

    if (action === "update_observation") {
      if (!['editor', 'admin'].includes(member.role)) {
        return fail(req, 403, "ROLE_FORBIDDEN", "観測記録を編集する権限がありません。");
      }
      const observationId = cleanString(body.observationId, 80);
      if (!observationId) {
        return fail(req, 400, "OBSERVATION_ID_REQUIRED", "編集対象の観測記録が指定されていません。");
      }

      const { data: existing, error: existingError } = await admin
        .from("enemy_observations")
        .select("id, enemy_player_id, season_name, completeness, source_image_hash, ocr_cache_hash, source_layout, capture_type, enemy_side, report_summary, created_by, observation_generals(slot, role_label, general_name, general_level, red_level, inherent_tactic, tactic_1, tactic_2)")
        .eq("id", observationId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) {
        return fail(req, 404, "OBSERVATION_NOT_FOUND", "編集する観測記録が見つかりません。");
      }

      const rawPayload = body.payload && typeof body.payload === "object" ? body.payload : {};
      let payload: JsonObject;
      try {
        payload = sanitizeObservationPayload(
          {
            ...rawPayload,
            imageHash: existing.source_image_hash,
            ocrCacheHash: existing.ocr_cache_hash ?? "",
            sourceLayout: existing.source_layout ?? "unknown",
            captureType: existing.capture_type ?? "unknown",
            enemySide: existing.enemy_side ?? "right",
            summary: {
              ...(existing.report_summary && typeof existing.report_summary === "object"
                ? existing.report_summary
                : {}),
              ...(rawPayload.summary && typeof rawPayload.summary === "object"
                ? rawPayload.summary
                : {}),
            },
          },
          existing.season_name || "未設定",
        );
      } catch (error) {
        if ((error as Error).message === "INVALID_IMAGE_HASH") {
          return fail(req, 400, "INVALID_IMAGE_HASH", "元の画像識別値が不正です。");
        }
        throw error;
      }
      if (!payload.enemy.name) {
        return fail(req, 400, "ENEMY_NAME_REQUIRED", "敵プレイヤー名を入力してください。");
      }

      const { data, error } = await admin.rpc("update_enemy_observation", {
        p_member_id: member.id,
        p_observation_id: observationId,
        p_payload: payload,
      });
      if (error) {
        const message = String(error.message ?? "");
        if (message.includes("EDIT_FORBIDDEN")) {
          return fail(req, 403, "EDIT_FORBIDDEN", "この記録を編集できません。");
        }
        if (message.includes("OBSERVATION_NOT_FOUND")) {
          return fail(req, 404, "OBSERVATION_NOT_FOUND", "編集する観測記録が見つかりません。");
        }
        return fail(req, 400, "UPDATE_FAILED", "観測記録を更新できませんでした。", {
          reason: cleanString(error.message, 300),
        });
      }

      // 発見フィードの「情報を完成」は新規登録ではなく、
      // 不足していた既存記録を編集で完成させた時だけ出す。
      const editedTeam = payloadTeamIdentity(payload);
      const wasComplete = existing.completeness === "complete" || observationIntelComplete(existing);
      if (editedTeam && payloadIntelComplete(payload) && !wasComplete && existing.enemy_player_id) {
        const allRows = await observationsForEnemySeason(existing.enemy_player_id, existing.season_name || "未設定");
        const anotherComplete = allRows.some((row: any) =>
          row.id !== observationId &&
          observationTeamKey(row) === editedTeam.key &&
          observationIntelComplete(row)
        );
        if (!anotherComplete) {
          const contributor = await getContributorForUserId(user.id);
          const actorLabel = contributor ? contributorLabel(contributor) : "匿名ユーザー";
          const enemyName = await enemyNameById(existing.enemy_player_id);
          await insertFeedEvent({
            season_name: existing.season_name || "未設定",
            actor_contributor_id: contributor?.id ?? null,
            actor_label: actorLabel,
            enemy_player_id: existing.enemy_player_id,
            observation_id: observationId,
            team_key: editedTeam.key,
            event_type: "team_complete_edit",
            event_key: `feed:${existing.season_name || "未設定"}:team:${existing.enemy_player_id}:${editedTeam.key}:complete-edit:${observationId}`,
            message: `${actorLabel}は${enemyName}の${editedTeam.leader}部隊の情報を完成させました。`,
            metadata: { teamDisplay: editedTeam.display },
          });
        }
      }

      return ok(req, { result: data });
    }

    if (action === "master_list") {
      try {
        return ok(req, { masters: await getMasterList(member.role === "admin") });
      } catch (error) {
        if (String((error as Error).message).includes("MASTER_TABLE_NOT_READY")) {
          return fail(
            req,
            503,
            "MASTER_TABLE_NOT_READY",
            "武将・戦法マスタ用の追加SQLが未実行です。v1.6.0のマスタ追加SQLを実行してください。",
          );
        }
        throw error;
      }
    }

    if (action === "admin_master_save") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "マスタを変更できるのは管理者だけです。");
      }
      const masterType = cleanString(body.masterType, 20);
      const table = masterTable(masterType);
      if (!table) return fail(req, 400, "INVALID_MASTER_TYPE", "マスタ種別が不正です。");
      const maxLength = masterType === "general" ? 40 : 50;
      const name = cleanString(body.name, maxLength);
      if (!name) return fail(req, 400, "MASTER_NAME_REQUIRED", "名称を入力してください。");
      const id = cleanString(body.id, 80);
      const active = body.active !== false;

      let saved: any;
      if (id) {
        const { data, error } = await admin
          .from(table)
          .update({ name, active, updated_by: member.id })
          .eq("id", id)
          .select("id, name, active, created_at, updated_at")
          .maybeSingle();
        if (error) {
          if (String(error.code) === "23505") {
            return fail(req, 409, "MASTER_DUPLICATE", "同じ名称がすでにマスタへ登録されています。");
          }
          throw error;
        }
        if (!data) return fail(req, 404, "MASTER_NOT_FOUND", "対象のマスタ項目が見つかりません。");
        saved = data;
      } else {
        const { data, error } = await admin
          .from(table)
          .insert({ name, active, updated_by: member.id })
          .select("id, name, active, created_at, updated_at")
          .single();
        if (error) {
          if (String(error.code) === "23505") {
            return fail(req, 409, "MASTER_DUPLICATE", "同じ名称がすでにマスタへ登録されています。");
          }
          throw error;
        }
        saved = data;
      }

      await admin.from("audit_logs").insert({
        member_id: member.id,
        action: id ? "master_updated" : "master_created",
        target_type: masterType,
        target_id: saved.id,
        details: { name: saved.name, active: saved.active },
      });
      return ok(req, { item: saved });
    }

    if (action === "admin_master_delete") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "マスタを削除できるのは管理者だけです。");
      }
      const masterType = cleanString(body.masterType, 20);
      const table = masterTable(masterType);
      if (!table) return fail(req, 400, "INVALID_MASTER_TYPE", "マスタ種別が不正です。");
      const id = cleanString(body.id, 80);
      if (!id) return fail(req, 400, "MASTER_ID_REQUIRED", "削除対象が指定されていません。");
      const { data: existing, error: readError } = await admin
        .from(table)
        .select("id, name")
        .eq("id", id)
        .maybeSingle();
      if (readError) throw readError;
      if (!existing) return fail(req, 404, "MASTER_NOT_FOUND", "対象のマスタ項目が見つかりません。");
      const { error } = await admin.from(table).delete().eq("id", id);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        member_id: member.id,
        action: "master_deleted",
        target_type: masterType,
        target_id: id,
        details: { name: existing.name },
      });
      return ok(req, {});
    }

    if (action === "admin_list") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const settings = await readSettings();
      return ok(req, {
        members: await adminMemberList(),
        settings,
        discordConfig: await getDiscordSeasonConfig(settings.current_season),
        discordOAuthConfigured: Boolean(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET),
        discordBotConfigured: Boolean(DISCORD_BOT_TOKEN),
        discordRedirectUri: DISCORD_REDIRECT_URI,
      });
    }

    if (action === "admin_create_member") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const displayName = cleanString(body.displayName, 40);
      const role = ["viewer", "editor", "admin"].includes(body.role)
        ? body.role
        : "viewer";
      if (!displayName) {
        return fail(req, 400, "INVALID_DISPLAY_NAME", "メンバー名を入力してください。");
      }
      const { data: created, error } = await admin
        .from("members")
        .insert({ display_name: displayName, role, active: true })
        .select("id, display_name, role, active")
        .single();
      if (error) throw error;
      const accessCode = await createInviteForMember(created.id, member.id);
      await admin.from("audit_logs").insert({
        member_id: member.id,
        action: "member_created",
        target_type: "member",
        target_id: created.id,
        details: { displayName, role },
      });
      return ok(req, {
        member: created,
        accessCode,
        warning: "このコードは今回の応答でのみ表示されます。",
      });
    }

    if (action === "admin_issue_code") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const targetMemberId = cleanString(body.memberId, 80);
      const { data: target } = await admin
        .from("members")
        .select("id, active")
        .eq("id", targetMemberId)
        .maybeSingle();
      if (!target?.active) {
        return fail(req, 400, "MEMBER_INACTIVE", "停止中のメンバーには発行できません。");
      }
      const accessCode = await createInviteForMember(targetMemberId, member.id);
      return ok(req, {
        accessCode,
        warning: "このコードは今回の応答でのみ表示されます。",
      });
    }

    if (action === "admin_set_member_role") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const targetMemberId = cleanString(body.memberId, 80);
      const role = ["viewer", "editor", "admin"].includes(body.role)
        ? body.role
        : "";
      if (!role) {
        return fail(req, 400, "INVALID_ROLE", "権限の指定が不正です。");
      }
      if (targetMemberId === member.id) {
        return fail(req, 400, "CANNOT_CHANGE_SELF_ROLE", "自分自身の権限は変更できません。");
      }
      const { data: target, error: targetError } = await admin
        .from("members")
        .select("id, display_name, role")
        .eq("id", targetMemberId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!target) {
        return fail(req, 404, "MEMBER_NOT_FOUND", "対象メンバーが見つかりません。");
      }
      const { error } = await admin
        .from("members")
        .update({ role })
        .eq("id", targetMemberId);
      if (error) throw error;
      await admin.from("audit_logs").insert({
        member_id: member.id,
        action: "member_role_changed",
        target_type: "member",
        target_id: targetMemberId,
        details: { from: target.role, to: role, displayName: target.display_name },
      });
      return ok(req, {});
    }

    if (action === "admin_set_member_active") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const targetMemberId = cleanString(body.memberId, 80);
      if (targetMemberId === member.id && body.active === false) {
        return fail(req, 400, "CANNOT_DISABLE_SELF", "自分自身は停止できません。");
      }
      const { error } = await admin
        .from("members")
        .update({ active: Boolean(body.active) })
        .eq("id", targetMemberId);
      if (error) throw error;
      if (body.active === false) {
        await admin
          .from("invite_codes")
          .update({ active: false })
          .eq("member_id", targetMemberId);
      }
      return ok(req, {});
    }

    if (action === "admin_reset_devices") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const targetMemberId = cleanString(body.memberId, 80);
      if (targetMemberId === member.id) {
        return fail(req, 400, "CANNOT_RESET_SELF", "操作中の管理者端末は解除できません。");
      }
      const { error } = await admin
        .from("member_devices")
        .delete()
        .eq("member_id", targetMemberId);
      if (error) throw error;
      return ok(req, {});
    }

    if (action === "admin_update_limits") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const globalDaily = boundedInteger(body.globalDaily, 50, 1, 100);
      const globalMonthly = boundedInteger(
        body.globalMonthly,
        900,
        1,
        HARD_MONTHLY_LIMIT,
      );
      const currentSeason = cleanString(body.currentSeason, 60) || "未設定";
      const { error } = await admin
        .from("app_settings")
        .update({
          global_daily_limit: globalDaily,
          global_monthly_limit: globalMonthly,
          current_season: currentSeason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
      if (error) throw error;
      return ok(req, { settings: await readSettings() });
    }

    if (action === "admin_discord_config_save") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const settings = await readSettings();
      const seasonName = settings.current_season;
      const guildId = cleanString(body.guildId, 80);
      const validSnowflake = (value: string) => !value || /^\d{10,30}$/.test(value);
      const roles = {
        role_scout_id: cleanString(body.roleScoutId, 80),
        role_spy_id: cleanString(body.roleSpyId, 80),
        role_ninja_head_id: cleanString(body.roleNinjaHeadId, 80),
        role_oniwaban_id: cleanString(body.roleOniwabanId, 80),
        role_intel_commissioner_id: cleanString(body.roleIntelCommissionerId, 80),
      };
      if (guildId && !validSnowflake(guildId)) {
        return fail(req, 400, "INVALID_GUILD_ID", "DiscordサーバーIDの形式が不正です。");
      }
      if (Object.values(roles).some((value) => !validSnowflake(value))) {
        return fail(req, 400, "INVALID_ROLE_ID", "DiscordロールIDの形式が不正です。");
      }
      const { error } = await admin.from("discord_season_configs").upsert({
        season_name: seasonName,
        guild_id: guildId,
        ...roles,
        updated_at: new Date().toISOString(),
      }, { onConflict: "season_name" });
      if (error) throw error;
      await syncAllDiscordTitlesForSeason(seasonName);
      return ok(req, { discordConfig: await getDiscordSeasonConfig(seasonName) });
    }

    if (action === "admin_discord_create_roles") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      if (!DISCORD_BOT_TOKEN) {
        return fail(req, 503, "DISCORD_BOT_NOT_CONFIGURED", "DISCORD_BOT_TOKENが未設定です。");
      }
      const settings = await readSettings();
      const seasonName = settings.current_season;
      const currentConfig = await getDiscordSeasonConfig(seasonName);
      const guildId = cleanString(body.guildId ?? currentConfig.guild_id, 80);
      if (!/^\d{10,30}$/.test(guildId)) {
        return fail(req, 400, "INVALID_GUILD_ID", "先にDiscordサーバーIDを入力してください。");
      }

      const existingResponse = await discordBotRequest(`/guilds/${encodeURIComponent(guildId)}/roles`);
      if (!existingResponse.ok) {
        return fail(req, 400, "DISCORD_GUILD_ACCESS_FAILED", "Discordサーバーのロール一覧を取得できません。Botの参加・権限を確認してください。", {
          status: existingResponse.status,
        });
      }
      const existingRoles = await existingResponse.json();
      const roleUpdates: Record<string, string> = {};
      for (const title of INTEL_TITLES) {
        const roleName = `諜報・${title.label}`;
        let role = Array.isArray(existingRoles)
          ? existingRoles.find((item: any) => item?.name === roleName)
          : null;
        if (!role) {
          const createResponse = await discordBotRequest(`/guilds/${encodeURIComponent(guildId)}/roles`, {
            method: "POST",
            body: JSON.stringify({ name: roleName, permissions: "0", mentionable: false }),
          });
          if (!createResponse.ok) {
            return fail(req, 400, "DISCORD_ROLE_CREATE_FAILED", `Discordロール「${roleName}」を作成できませんでした。`, {
              status: createResponse.status,
            });
          }
          role = await createResponse.json();
        }
        roleUpdates[title.roleField] = cleanString(role?.id, 80);
      }
      const { error } = await admin.from("discord_season_configs").upsert({
        season_name: seasonName,
        guild_id: guildId,
        ...roleUpdates,
        updated_at: new Date().toISOString(),
      }, { onConflict: "season_name" });
      if (error) throw error;
      await syncAllDiscordTitlesForSeason(seasonName);
      return ok(req, { discordConfig: await getDiscordSeasonConfig(seasonName) });
    }

    if (action === "admin_delete_observation") {
      if (member.role !== "admin") {
        return fail(req, 403, "ROLE_FORBIDDEN", "管理者のみ利用できます。");
      }
      const observationId = cleanString(body.observationId, 80);
      const { error } = await admin
        .from("enemy_observations")
        .delete()
        .eq("id", observationId);
      if (error) throw error;
      return ok(req, {});
    }

    return fail(req, 404, "UNKNOWN_ACTION", "指定された処理はありません。");
  } catch (error) {
    console.error(error);
    return fail(req, 500, "SERVER_ERROR", "サーバー処理でエラーが発生しました。", {
      reason: cleanString((error as Error).message, 300),
    });
  }
});
