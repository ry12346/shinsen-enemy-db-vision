const APP_VERSION = "2.4.16";
const FORMATION_SUPPORT_STORAGE_KEY = "shinsen-formation-support-v1";
const FORMATION_CONSULTATION_DRAFT_PREFIX = "shinsen-formation-consultation-draft-v1:";
const FORMATION_TACTIC_COPY_LIMITS = Object.freeze({ "奮戦": 2 });
const FORMATION_TACTIC_NAME_ALIASES = Object.freeze({
  "威風凛凛": "威風凜々",
  "威風凛々": "威風凜々",
  "威風凜凜": "威風凜々",
  "龍騎兵": "竜騎兵",
});
// 所持武将から伝授できる戦法。Qookka系武将マスタの teachable_skill を日本名へ正規化して保持。
// 新規PK武将は取得済みの日本版マスタで補完する。
const TEACHABLE_TACTIC_BY_GENERAL = Object.freeze({"お市":{"grade":"S","kind":"受動","name":"沈魚落雁"},"ねね":{"grade":"S","kind":"受動","name":"沈魚落雁"},"一条信竜":{"grade":"S","kind":"兵種","name":"甲斐弓騎兵"},"一條信竜":{"grade":"S","kind":"兵種","name":"甲斐弓騎兵"},"三好実休":{"grade":"S","kind":"突撃","name":"威風凛凛"},"三枝昌貞":{"grade":"A","kind":"指揮","name":"警戒周到"},"上杉謙信":{"grade":"S","kind":"受動","name":"毘沙門天"},"下方貞清":{"grade":"A","kind":"能動","name":"先陣の勇"},"不破光治":{"grade":"B","kind":"能動","name":"救援"},"九戶政實":{"grade":"A","kind":"受動","name":"一念乱志"},"九戸政実":{"grade":"A","kind":"受動","name":"一念乱志"},"今川義元":{"grade":"S","kind":"受動","name":"独立独歩"},"仙桃院":{"grade":"S","kind":"突撃","name":"戦意崩壊"},"仙石権兵衛":{"grade":"A","kind":"能動","name":"奪気"},"仙石權兵衛":{"grade":"A","kind":"能動","name":"奪気"},"伊達政宗":{"grade":"S","kind":"兵種","name":"龍騎兵"},"伊達晴宗":{"grade":"S","kind":"能動","name":"一力当先"},"佐久間信盛":{"grade":"S","kind":"指揮","name":"罵詈雑言"},"佐久間盛政":{"grade":"A","kind":"能動","name":"鬼玄蕃"},"佐竹義重":{"grade":"S","kind":"突撃","name":"威風凛凛"},"保科正俊":{"grade":"S","kind":"能動","name":"槍弾正"},"內藤信成":{"grade":"B","kind":"能動","name":"嘲罵"},"内藤信成":{"grade":"B","kind":"能動","name":"嘲罵"},"内藤昌豊":{"grade":"S","kind":"能動","name":"回天転運"},"前田利家":{"grade":"S","kind":"兵種","name":"母衣武者"},"前田慶次":{"grade":"S","kind":"突撃","name":"乱世の華"},"加藤清正":{"grade":"S","kind":"能動","name":"所向無敵"},"北条氏康":{"grade":"S","kind":"能動","name":"所領役帳"},"北条綱成":{"grade":"S","kind":"能動","name":"千軍辟易"},"北條氏康":{"grade":"S","kind":"能動","name":"所領役帳"},"北條綱成":{"grade":"S","kind":"能動","name":"千軍辟易"},"十河一存":{"grade":"S","kind":"能動","name":"前後挟撃"},"千坂景親":{"grade":"S","kind":"受動","name":"按甲休兵"},"南部晴政":{"grade":"S","kind":"受動","name":"百戦錬磨"},"原虎胤":{"grade":"S","kind":"指揮","name":"罵詈雑言"},"口羽通良":{"grade":"B","kind":"能動","name":"威圧"},"可児才蔵":{"grade":"S","kind":"受動","name":"死中求活"},"可兒才藏":{"grade":"S","kind":"受動","name":"死中求活"},"吉川広家":{"grade":"A","kind":"受動","name":"休養"},"国司元相":{"grade":"A","kind":"突撃","name":"槍の鈴"},"坂井政尚":{"grade":"A","kind":"能動","name":"先制先登"},"堀直政":{"grade":"S","kind":"能動","name":"荷駄崩し"},"壽桂尼":{"grade":"S","kind":"能動","name":"大智不智"},"多田三八郎":{"grade":"A","kind":"能動","name":"妖怪退治"},"大久保忠世":{"grade":"A","kind":"能動","name":"忠勤励行"},"大久保長安":{"grade":"S","kind":"内政","name":"重農主義"},"大內義隆":{"grade":"S","kind":"能動","name":"静動自在"},"大内義隆":{"grade":"S","kind":"能動","name":"静動自在"},"大祝鶴":{"grade":"S","kind":"指揮","name":"戦意消沈"},"太田牛一":{"grade":"A","kind":"能動","name":"奮戦"},"太田資正":{"grade":"S","kind":"受動","name":"百戦錬磨"},"妻木煕子":{"grade":"S","kind":"能動","name":"帰還の凱歌"},"妻木熙子":{"grade":"S","kind":"能動","name":"帰還の凱歌"},"宇佐美定満":{"grade":"S","kind":"指揮","name":"深慮遠謀"},"宇佐美定滿":{"grade":"S","kind":"指揮","name":"深慮遠謀"},"安東愛季":{"grade":"S","kind":"受動","name":"文武両道"},"安藤守就":{"grade":"A","kind":"受動","name":"一上一下"},"宮部継潤":{"grade":"S","kind":"兵種","name":"僧兵"},"宮部繼潤":{"grade":"S","kind":"兵種","name":"僧兵"},"寧寧":{"grade":"S","kind":"受動","name":"沈魚落雁"},"寿桂尼":{"grade":"S","kind":"能動","name":"大智不智"},"小山田信茂":{"grade":"A","kind":"能動","name":"矢石飛交"},"小山田茂誠":{"grade":"A","kind":"指揮","name":"参謀の助言"},"小島弥太郎":{"grade":"S","kind":"能動","name":"剛毅果断"},"小島彌太郎":{"grade":"S","kind":"能動","name":"剛毅果断"},"小幡景憲":{"grade":"A","kind":"能動","name":"甲州流軍学"},"小早川秀秋":{"grade":"B","kind":"能動","name":"薙ぎ払い"},"尼子晴久":{"grade":"S","kind":"指揮","name":"気炎万丈"},"山內一豊":{"grade":"A","kind":"能動","name":"弓調馬服"},"山内一豊":{"grade":"A","kind":"能動","name":"弓調馬服"},"山本勘助":{"grade":"S","kind":"能動","name":"草木皆兵"},"山県昌景":{"grade":"S","kind":"能動","name":"縦横馳突"},"山縣昌景":{"grade":"S","kind":"能動","name":"縦横馳突"},"岡部元信":{"grade":"S","kind":"指揮","name":"気炎万丈"},"岩城親隆":{"grade":"A","kind":"受動","name":"休養"},"島津貴久":{"grade":"S","kind":"兵種","name":"薩摩鉄砲兵"},"帰蝶":{"grade":"S","kind":"能動","name":"五里霧中"},"徳川家康":{"grade":"S","kind":"受動","name":"盤石耽々"},"德川家康":{"grade":"S","kind":"受動","name":"盤石耽々"},"成田甲斐":{"grade":"S","kind":"能動","name":"前後挟撃"},"斎藤利三":{"grade":"A","kind":"受動","name":"全力戦闘"},"斎藤義竜":{"grade":"S","kind":"突撃","name":"理非曲直"},"新発田重家":{"grade":"A","kind":"能動","name":"敵陣攪乱"},"新發田重家":{"grade":"A","kind":"能動","name":"敵陣攪乱"},"明智光秀":{"grade":"S","kind":"受動","name":"七十二の計"},"明智秀満":{"grade":"S","kind":"受動","name":"死中求活"},"明智秀滿":{"grade":"S","kind":"受動","name":"死中求活"},"朝倉義景":{"grade":"S","kind":"受動","name":"按甲休兵"},"本多忠勝":{"grade":"S","kind":"受動","name":"血戦奮闘"},"本多正信":{"grade":"S","kind":"能動","name":"帰還の凱歌"},"本庄実乃":{"grade":"B","kind":"能動","name":"火計"},"本庄實乃":{"grade":"B","kind":"能動","name":"火計"},"本願寺教如":{"grade":"B","kind":"能動","name":"水計"},"本願寺顕如":{"grade":"S","kind":"受動","name":"一行三昧"},"杉浦玄任":{"grade":"B","kind":"能動","name":"看破"},"松平信康":{"grade":"S","kind":"能動","name":"一力当先"},"松平忠直":{"grade":"B","kind":"突撃","name":"猛撃"},"松永久秀":{"grade":"S","kind":"受動","name":"一行三昧"},"板垣信方":{"grade":"S","kind":"能動","name":"奇謀独断"},"林秀貞":{"grade":"B","kind":"能動","name":"対話"},"柴田勝家":{"grade":"S","kind":"受動","name":"血戦奮闘"},"栗山善助":{"grade":"A","kind":"能動","name":"秋水一色"},"森可成":{"grade":"S","kind":"能動","name":"陣形崩し"},"榊原康政":{"grade":"S","kind":"指揮","name":"気勢衝天"},"樋口兼豊":{"grade":"S","kind":"能動","name":"奇謀独断"},"横山喜内":{"grade":"A","kind":"能動","name":"一六勝負"},"武田信玄":{"grade":"S","kind":"受動","name":"御旗楯無"},"武田義信":{"grade":"A","kind":"突撃","name":"一触即発"},"歸蝶":{"grade":"S","kind":"能動","name":"五里霧中"},"毛利元就":{"grade":"S","kind":"受動","name":"運勝の鼻"},"毛利輝元":{"grade":"A","kind":"能動","name":"祓除"},"毛利隆元":{"grade":"S","kind":"能動","name":"草木皆兵"},"氏家卜全":{"grade":"A","kind":"能動","name":"殿軍奮戦"},"水原親憲":{"grade":"A","kind":"能動","name":"援護射撃"},"池田せん":{"grade":"A","kind":"能動","name":"不意打ち"},"池田千":{"grade":"A","kind":"能動","name":"不意打ち"},"池田恒興":{"grade":"A","kind":"突撃","name":"一刀両断"},"池田輝政":{"grade":"A","kind":"能動","name":"岐阜侍従"},"河尻秀隆":{"grade":"B","kind":"能動","name":"刺突"},"河田長親":{"grade":"S","kind":"能動","name":"金鼓連天"},"津田算長":{"grade":"S","kind":"兵種","name":"鉄砲僧兵"},"浅井長政":{"grade":"S","kind":"能動","name":"金鼓連天"},"浦上宗景":{"grade":"S","kind":"能動","name":"荷駄崩し"},"淺井長政":{"grade":"S","kind":"能動","name":"金鼓連天"},"瑞溪院":{"grade":"S","kind":"能動","name":"静動自在"},"甘利虎泰":{"grade":"S","kind":"能動","name":"剛毅果断"},"甘粕景持":{"grade":"S","kind":"突撃","name":"乗勝追撃"},"甘粕景継":{"grade":"A","kind":"突撃","name":"回山倒海"},"相馬盛胤":{"grade":"S","kind":"突撃","name":"境目奮戦"},"真柄直隆":{"grade":"S","kind":"兵種","name":"大太刀力士隊"},"真田大助":{"grade":"B","kind":"能動","name":"反撃"},"磯野員昌":{"grade":"A","kind":"能動","name":"驍勇善戦"},"福原貞俊":{"grade":"A","kind":"能動","name":"融通自在"},"福島正なら":{"grade":"S","kind":"能動","name":"所向無敵"},"福留親政":{"grade":"A","kind":"能動","name":"奮戦"},"稲葉一鉄":{"grade":"S","kind":"能動","name":"陣形崩し"},"立花道雪":{"grade":"S","kind":"能動","name":"霹靂一撃"},"竹中半兵衛":{"grade":"S","kind":"能動","name":"大智不智"},"筒井順慶":{"grade":"B","kind":"能動","name":"火攻め"},"結城秀康":{"grade":"A","kind":"受動","name":"腹中鱗甲"},"織田信長":{"grade":"S","kind":"能動","name":"紅蓮の炎"},"織田信雄":{"grade":"B","kind":"能動","name":"同討"},"脇坂安治":{"grade":"A","kind":"能動","name":"攻守兼備"},"色部勝長":{"grade":"B","kind":"突撃","name":"連戦"},"色部長実":{"grade":"B","kind":"受動","name":"奮起"},"色部長實":{"grade":"B","kind":"受動","name":"奮起"},"荒木村重":{"grade":"S","kind":"指揮","name":"戦意消沈"},"藤林正保":{"grade":"S","kind":"兵種","name":"伊賀忍者"},"蜂須賀家政":{"grade":"A","kind":"能動","name":"有備無患"},"蜂須賀小六":{"grade":"S","kind":"能動","name":"嚢沙之計"},"諏訪姫":{"grade":"S","kind":"突撃","name":"戦意崩壊"},"諏訪姬":{"grade":"S","kind":"突撃","name":"戦意崩壊"},"豊臣秀吉":{"grade":"S","kind":"能動","name":"水攻干計"},"遠藤基信":{"grade":"B","kind":"能動","name":"殿軍"},"遠藤直経":{"grade":"A","kind":"能動","name":"闇討ち"},"遠藤直經":{"grade":"A","kind":"能動","name":"闇討ち"},"酒井忠次":{"grade":"S","kind":"兵種","name":"三河弓兵隊"},"里見義堯":{"grade":"S","kind":"突撃","name":"境目奮戦"},"金森長近":{"grade":"B","kind":"突撃","name":"破甲"},"鈴木重朝":{"grade":"A","kind":"能動","name":"鉄砲猛撃"},"長宗我部元親":{"grade":"S","kind":"指揮","name":"一領具足"},"長野業正":{"grade":"S","kind":"指揮","name":"戮力同心"},"長野業盛":{"grade":"B","kind":"突撃","name":"不退転"},"阿市":{"grade":"S","kind":"受動","name":"沈魚落雁"},"陶晴賢":{"grade":"S","kind":"突撃","name":"理非曲直"},"飯富虎昌":{"grade":"S","kind":"兵種","name":"赤備え隊"},"馬場信春":{"grade":"S","kind":"受動","name":"以戦養戦"},"高力清長":{"grade":"S","kind":"能動","name":"嚢沙之計"},"高橋紹運":{"grade":"S","kind":"突撃","name":"乱世の華"},"鬼庭左月斎":{"grade":"A","kind":"能動","name":"生死一顧"},"鬼庭左月齋":{"grade":"A","kind":"能動","name":"生死一顧"},"鳥居元忠":{"grade":"A","kind":"受動","name":"百錬成鋼"},"黑田官兵衛":{"grade":"S","kind":"指揮","name":"知者楽水"},"黒田官兵衛":{"grade":"S","kind":"指揮","name":"知者楽水"},"齋藤利三":{"grade":"A","kind":"受動","name":"全力戦闘"},"齋藤義竜":{"grade":"S","kind":"突撃","name":"理非曲直"}});
// 日本版Qookkaマスタで同一名の戦法IDを照合（cfg 1787384993825）。
const TEACHABLE_TACTIC_IDS_BY_NAME = Object.freeze({"沈魚落雁":["20103"],"甲斐弓騎兵":["20127"],"威風凜々":["20185"],"警戒周到":["24004"],"毘沙門天":["20136"],"先陣の勇":["24024"],"救援":["29613"],"一念乱志":["24003"],"独立独歩":["20139"],"戦意崩壊":["20100"],"奪気":["24048"],"竜騎兵":["20190"],"一力当先":["20096"],"罵詈雑言":["20118"],"鬼玄蕃":["24010"],"槍弾正":["24002"],"嘲罵":["29624"],"回天転運":["20093"],"母衣武者":["20125"],"乱世の華":["20160"],"所向無敵":["20088"],"所領役帳":["20138"],"千軍辟易":["20094"],"前後挟撃":["20092"],"按甲休兵":["20095"],"百戦錬磨":["20116"],"威圧":["29618"],"死中求活":["20104"],"休養":["24049"],"槍の鈴":["24033","24046"],"先制先登":["24008"],"荷駄崩し":["20186"],"大智不智":["20122"],"妖怪退治":["24034"],"忠勤励行":["24012"],"重農主義":["20197"],"静動自在":["20161"],"戦意消沈":["20106"],"奮戦":["24044"],"帰還の凱歌":["20109"],"深慮遠謀":["20108"],"文武両道":["20105","29959"],"一上一下":["24009"],"僧兵":["20131"],"矢石飛交":["24025"],"参謀の助言":["24030"],"剛毅果断":["20120"],"甲州流軍学":["24043"],"薙ぎ払い":["29606"],"気炎万丈":["20089"],"弓調馬服":["24023"],"草木皆兵":["20090"],"縦横馳突":["20091"],"薩摩鉄砲兵":["20128"],"五里霧中":["20117"],"盤石耽々":["20134"],"全力戦闘":["24017"],"理非曲直":["20099"],"敵陣攪乱":["24038"],"七十二の計":["20141"],"血戦奮闘":["20112"],"火計":["29620"],"水計":["29621"],"一行三昧":["20102"],"看破":["29610"],"猛撃":["29633"],"奇謀独断":["20101"],"対話":["29629"],"秋水一色":["24028"],"陣形崩し":["20087"],"気勢衝天":["20107"],"一六勝負":["24040"],"御旗楯無":["20135"],"一触即発":["24022"],"運勝の鼻":["20137"],"祓除":["24047"],"殿軍奮戦":["24006"],"援護射撃":["24013"],"不意打ち":["24016"],"一刀両断":["24015"],"岐阜侍従":["24041"],"刺突":["29619"],"金鼓連天":["20119"],"鉄砲僧兵":["20129"],"乗勝追撃":["20097"],"回山倒海":["24001"],"境目奮戦":["20162"],"大太刀力士隊":["20130"],"反撃":["29627"],"驍勇善戦":["24039"],"融通自在":["24027"],"霹靂一撃":["20113"],"火攻め":["29607"],"腹中鱗甲":["24036"],"紅蓮の炎":["20132"],"同討":["29608"],"攻守兼備":["24005"],"連戦":["29631"],"奮起":["29636"],"伊賀忍者":["20191"],"有備無患":["24020"],"嚢沙之計":["20121"],"水攻干計":["20133"],"殿軍":["29612"],"闇討ち":["24035"],"三河弓兵隊":["20126"],"破甲":["29632"],"鉄砲猛撃":["24007"],"一領具足":["20140"],"戮力同心":["20184"],"不退転":["29630"],"赤備え隊":["20124"],"以戦養戦":["20114"],"生死一顧":["24021"],"百錬成鋼":["24045"],"知者楽水":["20158"]});
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
  enemyPlayerSearch: "",
  enemyGroupSearch: "",
  enemyFormationSearch: "",
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
  intelSeason: "未設定",
  systemStatus: null,
  intel: null,
  myInventory: null,
  myFormations: [],
  myFormationShareSets: [],
  formationShareSelection: [],
  formationShareTitle: "",
  inventorySearch: "",
  inventoryFilters: { star: "5", faction: "all", cost: "all" },
  formationDraft: null,
  formationPicker: null,
  formationGeneralPickerFilters: { star: "5", faction: "all", cost: "all" },
  formationTacticPickerKinds: [],
  formationTacticPickerGrades: ["S"],
  formationSwap: null,
  formationExpandedTacticSlots: [],
  formationDraftRemote: null,
  formationDraftSaveTimer: null,
  formationDraftStatus: "",
  formationCopyMissing: null,
  formationReorderBusy: false,
  sharedFormation: null,
  shareToken: "",
  sharedFormationSet: null,
  shareSetToken: "",
  myFormationConsultations: [],
  activeConsultationId: "",
  activeConsultation: null,
  consultationToken: "",
  sharedConsultation: null,
  consultationDraft: null,
  consultationPicker: null,
  consultationSubmitted: false,
  consultationSubmitting: false,
  consultationSubmissionError: "",
  consultationAnswersError: "",
  consultationInventorySearch: "",
  consultationInventoryFilters: { star: "all", faction: "all", cost: "all" },
  consultationGeneralPickerFilters: { star: "5", faction: "all", cost: "all" },
  consultationTacticPickerKinds: [],
  consultationTacticPickerGrades: ["S"],
  consultationTacticPaletteSearch: "",
  consultationTacticPaletteKinds: [],
  consultationTacticPaletteGrades: ["S"],
  consultationTacticPaletteSource: "owned",
  consultationHideUsedTactics: false,
  consultationSwap: null,
  consultationExpandedTacticSlots: {},
  consultationMobileTacticTarget: null,
  formationSupportMode: false,
  formationSupportName: "",
  formationSupportSavedAt: "",
  consultationLocalSavedAt: "",
  consultationInventoryOpen: null,
  consultationSubmittedAt: "",
  formationSupportWorkspaceKey: "",
  supportSync: null,
  supportCloudDrafts: [],
  supportCloudLinked: null,
  supportCloudAccountId: null,
  supportCloudError: "",
};

let consultationAnswersTimer = null;
let consultationAnswersRefreshPromise = null;
let consultationAnswersNextAt = 0;
let consultationAnswersIdleChecks = 0;
let consultationAnswersFailures = 0;

function consultationSaveDataEnabled() {
  const connection = navigator.connection;
  return connection?.saveData === true || ["slow-2g", "2g"].includes(connection?.effectiveType);
}

function consultationAnswersBaseDelay() {
  return consultationSaveDataEnabled() ? 180_000 : 60_000;
}

const OCR_SHEET_VERSION = "field-sheet-v6-troop";
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


const TROOP_TYPES = Object.freeze([
  { value: "infantry", label: "足軽" },
  { value: "siege", label: "兵器" },
  { value: "cavalry", label: "馬" },
  { value: "bow", label: "弓" },
  { value: "gun", label: "鉄砲" },
]);

// 各兵種アイコンを24x24の2値マスクとして保持する。
// ユーザー提供の実画面から金色部分だけを抽出したテンプレートで、
// Google Visionを追加で呼ばずブラウザ内だけで兵種を判定する。
const TROOP_ICON_TEMPLATE_ROWS = Object.freeze({
  infantry: "000000,000000,000000,1e0000,1f0000,1f8000,0fc000,07e000,03f000,01f000,00fc00,007f00,003e00,001e00,001e00,000180,0000c0,000060,000070,000038,00000c,000000,000000,000000",
  bow: "000000,000000,000000,1c0000,1c0000,1c1f00,026000,018000,018000,024000,022100,041300,040e00,040e00,041e00,062000,066080,06c078,07007c,070070,060020,060000,000000,000000",
  cavalry: "000000,000000,000000,002000,002000,003000,007e00,007f00,00ff00,00ff00,01ff00,03ff80,03fbc0,07f3fc,0ff3fc,1f03fc,0e03f8,0601f0,0001f0,0001e0,0001c0,000000,000000,000000",
  gun: "000000,000000,000000,000000,000000,1c0000,3f0000,1fc000,0ffc00,03fe00,003f00,003f80,000fc0,0003e0,0001fc,0000be,00001e,00001e,00000e,00000e,000000,000000,000000,000000",
  siege: "000000,000000,003c00,01fe00,03da00,071800,0f1800,1f9800,199800,187e00,307e00,3fff00,3fff80,307e0c,187e18,199998,1f99f8,0f18f0,0718e0,03dbc0,01ff80,003c00,000000,000000",
});

let troopIconTemplatesCache = null;

function troopTypeLabel(value) {
  return TROOP_TYPES.find((item) => item.value === value)?.label ?? "未確認";
}

function troopTypeOptions(value) {
  const current = String(value ?? "");
  return [
    `<option value="" ${current === "" ? "selected" : ""}>未確認</option>`,
    ...TROOP_TYPES.map((item) =>
      `<option value="${item.value}" ${current === item.value ? "selected" : ""}>${item.label}</option>`
    ),
  ].join("");
}

function troopIconTemplates() {
  if (troopIconTemplatesCache) return troopIconTemplatesCache;
  const result = {};
  for (const [type, encoded] of Object.entries(TROOP_ICON_TEMPLATE_ROWS)) {
    const mask = new Uint8Array(24 * 24);
    encoded.split(",").forEach((hex, y) => {
      const bits = Number.parseInt(hex, 16).toString(2).padStart(24, "0");
      for (let x = 0; x < 24; x += 1) mask[y * 24 + x] = bits[x] === "1" ? 1 : 0;
    });
    result[type] = mask;
  }
  troopIconTemplatesCache = result;
  return result;
}

function troopHeaderGeometry(file) {
  const side = file?.enemySide === "left" ? "left" : "right";
  const portrait = file?.orientation === "portrait";
  const game = file?.captureType === "game";
  if (portrait) {
    const cx = side === "left" ? 0.418 : 0.651;
    const cy = game ? 0.177 : 0.205;
    return {
      icon: makeRect(cx - 0.025, cx + 0.025, cy - 0.014, cy + 0.014),
      level: makeRect(cx - 0.012, cx + 0.075, cy - 0.016, cy + 0.017),
    };
  }
  if (game) {
    const cx = side === "left" ? 0.394 : 0.583;
    const cy = 0.193;
    return {
      icon: makeRect(cx - 0.022, cx + 0.022, cy - 0.025, cy + 0.025),
      level: makeRect(cx - 0.012, cx + 0.050, cy - 0.027, cy + 0.027),
    };
  }
  const cx = side === "left" ? 0.365 : 0.552;
  const cy = 0.165;
  return {
    icon: makeRect(cx - 0.022, cx + 0.022, cy - 0.025, cy + 0.025),
    level: makeRect(cx - 0.012, cx + 0.052, cy - 0.027, cy + 0.027),
  };
}

function goldMaskFromRect(image, rect) {
  const sx = clamp(Math.round(rect.x1 * image.naturalWidth), 0, image.naturalWidth - 1);
  const sy = clamp(Math.round(rect.y1 * image.naturalHeight), 0, image.naturalHeight - 1);
  const ex = clamp(Math.round(rect.x2 * image.naturalWidth), sx + 1, image.naturalWidth);
  const ey = clamp(Math.round(rect.y2 * image.naturalHeight), sy + 1, image.naturalHeight);
  const sw = Math.max(1, ex - sx);
  const sh = Math.max(1, ey - sy);
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) return null;
  context.drawImage(image, sx, sy, sw, sh, 0, 0, sw, sh);
  const pixels = context.getImageData(0, 0, sw, sh).data;
  const raw = new Uint8Array(sw * sh);
  let minX = sw;
  let minY = sh;
  let maxX = -1;
  let maxY = -1;
  let count = 0;
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const offset = (y * sw + x) * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];
      const gold = r > 125 && g > 90 && b < 195 && r - b > 20 && g - b > 5 && r - g < 110;
      if (!gold) continue;
      raw[y * sw + x] = 1;
      count += 1;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  if (count < 10 || maxX < minX || maxY < minY) return null;

  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const size = Math.max(bw, bh) + 4;
  const offsetX = Math.floor((size - bw) / 2);
  const offsetY = Math.floor((size - bh) / 2);
  const normalized = new Uint8Array(24 * 24);
  for (let y = 0; y < 24; y += 1) {
    for (let x = 0; x < 24; x += 1) {
      const squareX = Math.min(size - 1, Math.floor((x * size) / 24));
      const squareY = Math.min(size - 1, Math.floor((y * size) / 24));
      const sourceX = squareX - offsetX + minX;
      const sourceY = squareY - offsetY + minY;
      if (sourceX < minX || sourceX > maxX || sourceY < minY || sourceY > maxY) continue;
      normalized[y * 24 + x] = raw[sourceY * sw + sourceX];
    }
  }
  return normalized;
}

function shiftedMaskValue(mask, x, y, dx, dy) {
  const sx = x - dx;
  const sy = y - dy;
  if (sx < 0 || sx >= 24 || sy < 0 || sy >= 24) return 0;
  return mask[sy * 24 + sx];
}

function maskJaccard(a, b) {
  let best = 0;
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      let intersection = 0;
      let union = 0;
      for (let y = 0; y < 24; y += 1) {
        for (let x = 0; x < 24; x += 1) {
          const av = a[y * 24 + x];
          const bv = shiftedMaskValue(b, x, y, dx, dy);
          if (av || bv) union += 1;
          if (av && bv) intersection += 1;
        }
      }
      if (union) best = Math.max(best, intersection / union);
    }
  }
  return best;
}

function detectTroopType(image, file) {
  const geometry = troopHeaderGeometry(file);
  const mask = goldMaskFromRect(image, geometry.icon);
  if (!mask) return { type: "", confidence: 0, scores: {} };
  const scores = Object.entries(troopIconTemplates())
    .map(([type, template]) => ({ type, score: maskJaccard(mask, template) }))
    .sort((a, b) => b.score - a.score);
  const best = scores[0] ?? { type: "", score: 0 };
  const second = scores[1] ?? { score: 0 };
  const margin = best.score - second.score;
  if (best.score < 0.38 || margin < 0.045) {
    return { type: "", confidence: Math.max(0, best.score), scores: Object.fromEntries(scores.map((item) => [item.type, item.score])) };
  }
  return {
    type: best.type,
    confidence: clamp(0.55 + best.score * 0.35 + margin * 0.35, 0, 0.98),
    scores: Object.fromEntries(scores.map((item) => [item.type, item.score])),
  };
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

function isTallAndroidAspect(file) {
  if (!file) return false;
  const width = Number(file.width || 0);
  const height = Number(file.height || 0);
  if (!width || !height) return false;
  return Math.max(width, height) / Math.min(width, height) >= 2.19;
}

function isWarmTacticPixel(r, g, b) {
  return (
    r > 145 &&
    g > 115 &&
    b > 65 &&
    r - g > -5 &&
    g - b > 5 &&
    r + b - 2 * g < 80 &&
    r - g < 90
  );
}

function detectTacticButtonLayout(image, profile, orientation) {
  if (!image || !profile?.columns) {
    return { mode: "unknown", rows: [], spacing: null, confidence: 0 };
  }

  // 戦法ボタンの淡い金色は、詳細の開閉に関係なく共通している。
  // 画像を縮小して横方向の金色画素率を調べ、戦法ボタン4段の実位置を直接検出する。
  // これにより端末・縦横・ゲーム内/スマホの差を固定座標だけに依存させない。
  const maxWidth = 900;
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!context) return { mode: "unknown", rows: [], spacing: null, confidence: 0 };
  context.drawImage(image, 0, 0, width, height);
  const pixels = context.getImageData(0, 0, width, height).data;

  const scanRange = orientation === "portrait" ? [0.315, 0.64] : [0.50, 0.93];
  const threshold = 0.25;
  const minSpan = orientation === "portrait" ? 0.006 : 0.018;
  const xRanges = [
    ...(profile.columns.left ?? []),
    ...(profile.columns.right ?? []),
  ];
  const yStart = clamp(Math.floor(scanRange[0] * height), 0, height - 1);
  const yEnd = clamp(Math.ceil(scanRange[1] * height), yStart + 1, height);
  const scores = [];

  for (let y = yStart; y < yEnd; y += 1) {
    let warm = 0;
    let total = 0;
    for (const [rx1, rx2] of xRanges) {
      const xStart = clamp(Math.floor(rx1 * width), 0, width - 1);
      const xEnd = clamp(Math.ceil(rx2 * width), xStart + 1, width);
      // 2pxおきで十分。端末上でも解析負荷を抑える。
      for (let x = xStart; x < xEnd; x += 2) {
        const offset = (y * width + x) * 4;
        if (isWarmTacticPixel(pixels[offset], pixels[offset + 1], pixels[offset + 2])) warm += 1;
        total += 1;
      }
    }
    scores.push({ y: y / height, score: total ? warm / total : 0 });
  }

  const runs = [];
  let current = [];
  const flush = () => {
    if (!current.length) return;
    const span = current[current.length - 1].y - current[0].y;
    if (span >= minSpan) {
      const weight = current.reduce((sum, item) => sum + item.score, 0);
      const center = weight
        ? current.reduce((sum, item) => sum + item.y * item.score, 0) / weight
        : (current[0].y + current[current.length - 1].y) / 2;
      runs.push({
        start: current[0].y,
        end: current[current.length - 1].y,
        center,
        strength: Math.max(...current.map((item) => item.score)),
      });
    }
    current = [];
  };

  for (const item of scores) {
    if (item.score >= threshold) current.push(item);
    else flush();
  }
  flush();

  if (runs.length < 3) {
    return { mode: "unknown", rows: [], spacing: null, confidence: 0, runs };
  }

  // 最初の3段は 固有 / 第1 / 第2。開状態では段間が大きく、閉状態では詰まる。
  const firstThree = runs.slice(0, 3);
  const spacing = (
    (firstThree[1].center - firstThree[0].center) +
    (firstThree[2].center - firstThree[1].center)
  ) / 2;
  const closedThreshold = orientation === "portrait" ? 0.06 : 0.09;
  const mode = spacing < closedThreshold ? "closed" : "open";
  const gapFromThreshold = Math.abs(spacing - closedThreshold);
  const confidence = clamp(0.75 + Math.min(0.22, gapFromThreshold * 3), 0, 0.97);

  const pad = orientation === "portrait" ? 0.004 : 0.008;
  const rows = firstThree.map((run) => [
    clamp(run.start - pad, 0, 1),
    clamp(run.end + pad, 0, 1),
  ]);

  return { mode, rows, spacing, confidence, runs };
}

function closedProfileId(profile) {
  const match = String(profile?.id ?? "").match(/^(.*-fields-v)(\d+)$/);
  if (!match) return profile?.id ?? "";
  return `${match[1]}${Number(match[2]) + 2}`;
}

function resolveOcrProfile(file, image) {
  const profile = getOcrProfile(file);
  const layout = detectTacticButtonLayout(image, profile, file.orientation);
  file.tacticLayout = layout.mode;
  file.tacticLayoutSpacing = layout.spacing;
  file.tacticLayoutConfidence = layout.confidence;

  // 開状態はv1.7.1までのプロファイルを一切変更しない。
  if (layout.mode !== "closed" || layout.rows.length < 3) {
    return { profile, layout };
  }

  const rows = {
    ...profile.rows,
    inherent: layout.rows[0],
    tactic1: layout.rows[1],
    tactic2: layout.rows[2],
  };
  let meta = profile.meta;
  let jewel = profile.jewel;
  let fieldCropTweaks = null;

  // 閉状態でも武将カード本体の位置は端末ごとに異なる。
  // 既存の開状態プロファイルは触らず、実画像でズレが確認できた閉状態だけ限定補正する。
  if (file.captureType === "game" && file.orientation === "landscape" && isTallAndroidAspect(file)) {
    // Android 20:9系・横ゲーム内保存・閉状態。
    // v1.7.3では開状態の武将名/Lv/珠位置を流用していたため、カード下端を外していた。
    // 武将名はカード下端の白文字だけを残す。右端の長い武将名が欠けないようX方向は後段で拡張する。
    rows.name = [0.443, 0.482];
    // 将Lvはカード直下の兵科Lvではなく、武将カード内の「50」等を読む。
    rows.level = [0.475, 0.515];
    // 凸珠は同じカード下端帯。Android横では珠列が少し右寄りなので専用中心位置を使う。
    rows.red = [0.475, 0.512];
    meta = {
      left: {
        group: makeRect(0.10, 0.33, 0.108, 0.151),
        player: makeRect(0.36, 0.46, 0.108, 0.151),
      },
      right: {
        group: makeRect(0.65, 0.88, 0.108, 0.151),
        player: makeRect(0.525, 0.64, 0.108, 0.151),
      },
    };
    jewel = { start: 0.57, step: 0.095, halfWidth: 0.04 };
    fieldCropTweaks = {
      // カード列の基準幅に対する割合。NAMEは端を少し拡張、LEVELは「50」だけへ絞る。
      NAME: { leftExpand: 0.03, rightExpand: 0.10, mode: "dark-invert" },
      LEVEL: { innerStart: 0.34, innerEnd: 0.66, mode: "dark-invert" },
    };
  } else if (file.captureType !== "game" && file.orientation === "portrait" && !isTallAndroidPortraitPhone(file)) {
    // iPhone系の縦スマホスクショ・閉状態。
    // 武将名の下側に珠/兵力欄が入ると2文字名（例: お市）が崩れやすいため文字帯へ絞る。
    rows.name = [0.258, 0.276];
  }

  // Android縦のゲーム内保存画像だけは、上部メタ情報と武将名がiPhone系より上寄り/下寄りに異なる。
  // 閉状態かつ20:9系と確定した場合だけ限定補正し、従来の開状態やiPhoneには影響させない。
  if (file.captureType === "game" && file.orientation === "portrait" && isTallAndroidAspect(file)) {
    meta = {
      left: {
        group: makeRect(0.03, 0.23, 0.105, 0.14),
        player: makeRect(0.24, 0.505, 0.105, 0.14),
      },
      right: {
        group: makeRect(0.54, 0.75, 0.105, 0.14),
        player: makeRect(0.76, 0.99, 0.105, 0.14),
      },
    };
    rows.name = [0.299, 0.322];
  } else if (file.captureType === "game" && file.orientation === "portrait") {
    // iPhone縦ゲーム内の閉状態でも状態表示「潰走」を避け、武将名の文字帯だけへ寄せる。
    rows.name = [0.299, 0.322];
  }

  return {
    profile: {
      ...profile,
      id: closedProfileId(profile),
      meta,
      rows,
      jewel,
      fieldCropTweaks,
    },
    layout,
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

function buildOcrFieldRows(file, image) {
  const { profile, layout } = resolveOcrProfile(file, image);
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
      const cropWidth = x2 - x1;
      const tweak = profile.fieldCropTweaks?.[suffix] ?? null;
      if (tweak) {
        if (Number.isFinite(Number(tweak.innerStart)) && Number.isFinite(Number(tweak.innerEnd))) {
          cropX1 = x1 + cropWidth * Number(tweak.innerStart);
          cropX2 = x1 + cropWidth * Number(tweak.innerEnd);
        } else {
          cropX1 = x1 - cropWidth * Number(tweak.leftExpand ?? 0);
          cropX2 = x2 + cropWidth * Number(tweak.rightExpand ?? 0);
        }
        if (tweak.mode) mode = tweak.mode;
      }
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

  return { profile, rows, layout };
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
  const image = await loadImage(file.previewUrl);
  const { profile, rows, layout } = buildOcrFieldRows(file, image);
  const layoutKey = layout?.mode ?? "unknown";
  // v1.7.3/1.7.4では閉状態の切り出しを変えても同じOCRキャッシュキーだったため、
  // 新しい切り出し画像を表示していても古いVision結果が返ることがあった。
  // 開状態の既存キャッシュは維持し、閉状態だけリビジョンを付けて再解析する。
  const layoutRevision = layoutKey === "closed" ? "closed-crop-v175" : "";
  const cacheKey = `${OCR_SHEET_VERSION}|${profile.id}|${layoutKey}|${layoutRevision}|${file.enemySide}|${file.captureType}`;
  if (file.ocrPrepared?.cacheKey === cacheKey) return file.ocrPrepared;

  if (file.ocrPrepared?.previewUrl) URL.revokeObjectURL(file.ocrPrepared.previewUrl);
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
    const boxY = y + 6;
    const boxH = OCR_SHEET_ROW_HEIGHT - 12;
    if (index === 0) {
      // 既存17行の構造を変えず、GROUP行のラベル領域（既存パーサーが無視する左12%）へ
      // 兵種Lvだけを追加する。これにより既存の武将/戦法OCRの行配置は維持される。
      const troopLevelRect = troopHeaderGeometry(file).level;
      drawCropIntoBox(
        context,
        image,
        troopLevelRect,
        { x: 6, y: boxY, w: OCR_SHEET_LABEL_WIDTH - 12, h: boxH },
        "grayscale(100%) contrast(205%) brightness(120%)",
      );
    } else {
      context.fillStyle = "#111827";
      context.font = "700 28px system-ui, sans-serif";
      context.fillText(row.key, 16, y + OCR_SHEET_ROW_HEIGHT / 2);
    }
    drawCropIntoBox(
      context,
      image,
      row.rect,
      { x: firstBox.x, y: boxY, w: firstBox.w, h: boxH },
      "none",
    );
    const enhancedFilter = row.mode === "dark-invert"
      ? "grayscale(100%) contrast(215%) brightness(118%) invert(100%)"
      : row.mode === "dark"
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
  const troopTypeAnalysis = detectTroopType(image, file);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.93);
  const analysisHash = await sha256Text(
    `${file.hash}|${OCR_SHEET_VERSION}|${profile.id}|${layout?.mode ?? "unknown"}|${layoutRevision}|${file.enemySide}|${file.captureType}`,
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
    troopType: troopTypeAnalysis.type,
    troopTypeConfidence: troopTypeAnalysis.confidence,
    troopTypeScores: troopTypeAnalysis.scores,
    tacticLayout: layout?.mode ?? "unknown",
    tacticLayoutSpacing: Number(layout?.spacing ?? 0),
    tacticLayoutConfidence: Number(layout?.confidence ?? 0),
    tacticRows: layout?.rows ?? [],
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

function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[\s・･ーｰ_-]+/g, "");
}

function generalFilterValues(generals = []) {
  const factions = [...new Set(generals.map((row) => String(row.faction || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ja"));
  const costs = [...new Set(generals.map((row) => Number(row.cost)).filter((value) => Number.isFinite(value) && value > 0))]
    .sort((a, b) => a - b);
  return { factions, costs };
}

function generalMatchesFilter(general, query, filters = {}) {
  const normalizedQuery = normalizeSearchText(query);
  if (normalizedQuery && !normalizeSearchText(general.name).includes(normalizedQuery)) return false;
  if (filters.star && filters.star !== "all" && general.star != null && general.star !== "" && String(general.star) !== String(filters.star)) return false;
  if (filters.faction && filters.faction !== "all" && general.faction && String(general.faction) !== String(filters.faction)) return false;
  if (filters.cost && filters.cost !== "all" && general.cost != null && general.cost !== "" && String(general.cost) !== String(filters.cost)) return false;
  return true;
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
    ["formations", "◇", "編成"],
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
    const consultationToken = discordParams.get("consultation") || "";
    if (consultationToken) {
      state.consultationToken = consultationToken;
      await navigate("formation-consultation");
      return;
    }
    const sharedSetToken = discordParams.get("formation_set") || "";
    if (sharedSetToken) {
      state.shareSetToken = sharedSetToken;
      await navigate("shared-formation-set");
      return;
    }
    const sharedToken = discordParams.get("formation") || "";
    if (sharedToken) {
      state.shareToken = sharedToken;
      await navigate("shared-formation");
      return;
    }
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
  stopConsultationAnswersPolling();
  state.view = view;
  window.scrollTo({ top: 0, behavior: "auto" });
  if (view === "enemies") await renderEnemies();
  else if (view === "upload") renderUpload();
  else if (view === "intel") await renderIntel();
  else if (view === "formations") await renderMyFormations();
  else if (view === "inventory") await renderMyInventory();
  else if (view === "formation-edit") renderFormationEditor();
  else if (view === "formation-share-select") renderFormationShareSelector();
  else if (view === "formation-consultation-create") renderFormationConsultationCreate();
  else if (view === "formation-consultation-detail") await renderFormationConsultationDetail();
  else if (view === "formation-consultation") await renderFormationConsultation();
  else if (view === "formation-support-start") await renderFormationSupportStart();
  else if (view === "formation-support-workspace") renderFormationSupportWorkspace();
  else if (view === "shared-formation") await renderSharedFormation();
  else if (view === "shared-formation-set") await renderSharedFormationSet();
  else if (view === "usage") await renderUsage();
  else if (view === "settings") await renderSettings();
  else if (view === "masters") await renderMasters();
}

function latestGenerals(latest) {
  return [...(latest?.observation_generals ?? [])].sort((a, b) => a.slot - b.slot);
}

function observationTroopText(observation) {
  const summary = observation?.report_summary && typeof observation.report_summary === "object"
    ? observation.report_summary
    : {};
  const rawType = String(summary.troopType ?? "");
  const rawLevel = summary.troopLevel;
  const level = rawLevel === null || rawLevel === undefined || rawLevel === "" ? null : Number(rawLevel);
  if (!rawType && level == null) return "";
  const type = troopTypeLabel(rawType);
  const levelText = Number.isFinite(level) && level >= 1 && level <= 10 ? ` Lv${Math.trunc(level)}` : "";
  return `${type}${levelText}`;
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
          ${observationTroopText(observation) ? `<span class="badge info">${escapeHtml(observationTroopText(observation))}</span>` : ""}
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
      <div class="enemy-search-panel">
        <label class="enemy-search-field">
          <span>プレイヤー名</span>
          <input id="enemy-player-search" type="search" inputmode="search" value="${escapeAttr(state.enemyPlayerSearch)}" placeholder="プレイヤー名で検索" autocomplete="off" />
        </label>
        <label class="enemy-search-field">
          <span>一門名</span>
          <input id="enemy-group-search" type="search" inputmode="search" value="${escapeAttr(state.enemyGroupSearch)}" placeholder="一門名で検索" autocomplete="off" />
        </label>
        <label class="enemy-search-field enemy-search-field-wide">
          <span>武将・戦法</span>
          <input id="enemy-formation-search" type="search" inputmode="search" value="${escapeAttr(state.enemyFormationSearch)}" placeholder="武将名 / 第1・第2戦法で検索" autocomplete="off" />
        </label>
        <button type="button" class="text-button enemy-search-clear" data-action="clear-enemy-search">検索をクリア</button>
      </div>
      <section class="page-content">
        <div class="card"><p class="muted" style="margin:0">読み込み中...</p></div>
      </section>`,
  });

  try {
    const response = await apiRequest("list_enemies", {
      playerSearch: state.enemyPlayerSearch,
      groupSearch: state.enemyGroupSearch,
      formationSearch: state.enemyFormationSearch,
    });
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
        <span>${(state.enemyPlayerSearch || state.enemyGroupSearch || state.enemyFormationSearch) ? "検索条件に一致する敵がいません。" : "戦報画像から最初の敵部隊を登録してください。"}</span>
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
    troopType: observation.report_summary?.troopType ?? "",
    troopLevel: observation.report_summary?.troopLevel ?? null,
    troopConfidence: { type: 0, level: 0 },
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

        <div class="card form-stack">
          <div class="card-header"><div><h2>部隊情報</h2><small>兵種と兵種Lv</small></div></div>
          <div class="form-grid-2">
            <label class="field"><span>兵種</span><select data-edit-path="troopType">${troopTypeOptions(draft.troopType)}</select></label>
            <label class="field"><span>兵種Lv</span><input type="number" inputmode="numeric" min="1" max="10" data-edit-path="troopLevel" value="${escapeAttr(draft.troopLevel ?? "")}" placeholder="例 8" /></label>
          </div>
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
    summary: {
      ...(draft.summary ?? {}),
      completenessScore: completion.score,
      troopType: draft.troopType || "",
      troopLevel: draft.troopLevel === "" || draft.troopLevel == null ? null : Number(draft.troopLevel),
    },
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
          <small>${escapeHtml(group.seasonName || latest.season_name || state.currentSeason)}・最終観測 ${escapeHtml(relativeTime(latest.observed_at))}</small>
          <div class="team-intel-summary">
            <span class="badge ${freshnessBadgeClass(freshness)}">${escapeHtml(freshness.label || "不明")}</span>
            <span class="badge ${confidenceBadgeClass(confidence)}">信頼度：${escapeHtml(confidence.label || "暫定")}</span>
            ${observationTroopText(latest) ? `<span class="badge info">${escapeHtml(observationTroopText(latest))}</span>` : ""}
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
          ${observationTroopText(observation) ? `<span class="badge info">${escapeHtml(observationTroopText(observation))}</span>` : ""}
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
          ${state.member?.role === "admin" ? `<button type="button" class="danger-button" style="min-height:44px" data-action="delete-observation" data-observation-id="${escapeAttr(observation.id)}">この記録を削除</button>` : ""}
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
    troopType: "",
    troopLevel: null,
    troopConfidence: { type: 0, level: 0 },
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
    state.draft.troopType = ocrInput.troopType || state.draft.troopType || "";
    state.draft.troopLevel = state.draft.troopLevel == null ? null : Number(state.draft.troopLevel);
    state.draft.troopConfidence = {
      ...(state.draft.troopConfidence ?? {}),
      type: Number(ocrInput.troopTypeConfidence ?? 0),
      level: Number(state.draft.troopConfidence?.level ?? 0),
    };
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
      troopTypeSource: "icon-template-v1",
      troopTypeScores: ocrInput.troopTypeScores ?? {},
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

        <div class="card form-stack">
          <div class="card-header"><div><h2>部隊情報</h2><small>自動判定・修正可</small></div></div>
          <div class="form-grid-2">
            <label class="field">
              <span>兵種<span class="confidence-dot ${confidenceClass(draft.troopConfidence?.type)}"></span></span>
              <select data-draft-path="troopType">${troopTypeOptions(draft.troopType)}</select>
            </label>
            <label class="field">
              <span>兵種Lv<span class="confidence-dot ${confidenceClass(draft.troopConfidence?.level)}"></span></span>
              <input type="number" inputmode="numeric" min="1" max="10" data-draft-path="troopLevel" value="${escapeAttr(draft.troopLevel ?? "")}" placeholder="例 8" />
            </label>
          </div>
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
                ${file?.ocrPrepared ? `<div class="notice info" style="margin-bottom:10px;font-size:.8rem">戦法レイアウト: ${escapeHtml(file.ocrPrepared.tacticLayout === "closed" ? "閉じ" : file.ocrPrepared.tacticLayout === "open" ? "開き" : "判定不能")} / OCRプロファイル: ${escapeHtml(file.ocrPrepared.profile)} / 兵種判定: ${escapeHtml(troopTypeLabel(file.ocrPrepared.troopType))} (${Number(file.ocrPrepared.troopTypeConfidence ?? 0).toFixed(2)})</div>` : ""}
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
    summary: {
      ...(draft.summary ?? {}),
      completenessScore: completion.score,
      troopType: draft.troopType || "",
      troopLevel: draft.troopLevel === "" || draft.troopLevel == null ? null : Number(draft.troopLevel),
    },
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
    subtitle: `対象：${state.intelSeason || "未設定"}`,
    activeNav: "intel",
    content: `<section class="page-content"><div class="card"><p class="muted" style="margin:0">諜報情報を読み込み中...</p></div></section>`,
  });
  try {
    const response = await apiRequest("intel_dashboard");
    state.intel = response.intel ?? null;
    state.intelSeason = state.intel?.currentSeason ?? state.intelSeason;
    const subtitle = document.querySelector(".page-header-title small");
    if (subtitle) subtitle.textContent = `対象：${state.intelSeason || "未設定"}`;
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


function newFormationDraft() {
  return {
    id: "",
    name: "",
    troopType: "",
    troopLevel: "",
    note: "",
    tags: [],
    isShared: false,
    shareToken: null,
    members: [1, 2, 3].map((slot) => ({
      slot,
      generalQookkaId: "",
      generalName: "",
      tactic1QookkaId: "",
      tactic1Name: "",
      tactic2QookkaId: "",
      tactic2Name: "",
    })),
  };
}

function formationMemberRole(slot) {
  return slot === 1 ? "大将" : `副将${slot - 1}`;
}

function cloneFormationForEdit(formation) {
  const draft = newFormationDraft();
  if (!formation) return draft;
  draft.id = formation.id || "";
  draft.name = formation.name || "";
  draft.troopType = formation.troopType || "";
  draft.troopLevel = formation.troopLevel ?? "";
  draft.note = formation.note || "";
  draft.tags = Array.isArray(formation.tags) ? [...formation.tags] : [];
  draft.isShared = Boolean(formation.isShared);
  draft.shareToken = formation.shareToken || null;
  for (const member of formation.members ?? []) {
    const target = draft.members.find((row) => row.slot === Number(member.slot));
    if (!target) continue;
    Object.assign(target, {
      generalQookkaId: member.generalQookkaId || "",
      generalName: member.generalName || "",
      tactic1QookkaId: member.tactic1QookkaId || "",
      tactic1Name: member.tactic1Name || "",
      tactic2QookkaId: member.tactic2QookkaId || "",
      tactic2Name: member.tactic2Name || "",
    });
  }
  return draft;
}

async function loadMyFormationData({ force = false } = {}) {
  if (!force && state.myInventory && Array.isArray(state.myFormations) && Array.isArray(state.myFormationShareSets) && Array.isArray(state.myFormationConsultations)) return;
  const [inventoryResponse, formationsResponse, shareSetsResponse, consultationsResponse, draftResponse] = await Promise.all([
    apiRequest("my_inventory"),
    apiRequest("my_formations"),
    apiRequest("my_formation_share_sets"),
    apiRequest("my_formation_consultations"),
    apiRequest("my_formation_draft_get").catch(() => ({ draft: null })),
  ]);
  state.myInventory = inventoryResponse.inventory ?? { generals: [], tactics: [], lastImport: null };
  state.myFormations = formationsResponse.formations ?? [];
  state.myFormationShareSets = shareSetsResponse.shareSets ?? [];
  state.myFormationConsultations = consultationsResponse.consultations ?? [];
  state.formationDraftRemote = draftResponse.draft ?? null;
}

function qookkaSyncCard() {
  const last = state.myInventory?.lastImport;
  return `
    <div class="card qookka-sync-card">
      <div class="card-header">
        <div>
          <h2>所持情報を同期</h2>
          <small>Qookka共有URLから武将・戦法を再取得</small>
        </div>
      </div>
      <form class="form-stack" data-form="qookka-sync">
        <label class="field">
          <span>Qookka共有URL</span>
          <input name="url" type="url" inputmode="url" autocomplete="off" required
            placeholder="https://general.qookkagames.com/...snapshot_id=..." />
        </label>
        <button type="submit" class="primary-button">所持情報を更新</button>
      </form>
      <p class="muted compact-note">共有URLは同期のためだけに使います。期限切れ後も取得済みデータはDBに残ります。凸は再同期しても上書きしません。</p>
      ${last ? `<div class="sync-meta">最終同期 ${escapeHtml(formatDateTime(last.importedAt))} ・ 武将${Number(last.generalCount || 0)} ・ 戦法${Number(last.tacticCount || 0)}</div>` : ""}
    </div>`;
}

function formationSummaryMembers(formation) {
  const members = [...(formation?.members ?? [])].sort((a, b) => Number(a.slot) - Number(b.slot));
  if (!members.length) return `<p class="muted">武将未設定</p>`;
  return members.map((member) => `
    <div class="formation-summary-member">
      <div class="formation-summary-general">
        <span class="slot-label">${escapeHtml(formationMemberRole(Number(member.slot)))}</span>
        <strong>${escapeHtml(member.generalName || "未設定")}</strong>
        ${member.generalName ? `<span class="dupe-text">${member.dupeCount == null ? "凸不明" : `${Number(member.dupeCount)}凸`}</span>` : ""}
      </div>
      <div class="formation-summary-tactics">
        ${member.inherentTacticName ? `<span class="inherent-tactic">固有 ${escapeHtml(member.inherentTacticName)}</span>` : ""}
        ${member.tactic1Name ? `<span>${escapeHtml(member.tactic1Name)}</span>` : ""}
        ${member.tactic2Name ? `<span>${escapeHtml(member.tactic2Name)}</span>` : ""}
      </div>
    </div>`).join("");
}

async function renderMyFormations() {
  app.innerHTML = pageHtml({
    title: "マイ編成",
    subtitle: "非公開で保存・必要な編成だけ共有",
    content: `<div class="page-content"><div class="card"><p class="muted">読み込み中...</p></div></div>`,
    activeNav: "formations",
  });
  try {
    await loadMyFormationData({ force: true });
    renderMyFormationsBody();
  } catch (error) {
    app.innerHTML = pageHtml({
      title: "マイ編成",
      subtitle: "非公開で保存・必要な編成だけ共有",
      content: `<div class="page-content"><div class="notice danger">${escapeHtml(error.message)}</div></div>`,
      activeNav: "formations",
    });
  }
}

function formationTagsHtml(formation) {
  const tags = Array.isArray(formation?.tags) ? formation.tags : [];
  return tags.length ? `<div class="formation-tag-list">${tags.map((tag) => `<span class="tag-chip static">${escapeHtml(tag)}</span>`).join("")}</div>` : "";
}

function formationHistoryMembersHtml(snapshot) {
  const members = [...(snapshot?.members ?? [])].sort((a, b) => Number(a.slot) - Number(b.slot));
  if (!members.length) return `<div class="formation-history-empty">武将情報なし</div>`;
  return `<div class="formation-history-members">${members.map((member) => {
    const tactic1 = String(member?.tactic1Name || "").trim();
    const tactic2 = String(member?.tactic2Name || "").trim();
    return `<div class="formation-history-member">
      <div class="formation-history-general"><span>${escapeHtml(formationMemberRole(Number(member.slot)))}</span><strong>${escapeHtml(member.generalName || "未設定")}</strong></div>
      <div class="formation-history-tactics"><span>第1 ${escapeHtml(tactic1 || "未設定")}</span><span>第2 ${escapeHtml(tactic2 || "未設定")}</span></div>
    </div>`;
  }).join("")}</div>`;
}

function formationHistoryHtml(formation) {
  const history = formation?.history ?? [];
  if (!history.length) return "";
  return `<details class="formation-history"><summary>変更履歴 ${history.length}</summary><div class="formation-history-list">
    ${history.map((item, index) => `<article class="formation-history-row">
      <div class="formation-history-head">
        <div><strong>${escapeHtml(formatDateTime(item.createdAt))}</strong><small>${index === 0 ? "直前の状態" : `${index + 1}世代前`}</small></div>
        <button type="button" class="secondary-button compact-button" data-action="restore-formation-history" data-id="${escapeAttr(item.id)}">この状態に戻す</button>
      </div>
      ${formationHistoryMembersHtml(item.snapshot)}
    </article>`).join("")}
  </div></details>`;
}

function renderMyFormationsBody() {
  const inventory = state.myInventory ?? { generals: [], tactics: [] };
  const hasInventory = (inventory.generals?.length ?? 0) > 0 || (inventory.tactics?.length ?? 0) > 0;
  const shareSets = state.myFormationShareSets ?? [];
  const shareSetFormationIds = new Set(shareSets.flatMap((set) => set.formationIds ?? []));
  const singleShared = state.myFormations.filter((formation) => formation.isShared);
  const draftData = state.formationDraftRemote?.payload;
  const hasDraft = draftData && typeof draftData === "object" && ((draftData.name || "").trim() || (draftData.note || "").trim() || draftData.troopType || (draftData.tags ?? []).length || (draftData.members ?? []).some((row) => row.generalQookkaId || row.tactic1QookkaId || row.tactic2QookkaId));
  const formationCards = state.myFormations.length
    ? state.myFormations.map((formation, index) => `
      <article class="card formation-card">
        <div class="formation-card-head">
          <div>
            <div class="formation-title-row">
              <h2>${escapeHtml(formation.name || "名称未設定の編成")}</h2>
              <span class="privacy-badge ${(formation.isShared || shareSetFormationIds.has(formation.id)) ? "shared" : "private"}">${formation.isShared ? "共有中" : (shareSetFormationIds.has(formation.id) ? "まとめ共有中" : "非公開")}</span>
            </div>
            <small>${escapeHtml(observationTroopText({ report_summary: { troopType: formation.troopType, troopLevel: formation.troopLevel } }) || "兵種未設定")}${formation.updatedAt ? ` ・ 更新 ${escapeHtml(formatDateTime(formation.updatedAt))}` : ""}</small>
          </div>
          <div class="formation-order-actions" aria-label="並び替え">
            <button type="button" class="icon-button" data-action="move-formation" data-id="${escapeAttr(formation.id)}" data-direction="up" ${index === 0 ? "disabled" : ""} aria-label="上へ">↑</button>
            <button type="button" class="icon-button" data-action="move-formation" data-id="${escapeAttr(formation.id)}" data-direction="down" ${index === state.myFormations.length - 1 ? "disabled" : ""} aria-label="下へ">↓</button>
          </div>
        </div>
        ${formationTagsHtml(formation)}
        <div class="formation-summary">${formationSummaryMembers(formation)}</div>
        ${formation.note ? `<p class="formation-note">${escapeHtml(formation.note)}</p>` : ""}
        <div class="formation-card-primary-row">
          <button type="button" class="primary-button formation-edit-button" data-action="edit-my-formation" data-id="${escapeAttr(formation.id)}">編成を編集</button>
          ${!formation.isShared ? `<button type="button" class="secondary-button compact-button" data-action="share-my-formation" data-id="${escapeAttr(formation.id)}">共有</button>` : ""}
        </div>
        ${formationHistoryHtml(formation)}
      </article>`).join("")
    : `<div class="card empty-state"><strong>まだ編成がありません</strong><p class="muted">「編成を登録」から最初の編成を作成できます。</p></div>`;

  const consultationHtml = consultationManagementHtml();
  const shareManagementHtml = (singleShared.length || shareSets.length) ? `
    <details class="card share-set-management">
      <summary><strong>共有リンク管理</strong><span>${singleShared.length + shareSets.length}件</span></summary>
      <div class="share-set-management-list">
        ${singleShared.map((formation) => `<div class="share-set-management-row"><div><strong>${escapeHtml(formation.name || "名称未設定")}</strong><small>単体共有</small></div><div class="button-row"><button type="button" class="secondary-button compact-button" data-action="copy-formation-link" data-id="${escapeAttr(formation.id)}">URLコピー</button><button type="button" class="secondary-button compact-button" data-action="regenerate-formation-link" data-id="${escapeAttr(formation.id)}">再発行</button><button type="button" class="text-button danger-text" data-action="unshare-my-formation" data-id="${escapeAttr(formation.id)}">解除</button></div></div>`).join("")}
        ${shareSets.map((set) => `<div class="share-set-management-row"><div><strong>${escapeHtml(set.title || `編成共有 ${Number(set.formationCount || 0)}部隊`)}</strong><small>${(set.formationNames ?? []).map(escapeHtml).join(" / ")}</small></div><div class="button-row"><button type="button" class="secondary-button compact-button" data-action="rename-formation-share-set" data-id="${escapeAttr(set.id)}" data-title="${escapeAttr(set.title || "")}">名前変更</button><button type="button" class="secondary-button compact-button" data-action="copy-formation-share-set" data-token="${escapeAttr(set.shareToken || "")}">URLコピー</button><button type="button" class="secondary-button compact-button" data-action="regenerate-formation-share-set" data-id="${escapeAttr(set.id)}">再発行</button><button type="button" class="text-button danger-text" data-action="revoke-formation-share-set" data-id="${escapeAttr(set.id)}">解除</button></div></div>`).join("")}
      </div>
    </details>` : "";

  app.innerHTML = pageHtml({
    title: "マイ編成",
    subtitle: "編成の登録・編集をすばやく",
    content: `
      <div class="page-content formation-page">
        <div class="formation-primary-actions">
          <button type="button" class="primary-button create-formation-button" data-action="new-my-formation" ${hasInventory ? "" : "disabled"}>＋ 編成を登録</button>
          <button type="button" class="secondary-button create-formation-button" data-action="begin-share-formations" ${state.myFormations.length ? "" : "disabled"}>複数編成をまとめて共有</button>
          <button type="button" class="secondary-button create-formation-button consultation-create-button" data-action="new-formation-consultation" ${hasInventory ? "" : "disabled"}>編成相談を作成</button>
          <button type="button" class="secondary-button create-formation-button" data-action="open-formation-support">他人の編成を組む</button>
        </div>
        ${hasDraft ? `<div class="card draft-resume-card"><div><strong>編集中の下書きがあります</strong><small>${state.formationDraftRemote?.updatedAt ? `自動保存 ${escapeHtml(formatDateTime(state.formationDraftRemote.updatedAt))}` : ""}</small></div><div class="button-row"><button type="button" class="primary-button compact-button" data-action="resume-formation-draft">続きから編集</button><button type="button" class="text-button" data-action="discard-formation-draft">破棄</button></div></div>` : ""}
        ${!hasInventory ? `<div class="notice warning">編成登録・編成相談の前に所持情報が必要です。<button type="button" class="inline-link-button" data-action="navigate" data-view="inventory">所持情報を登録する</button></div>` : ""}
        ${consultationHtml}
        ${shareManagementHtml}
        <div class="section-heading"><h2>保存した編成</h2><span>${state.myFormations.length}件</span></div>
        ${formationCards}
      </div>`,
    activeNav: "formations",
  });
}

function renderFormationShareSelector() {
  const selected = new Set(state.formationShareSelection ?? []);
  const cards = state.myFormations.map((formation) => {
    const isSelected = selected.has(formation.id);
    return `
      <button type="button" class="share-select-card ${isSelected ? "selected" : ""}" data-action="toggle-formation-share-selection" data-id="${escapeAttr(formation.id)}" aria-pressed="${isSelected ? "true" : "false"}">
        <span class="share-select-check" aria-hidden="true">${isSelected ? "✓" : ""}</span>
        <span class="share-select-main">
          <strong>${escapeHtml(formation.name || "名称未設定の編成")}</strong>
          <small>${escapeHtml(observationTroopText({ report_summary: { troopType: formation.troopType, troopLevel: formation.troopLevel } }) || "兵種未設定")}</small>
          <span class="share-select-members">${(formation.members ?? []).map((member) => escapeHtml(member.generalName || "")).filter(Boolean).join(" / ") || "武将未設定"}</span>
        </span>
      </button>`;
  }).join("");
  app.innerHTML = pageHtml({
    title: "まとめて共有",
    subtitle: "共有したい編成を複数選択",
    content: `
      <div class="page-content formation-share-select-page">
        <div class="notice info">選択した編成だけが1つの共有URLに表示されます。所持武将・所持戦法や、選択していない編成は公開されません。</div>
        <div class="share-selection-status"><strong>${selected.size}編成を選択中</strong><button type="button" class="text-button" data-action="clear-formation-share-selection">選択解除</button></div>
        <label class="field"><span>共有セット名</span><input id="formation-share-title" maxlength="80" placeholder="例：PK2 主力3軍" value="${escapeAttr(state.formationShareTitle || "")}" /></label>
        <div class="share-select-list">${cards || `<div class="card empty-state">共有できる編成がありません。</div>`}</div>
        <button type="button" class="primary-button" style="width:100%" data-action="create-formation-share-set" ${selected.size ? "" : "disabled"}>選択した${selected.size}編成の共有URLを作成</button>
        <button type="button" class="secondary-button" style="width:100%" data-action="cancel-formation-share-selection">戻る</button>
      </div>`,
    activeNav: "formations",
  });
}

async function renderMyInventory() {
  if (!state.myInventory) {
    try { await loadMyFormationData({ force: true }); }
    catch (error) { showToast(error.message, "error"); }
  }
  renderMyInventoryBody();
}

function dupeControlHtml(general) {
  const value = Math.max(0, Math.min(5, Number(general.dupeCount || 0)));
  return `
    <div class="dupe-control" data-dupe-id="${escapeAttr(general.qookkaId)}">
      <div class="dupe-control-top"><span>凸</span><strong data-dupe-label>${value}凸</strong></div>
      <div class="dupe-dots" role="group" aria-label="${escapeAttr(general.name)}の凸数">
        ${[1,2,3,4,5].map((step) => `<button type="button" class="dupe-dot-button ${step <= value ? "active" : ""}" data-action="set-my-dupe" data-id="${escapeAttr(general.qookkaId)}" data-value="${step}" aria-label="${step}凸" aria-pressed="${step <= value ? "true" : "false"}"><span class="dupe-dot-shape" aria-hidden="true"></span></button>`).join("")}
      </div>
    </div>`;
}

function applyInventorySearchFilter() {
  const filters = state.inventoryFilters ?? { star: "5", faction: "all", cost: "all" };
  let visibleCount = 0;
  document.querySelectorAll("[data-inventory-general]").forEach((row) => {
    const general = {
      name: row.dataset.inventoryGeneral || "",
      star: row.dataset.star || "",
      faction: row.dataset.faction || "",
      cost: row.dataset.cost || "",
    };
    const visible = generalMatchesFilter(general, state.inventorySearch, filters);
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const count = document.getElementById("inventory-result-count");
  if (count) count.textContent = `${visibleCount}件`;
}

function inventoryFilterControlsHtml(generals) {
  const { factions, costs } = generalFilterValues(generals);
  const filters = state.inventoryFilters ?? { star: "5", faction: "all", cost: "all" };
  return `
    <div class="inventory-filter-panel">
      <label><span>レア度</span><select id="inventory-star-filter">
        <option value="5" ${filters.star === "5" ? "selected" : ""}>★5</option>
        <option value="4" ${filters.star === "4" ? "selected" : ""}>★4</option>
        <option value="all" ${filters.star === "all" ? "selected" : ""}>すべて</option>
      </select></label>
      <label><span>勢力</span><select id="inventory-faction-filter">
        <option value="all">すべて</option>
        ${factions.map((value) => `<option value="${escapeAttr(value)}" ${filters.faction === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
      </select></label>
      <label><span>コスト</span><select id="inventory-cost-filter">
        <option value="all">すべて</option>
        ${costs.map((value) => `<option value="${value}" ${String(filters.cost) === String(value) ? "selected" : ""}>${value}</option>`).join("")}
      </select></label>
      <div class="inventory-result-count"><span>表示中</span><strong id="inventory-result-count">0件</strong></div>
    </div>`;
}

function renderMyInventoryBody() {
  const inventory = state.myInventory ?? { generals: [], tactics: [], lastImport: null };
  app.innerHTML = pageHtml({
    title: "所持情報管理",
    subtitle: `武将${inventory.generals.length} / 戦法${inventory.tactics.length} ・ Qookka同期・凸設定`,
    content: `
      <div class="page-content inventory-page">
        ${qookkaSyncCard()}
        <div class="card">
          <div class="card-header"><div><h2>所持武将</h2><small>○をタップして凸を設定</small></div></div>
          <label class="field compact-search"><span>武将を検索</span><input id="inventory-search" type="search" value="${escapeAttr(state.inventorySearch)}" placeholder="武将名で絞り込み" /></label>
          ${inventoryFilterControlsHtml(inventory.generals)}
          <div class="inventory-general-list">
            ${inventory.generals.length ? inventory.generals.map((general) => `
              <div class="inventory-general-row" data-inventory-general="${escapeAttr(general.name)}" data-star="${escapeAttr(general.star ?? "")}" data-faction="${escapeAttr(general.faction ?? "")}" data-cost="${escapeAttr(general.cost ?? "")}">
                <div class="inventory-general-name">
                  <strong>${escapeHtml(general.name)}</strong>
                  <div class="general-meta-line">${general.star ? `<span>★${Number(general.star)}</span>` : ""}${general.faction ? `<span>${escapeHtml(general.faction)}</span>` : ""}${general.cost ? `<span>コスト${Number(general.cost)}</span>` : ""}</div>
                  ${general.inherentTacticName ? `<small>固有：${escapeHtml(general.inherentTacticName)}</small>` : ""}
                </div>
                ${dupeControlHtml(general)}
              </div>`).join("") : `<p class="muted">所持武将が未同期です。</p>`}
          </div>
          <p class="muted compact-note">例：3つ目をタップすると左から3個が赤丸になります。同じ3つ目をもう一度タップすると0凸へ戻ります。</p>
        </div>
        <details class="card inventory-tactics-card">
          <summary><strong>所持戦法 ${inventory.tactics.length}</strong><span>一覧を見る</span></summary>
          <div class="tactic-chip-list">${inventory.tactics.map((tactic) => `<span class="tactic-chip">${escapeHtml(tactic.name)}</span>`).join("")}</div>
        </details>
      </div>`,
    activeNav: "settings",
    backAction: "back-to-settings",
  });
  applyInventorySearchFilter();
}

function maxTacticCopies(tactic) {
  return FORMATION_TACTIC_COPY_LIMITS[String(tactic?.name || "").trim()] ?? 1;
}

function tacticGradeLabel(tactic) {
  const raw = String(tactic?.grade ?? "").trim().toUpperCase();
  if (raw === "S" || raw === "5") return "S";
  if (raw === "A" || raw === "4") return "A";
  return "";
}

function tacticGradeFilterButtonsHtml(selectedGrades, action) {
  const selected = new Set(selectedGrades ?? []);
  const all = selected.size === 0;
  return `<div class="tactic-kind-filter tactic-grade-filter" role="group" aria-label="戦法ランク">
    <button type="button" class="tactic-kind-chip ${all ? "selected" : ""}" data-action="${escapeAttr(action)}" data-grade="all" aria-pressed="${all ? "true" : "false"}">すべて</button>
    ${["S","A"].map((grade) => `<button type="button" class="tactic-kind-chip ${selected.has(grade) ? "selected" : ""}" data-action="${escapeAttr(action)}" data-grade="${grade}" aria-pressed="${selected.has(grade) ? "true" : "false"}">${grade}</button>`).join("")}
  </div>`;
}

function formationHasTag(formation, tag) {
  return Array.isArray(formation?.tags) && formation.tags.includes(tag);
}

function formationUsageMaps(excludeFormationId = "") {
  const general = new Map();
  const tactic = new Map();
  for (const formation of state.myFormations ?? []) {
    if (excludeFormationId && String(formation.id) === String(excludeFormationId)) continue;
    for (const member of formation.members ?? []) {
      if (member.generalQookkaId) {
        const list = general.get(member.generalQookkaId) ?? [];
        const formationName = formation.name || "名称未設定";
        if (!list.includes(formationName)) list.push(formationName);
        general.set(member.generalQookkaId, list);
      }
      if (formationHasTag(formation, "スタダ")) continue;
      for (const id of [member.tactic1QookkaId, member.tactic2QookkaId]) {
        if (!id) continue;
        const list = tactic.get(id) ?? [];
        const formationName = formation.name || "名称未設定";
        if (!list.includes(formationName)) list.push(formationName);
        tactic.set(id, list);
      }
    }
  }
  return { general, tactic };
}

function syncFormationDraftFromEditor() {
  if (!state.formationDraft) return;
  const form = document.querySelector('[data-form="save-my-formation"]');
  if (!form) return;
  const fd = new FormData(form);
  state.formationDraft.name = String(fd.get("name") ?? "").trim();
  state.formationDraft.note = String(fd.get("note") ?? "").trim();
  state.formationDraft.troopType = String(fd.get("troopType") ?? "");
  state.formationDraft.troopLevel = fd.get("troopLevel") ? Number(fd.get("troopLevel")) : null;
}

function scheduleFormationDraftSave() {
  if (!state.formationDraft) return;
  syncFormationDraftFromEditor();
  if (state.formationDraftSaveTimer) window.clearTimeout(state.formationDraftSaveTimer);
  state.formationDraftStatus = "保存中";
  const payload = structuredClone(state.formationDraft);
  state.formationDraftSaveTimer = window.setTimeout(async () => {
    try {
      await apiRequest("my_formation_draft_save", { draft: payload });
      state.formationDraftRemote = { payload, updatedAt: new Date().toISOString() };
      state.formationDraftStatus = "自動保存済み";
      const badge = document.getElementById("formation-draft-status");
      if (badge) badge.textContent = state.formationDraftStatus;
    } catch (error) {
      state.formationDraftStatus = "下書き保存に失敗";
      const badge = document.getElementById("formation-draft-status");
      if (badge) badge.textContent = state.formationDraftStatus;
    }
  }, 500);
}

function favoriteFirst(items) {
  return [...(items ?? [])].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || String(a.name || "").localeCompare(String(b.name || ""), "ja"));
}

function formationTagEditorHtml(draft) {
  const suggestions = ["主力", "スタダ", "対計略", "対兵刃", "攻城", "試作"];
  const selected = new Set(draft.tags ?? []);
  const custom = [...selected].filter((tag) => !suggestions.includes(tag));
  return `<div class="card formation-tag-card"><div class="field"><span>タグ</span><div class="tag-chip-list">
    ${suggestions.map((tag) => `<button type="button" class="tag-chip ${selected.has(tag) ? "selected" : ""}" data-action="toggle-formation-tag" data-tag="${escapeAttr(tag)}" aria-pressed="${selected.has(tag) ? "true" : "false"}">${escapeHtml(tag)}</button>`).join("")}
    ${custom.map((tag) => `<button type="button" class="tag-chip selected" data-action="toggle-formation-tag" data-tag="${escapeAttr(tag)}" aria-pressed="true">${escapeHtml(tag)}</button>`).join("")}
  </div><div class="tag-add-row"><input id="formation-custom-tag" maxlength="20" placeholder="タグを追加" /><button type="button" class="secondary-button compact-button" data-action="add-formation-tag">追加</button></div></div></div>`;
}

function currentPickerOptions() {
  const picker = state.formationPicker;
  if (!picker || !state.myInventory) return [];
  const source = picker.kind === "general" ? state.myInventory.generals : state.myInventory.tactics;
  const query = normalizeSearchText(picker.query || "");
  const selectedIds = picker.selectedIds ?? [];
  const selectedSet = new Set(selectedIds);
  const tacticUseCounts = new Map();
  const usage = formationUsageMaps(state.formationDraft?.id || "");
  const startupDraft = formationHasTag(state.formationDraft, "スタダ");

  if (picker.kind === "tactic") {
    for (const row of state.formationDraft?.members ?? []) {
      if (Number(row.slot) === Number(picker.slot)) continue;
      for (const field of ["tactic1", "tactic2"]) {
        const id = field === "tactic1" ? row.tactic1QookkaId : row.tactic2QookkaId;
        if (id) tacticUseCounts.set(id, (tacticUseCounts.get(id) || 0) + 1);
      }
    }
  }

  const filtered = source
    .filter((item) => {
      if (picker.kind === "general") return true;
      if (selectedSet.has(item.qookkaId)) return true;
      const localCount = tacticUseCounts.get(item.qookkaId) || 0;
      return localCount < maxTacticCopies(item);
    })
    .filter((item) => {
      if (picker.kind !== "general") {
        const matchesQuery = !query || normalizeSearchText(item.name).includes(query);
        const kindFilters = picker.kindFilters ?? state.formationTacticPickerKinds ?? [];
        const gradeFilters = picker.gradeFilters ?? state.formationTacticPickerGrades ?? ["S"];
        const kindOk = !kindFilters.length || kindFilters.includes(consultationTacticKindLabel(item.kind));
        const gradeLabel = tacticGradeLabel(item);
        const gradeOk = !gradeFilters.length || gradeFilters.includes(gradeLabel);
        return matchesQuery && kindOk && gradeOk;
      }
      if (selectedSet.has(item.qookkaId)) return true;
      const filters = picker.filters ?? state.formationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" };
      return generalMatchesFilter(item, picker.query || "", filters);
    });
  return favoriteFirst(filtered).slice(0, 100);
}

function formationPickerSelectionLabel(picker, itemId) {
  const index = (picker?.selectedIds ?? []).indexOf(itemId);
  if (index < 0) return "";
  if (picker.kind === "general") return formationMemberRole(index + 1);
  return index === 0 ? "第1戦法" : "第2戦法";
}

function formationPickerListHtml() {
  const picker = state.formationPicker;
  if (!picker) return "";
  const options = currentPickerOptions();
  const selectedIds = picker.selectedIds ?? [];
  const usage = formationUsageMaps(state.formationDraft?.id || "");
  return options.length
    ? options.map((item) => {
      const selectionLabel = formationPickerSelectionLabel(picker, item.qookkaId);
      const selected = selectedIds.includes(item.qookkaId);
      const usedIn = picker.kind === "general" ? (usage.general.get(item.qookkaId) ?? []) : (usage.tactic.get(item.qookkaId) ?? []);
      const usageText = usedIn.length ? `使用中：${usedIn.slice(0, 2).join(" / ")}${usedIn.length > 2 ? ` ほか${usedIn.length - 2}` : ""}` : "";
      const startupDraft = formationHasTag(state.formationDraft, "スタダ");
      const blockedByUsage = picker.kind === "tactic" && !selected && !startupDraft && usedIn.length >= maxTacticCopies(item);
      return `<div class="choice-option-row ${selected ? "selected" : ""} ${blockedByUsage ? "usage-blocked" : ""}">
        <button type="button" class="choice-option ${selected ? "selected multi-selected" : ""}" data-action="toggle-formation-choice" data-id="${escapeAttr(item.qookkaId)}" data-name="${escapeAttr(item.name)}" aria-pressed="${selected ? "true" : "false"}" ${blockedByUsage ? "disabled" : ""}>
          <div class="choice-option-main"><strong title="${escapeAttr(item.name)}">${escapeHtml(item.name)}</strong><span class="choice-selection-badge ${selectionLabel ? "" : "empty"}" ${selectionLabel ? "" : 'aria-hidden="true"'}>${escapeHtml(selectionLabel || (picker.kind === "general" ? "副将2" : "第2戦法"))}</span></div>
          ${picker.kind === "general"
            ? `<span>${Number(item.dupeCount || 0)}凸${item.star ? ` ・ ★${Number(item.star)}` : ""}${item.faction ? ` ・ ${escapeHtml(item.faction)}` : ""}${item.cost ? ` ・ コスト${Number(item.cost)}` : ""}${usageText ? ` ・ ${escapeHtml(usageText)}` : ""}</span>`
            : `<span>${escapeHtml(tacticGradeLabel(item) || "ランク未確認")} ・ ${escapeHtml(consultationTacticKindLabel(item.kind))}${usageText ? ` ・ ${escapeHtml(usageText)}` : ""}</span>`}
        </button>
        <button type="button" class="favorite-toggle ${item.favorite ? "selected" : ""}" data-action="toggle-formation-favorite" data-kind="${picker.kind}" data-id="${escapeAttr(item.qookkaId)}" aria-label="${item.favorite ? "お気に入り解除" : "お気に入り登録"}" aria-pressed="${item.favorite ? "true" : "false"}">★</button>
      </div>`;
    }).join("")
    : `<div class="choice-empty">候補がありません</div>`;
}

function formationPickerSelectedSummaryHtml() {
  const picker = state.formationPicker;
  if (!picker) return "";
  const source = picker.kind === "general" ? (state.myInventory?.generals ?? []) : (state.myInventory?.tactics ?? []);
  return pickerSelectedSummaryHtml(picker, source);
}

function pickerSelectedSummaryHtml(picker, source) {
  const general = picker.kind === "general";
  const slots = Array.from({ length: general ? 3 : 2 }, (_, index) => {
    const id = picker.selectedIds?.[index];
    const item = (source ?? []).find((row) => row.qookkaId === id);
    const role = general ? formationMemberRole(index + 1) : index === 0 ? "第1" : "第2";
    return `<span class="picker-selection-slot ${item ? "selected" : "empty"}"><small>${escapeHtml(role)}</small><strong title="${escapeAttr(item?.name || "未選択")}">${escapeHtml(item?.name || "未選択")}</strong></span>`;
  });
  return `<div class="multi-choice-summary ${general ? "picker-general-summary" : "picker-tactic-summary"}">${slots.join("")}</div>`;
}

function formationPickerFiltersHtml() {
  const picker = state.formationPicker;
  if (!picker) return "";
  if (picker.kind === "general") {
    const { factions, costs } = generalFilterValues(state.myInventory?.generals ?? []);
    const filters = picker.filters ?? state.formationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" };
    return `
      <div class="picker-filter-grid">
        <select id="formation-picker-star" aria-label="レア度">
          <option value="5" ${filters.star === "5" ? "selected" : ""}>★5</option>
          <option value="4" ${filters.star === "4" ? "selected" : ""}>★4</option>
          <option value="all" ${filters.star === "all" ? "selected" : ""}>全レア</option>
        </select>
        <select id="formation-picker-faction" aria-label="勢力">
          <option value="all">全勢力</option>
          ${factions.map((value) => `<option value="${escapeAttr(value)}" ${filters.faction === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
        </select>
        <select id="formation-picker-cost" aria-label="コスト">
          <option value="all">全コスト</option>
          ${costs.map((value) => `<option value="${value}" ${String(filters.cost) === String(value) ? "selected" : ""}>コスト${value}</option>`).join("")}
        </select>
      </div>`;
  }
  const kinds = consultationTacticKindValues(state.myInventory?.tactics ?? []);
  const selectedKinds = picker.kindFilters ?? state.formationTacticPickerKinds ?? [];
  const selectedGrades = picker.gradeFilters ?? state.formationTacticPickerGrades ?? ["S"];
  return `<div class="picker-filter-section"><small>ランク</small>${tacticGradeFilterButtonsHtml(selectedGrades, "toggle-formation-tactic-grade")}</div>
    <div class="picker-filter-section"><small>種別</small>${tacticKindFilterButtonsHtml(kinds, selectedKinds, "toggle-formation-tactic-kind", "戦法種別")}</div>`;
}

function formationPickerHtml() {
  const picker = state.formationPicker;
  if (!picker) return "";
  const title = picker.kind === "general" ? "武将をまとめて選択" : `${formationMemberRole(picker.slot)}の戦法を選択`;
  const limit = picker.kind === "general" ? 3 : 2;
  return `
    <div class="choice-sheet-backdrop" data-action="close-formation-picker"></div>
    <section class="choice-sheet multi-choice-sheet ${picker.kind === "general" ? "general-choice-sheet" : ""}" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
      <div class="choice-sheet-handle" aria-hidden="true"></div>
      <div class="choice-sheet-header"><div><strong>${escapeHtml(title)}</strong><small>最大${limit}つまで選択</small></div><button type="button" class="icon-button" data-action="close-formation-picker">×</button></div>
      ${formationPickerSelectedSummaryHtml()}
      <div class="choice-filter-stack">
        <input id="formation-picker-search" class="choice-search" type="search" autocomplete="off" placeholder="名前を入力して絞り込み" value="${escapeAttr(picker.query || "")}" />
        ${formationPickerFiltersHtml()}
      </div>
      <div id="formation-picker-list" class="choice-list">${formationPickerListHtml()}</div>
      <div class="multi-choice-footer"><button type="button" class="secondary-button" data-action="clear-formation-multi-choice">選択解除</button><button type="button" class="primary-button" data-action="confirm-formation-multi-choice">決定</button></div>
    </section>`;
}

function refreshFormationPickerOptions({ selectionOnly = false } = {}) {
  const list = document.getElementById("formation-picker-list");
  if (selectionOnly) updatePickerSelectionDom(list, state.formationPicker, "toggle-formation-choice");
  else if (list) list.innerHTML = formationPickerListHtml();
  const summary = document.querySelector(".multi-choice-summary");
  if (summary) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = formationPickerSelectedSummaryHtml();
    summary.replaceWith(wrapper.firstElementChild);
  }
}

function updatePickerSelectionDom(list, picker, action) {
  if (!list || !picker) return;
  // 選択時には候補DOMを入れ替えない。スクロール・フォーカス・カード位置を保つ。
  for (const button of list.querySelectorAll?.(`[data-action="${action}"]`) ?? []) {
    const label = formationPickerSelectionLabel(picker, button.dataset.id);
    const selected = Boolean(label);
    button.classList.toggle("selected", selected);
    button.classList.toggle("multi-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.closest(".choice-option-row")?.classList.toggle("selected", selected);
    const badge = button.querySelector(".choice-selection-badge");
    if (badge) {
      badge.textContent = label || (picker.kind === "general" ? "副将2" : "第2戦法");
      badge.classList.toggle("empty", !selected);
      if (selected) badge.removeAttribute("aria-hidden"); else badge.setAttribute("aria-hidden", "true");
    }
  }
}

function formationSwapToolbarHtml() {
  const swap = state.formationSwap;
  const activeKind = swap?.kind || "";
  const guide = activeKind
    ? `<small>${activeKind === "general" ? "入れ替える武将を2人タップ" : "入れ替える戦法枠を2つタップ"}</small>`
    : `<small>選び直さず位置だけ交換</small>`;
  return `
    <div class="formation-swap-toolbar ${activeKind ? "active" : ""}">
      <div><strong>入れ替え</strong>${guide}</div>
      <div class="formation-swap-actions">
        <button type="button" class="secondary-button compact-button ${activeKind === "general" ? "selected" : ""}" data-action="start-formation-swap" data-kind="general">武将</button>
        <button type="button" class="secondary-button compact-button ${activeKind === "tactic" ? "selected" : ""}" data-action="start-formation-swap" data-kind="tactic">戦法</button>
        ${activeKind ? `<button type="button" class="text-button" data-action="cancel-formation-swap">終了</button>` : ""}
      </div>
    </div>`;
}

function formationTacticSwapTargetsHtml(member) {
  if (state.formationSwap?.kind !== "tactic") return "";
  const first = state.formationSwap?.first;
  return `<div class="tactic-swap-targets">
    ${[1,2].map((index) => {
      const field = `tactic${index}`;
      const name = member[`${field}Name`] || `第${index}戦法：空き`;
      const selected = first && Number(first.slot) === Number(member.slot) && first.field === field;
      return `<button type="button" class="tactic-swap-target ${selected ? "swap-first-selected" : ""}" data-action="select-formation-swap-tactic" data-slot="${member.slot}" data-field="${field}"><small>第${index}</small><strong>${escapeHtml(name)}</strong></button>`;
    }).join("")}
  </div>`;
}

function swapMemberSlots(members, slotA, slotB) {
  if (!Array.isArray(members) || Number(slotA) === Number(slotB)) return;
  const indexA = members.findIndex((row) => Number(row.slot) === Number(slotA));
  const indexB = members.findIndex((row) => Number(row.slot) === Number(slotB));
  if (indexA < 0 || indexB < 0) return;
  const a = { ...members[indexA], slot: Number(slotB) };
  const b = { ...members[indexB], slot: Number(slotA) };
  members[indexA] = b;
  members[indexB] = a;
  members.sort((x, y) => Number(x.slot) - Number(y.slot));
}

function swapTacticSlots(members, first, second) {
  if (!Array.isArray(members) || !first || !second) return;
  if (Number(first.slot) === Number(second.slot) && first.field === second.field) return;
  const memberA = members.find((row) => Number(row.slot) === Number(first.slot));
  const memberB = members.find((row) => Number(row.slot) === Number(second.slot));
  if (!memberA || !memberB) return;
  const idA = `${first.field}QookkaId`;
  const nameA = `${first.field}Name`;
  const idB = `${second.field}QookkaId`;
  const nameB = `${second.field}Name`;
  const tempId = memberA[idA] || "";
  const tempName = memberA[nameA] || "";
  memberA[idA] = memberB[idB] || "";
  memberA[nameA] = memberB[nameB] || "";
  memberB[idB] = tempId;
  memberB[nameB] = tempName;
}

function formationTacticPanelExpanded(slot) {
  return (state.formationExpandedTacticSlots ?? []).includes(Number(slot));
}

function consultationTacticPanelExpanded(formationIndex, slot) {
  const slots = state.consultationExpandedTacticSlots?.[String(formationIndex)] ?? [];
  return slots.includes(Number(slot));
}

function dndHandleHtml(label) {
  return `<button type="button" class="formation-dnd-handle" data-action="formation-dnd-handle" aria-label="${escapeAttr(label)}">⋮⋮</button>`;
}

function tacticDndSlotHtml({ context, formationIndex = null, member, field, label }) {
  const name = member?.[`${field}Name`] || "空き";
  const hasValue = Boolean(member?.[`${field}QookkaId`]);
  const formationAttr = formationIndex === null ? "" : ` data-formation-index="${formationIndex}"`;
  return `<div class="formation-tactic-dnd-slot ${hasValue ? "filled" : "empty"}" data-dnd-type="tactic" data-dnd-context="${context}"${formationAttr} data-slot="${member.slot}" data-field="${field}" data-dnd-drop-type="tactic" draggable="${hasValue ? "true" : "false"}">
    <div><small>${escapeHtml(label)}</small><strong>${escapeHtml(name)}</strong></div>
    ${dndHandleHtml(`${label}をドラッグして移動`)}
  </div>`;
}

function memberEditorHtml(member) {
  const general = state.myInventory?.generals?.find((row) => row.qookkaId === member.generalQookkaId);
  const expanded = Boolean(member.generalName) && formationTacticPanelExpanded(member.slot);
  return `
    <section class="formation-member-editor ${expanded ? "tactics-open" : ""}">
      <div class="member-editor-title"><span>${escapeHtml(formationMemberRole(member.slot))}</span>${general ? `<strong>${escapeHtml(consultationDupeText(general))}</strong>` : ""}</div>
      <div class="selected-general-display ${member.generalName ? "selected" : ""}" data-action="toggle-formation-tactic-panel" data-slot="${member.slot}" data-dnd-type="general" data-dnd-context="my" data-dnd-drop-type="general" draggable="${member.generalName ? "true" : "false"}" role="button" tabindex="0" aria-expanded="${expanded ? "true" : "false"}">
        <div class="selected-general-main"><span>${member.generalName ? escapeHtml(member.generalName) : "武将未選択"}</span>${general?.inherentTacticName ? `<small>固有：${escapeHtml(general.inherentTacticName)}</small>` : ""}</div>
        ${member.generalName ? dndHandleHtml(`${member.generalName}をドラッグして移動`) : ""}
        ${member.generalName ? `<span class="tactic-panel-chevron">${expanded ? "▲" : "▼"}</span>` : ""}
      </div>
      ${expanded ? `<div class="formation-tactic-panel">
        <div class="formation-tactic-dnd-grid">
          ${tacticDndSlotHtml({ context:"my", member, field:"tactic1", label:"第1戦法" })}
          ${tacticDndSlotHtml({ context:"my", member, field:"tactic2", label:"第2戦法" })}
        </div>
        <button type="button" class="search-choice-button tactic-batch-choice ${(member.tactic1Name || member.tactic2Name) ? "selected" : ""}" data-action="open-formation-picker" data-kind="tactic" data-slot="${member.slot}" data-field="tactics">
          <span><b>${(member.tactic1Name || member.tactic2Name) ? "戦法を変更" : "戦法を選択"}</b><small>第1・第2戦法をまとめて選択</small></span><small>選択 ›</small>
        </button>
      </div>` : ""}
    </section>`;
}

function formationGeneralBatchButtonHtml() {
  const names = (state.formationDraft?.members ?? []).map((member) => member.generalName).filter(Boolean);
  return `<button type="button" class="search-choice-button formation-general-batch-button ${names.length ? "selected" : ""}" data-action="open-formation-picker" data-kind="general" data-field="generals"><span><b>${names.length ? escapeHtml(names.join(" / ")) : "武将を選択"}</b><small>大将・副将1・副将2をまとめて選択</small></span><small>選択 ›</small></button>`;
}

function parseConsultationTokenInput(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw, window.location.href);
    const token = url.searchParams.get("consultation");
    if (token) return token.trim();
  } catch {
    // token単体入力へフォールバック
  }
  return /^[A-Za-z0-9_-]{20,}$/.test(raw) ? raw : "";
}

function loadFormationSupportLocal() {
  try {
    const raw = window.localStorage.getItem(FORMATION_SUPPORT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    if (!value?.inventory?.generals || !value?.inventory?.tactics || !value?.draft?.formations) return null;
    return value;
  } catch {
    return null;
  }
}

function persistFormationSupportLocal() {
  if (!state.formationSupportMode || !state.sharedConsultation?.inventory || !state.consultationDraft) return;
  state.formationSupportWorkspaceKey ||= `direct:${newConsultationRequestId()}`;
  const payload = supportWorkspacePayload();
  const savedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(FORMATION_SUPPORT_STORAGE_KEY, JSON.stringify({ ...payload,
      workspaceKey: currentSupportWorkspaceKey(), sync: supportLocalSyncMetadata(), savedAt }));
    state.formationSupportSavedAt = savedAt;
  } catch {
    // localStorageが利用できない環境でも編成作業自体は継続する。
  }
  queueSupportCloudSave(payload);
}

function clearFormationSupportLocal() {
  try { window.localStorage.removeItem(FORMATION_SUPPORT_STORAGE_KEY); } catch {}
  state.formationSupportSavedAt = "";
}

function restoreFormationSupportLocal(saved = loadFormationSupportLocal()) {
  if (!saved) return false;
  state.formationSupportMode = true;
  state.formationSupportName = String(saved.name || "");
  state.formationSupportSavedAt = String(saved.savedAt || "");
  state.formationSupportWorkspaceKey = /^direct:[a-f0-9-]{36}$/i.test(saved.workspaceKey || "") ? saved.workspaceKey : `direct:${newConsultationRequestId()}`;
  state.sharedConsultation = {
    title: state.formationSupportName ? `${state.formationSupportName}さんの編成` : "他人の編成",
    note: "",
    inventory: saved.inventory,
  };
  state.consultationDraft = saved.draft;
  applySupportWorkspaceSettings(saved);
  state.consultationPicker = null;
  state.consultationSwap = null;
  state.consultationExpandedTacticSlots = {};
  return true;
}


function formationConsultationDraftStorageKey(token = state.consultationToken) {
  const clean = String(token || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100);
  return clean ? `${FORMATION_CONSULTATION_DRAFT_PREFIX}${clean}` : "";
}

function loadFormationConsultationLocal(token = state.consultationToken) {
  const key = formationConsultationDraftStorageKey(token);
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved?.draft?.formations) return null;
    return saved;
  } catch {
    return null;
  }
}

function persistFormationConsultationLocal() {
  if (state.formationSupportMode || !state.consultationToken || !state.consultationDraft) return;
  const key = formationConsultationDraftStorageKey();
  if (!key) return;
  const payload = supportWorkspacePayload();
  const savedAt = new Date().toISOString();
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...payload,
      workspaceKey: currentSupportWorkspaceKey(), sync: supportLocalSyncMetadata(), savedAt }));
    state.consultationLocalSavedAt = savedAt;
  } catch {
    // localStorageが使えない環境では保存せず、そのまま作業を続ける。
  }
  queueSupportCloudSave(payload);
}

function clearFormationConsultationLocal(token = state.consultationToken) {
  const key = formationConsultationDraftStorageKey(token);
  if (!key) return;
  try { window.localStorage.removeItem(key); } catch {}
  state.consultationLocalSavedAt = "";
}

function persistConsultationWorkspaceLocal() {
  if (state.formationSupportMode) persistFormationSupportLocal();
  else persistFormationConsultationLocal();
}

function enemyDatabaseUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function currentSupportWorkspaceKey() {
  return state.formationSupportMode ? state.formationSupportWorkspaceKey : state.consultationToken ? `consultation:${state.consultationToken}` : "";
}

function supportPayloadSignature(value) {
  const ordered = (item) => Array.isArray(item) ? item.map(ordered) : item && typeof item === "object"
    ? Object.fromEntries(Object.keys(item).sort().filter((key) => item[key] !== undefined).map((key) => [key, ordered(item[key])])) : item;
  return JSON.stringify(ordered(value));
}

function supportPayloadPatch(payload, base) {
  if (!base) return null;
  // 所持情報が変わらない編集では、所持武将・戦法を繰り返し送らない。
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) =>
    supportPayloadSignature(value) !== supportPayloadSignature(base[key])));
}

function supportWorkspacePayload() {
  const pick = (value, keys) => Object.fromEntries(keys.filter((key) => value && Object.prototype.hasOwnProperty.call(value, key)).map((key) => [key, value[key]]));
  const draft = state.consultationDraft;
  const payload = {
    name: state.formationSupportMode ? state.formationSupportName || "" : "",
    draft: { ...pick(draft, ["proposerName", "note", "isPublic", "requestId", "requestSignature"]),
      formations: (draft?.formations ?? []).map((formation) => ({ ...pick(formation, ["name", "note", "troopType", "troopLevel"]),
        members: (formation.members ?? []).map((member) => pick(member, ["slot", "generalQookkaId", "generalName", "tactic1QookkaId", "tactic1Name", "tactic2QookkaId", "tactic2Name", "dupeCount", "inherentTacticName"])) })) },
    paletteSearch: state.consultationTacticPaletteSearch || "", paletteKinds: state.consultationTacticPaletteKinds ?? [],
    paletteGrades: state.consultationTacticPaletteGrades ?? ["S"], paletteSource: state.consultationTacticPaletteSource || "owned",
    hideUsedTactics: state.consultationHideUsedTactics === true,
    generalFilters: state.consultationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" },
    inventoryOpen: state.consultationInventoryOpen,
    submitted: state.consultationSubmitted === true, submittedAt: state.consultationSubmittedAt || "",
  };
  if (state.formationSupportMode) {
    const inventory = state.sharedConsultation?.inventory ?? { generals: [], tactics: [] };
    payload.inventory = { generals: inventory.generals.map((row) => pick(row, ["qookkaId", "name", "inherentTacticName", "star", "cost", "faction", "level", "sourceOrder", "dupeCount", "supportCandidate", "favorite"])),
      tactics: inventory.tactics.map((row) => pick(row, ["qookkaId", "name", "grade", "kind"])) };
  } else {
    payload.candidateGeneralIds = (state.sharedConsultation?.inventory?.generals ?? []).filter(consultationGeneralCandidateEnabled).map((row) => row.qookkaId);
  }
  // API呼出し中に編集しても、送信済みスナップショットを書き換えない。
  return JSON.parse(JSON.stringify(payload));
}

function applySupportWorkspaceSettings(saved) {
  state.consultationTacticPaletteSearch = String(saved?.paletteSearch || "");
  state.consultationTacticPaletteKinds = Array.isArray(saved?.paletteKinds) ? saved.paletteKinds.slice(0, 1) : [];
  state.consultationTacticPaletteGrades = Array.isArray(saved?.paletteGrades) ? saved.paletteGrades.slice(0, 1) : ["S"];
  state.consultationTacticPaletteSource = saved?.paletteSource === "teachable" ? "teachable" : "owned";
  state.consultationHideUsedTactics = saved?.hideUsedTactics === true;
  state.consultationGeneralPickerFilters = saved?.generalFilters && typeof saved.generalFilters === "object" ? saved.generalFilters : { star: "5", faction: "all", cost: "all" };
  state.consultationInventoryOpen = typeof saved?.inventoryOpen === "boolean" ? saved.inventoryOpen : null;
  state.consultationSubmitted = saved?.submitted === true;
  state.consultationSubmittedAt = saved?.submittedAt || "";
}

function supportLocalSyncMetadata(context = state.supportSync) {
  if (context?.key === currentSupportWorkspaceKey() && context.conflict) return context.localMetadata || null;
  if (context?.key === currentSupportWorkspaceKey() && !context.accountId) return context.localMetadata || null;
  return context?.key === currentSupportWorkspaceKey() && context.accountId
    ? { accountId: context.accountId, revision: context.revision, baseSignature: context.baseSignature } : null;
}

function supportLocalStorageKey(context) {
  return context.kind === "direct" ? FORMATION_SUPPORT_STORAGE_KEY : formationConsultationDraftStorageKey(context.key.slice("consultation:".length));
}

function updateSupportLocalSyncMetadata(context) {
  try {
    const key = supportLocalStorageKey(context);
    const saved = JSON.parse(window.localStorage.getItem(key) || "null");
    if (!saved || (saved.workspaceKey && saved.workspaceKey !== context.key)) return;
    saved.sync = { accountId: context.accountId, revision: context.revision, baseSignature: context.baseSignature };
    window.localStorage.setItem(key, JSON.stringify(saved));
  } catch {}
}

function savedSupportPayload(saved) {
  if (!saved) return null;
  const { savedAt, sync, workspaceKey, ...payload } = saved;
  return payload;
}

async function openSupportCloudWorkspace(key, localSaved, { preferRemote = false } = {}) {
  const previous = state.supportSync;
  if (previous?.timer) window.clearTimeout(previous.timer);
  if (previous?.pending && !previous.error && !previous.conflict) void flushSupportCloudSave(previous);
  const context = { key, kind: key.startsWith("direct:") ? "direct" : "consultation", linked: null, accountId: null,
    revision: 0, baseSignature: "", pending: null, timer: null, promise: null, error: "", conflict: null, loading: true, updatedAt: "",
    basePayload: null, supportsPayloadPatch: false, pendingSince: null,
    localMetadata: localSaved?.sync || null, title: "編成相談" };
  state.supportSync = context;
  try {
    const response = await apiRequest("formation_support_draft_get", { workspaceKey: key });
    if (state.supportSync !== context) return localSaved;
    context.linked = response.linked === true;
    state.supportCloudLinked = context.linked;
    if (!context.linked) return localSaved;
    context.accountId = response.accountId;
    context.supportsPayloadPatch = response.supportsPayloadPatch === true;
    const remote = response.draft;
    context.revision = remote?.revision ?? 0;
    context.updatedAt = remote?.updatedAt || "";
    context.baseSignature = remote?.payload ? supportPayloadSignature(remote.payload) : "";
    context.basePayload = context.baseSignature ? JSON.parse(context.baseSignature) : null;
    const metadata = localSaved?.sync;
    const localSignature = localSaved ? supportPayloadSignature(savedSupportPayload(localSaved)) : "";
    const remoteSaved = remote?.payload ? { ...remote.payload, workspaceKey: key, savedAt: remote.updatedAt,
      sync: { accountId: context.accountId, revision: context.revision, baseSignature: context.baseSignature } } : null;
    if (localSaved && metadata?.accountId && metadata.accountId !== context.accountId) {
      context.conflict = { remote, accountChanged: true };
      return localSaved;
    }
    if (preferRemote || !localSaved) return remoteSaved;
    if (remote && localSignature === context.baseSignature) return remoteSaved;
    if (remote && (remote.deleted || (!metadata || metadata.revision !== context.revision) && localSignature !== metadata?.baseSignature)) {
      context.conflict = { remote };
      return localSaved;
    }
    if (remoteSaved && metadata?.revision !== context.revision) return remoteSaved;
    return localSaved;
  } catch (error) {
    if (state.supportSync === context) context.error = error.message || "アカウントの下書きを取得できません。";
    return localSaved;
  } finally {
    context.loading = false;
    updateSupportSyncStatus();
  }
}

function queueSupportCloudSave(payload = supportWorkspacePayload()) {
  const context = state.supportSync;
  if (!context || context.key !== currentSupportWorkspaceKey() || context.linked !== true || context.loading) return;
  const signature = supportPayloadSignature(payload);
  context.pending = !context.promise && signature === context.baseSignature ? null : payload;
  if (!context.pending) context.pendingSince = null;
  else context.pendingSince ??= Date.now();
  context.title = state.sharedConsultation?.title || (context.kind === "direct" ? "他人の編成" : "編成相談");
  if (context.timer) window.clearTimeout(context.timer);
  if (context.pending && !context.error && !context.conflict && navigator.onLine !== false) {
    const reduced = consultationSaveDataEnabled();
    const delay = Math.max(0, Math.min(reduced ? 10_000 : 3_000,
      (context.pendingSince + (reduced ? 30_000 : 15_000)) - Date.now()));
    context.timer = window.setTimeout(() => void flushSupportCloudSave(context), delay);
  }
  updateSupportSyncStatus();
}

async function flushSupportCloudSave(context = state.supportSync) {
  if (!context || context.linked !== true || context.loading || context.error || context.conflict) return false;
  if (navigator.onLine === false) return false;
  if (context.timer) { window.clearTimeout(context.timer); context.timer = null; }
  if (context.promise) { await context.promise; return flushSupportCloudSave(context); }
  if (!context.pending) return true;
  const payload = context.pending;
  const signature = supportPayloadSignature(payload);
  const title = context.kind === "direct" ? payload.name ? `${payload.name}さんの編成` : "他人の編成" : context.title;
  const patch = context.supportsPayloadPatch && context.revision > 0 ? supportPayloadPatch(payload, context.basePayload) : null;
  context.promise = (async () => {
    try {
      const response = await apiRequest("formation_support_draft_save", { workspaceKey: context.key,
        accountId: context.accountId, expectedRevision: context.revision, title,
        ...(patch ? { payloadPatch: patch } : { payload }) });
      if (response.accountId !== context.accountId) throw new Error("Discord連携が変わりました。端末の下書きは保持しています。");
      context.revision = response.draft.revision;
      context.updatedAt = response.draft.updatedAt;
      context.baseSignature = signature;
      context.basePayload = payload;
      if (context.pending && supportPayloadSignature(context.pending) === signature) {
        context.pending = null; context.pendingSince = null;
      }
      updateSupportLocalSyncMetadata(context);
      return true;
    } catch (error) {
      if (error.code === "SUPPORT_DRAFT_CONFLICT") {
        context.localMetadata ||= { accountId: context.accountId, revision: context.revision, baseSignature: context.baseSignature };
        try {
          const response = await apiRequest("formation_support_draft_get", { workspaceKey: context.key });
          context.conflict = { remote: response.draft, accountChanged: response.accountId !== context.accountId };
        } catch { context.error = "別端末の更新を取得できません。端末の下書きは保持しています。"; }
      } else {
        context.error = error.message || "アカウントへの保存に失敗しました。";
      }
      return false;
    } finally {
      context.promise = null;
      updateSupportSyncStatus();
    }
  })();
  updateSupportSyncStatus();
  const saved = await context.promise;
  if (saved && context.pending) return flushSupportCloudSave(context);
  return saved;
}

function supportSyncStatusHtml() {
  const context = state.supportSync;
  if (!context || context.key !== currentSupportWorkspaceKey() || context.loading) return `<span>端末に自動保存 · アカウントを確認中…</span>`;
  if (context.conflict) return `<div><strong>${context.conflict.accountChanged ? "Discord連携が変わりました" : context.conflict.remote?.deleted ? "別端末で削除されています" : "別端末で更新されています"}</strong><small>この端末の内容は残しています。保存する内容を選んでください。</small></div><div class="button-row"><button type="button" class="secondary-button compact-button" data-action="support-use-remote">アカウントの内容を開く</button><button type="button" class="secondary-button compact-button" data-action="support-use-local">この端末の内容を保存</button></div>`;
  if (context.error) return `<div><strong>端末の下書きは保持しています</strong><small>${escapeHtml(context.error)}</small></div><button type="button" class="secondary-button compact-button" data-action="support-retry-sync">再接続</button>`;
  if (!context.linked) return `<div><span>この端末に自動保存</span><small>Discord連携すると別端末でも開けます。</small></div><button type="button" class="text-button" data-action="navigate" data-view="intel">Discord連携</button>`;
  const status = context.promise ? "アカウントへ保存中…" : context.pending ? "端末に保存済み · アカウントへの保存待ち" : context.updatedAt ? "Discordアカウントに保存済み" : "Discord連携済み · 入力すると自動保存";
  return `<div><span>${status}</span><small>${context.updatedAt ? `${escapeHtml(formatDateTime(context.updatedAt))} · 同じDiscordで別端末から再開できます` : "他人の編成を組む → アカウントに保存した編成から再開できます"}</small></div>`;
}

function supportSyncNoticeHtml() {
  return `<div id="support-sync-status" class="consultation-autosave-note support-sync-status" role="status">${supportSyncStatusHtml()}</div>`;
}

function updateSupportSyncStatus() {
  if (!["formation-consultation", "formation-support-workspace"].includes(state.view)) return;
  const panel = document.getElementById("support-sync-status");
  if (panel) panel.innerHTML = supportSyncStatusHtml();
}

async function resolveSupportSync(useRemote) {
  const context = state.supportSync;
  if (!context || context.key !== currentSupportWorkspaceKey()) return;
  if (context.promise) await context.promise;
  const response = await apiRequest("formation_support_draft_get", { workspaceKey: context.key });
  if (state.supportSync !== context) return;
  if (!response.linked) { context.linked = false; context.error = ""; context.conflict = null; updateSupportSyncStatus(); return; }
  const remote = response.draft;
  context.linked = true; context.accountId = response.accountId; context.revision = remote?.revision ?? 0;
  context.baseSignature = remote?.payload ? supportPayloadSignature(remote.payload) : "";
  context.basePayload = context.baseSignature ? JSON.parse(context.baseSignature) : null;
  context.supportsPayloadPatch = response.supportsPayloadPatch === true;
  context.updatedAt = remote?.updatedAt || ""; context.conflict = null; context.error = ""; context.localMetadata = null;
  if (useRemote) {
    if (!remote?.payload) {
      if (context.kind === "direct") clearFormationSupportLocal(); else clearFormationConsultationLocal();
      context.pending = null;
      await navigate("formation-support-start");
      return;
    }
    if (context.kind === "direct") restoreFormationSupportLocal({ ...remote.payload, workspaceKey: context.key, savedAt: remote.updatedAt });
    else {
      state.consultationDraft = remote.payload.draft;
      initializeFormalConsultationCandidates(remote.payload.candidateGeneralIds);
      applySupportWorkspaceSettings(remote.payload);
    }
    context.pending = null;
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBody();
  } else {
    persistConsultationWorkspaceLocal();
    await flushSupportCloudSave(context);
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden) void flushSupportCloudSave();
});
window.addEventListener("pagehide", () => { void flushSupportCloudSave(); });
window.addEventListener("online", () => {
  // 復帰後も版の照合は通常の保存・競合処理を通す。
  void flushSupportCloudSave();
  consultationAnswersNextAt = Date.now();
});

async function retrySupportCloudSync() {
  const key = currentSupportWorkspaceKey();
  persistConsultationWorkspaceLocal();
  const localSaved = state.formationSupportMode ? loadFormationSupportLocal() : loadFormationConsultationLocal();
  const saved = await openSupportCloudWorkspace(key, localSaved);
  if (currentSupportWorkspaceKey() !== key || state.supportSync?.key !== key) return;
  if (saved) {
    if (state.formationSupportMode) restoreFormationSupportLocal(saved);
    else { state.consultationDraft = saved.draft; initializeFormalConsultationCandidates(saved.candidateGeneralIds); applySupportWorkspaceSettings(saved); }
  }
  persistConsultationWorkspaceLocal();
  renderFormationConsultationBody();
  await flushSupportCloudSave();
}

async function openSavedSupportCloudDraft(key) {
  if (key.startsWith("consultation:")) {
    state.formationSupportMode = false;
    state.consultationToken = key.slice("consultation:".length);
    state.sharedConsultation = null; state.consultationDraft = null; state.consultationPicker = null;
    await navigate("formation-consultation");
    return;
  }
  if (!/^direct:[a-f0-9-]{36}$/i.test(key)) return;
  const local = loadFormationSupportLocal();
  const saved = await openSupportCloudWorkspace(key, local?.workspaceKey === key ? local : null);
  if (state.supportSync?.key !== key || state.view !== "formation-support-start") return;
  if (!saved || !restoreFormationSupportLocal({ ...saved, workspaceKey: key })) throw new Error("保存した編成を開けません。アカウントと一覧を確認してください。");
  state.consultationToken = "";
  persistFormationSupportLocal();
  await navigate("formation-support-workspace");
}

async function deleteSavedSupportCloudDraft(key) {
  const item = state.supportCloudDrafts.find((draft) => draft.workspaceKey === key);
  if (!item || !window.confirm(`「${item.title || "他人の編成"}」をアカウントの保存一覧から削除しますか？送信した回答は削除されません。`)) return;
  const context = state.supportSync?.key === key ? state.supportSync : null;
  const listedAccountId = state.supportCloudAccountId;
  if (context?.timer) window.clearTimeout(context.timer);
  if (context?.promise) await context.promise;
  const account = await apiRequest("formation_support_draft_get", { workspaceKey: key });
  if (!account.linked) throw new Error("Discord連携を確認してください。");
  if (account.accountId !== listedAccountId) throw new Error("Discord連携が変わりました。一覧を更新してから削除してください。");
  // 一覧を表示してから変更された内容を、削除操作で消さない。
  const response = await apiRequest("formation_support_draft_delete", { workspaceKey: key,
    accountId: listedAccountId, expectedRevision: item.revision });
  if (context) { context.pending = null; context.conflict = { remote: { ...response.draft, payload: null } }; }
  if (key.startsWith("consultation:")) clearFormationConsultationLocal(key.slice("consultation:".length));
  else if (loadFormationSupportLocal()?.workspaceKey === key) clearFormationSupportLocal();
  await renderFormationSupportStart();
}

function supportCloudDraftListHtml() {
  if (state.supportCloudError) return `<div class="notice warning">${escapeHtml(state.supportCloudError)}<br><button type="button" class="text-button" data-action="refresh-support-cloud-list">再読み込み</button></div>`;
  if (state.supportCloudLinked === null) return `<p class="muted">アカウントの保存を確認中…</p>`;
  if (!state.supportCloudLinked) return `<p class="muted">Discord連携すると、他人の編成の下書きを別端末でも参照できます。</p><button type="button" class="secondary-button compact-button" data-action="navigate" data-view="intel">Discord連携へ</button>`;
  const drafts = state.supportCloudDrafts ?? [];
  return `<p class="muted">同じDiscordで連携した端末から開けます。この保存は自分だけに表示されます。</p>${drafts.length ? `<div class="support-cloud-draft-list">${drafts.map((draft) => `<div class="support-cloud-draft-row"><div><strong>${escapeHtml(draft.title || "他人の編成")}</strong><small>${draft.kind === "consultation" ? "編成相談URL" : "Qookkaからの編成支援"} · ${escapeHtml(formatDateTime(draft.updatedAt))}</small></div><div class="button-row"><button type="button" class="primary-button compact-button" data-action="open-support-cloud-draft" data-key="${escapeAttr(draft.workspaceKey)}">開く</button><button type="button" class="text-button" data-action="delete-support-cloud-draft" data-key="${escapeAttr(draft.workspaceKey)}">削除</button></div></div>`).join("")}</div>` : `<p class="muted">アカウントに保存した編成はまだありません。</p>`}<button type="button" class="text-button" data-action="refresh-support-cloud-list">一覧を更新</button>`;
}

async function refreshSupportCloudDraftList() {
  const context = state.supportSync;
  if (context?.pending && !context.error && !context.conflict) await flushSupportCloudSave(context);
  try {
    const response = await apiRequest("formation_support_drafts");
    if (state.view !== "formation-support-start") return;
    state.supportCloudDrafts = response.drafts ?? [];
    state.supportCloudLinked = response.linked === true;
    state.supportCloudAccountId = response.accountId || null;
    state.supportCloudError = "";
  } catch (error) {
    if (state.view !== "formation-support-start") return;
    state.supportCloudError = error.message || "アカウントの保存を確認できません。端末の下書きは利用できます。";
  }
  const panel = document.getElementById("support-cloud-list");
  if (state.view === "formation-support-start" && panel) panel.innerHTML = supportCloudDraftListHtml();
}

async function renderFormationSupportStart() {
  const saved = loadFormationSupportLocal();
  app.innerHTML = pageHtml({
    title: "他人の編成を組む",
    subtitle: "相談URLまたはQookka共有URLから開始",
    content: `
      <div class="page-content formation-support-start-page">
        ${saved ? `<div class="card draft-resume-card"><div><strong>この端末の編成支援の下書き</strong><small>${saved.savedAt ? `自動保存 ${escapeHtml(formatDateTime(saved.savedAt))}` : ""}</small></div><div class="button-row"><button type="button" class="primary-button compact-button" data-action="resume-formation-support">続きから編集</button><button type="button" class="text-button" data-action="discard-formation-support">端末から削除</button></div></div>` : ""}
        <section class="card form-stack"><strong>アカウントに保存した編成</strong><div id="support-cloud-list">${supportCloudDraftListHtml()}</div></section>
        <section class="card form-stack formation-support-route-card">
          <div><strong>相談URLから組む</strong><p class="muted">相手がQookka同期と凸設定を済ませて作成した編成相談URLを開きます。</p></div>
          <form class="form-stack" data-form="open-formation-consultation-url">
            <label class="field"><span>編成相談URL</span><input name="url" type="url" inputmode="url" required placeholder="https://.../?consultation=..." /></label>
            <button type="submit" class="primary-button">相談を開く</button>
          </form>
        </section>
        <section class="card form-stack formation-support-route-card">
          <div><strong>Qookka URLから直接組む</strong><p class="muted">相手の所持情報を一時的に読み込みます。あなた自身の所持武将・戦法には反映しません。</p></div>
          <form class="form-stack" data-form="open-qookka-formation-support">
            <label class="field"><span>相手の名前（任意）</span><input name="name" maxlength="40" placeholder="ゲーム内名など" /></label>
            <label class="field"><span>Qookka共有URL</span><input name="url" type="url" inputmode="url" required placeholder="https://general.qookkagames.com/...snapshot_id=..." /></label>
            <button type="submit" class="primary-button">手持ちを読み込んで編成する</button>
          </form>
        </section>
        <button type="button" class="secondary-button" data-action="back-to-formations">戻る</button>
      </div>`,
    activeNav: "formations",
    backAction: "back-to-formations",
    showNav: false,
  });
  await refreshSupportCloudDraftList();
}

function renderFormationSupportWorkspace() {
  if (!state.formationSupportMode || !state.sharedConsultation?.inventory) {
    renderFormationSupportStart();
    return;
  }
  renderFormationConsultationBody();
}

function formationConsultationUrl(token) {
  if (!token) return "";
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("consultation", token);
  return url.toString();
}

function newConsultationProposalFormation(index = 0) {
  return {
    name: `第${index + 1}部隊`,
    troopType: "",
    troopLevel: "",
    note: "",
    members: [1, 2, 3].map((slot) => ({
      slot,
      generalQookkaId: "",
      generalName: "",
      tactic1QookkaId: "",
      tactic1Name: "",
      tactic2QookkaId: "",
      tactic2Name: "",
    })),
  };
}

function newConsultationProposalDraft() {
  return {
    proposerName: "",
    note: "",
    isPublic: true,
    formations: [newConsultationProposalFormation(0)],
  };
}

function normalizeConsultationProposalDraftForBuilder() {
  if (!state.consultationDraft?.formations) return;
  state.consultationDraft.formations.forEach((formation, index) => {
    formation.name = `第${index + 1}部隊`;
    formation.troopType = "";
    formation.troopLevel = null;
    formation.note = "";
  });
}

function consultationManagementHtml() {
  const consultations = state.myFormationConsultations ?? [];
  if (!consultations.length) return "";
  return `
    <details class="card consultation-management">
      <summary><strong>編成相談 ${consultations.length}件</strong><span>管理</span></summary>
      <div class="consultation-management-list">
        ${consultations.map((consultation) => `
          <div class="consultation-management-row">
            <div>
              <strong>${escapeHtml(consultation.title || "編成相談")} ${consultation.isActive === false ? `<span class="closed-consultation-badge">受付終了</span>` : ""}</strong>
              <small>提案 ${Number(consultation.proposalCount || 0)}件${Number(consultation.adoptedCount || 0) ? ` ・ 採用 ${Number(consultation.adoptedCount || 0)}件` : ""}${consultation.createdAt ? ` ・ ${escapeHtml(formatDateTime(consultation.createdAt))}` : ""}</small>
            </div>
            <div class="button-row">
              <button type="button" class="secondary-button compact-button" data-action="open-formation-consultation-detail" data-id="${escapeAttr(consultation.id)}">提案を見る</button>
              ${consultation.shareToken ? `<button type="button" class="secondary-button compact-button" data-action="copy-formation-consultation" data-token="${escapeAttr(consultation.shareToken)}">${consultation.isActive === false ? "参考URLコピー" : "相談URLコピー"}</button>` : ""}
              ${consultation.isActive === false ? "" : `<button type="button" class="text-button danger-text" data-action="revoke-formation-consultation" data-id="${escapeAttr(consultation.id)}">受付終了</button>`}
            </div>
          </div>`).join("")}
      </div>
    </details>`;
}

function renderFormationConsultationCreate() {
  app.innerHTML = pageHtml({
    title: "編成相談を作成",
    subtitle: "全手持ちを共有して編成案を募集",
    content: `
      <div class="page-content consultation-create-page">
        <div class="notice warning"><strong>相談URLから全所持情報を閲覧できます。</strong><br>所持武将・凸・所持戦法をすべて公開します。保存済みのマイ編成や敵部隊DBは公開されません。</div>
        <form class="form-stack" data-form="create-formation-consultation">
          <div class="card form-stack">
            <label class="field"><span>相談タイトル</span><input name="title" maxlength="80" value="編成相談" required placeholder="例：PK2 対人3軍の編成相談" /></label>
            <label class="field"><span>相談内容・条件（任意）</span><textarea name="note" maxlength="1000" rows="5" placeholder="例：対人用で3軍まで。第1軍を最優先。"></textarea></label>
          </div>
          <div class="card consultation-scope-card">
            <strong>相談相手に見える情報</strong>
            <div class="consultation-scope-grid">
              <span>所持武将 <b>${Number(state.myInventory?.generals?.length || 0)}</b></span>
              <span>所持戦法 <b>${Number(state.myInventory?.tactics?.length || 0)}</b></span>
              <span>各武将の凸 <b>すべて</b></span>
              <span>保存済み編成 <b>非公開</b></span>
            </div>
          </div>
          <button type="submit" class="primary-button">相談URLを作成</button>
          <button type="button" class="secondary-button" data-action="back-to-formations">戻る</button>
        </form>
      </div>`,
    activeNav: "formations",
    backAction: "back-to-formations",
    showNav: false,
  });
}

function enrichConsultationProposalFormation(formation, sourceInventory = state.myInventory) {
  const inventory = sourceInventory?.generals ?? [];
  return {
    ...formation,
    members: (formation.members ?? []).map((member) => {
      const current = inventory.find((row) => row.qookkaId === member.generalQookkaId);
      return {
        ...member,
        dupeCount: member.dupeCount ?? current?.dupeCount ?? null,
        inherentTacticName: member.inherentTacticName || current?.inherentTacticName || "",
      };
    }),
  };
}

function consultationProposalHtml(proposal, { readOnly = false, inventory = state.myInventory } = {}) {
  return `
    <${readOnly ? "details" : "article"} class="card consultation-proposal-card ${!readOnly && proposal.adopted ? "adopted" : ""}" data-proposal-id="${escapeAttr(proposal.id)}">
      <${readOnly ? "summary" : "div"} class="consultation-proposal-head">
        <div><strong>${escapeHtml(proposal.proposerName || "提案者")}</strong><small>${proposal.createdAt ? escapeHtml(formatDateTime(proposal.createdAt)) : ""}</small></div>
        ${readOnly ? `<small>${Number(proposal.formations?.length || 0)}部隊</small>` : `<span class="privacy-badge ${proposal.isPublic ? "shared" : "private"}">${proposal.isPublic ? "参考公開中" : "相談者のみ"}</span>`}
        ${readOnly ? "" : `<span class="privacy-badge ${proposal.adopted ? "shared" : "private"}">${proposal.adopted ? "採用済み" : "未採用"}</span>`}
      </${readOnly ? "summary" : "div"}>
      ${proposal.note ? `<p class="consultation-proposal-note">${escapeHtml(proposal.note)}</p>` : ""}
      <div class="consultation-proposal-formations">
        ${(proposal.formations ?? []).map((formation, index) => `
          <section class="consultation-proposal-formation">
            <div class="shared-set-card-heading">
              <div><span class="shared-set-number">${index + 1}</span><strong>${escapeHtml(formation.name || `第${index + 1}軍`)}</strong></div>
              <small>武将3名・戦法</small>
            </div>
            <div class="formation-summary">${formationSummaryMembers(enrichConsultationProposalFormation(formation, inventory))}</div>
            ${formation.note ? `<p class="formation-note">${escapeHtml(formation.note)}</p>` : ""}
          </section>`).join("")}
      </div>
      ${readOnly ? "" : `<div class="button-row consultation-proposal-actions">
        ${proposal.adopted
          ? `<span class="muted">この提案はマイ編成へコピー済みです。</span>`
          : `<button type="button" class="primary-button compact-button" data-action="adopt-formation-consultation-proposal" data-id="${escapeAttr(proposal.id)}">この提案を採用</button>`}
        <button type="button" class="text-button danger-text" data-action="delete-formation-consultation-proposal" data-id="${escapeAttr(proposal.id)}">提案を削除</button>
        <button type="button" class="secondary-button compact-button" data-action="set-consultation-proposal-visibility" data-id="${escapeAttr(proposal.id)}" data-public="${proposal.isPublic ? "false" : "true"}">${proposal.isPublic ? "参考表示を非公開にする" : "相談URLに参考公開する"}</button>
      </div>`}
    </${readOnly ? "details" : "article"}>`;
}

function consultationCompareCell(formation) {
  if (!formation) return `<span class="muted">—</span>`;
  const members = [...(formation.members ?? [])].sort((a,b)=>Number(a.slot)-Number(b.slot));
  return `<div class="proposal-compare-cell"><strong>${escapeHtml(formation.name || "編成")}</strong>${members.map((m) => `<div><b>${escapeHtml(formationMemberRole(Number(m.slot)))}</b> ${escapeHtml(m.generalName || "未設定")}<small>${[m.tactic1Name,m.tactic2Name].filter(Boolean).map(escapeHtml).join(" / ") || "戦法未設定"}</small></div>`).join("")}</div>`;
}

function consultationComparisonHtml(proposals, { readOnly = false } = {}) {
  if ((proposals ?? []).length < 2) return "";
  const maxFormations = Math.max(...proposals.map((proposal) => proposal.formations?.length ?? 0), 0);
  return `<details class="card proposal-comparison" ${readOnly ? "" : "open"}><summary><strong>提案を比較</strong><span>${proposals.length}案</span></summary><div class="proposal-comparison-scroll"><table><thead><tr><th>部隊</th>${proposals.map((proposal) => `<th>${escapeHtml(proposal.proposerName || "提案者")}</th>`).join("")}</tr></thead><tbody>${Array.from({length:maxFormations},(_,index)=>`<tr><th>第${index+1}軍</th>${proposals.map((proposal)=>`<td>${consultationCompareCell(proposal.formations?.[index])}</td>`).join("")}</tr>`).join("")}</tbody></table></div></details>`;
}

async function renderFormationConsultationDetail() {
  const id = state.activeConsultationId;
  if (!id) { await navigate("formations"); return; }
  app.innerHTML = pageHtml({
    title: "編成相談",
    subtitle: "届いた提案を確認",
    content: `<div class="page-content"><div class="card"><p class="muted">読み込み中...</p></div></div>`,
    activeNav: "formations",
    backAction: "back-to-formations",
    showNav: false,
  });
  try {
    if (!state.myInventory) await loadMyFormationData({ force: true });
    const response = await apiRequest("my_formation_consultation_detail", { id });
    state.activeConsultation = response.consultation;
    const consultation = state.activeConsultation;
    const proposals = consultation?.proposals ?? [];
    app.innerHTML = pageHtml({
      title: consultation?.title || "編成相談",
      subtitle: `提案 ${proposals.length}件`,
      content: `
        <div class="page-content consultation-detail-page">
          <div class="card consultation-owner-summary">
            ${consultation?.note ? `<p>${escapeHtml(consultation.note)}</p>` : `<p class="muted">相談条件は未入力です。</p>`}
            <div class="button-row">
              ${consultation?.shareToken ? `<button type="button" class="secondary-button" data-action="copy-formation-consultation" data-token="${escapeAttr(consultation.shareToken)}">相談URLをコピー</button>` : ""}
              ${consultation?.isActive ? `<button type="button" class="text-button danger-text" data-action="revoke-formation-consultation" data-id="${escapeAttr(consultation.id)}">受付を終了</button>` : `<span class="muted">受付終了済み</span>`}
              <button type="button" class="secondary-button" data-action="set-consultation-url-visibility" data-id="${escapeAttr(consultation.id)}" data-shared="${consultation?.shareToken ? "false" : "true"}">${consultation?.shareToken ? "URLを非公開にする" : "参考URLを発行する"}</button>
            </div>
            <p class="muted compact-note">公開した回答は相談URLから参考として読めます。過去の回答は非公開のままです。受付終了後も参考表示は残り、URLを非公開にすると閲覧できなくなります。</p>
          </div>
          ${consultationComparisonHtml(proposals)}
          <div class="section-heading"><h2>届いた提案</h2><span>${proposals.length}件</span></div>
          ${proposals.length ? proposals.map((proposal) => consultationProposalHtml(proposal)).join("") : `<div class="card empty-state"><strong>まだ提案はありません</strong><p class="muted">相談URLをDiscordなどで共有してください。</p></div>`}
        </div>`,
      activeNav: "formations",
      backAction: "back-to-formations",
      showNav: false,
    });
  } catch (error) {
    app.innerHTML = pageHtml({
      title: "編成相談",
      subtitle: "提案を確認",
      content: `<div class="page-content"><div class="notice danger">${escapeHtml(error.message)}</div></div>`,
      activeNav: "formations",
      backAction: "back-to-formations",
      showNav: false,
    });
  }
}

function consultationTacticKindLabel(value) {
  const kind = String(value || "").trim();
  return kind || "その他";
}

function consultationTacticKindValues(tactics) {
  const preferred = ["能動", "突撃", "指揮", "受動", "兵種", "陣法"];
  const present = new Set((tactics ?? []).map((tactic) => consultationTacticKindLabel(tactic.kind)));
  const ordered = preferred.filter((kind) => present.has(kind));
  const extra = [...present].filter((kind) => !preferred.includes(kind) && kind !== "その他").sort((a, b) => a.localeCompare(b, "ja"));
  if (present.has("その他")) extra.push("その他");
  return [...ordered, ...extra];
}

function refreshTacticKindFilterButtons(action, selectedKinds) {
  const selected = new Set(selectedKinds ?? []);
  document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => {
    const kind = String(button.dataset.kind || "all");
    const active = kind === "all" ? selected.size === 0 : selected.has(kind);
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function refreshTacticGradeFilterButtons(action, selectedGrades) {
  const selected = new Set(selectedGrades ?? []);
  document.querySelectorAll(`[data-action="${action}"]`).forEach((button) => {
    const grade = String(button.dataset.grade || "all");
    const active = grade === "all" ? selected.size === 0 : selected.has(grade);
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function tacticKindFilterButtonsHtml(kinds, selectedKinds, action, ariaLabel) {
  const selected = new Set(selectedKinds ?? []);
  const allSelected = selected.size === 0;
  return `<div class="tactic-kind-filter" role="group" aria-label="${escapeAttr(ariaLabel || "戦法種別")}">
    <button type="button" class="tactic-kind-chip ${allSelected ? "selected" : ""}" data-action="${escapeAttr(action)}" data-kind="all" aria-pressed="${allSelected ? "true" : "false"}">すべて</button>
    ${kinds.map((kind) => {
      const active = selected.has(kind);
      return `<button type="button" class="tactic-kind-chip ${active ? "selected" : ""}" data-action="${escapeAttr(action)}" data-kind="${escapeAttr(kind)}" aria-pressed="${active ? "true" : "false"}">${escapeHtml(kind)}</button>`;
    }).join("")}
  </div>`;
}

function consultationDupeText(general) {
  if (!general || general.dupeCount === null || general.dupeCount === undefined) return "凸未入力";
  return `${Number(general.dupeCount)}凸`;
}

function supportDupeControlHtml(general) {
  const value = general?.dupeCount === null || general?.dupeCount === undefined ? null : Number(general.dupeCount);
  return `<div class="support-dupe-control" aria-label="${escapeAttr(general?.name || "武将")}の凸">
    <button type="button" class="support-dupe-zero ${value === 0 ? "selected" : ""}" data-action="set-support-dupe" data-id="${escapeAttr(general?.qookkaId || "")}" data-value="0">0凸</button>
    <div class="support-dupe-dots">
      ${[1,2,3,4,5].map((step) => `<button type="button" class="dupe-dot-button ${value !== null && step <= value ? "active" : ""}" data-action="set-support-dupe" data-id="${escapeAttr(general?.qookkaId || "")}" data-value="${step}" aria-label="${step}凸"><span class="dupe-dot-shape" aria-hidden="true"></span></button>`).join("")}
    </div>
    <small>${value === null ? "未入力" : `${value}凸`}</small>
  </div>`;
}

function supportCandidateButtonHtml(general) {
  const selected = Boolean(general?.supportCandidate);
  return `<button type="button" class="support-candidate-button ${selected ? "selected" : ""}" data-action="toggle-support-candidate" data-id="${escapeAttr(general?.qookkaId || "")}" aria-pressed="${selected ? "true" : "false"}"><span aria-hidden="true">${selected ? "✓" : "+"}</span>${selected ? "編成候補" : "候補に追加"}</button>`;
}

function consultationGeneralCandidateEnabled(general) {
  return state.formationSupportMode ? Boolean(general?.supportCandidate) : general?.supportCandidate !== false;
}

function consultationCandidateCheckboxHtml(general) {
  const selected = consultationGeneralCandidateEnabled(general);
  return `<span class="consultation-candidate-check"><input type="checkbox" aria-label="${escapeAttr(general?.name || "武将")}を武将選択に表示" data-consultation-candidate-id="${escapeAttr(general?.qookkaId || "")}" ${selected ? "checked" : ""} /><span aria-hidden="true">候補</span></span>`;
}

function captureConsultationInventoryState() {
  const details = document.querySelector(".consultation-inventory-card");
  if (details) state.consultationInventoryOpen = details.open;
}

function updateConsultationCandidateDisplay() {
  const inventory = state.sharedConsultation?.inventory ?? { generals: [] };
  const selectedIds = new Set(inventory.generals.filter(consultationGeneralCandidateEnabled).map((row) => String(row.qookkaId)));
  document.querySelectorAll("[data-consultation-candidate-id]").forEach((input) => {
    input.checked = selectedIds.has(String(input.dataset.consultationCandidateId));
    input.closest(".consultation-general-chip")?.classList.toggle("candidate-selected", input.checked);
  });
  const summary = document.querySelector(".consultation-inventory-card > summary span");
  if (summary) summary.textContent = `武将選択 ${selectedIds.size}名 ・ 勢力別 ・ 全所持${inventory.generals.length}名`;
  const count = document.querySelector(".consultation-candidate-toolbar small");
  if (count) count.textContent = `${selectedIds.size} / ${inventory.generals.length}名`;
  if (state.consultationPicker?.kind === "general") refreshConsultationPickerOptions();
}

document.addEventListener("toggle", (event) => {
  if (!event.target?.classList?.contains("consultation-inventory-card")) return;
  state.consultationInventoryOpen = event.target.open;
  if (state.consultationDraft && ["formation-consultation", "formation-support-workspace"].includes(state.view)) persistConsultationWorkspaceLocal();
}, true);

function setConsultationCandidateVisibility(visible) {
  for (const general of state.sharedConsultation?.inventory?.generals ?? []) general.supportCandidate = Boolean(visible);
  persistConsultationWorkspaceLocal();
}

function initializeFormalConsultationCandidates(savedIds) {
  if (state.formationSupportMode) return;
  const generals = state.sharedConsultation?.inventory?.generals ?? [];
  const hasSavedSelection = Array.isArray(savedIds);
  const selected = hasSavedSelection ? new Set(savedIds.map((id) => String(id))) : null;
  for (const general of generals) {
    general.supportCandidate = hasSavedSelection ? selected.has(String(general.qookkaId || "")) : true;
  }
}

const CONSULTATION_FACTION_ORDER = ["織田", "豊臣", "徳川", "武田", "上杉", "群雄"];

function supportGeneralFallbackSort(a, b) {
  const costDiff = Number(b?.cost || 0) - Number(a?.cost || 0);
  if (costDiff) return costDiff;
  const aId = Number(a?.qookkaId);
  const bId = Number(b?.qookkaId);
  if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) return aId - bId;
  return String(a?.qookkaId || "").localeCompare(String(b?.qookkaId || ""), "ja");
}

function isConsultationMobileViewport() {
  try { return window.matchMedia("(max-width: 899px)").matches; } catch { return window.innerWidth < 900; }
}

function consultationInventoryHtml() {
  const inventory = state.sharedConsultation?.inventory ?? { generals: [], tactics: [], lastImport: null };
  const star5Generals = (inventory.generals ?? [])
    .filter((general) => Number(general.star) === 5)
    .slice();
  const supportCandidateCount = (inventory.generals ?? []).filter((general) => consultationGeneralCandidateEnabled(general)).length;

  // 凸確認・編成相談では、勢力ごとの比較を優先するため
  // 各勢力内をコスト降順 -> Qookka武将ID順で統一する。
  star5Generals.sort(supportGeneralFallbackSort);

  const factionGroups = new Map();
  for (const general of star5Generals) {
    const faction = String(general.faction || "その他").trim() || "その他";
    if (!factionGroups.has(faction)) factionGroups.set(faction, []);
    factionGroups.get(faction).push(general);
  }
  const factionIndex = new Map(CONSULTATION_FACTION_ORDER.map((name, index) => [name, index]));
  const factionNames = [...factionGroups.keys()].sort((a, b) => {
    const ai = factionIndex.has(a) ? factionIndex.get(a) : Number.MAX_SAFE_INTEGER;
    const bi = factionIndex.has(b) ? factionIndex.get(b) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b, "ja");
  });

  const generalGroupsHtml = factionNames.length
    ? factionNames.map((faction) => `
        <section class="consultation-inventory-group">
          <div class="consultation-inventory-group-title"><strong>${escapeHtml(faction)}</strong><span>${factionGroups.get(faction).length}名</span></div>
          <div class="consultation-general-chip-list">
            ${factionGroups.get(faction).map((general) => state.formationSupportMode
              ? `<div class="consultation-general-chip support-general-chip ${consultationGeneralCandidateEnabled(general) ? "candidate-selected" : ""}"><div class="support-general-chip-head"><div><b>${escapeHtml(general.name)}</b><small>${escapeHtml(consultationDupeText(general))}${general.cost ? ` ・ コスト${Number(general.cost)}` : ""}</small></div>${supportCandidateButtonHtml(general)}</div>${supportDupeControlHtml(general)}</div>`
              : `<label class="consultation-general-chip consultation-formal-general-chip ${consultationGeneralCandidateEnabled(general) ? "candidate-selected" : ""}"><span class="support-general-chip-head"><span class="consultation-candidate-general-name"><b>${escapeHtml(general.name)}</b><small>${escapeHtml(consultationDupeText(general))}${general.cost ? ` ・ コスト${Number(general.cost)}` : ""}</small></span>${consultationCandidateCheckboxHtml(general)}</span></label>`).join("")}
          </div>
        </section>`).join("")
    : `<div class="notice subtle">★5武将の分類情報を取得できませんでした。編成作成では全所持武将から選択できます。</div>`;

  const openInventory = state.consultationInventoryOpen ?? (state.formationSupportMode || !isConsultationMobileViewport());
  return `
    <details class="card consultation-inventory-card" ${openInventory ? "open" : ""}>
      <summary><strong>所持武将 ★5 ${star5Generals.length}</strong><span>武将選択 ${supportCandidateCount}名 ・ 勢力別 ・ 全所持${inventory.generals.length}名</span></summary>
      <div class="consultation-inventory-body consultation-grouped-inventory">
        <div class="consultation-candidate-toolbar">
          <div><strong>武将選択に出す武将</strong><small>${supportCandidateCount} / ${inventory.generals.length}名</small></div>
          <div class="consultation-candidate-toolbar-actions"><button type="button" class="secondary-button compact-button" data-action="show-all-consultation-candidates">すべて表示</button><button type="button" class="secondary-button compact-button" data-action="hide-all-consultation-candidates">すべて外す</button></div>
        </div>
        ${generalGroupsHtml}
        ${state.formationSupportMode ? `<div class="consultation-mobile-inventory-actions"><button type="button" class="primary-button" data-action="jump-to-consultation-builder">候補を決めたら編成へ</button></div>` : ""}
      </div>
    </details>`;
}

function consultationPickerOptions() {
  const picker = state.consultationPicker;
  const inventory = state.sharedConsultation?.inventory;
  const draft = state.consultationDraft;
  if (!picker || !inventory || !draft) return [];
  const source = picker.kind === "general" ? inventory.generals : inventory.tactics;
  const selectedIds = picker.selectedIds ?? [];
  const selectedSet = new Set(selectedIds);
  const usedGeneralIds = new Set();
  const tacticUseCounts = new Map();

  for (let formationIndex = 0; formationIndex < draft.formations.length; formationIndex += 1) {
    const formation = draft.formations[formationIndex];
    for (const member of formation.members ?? []) {
      if (picker.kind === "general") {
        if (formationIndex !== picker.formationIndex && member.generalQookkaId) usedGeneralIds.add(member.generalQookkaId);
        continue;
      }
      if (formationIndex === picker.formationIndex && Number(member.slot) === Number(picker.slot)) continue;
      for (const field of ["tactic1", "tactic2"]) {
        const id = field === "tactic1" ? member.tactic1QookkaId : member.tactic2QookkaId;
        if (id) tacticUseCounts.set(id, (tacticUseCounts.get(id) || 0) + 1);
      }
    }
  }

  return source
    .filter((item) => {
      if (selectedSet.has(item.qookkaId)) return true;
      if (picker.kind === "general") {
        if (!consultationGeneralCandidateEnabled(item)) return false;
        return !usedGeneralIds.has(item.qookkaId);
      }
      return (tacticUseCounts.get(item.qookkaId) || 0) < maxTacticCopies(item);
    })
    .filter((item) => picker.kind === "general"
      ? (selectedSet.has(item.qookkaId) || generalMatchesFilter(item, picker.query || "", picker.filters ?? state.consultationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" }))
      : (() => {
          const matchesQuery = !normalizeSearchText(picker.query || "") || normalizeSearchText(item.name).includes(normalizeSearchText(picker.query || ""));
          const kindFilters = picker.kindFilters ?? state.consultationTacticPickerKinds ?? [];
          const gradeFilters = picker.gradeFilters ?? state.consultationTacticPickerGrades ?? ["S"];
          const gradeLabel = tacticGradeLabel(item);
          return matchesQuery && (!kindFilters.length || kindFilters.includes(consultationTacticKindLabel(item.kind))) && (!gradeFilters.length || gradeFilters.includes(gradeLabel));
        })())
    .slice(0, 100);
}

function consultationPickerSelectionLabel(picker, itemId) {
  const index = (picker?.selectedIds ?? []).indexOf(itemId);
  if (index < 0) return "";
  if (picker.kind === "general") return formationMemberRole(index + 1);
  return index === 0 ? "第1戦法" : "第2戦法";
}

function consultationPickerListHtml() {
  const picker = state.consultationPicker;
  const options = consultationPickerOptions();
  const selectedIds = picker?.selectedIds ?? [];
  return options.length ? options.map((item) => {
    const selectionLabel = consultationPickerSelectionLabel(picker, item.qookkaId);
    const selected = selectedIds.includes(item.qookkaId);
    return `
    <button type="button" class="choice-option ${selected ? "selected multi-selected" : ""}" data-action="toggle-consultation-choice" data-id="${escapeAttr(item.qookkaId)}" data-name="${escapeAttr(item.name)}" aria-pressed="${selected ? "true" : "false"}">
      <div class="choice-option-main"><strong title="${escapeAttr(item.name)}">${escapeHtml(item.name)}</strong><span class="choice-selection-badge ${selectionLabel ? "" : "empty"}" ${selectionLabel ? "" : 'aria-hidden="true"'}>${escapeHtml(selectionLabel || (picker?.kind === "general" ? "副将2" : "第2戦法"))}</span></div>
      ${picker?.kind === "general"
        ? `<span>${escapeHtml(consultationDupeText(item))}${item.star ? ` ・ ★${Number(item.star)}` : ""}${item.faction ? ` ・ ${escapeHtml(item.faction)}` : ""}${item.cost ? ` ・ コスト${Number(item.cost)}` : ""}${item.inherentTacticName ? ` ・ 固有 ${escapeHtml(item.inherentTacticName)}` : ""}</span>`
        : `<span>${item.grade ? `${Number(item.grade) === 5 ? "S" : `Grade${Number(item.grade)}`} ・ ` : ""}${escapeHtml(consultationTacticKindLabel(item.kind))}</span>`}
    </button>`;
  }).join("") : `<div class="choice-empty">${picker?.kind === "general" ? "上の所持武将一覧で「武将選択に表示」をオンにしてください。" : "候補がありません"}</div>`;
}

function consultationPickerFiltersHtml() {
  const picker = state.consultationPicker;
  if (!picker) return "";
  if (picker.kind === "general") {
    const { factions, costs } = generalFilterValues(state.sharedConsultation?.inventory?.generals ?? []);
    const filters = picker.filters ?? state.consultationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" };
    return `<div class="picker-filter-grid">
      <select id="consultation-picker-star"><option value="5" ${filters.star === "5" ? "selected" : ""}>★5</option><option value="4" ${filters.star === "4" ? "selected" : ""}>★4</option><option value="all" ${filters.star === "all" ? "selected" : ""}>全レア</option></select>
      <select id="consultation-picker-faction"><option value="all">全勢力</option>${factions.map((value) => `<option value="${escapeAttr(value)}" ${filters.faction === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select>
      <select id="consultation-picker-cost"><option value="all">全コスト</option>${costs.map((value) => `<option value="${value}" ${String(filters.cost) === String(value) ? "selected" : ""}>コスト${value}</option>`).join("")}</select>
    </div>`;
  }
  const tactics = state.sharedConsultation?.inventory?.tactics ?? [];
  const kinds = consultationTacticKindValues(tactics);
  const selectedKinds = picker.kindFilters ?? state.consultationTacticPickerKinds ?? [];
  const selectedGrades = picker.gradeFilters ?? state.consultationTacticPickerGrades ?? ["S"];
  return `<div class="picker-filter-section"><small>ランク</small>${tacticGradeFilterButtonsHtml(selectedGrades, "toggle-consultation-tactic-grade")}</div>
    <div class="picker-filter-section"><small>種別</small>${tacticKindFilterButtonsHtml(kinds, selectedKinds, "toggle-consultation-tactic-kind", "戦法種別")}</div>`;
}

function consultationPickerSelectedSummaryHtml() {
  const picker = state.consultationPicker;
  const inventory = state.sharedConsultation?.inventory;
  if (!picker || !inventory) return "";
  const source = picker.kind === "general" ? inventory.generals : inventory.tactics;
  return pickerSelectedSummaryHtml(picker, source);
}

function consultationPickerHtml() {
  const picker = state.consultationPicker;
  if (!picker) return "";
  const title = picker.kind === "general" ? "武将をまとめて選択" : `${formationMemberRole(picker.slot)}の戦法を選択`;
  const limit = picker.kind === "general" ? 3 : 2;
  return `
    <div class="choice-sheet-backdrop" data-action="close-consultation-picker"></div>
    <section class="choice-sheet multi-choice-sheet ${picker.kind === "general" ? "general-choice-sheet" : ""}" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
      <div class="choice-sheet-handle"></div>
      <div class="choice-sheet-header"><div><strong>${escapeHtml(title)}</strong><small>最大${limit}つまで選択</small></div><button type="button" class="icon-button" data-action="close-consultation-picker">×</button></div>
      ${consultationPickerSelectedSummaryHtml()}
      <div class="choice-filter-stack"><input id="consultation-picker-search" class="choice-search" type="search" placeholder="名前を入力して絞り込み" value="${escapeAttr(picker.query || "")}" />${consultationPickerFiltersHtml()}</div>
      <div id="consultation-picker-list" class="choice-list">${consultationPickerListHtml()}</div>
      <div class="multi-choice-footer"><button type="button" class="secondary-button" data-action="clear-consultation-multi-choice">選択解除</button><button type="button" class="primary-button" data-action="confirm-consultation-multi-choice">決定</button></div>
    </section>`;
}

function refreshConsultationPickerOptions({ selectionOnly = false } = {}) {
  const list = document.getElementById("consultation-picker-list");
  if (selectionOnly) updatePickerSelectionDom(list, state.consultationPicker, "toggle-consultation-choice");
  else if (list) list.innerHTML = consultationPickerListHtml();
  const summary = document.querySelector(".multi-choice-summary");
  if (summary) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = consultationPickerSelectedSummaryHtml();
    summary.replaceWith(wrapper.firstElementChild);
  }
}

function consultationSwapToolbarHtml(formationIndex) {
  const swap = state.consultationSwap;
  const activeHere = swap && Number(swap.formationIndex) === Number(formationIndex);
  const activeKind = activeHere ? swap.kind : "";
  const guide = activeKind
    ? `<small>${activeKind === "general" ? "入れ替える武将を2人タップ" : "入れ替える戦法枠を2つタップ"}</small>`
    : `<small>選び直さず位置だけ交換</small>`;
  return `<div class="formation-swap-toolbar ${activeKind ? "active" : ""}">
    <div><strong>入れ替え</strong>${guide}</div>
    <div class="formation-swap-actions">
      <button type="button" class="secondary-button compact-button ${activeKind === "general" ? "selected" : ""}" data-action="start-consultation-swap" data-kind="general" data-formation-index="${formationIndex}">武将</button>
      <button type="button" class="secondary-button compact-button ${activeKind === "tactic" ? "selected" : ""}" data-action="start-consultation-swap" data-kind="tactic" data-formation-index="${formationIndex}">戦法</button>
      ${activeKind ? `<button type="button" class="text-button" data-action="cancel-consultation-swap">終了</button>` : ""}
    </div>
  </div>`;
}

function consultationTacticSwapTargetsHtml(formationIndex, member) {
  const swap = state.consultationSwap;
  if (swap?.kind !== "tactic" || Number(swap.formationIndex) !== Number(formationIndex)) return "";
  const first = swap.first;
  return `<div class="tactic-swap-targets">
    ${[1,2].map((index) => {
      const field = `tactic${index}`;
      const name = member[`${field}Name`] || `第${index}戦法：空き`;
      const selected = first && Number(first.slot) === Number(member.slot) && first.field === field;
      return `<button type="button" class="tactic-swap-target ${selected ? "swap-first-selected" : ""}" data-action="select-consultation-swap-tactic" data-formation-index="${formationIndex}" data-slot="${member.slot}" data-field="${field}"><small>第${index}</small><strong>${escapeHtml(name)}</strong></button>`;
    }).join("")}
  </div>`;
}

function consultationAssignedTacticChipHtml(formationIndex, member, field) {
  const id = member?.[`${field}QookkaId`] || "";
  const name = member?.[`${field}Name`] || "";
  const label = field === "tactic2" ? "第2" : "第1";
  const teachable = !id && /（伝授）$/.test(name);
  const slotAction = `data-action="edit-consultation-tactic-slot" data-formation-index="${formationIndex}" data-slot="${member.slot}" data-field="${field}"`;
  if (!name) {
    return `<button type="button" class="consultation-assigned-tactic consultation-tactic-slot-empty" ${slotAction} data-dnd-context="consultation" data-dnd-drop-type="tactic" data-dnd-target-kind="slot" aria-label="${label}戦法を選択または手入力">
      <span><small>${label}</small><span>空き</span></span><em>${isConsultationMobileViewport() ? "選ぶ" : "手入力"}</em>
    </button>`;
  }
  return `<span class="consultation-assigned-tactic ${id ? "" : teachable ? "teachable" : "manual"}" ${slotAction} data-dnd-type="tactic" data-dnd-context="consultation" data-dnd-source-kind="assigned" data-dnd-drop-type="tactic" data-dnd-target-kind="slot" data-formation-index="${formationIndex}" data-slot="${member.slot}" data-field="${field}" draggable="true" role="button" tabindex="0" aria-label="${escapeAttr(label)}戦法 ${escapeAttr(name)}を変更">
    <span><small>${label}</small>${escapeHtml(name)}</span>
    ${dndHandleHtml(`${name}をドラッグして移動`)}
    <button type="button" class="consultation-tactic-remove" data-action="remove-consultation-tactic" data-formation-index="${formationIndex}" data-slot="${member.slot}" data-field="${field}" aria-label="${escapeAttr(name)}を外す">×</button>
  </span>`;
}

function consultationCompactMemberHtml(formationIndex, member) {
  const inventory = state.sharedConsultation?.inventory?.generals ?? [];
  const general = inventory.find((row) => row.qookkaId === member.generalQookkaId);
  const selected = Boolean(member.generalQookkaId);
  return `<div class="consultation-team-member-shell ${selected ? "selected" : "empty"}" data-dnd-type="general" data-dnd-context="consultation" data-dnd-drop-type="general" data-formation-index="${formationIndex}" data-slot="${member.slot}" draggable="${selected ? "true" : "false"}">
    <div class="consultation-team-member-drop" data-dnd-drop-type="tactic" data-dnd-context="consultation" data-dnd-target-kind="member" data-formation-index="${formationIndex}" data-slot="${member.slot}">
      <div class="consultation-team-member-name">
        <strong>${selected ? escapeHtml(member.generalName) : escapeHtml(formationMemberRole(member.slot))}</strong>
        <small>${general ? escapeHtml(consultationDupeText(general)) : selected ? "" : "未選択"}</small>
      </div>
      <div class="consultation-team-member-tactics">
        ${consultationAssignedTacticChipHtml(formationIndex, member, "tactic1")}
        ${consultationAssignedTacticChipHtml(formationIndex, member, "tactic2")}
      </div>
    </div>
    ${selected ? dndHandleHtml(`${member.generalName}をドラッグして移動`) : ""}
  </div>`;
}

function consultationProposalFormationEditorHtml(formation, index) {
  const members = [...(formation?.members ?? [])].sort((a,b)=>Number(a.slot)-Number(b.slot));
  return `<section class="consultation-team-strip">
    <div class="consultation-team-strip-head">
      <strong>第${index + 1}部隊</strong>
      ${state.consultationDraft.formations.length > 1 ? `<button type="button" class="text-button danger-text" data-action="remove-consultation-formation" data-index="${index}">削除</button>` : ""}
    </div>
    <div class="consultation-team-strip-body">
      <div class="consultation-team-members">${members.map((member)=>consultationCompactMemberHtml(index, member)).join("")}</div>
      <button type="button" class="consultation-team-select-button" data-action="open-consultation-picker" data-kind="general" data-formation-index="${index}" data-field="generals"><span>武将を選択</span><small>選択 ›</small></button>
    </div>
  </section>`;
}

function consultationTacticBaseName(value) {
  const name = String(value || "").normalize("NFKC").replace(/\s*\(伝授\)\s*$/, "").trim();
  return FORMATION_TACTIC_NAME_ALIASES[normalizeSearchText(name)] ?? name;
}

function consultationTacticUsageCountByName(tacticName) {
  const target = normalizeSearchText(consultationTacticBaseName(tacticName));
  if (!target) return 0;
  let count = 0;
  for (const formation of state.consultationDraft?.formations ?? []) {
    for (const member of formation.members ?? []) {
      for (const field of ["tactic1", "tactic2"]) {
        const assigned = normalizeSearchText(consultationTacticBaseName(member?.[`${field}Name`] || ""));
        if (assigned && assigned === target) count += 1;
      }
    }
  }
  return count;
}

function consultationTacticUsageCount(tacticId, tacticName = "") {
  if (tacticName) return consultationTacticUsageCountByName(tacticName);
  if (!tacticId) return 0;
  let count = 0;
  for (const formation of state.consultationDraft?.formations ?? []) {
    for (const member of formation.members ?? []) {
      if (member.tactic1QookkaId === tacticId) count += 1;
      if (member.tactic2QookkaId === tacticId) count += 1;
    }
  }
  return count;
}

function consultationTeachableTactics() {
  const inventory = state.sharedConsultation?.inventory ?? { generals: [], tactics: [] };
  const ownedTacticNames = new Set((inventory.tactics ?? []).map((tactic) => normalizeSearchText(consultationTacticBaseName(tactic.name))));
  const ownedTacticIds = new Set((inventory.tactics ?? []).map((tactic) => String(tactic.qookkaId || "")));
  const grouped = new Map();
  for (const general of inventory.generals ?? []) {
    const info = TEACHABLE_TACTIC_BY_GENERAL[String(general.name || "").trim()];
    if (!info?.name) continue;
    const name = consultationTacticBaseName(info.name);
    const key = normalizeSearchText(name);
    if (!key) continue;
    const tacticIds = TEACHABLE_TACTIC_IDS_BY_NAME[name] ?? [];
    if (ownedTacticNames.has(key) || tacticIds.some((id) => ownedTacticIds.has(id))) continue;
    const current = grouped.get(key) ?? {
      name,
      grade: info.grade || "S",
      kind: info.kind || "その他",
      sourceGenerals: [],
    };
    if (!current.sourceGenerals.some((source) => source.name === general.name)) {
      current.sourceGenerals.push({ name: general.name, dupeCount: general.dupeCount });
    }
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ja"));
}

function consultationTeachableSourceText(tactic) {
  const sources = (tactic.sourceGenerals ?? []).map((general) => `${general.name}（${consultationDupeText(general)}）`);
  return sources.length ? `${sources.join(" / ")}から伝授` : "";
}

function consultationPaletteSourceItems() {
  return state.consultationTacticPaletteSource === "teachable"
    ? consultationTeachableTactics()
    : (state.sharedConsultation?.inventory?.tactics ?? []);
}

function consultationTacticPaletteItems() {
  const tactics = consultationPaletteSourceItems();
  const query = normalizeSearchText(state.consultationTacticPaletteSearch || "");
  const gradeFilters = state.consultationTacticPaletteGrades ?? ["S"];
  const kindFilters = state.consultationTacticPaletteKinds ?? [];
  return tactics.filter((tactic) => {
    if (state.consultationHideUsedTactics && consultationTacticUsageCount(tactic.qookkaId || "", tactic.name || "") > 0) return false;
    const grade = tacticGradeLabel(tactic);
    const kind = consultationTacticKindLabel(tactic.kind);
    if (gradeFilters.length && !gradeFilters.includes(grade)) return false;
    if (kindFilters.length && !kindFilters.includes(kind)) return false;
    if (query) {
      const haystack = [tactic.name, ...(tactic.sourceGenerals ?? []).map((general) => general.name)].map((value) => normalizeSearchText(value || "")).join(" ");
      if (!haystack.includes(query)) return false;
    }
    return true;
  }).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"ja"));
}

function consultationTacticPaletteListHtml() {
  const items = consultationTacticPaletteItems();
  const teachableMode = state.consultationTacticPaletteSource === "teachable";
  if (!items.length) return `<div class="choice-empty">${teachableMode ? "該当する伝授戦法がありません" : "該当する戦法がありません"}</div>`;
  return items.map((tactic) => {
    const used = consultationTacticUsageCount(tactic.qookkaId || "", tactic.name || "");
    const baseName = consultationTacticBaseName(tactic.name);
    const limit = FORMATION_TACTIC_COPY_LIMITS[baseName] ?? (teachableMode ? 1 : maxTacticCopies(tactic));
    const exhausted = used >= limit;
    const sourceText = teachableMode ? consultationTeachableSourceText(tactic) : "";
    return `<div class="consultation-palette-tactic ${teachableMode ? "teachable" : ""} ${used ? "used" : ""} ${exhausted ? "exhausted" : ""}" data-dnd-type="tactic" data-dnd-context="consultation" data-dnd-source-kind="${teachableMode ? "teachable" : "pool"}" data-tactic-id="${escapeAttr(teachableMode ? "" : tactic.qookkaId)}" data-tactic-name="${escapeAttr(tactic.name)}" draggable="${exhausted ? "false" : "true"}">
      <div><strong>${escapeHtml(tactic.name)}</strong><small>${escapeHtml(tacticGradeLabel(tactic) || "-")} ・ ${escapeHtml(consultationTacticKindLabel(tactic.kind))}${sourceText ? ` ・ ${escapeHtml(sourceText)}` : ""}${used ? " ・ 使用中" : ""}</small></div>
      ${exhausted ? `<span class="consultation-palette-used-mark">使用中</span>` : dndHandleHtml(`${tactic.name}${teachableMode ? "（伝授）" : ""}を武将へドラッグ`)}
    </div>`;
  }).join("");
}

function consultationTacticPaletteHtml() {
  const ownedTactics = state.sharedConsultation?.inventory?.tactics ?? [];
  const teachableTactics = consultationTeachableTactics();
  const tactics = consultationPaletteSourceItems();
  const kinds = consultationTacticKindValues(tactics);
  const gradeLabel = (state.consultationTacticPaletteGrades ?? ["S"])[0] || "すべて";
  const kindLabel = (state.consultationTacticPaletteKinds ?? [])[0] || "すべて";
  const teachableMode = state.consultationTacticPaletteSource === "teachable";
  return `<aside class="card consultation-tactic-palette" id="consultation-tactic-palette">
    <div class="consultation-tactic-palette-head"><div><strong>戦法パレット</strong><small>${teachableMode ? "伝授戦法を武将へドラッグ" : "所持戦法を武将へドラッグ"}</small></div><span>${tactics.length}件</span></div>
    <div class="consultation-palette-source-tabs" role="tablist" aria-label="戦法の入手元">
      <button type="button" class="consultation-palette-source-tab ${!teachableMode ? "selected" : ""}" data-action="set-consultation-palette-source" data-source="owned" aria-pressed="${!teachableMode ? "true" : "false"}">所持戦法 <b>${ownedTactics.length}</b></button>
      <button type="button" class="consultation-palette-source-tab ${teachableMode ? "selected" : ""}" data-action="set-consultation-palette-source" data-source="teachable" aria-pressed="${teachableMode ? "true" : "false"}">伝授 <b>${teachableTactics.length}</b></button>
    </div>
    <div class="consultation-palette-search-row"><input id="consultation-tactic-palette-search" class="choice-search consultation-palette-search" type="search" placeholder="${teachableMode ? "伝授戦法・伝授元で検索" : "戦法名で検索"}" value="${escapeAttr(state.consultationTacticPaletteSearch || "")}" autocomplete="off" />${consultationHideUsedTacticsCheckboxHtml()}</div>
    <details class="consultation-palette-filters">
      <summary>絞り込み <span>${escapeHtml(gradeLabel)} / ${escapeHtml(kindLabel)}</span></summary>
      <div class="consultation-palette-filter-body">
        <div class="picker-filter-section"><small>ランク</small>${tacticGradeFilterButtonsHtml(state.consultationTacticPaletteGrades ?? ["S"], "toggle-consultation-palette-grade")}</div>
        <div class="picker-filter-section"><small>種別</small>${tacticKindFilterButtonsHtml(kinds, state.consultationTacticPaletteKinds ?? [], "toggle-consultation-palette-kind", "戦法種別")}</div>
      </div>
    </details>
    <div id="consultation-tactic-palette-list" class="consultation-tactic-palette-list">${consultationTacticPaletteListHtml()}</div>
  </aside>`;
}

function consultationHideUsedTacticsCheckboxHtml() {
  return `<label class="consultation-hide-used-check"><input type="checkbox" data-hide-used-consultation-tactics ${state.consultationHideUsedTactics ? "checked" : ""} /><span>使用戦法は表示しない</span></label>`;
}

function consultationMobileTacticTargetInfo() {
  const target = state.consultationMobileTacticTarget;
  if (!target) return null;
  const entry = consultationMemberAt(target);
  if (!entry?.member?.generalQookkaId) return null;
  const field = target.field === "tactic2" ? "tactic2" : "tactic1";
  return {
    target: { formationIndex:Number(target.formationIndex), slot:Number(target.slot), field },
    entry,
    field,
    formationNumber: Number(target.formationIndex) + 1,
    role: formationMemberRole(Number(target.slot)),
    label: field === "tactic2" ? "第2戦法" : "第1戦法",
    currentName: entry.member[`${field}Name`] || "",
  };
}

function consultationMobileTacticListHtml() {
  const info = consultationMobileTacticTargetInfo();
  if (!info) return `<div class="choice-empty">割り当て先を選択してください</div>`;
  const items = consultationTacticPaletteItems();
  const teachableMode = state.consultationTacticPaletteSource === "teachable";
  if (!items.length) return `<div class="choice-empty">${teachableMode ? "該当する伝授戦法がありません" : "該当する戦法がありません"}</div>`;
  const currentBase = normalizeSearchText(consultationTacticBaseName(info.currentName));
  return items.map((tactic) => {
    const used = consultationTacticUsageCount(tactic.qookkaId || "", tactic.name || "");
    const baseName = consultationTacticBaseName(tactic.name);
    const limit = FORMATION_TACTIC_COPY_LIMITS[baseName] ?? (teachableMode ? 1 : maxTacticCopies(tactic));
    const isCurrent = currentBase && currentBase === normalizeSearchText(baseName);
    const exhausted = !isCurrent && used >= limit;
    const sourceText = teachableMode ? consultationTeachableSourceText(tactic) : "";
    return `<button type="button" class="consultation-mobile-tactic-option ${teachableMode ? "teachable" : ""} ${isCurrent ? "current" : ""}" data-action="assign-mobile-consultation-tactic" data-source-kind="${teachableMode ? "teachable" : "pool"}" data-tactic-id="${escapeAttr(teachableMode ? "" : tactic.qookkaId)}" data-tactic-name="${escapeAttr(tactic.name)}" ${exhausted || isCurrent ? "disabled" : ""}>
      <span><strong>${escapeHtml(tactic.name)}</strong><small>${escapeHtml(tacticGradeLabel(tactic) || "-")} ・ ${escapeHtml(consultationTacticKindLabel(tactic.kind))}${sourceText ? ` ・ ${escapeHtml(sourceText)}` : ""}${used && !isCurrent ? " ・ 使用中" : ""}</small></span>
      <b>${isCurrent ? "設定中" : exhausted ? "使用中" : "選択"}</b>
    </button>`;
  }).join("");
}

function consultationMobileTacticPickerHtml() {
  if (!isConsultationMobileViewport()) return "";
  const info = consultationMobileTacticTargetInfo();
  if (!info) return "";
  const ownedTactics = state.sharedConsultation?.inventory?.tactics ?? [];
  const teachableTactics = consultationTeachableTactics();
  const tactics = consultationPaletteSourceItems();
  const kinds = consultationTacticKindValues(tactics);
  const teachableMode = state.consultationTacticPaletteSource === "teachable";
  return `<div class="consultation-mobile-tactic-backdrop" data-action="close-mobile-consultation-tactic-picker"></div>
    <section class="consultation-mobile-tactic-sheet" role="dialog" aria-modal="true" aria-label="戦法を選択">
      <div class="consultation-mobile-tactic-header">
        <div><small>第${info.formationNumber}部隊 ・ ${escapeHtml(info.role)}</small><strong>${escapeHtml(info.entry.member.generalName)} / ${escapeHtml(info.label)}</strong>${info.currentName ? `<span>現在：${escapeHtml(info.currentName)}</span>` : `<span>空き枠</span>`}</div>
        <button type="button" class="icon-button" data-action="close-mobile-consultation-tactic-picker" aria-label="閉じる">×</button>
      </div>
      <div class="consultation-palette-source-tabs" role="tablist" aria-label="戦法の入手元">
        <button type="button" class="consultation-palette-source-tab ${!teachableMode ? "selected" : ""}" data-action="set-consultation-palette-source" data-source="owned" aria-pressed="${!teachableMode ? "true" : "false"}">所持戦法 <b>${ownedTactics.length}</b></button>
        <button type="button" class="consultation-palette-source-tab ${teachableMode ? "selected" : ""}" data-action="set-consultation-palette-source" data-source="teachable" aria-pressed="${teachableMode ? "true" : "false"}">伝授 <b>${teachableTactics.length}</b></button>
      </div>
      <div class="consultation-mobile-tactic-tools">
        <input id="consultation-mobile-tactic-search" class="choice-search" type="search" autocomplete="off" placeholder="${teachableMode ? "伝授戦法・伝授元で検索" : "戦法名で検索"}" value="${escapeAttr(state.consultationTacticPaletteSearch || "")}" />
        ${consultationHideUsedTacticsCheckboxHtml()}
        <div class="consultation-mobile-filter-row"><small>ランク</small>${tacticGradeFilterButtonsHtml(state.consultationTacticPaletteGrades ?? ["S"], "toggle-consultation-palette-grade")}</div>
        <div class="consultation-mobile-filter-row"><small>種別</small>${tacticKindFilterButtonsHtml(kinds, state.consultationTacticPaletteKinds ?? [], "toggle-consultation-palette-kind", "戦法種別")}</div>
      </div>
      <div id="consultation-mobile-tactic-list" class="consultation-mobile-tactic-list">${consultationMobileTacticListHtml()}</div>
      <div class="consultation-mobile-tactic-footer">
        <button type="button" class="secondary-button" data-action="input-mobile-consultation-manual-tactic">未所持戦法を手入力</button>
        <button type="button" class="text-button" data-action="close-mobile-consultation-tactic-picker">閉じる</button>
      </div>
    </section>`;
}

function refreshConsultationMobileTacticPickerList() {
  const list = document.getElementById("consultation-mobile-tactic-list");
  if (list) list.innerHTML = consultationMobileTacticListHtml();
}

function refreshConsultationMobileTacticPicker() {
  const sheet = document.querySelector(".consultation-mobile-tactic-sheet");
  const backdrop = document.querySelector(".consultation-mobile-tactic-backdrop");
  if (!sheet && !backdrop) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = consultationMobileTacticPickerHtml();
  const nextBackdrop = wrapper.firstElementChild;
  const nextSheet = nextBackdrop?.nextElementSibling;
  if (backdrop && nextBackdrop) backdrop.replaceWith(nextBackdrop);
  if (sheet && nextSheet) sheet.replaceWith(nextSheet);
}

function mountConsultationMobileTacticPicker() {
  document.querySelector(".consultation-mobile-tactic-backdrop")?.remove();
  document.querySelector(".consultation-mobile-tactic-sheet")?.remove();
  const html = consultationMobileTacticPickerHtml();
  if (!html) return;
  app.insertAdjacentHTML("beforeend", html);
}

function captureConsultationScrollState() {
  const teams = document.querySelector(".consultation-builder-teams");
  const palette = document.getElementById("consultation-tactic-palette-list");
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    teamsTop: teams ? teams.scrollTop : 0,
    paletteTop: palette ? palette.scrollTop : 0,
  };
}

function restoreConsultationScrollState(saved) {
  if (!saved) return;
  window.requestAnimationFrame(() => {
    window.scrollTo(saved.windowX || 0, saved.windowY || 0);
    const teams = document.querySelector(".consultation-builder-teams");
    const palette = document.getElementById("consultation-tactic-palette-list");
    if (teams) teams.scrollTop = saved.teamsTop || 0;
    if (palette) palette.scrollTop = saved.paletteTop || 0;
  });
}

function rerenderFormationConsultationPreserveScroll() {
  const saved = captureConsultationScrollState();
  renderFormationConsultationBody();
  if (state.consultationMobileTacticTarget) mountConsultationMobileTacticPicker();
  restoreConsultationScrollState(saved);
}

function renderFormationConsultationBodyPreserveScroll() {
  const saved = captureConsultationScrollState();
  renderFormationConsultationBody();
  restoreConsultationScrollState(saved);
}

function refreshConsultationTacticPaletteList() {
  const list = document.getElementById("consultation-tactic-palette-list");
  if (list) list.innerHTML = consultationTacticPaletteListHtml();
  refreshConsultationMobileTacticPickerList();
}

function refreshConsultationTacticPalette() {
  const current = document.getElementById("consultation-tactic-palette");
  if (current) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = consultationTacticPaletteHtml().trim();
    const next = wrapper.firstElementChild;
    if (next) current.replaceWith(next);
  }
  refreshConsultationMobileTacticPicker();
}

function collapseConsultationPaletteFilters() {
  const details = document.querySelector("#consultation-tactic-palette .consultation-palette-filters");
  if (details?.open) details.open = false;
}

function formationSupportResultText() {
  const draft = state.consultationDraft;
  const inventory = state.sharedConsultation?.inventory ?? { generals: [] };
  if (!draft) return "";
  const generalMap = new Map((inventory.generals ?? []).map((row) => [row.qookkaId, row]));
  const lines = [];
  lines.push(state.formationSupportName ? `${state.formationSupportName}さん 編成案` : "編成案");
  if (draft.note?.trim()) lines.push(`メモ：${draft.note.trim()}`);
  for (let index = 0; index < (draft.formations ?? []).length; index += 1) {
    const formation = draft.formations[index];
    lines.push("");
    lines.push(`【第${index + 1}部隊】`);
    for (const member of [...(formation.members ?? [])].sort((a,b)=>Number(a.slot)-Number(b.slot))) {
      if (!member.generalName) continue;
      const general = generalMap.get(member.generalQookkaId);
      lines.push(`${formationMemberRole(Number(member.slot))}：${member.generalName}（${consultationDupeText(general)}）`);
      lines.push(`  第1：${member.tactic1Name || "未設定"}`);
      lines.push(`  第2：${member.tactic2Name || "未設定"}`);
    }
    if (formation.note?.trim()) lines.push(`  メモ：${formation.note.trim()}`);
  }
  return lines.join("\n");
}

function renderFormationSupportDirectBody() {
  const consultation = state.sharedConsultation;
  if (!consultation) return;
  state.consultationDraft ??= newConsultationProposalDraft();
  normalizeConsultationProposalDraftForBuilder();
  const draft = state.consultationDraft;
  const inventory = consultation.inventory ?? { generals: [], tactics: [], lastImport: null };
  const unknownStar5 = (inventory.generals ?? []).filter((row) => Number(row.star) === 5 && (row.dupeCount === null || row.dupeCount === undefined)).length;
  captureConsultationInventoryState();
  app.innerHTML = pageHtml({
    title: state.formationSupportName ? `${state.formationSupportName}さんの編成` : "他人の編成を組む",
    subtitle: "Qookkaの手持ちを一時利用",
    content: `
      <div class="page-content consultation-public-page formation-support-workspace">
        <div class="card formation-support-toolbar">
          <div><strong>この手持ちはあなたのマイ編成とは別です</strong><small>他人の編成を組む画面から、保存した内容を再開できます。</small></div>
          <div class="button-row"><button type="button" class="secondary-button compact-button" data-action="copy-formation-support-result">編成案をコピー</button><button type="button" class="text-button" data-action="back-to-formation-support-start">別の相談を開く</button></div>
        </div>
        ${supportSyncNoticeHtml()}
        ${unknownStar5 ? `<div class="notice warning">★5武将で凸未入力が${unknownStar5}名あります。編成に使う武将だけ入力しても進められます。</div>` : `<div class="notice success">★5武将の凸は入力済みです。</div>`}
        <div class="notice info">下の所持武将で<strong>編成候補</strong>を付けた武将だけ、編成作成時の武将候補に表示します。</div>
        <div class="consultation-counts"><span>武将 <b>${inventory.generals.length}</b></span><span>戦法 <b>${inventory.tactics.length}</b></span></div>
        ${consultationInventoryHtml()}
        <div class="section-heading" id="consultation-builder-start"><h2>武将を組む</h2><span>最大10部隊</span></div>
        <div class="consultation-mobile-builder-hint">武将を決めたら、第1・第2戦法の枠をタップして戦法を選択します。</div>
        <div class="form-stack">
          <div class="card form-stack"><label class="field"><span>編成案全体のメモ（任意）</span><textarea maxlength="1000" rows="3" data-consultation-path="note" placeholder="運用順、狙いなど">${escapeHtml(draft.note || "")}</textarea></label></div>
          <div class="consultation-builder-layout">
            <div class="consultation-builder-teams" tabindex="0" role="region" aria-label="編成案の部隊一覧">
              <div class="consultation-team-list">${draft.formations.map(consultationProposalFormationEditorHtml).join("")}</div>
              <button type="button" class="secondary-button add-consultation-formation" data-action="add-consultation-formation" ${draft.formations.length >= 10 ? "disabled" : ""}>＋ 部隊を追加</button>
            </div>
            <div class="consultation-builder-tactics">
              <div class="section-heading consultation-tactic-heading"><h2>戦法を割り当てる</h2><span>ドラッグ&ドロップ</span></div>
              ${consultationTacticPaletteHtml()}
            </div>
          </div>
          <button type="button" class="primary-button" data-action="copy-formation-support-result">編成案をコピー</button>
        </div>
      </div>
      ${consultationPickerHtml()}`,
    activeNav: "formations",
    backAction: "back-to-formation-support-start",
    showNav: false,
    shellClass: "consultation-wide-shell",
  });
  if (state.consultationPicker) window.setTimeout(() => document.getElementById("consultation-picker-search")?.focus(), 30);
}

function consultationPublicAnswersHtml() {
  const proposals = state.sharedConsultation?.proposals ?? [];
  return `<div class="section-heading"><h2>参考回答</h2><span>${proposals.length}件</span></div>
    <div class="consultation-answer-toolbar"><p class="muted">回答者名をタップするとコメントと編成を読めます。通信量を抑えるため、自動確認の間隔は1～5分です。「更新」でいつでも確認できます。</p><button type="button" class="secondary-button compact-button" data-action="refresh-consultation-answers">更新</button></div>
    ${state.consultationAnswersError ? `<p class="notice warning" role="status">${escapeHtml(state.consultationAnswersError)}</p>` : ""}
    ${consultationComparisonHtml(proposals, { readOnly: true })}
    ${proposals.length ? proposals.map((proposal) => consultationProposalHtml(proposal, { readOnly: true, inventory: state.sharedConsultation?.inventory })).join("") : `<div class="card empty-state"><p class="muted">公開された回答はまだありません。相談者のみへの回答はここには表示されません。</p></div>`}`;
}

function stopConsultationAnswersPolling() {
  if (consultationAnswersTimer != null) window.clearInterval(consultationAnswersTimer);
  consultationAnswersTimer = null;
}

function startConsultationAnswersPolling() {
  stopConsultationAnswersPolling();
  consultationAnswersIdleChecks = 0;
  consultationAnswersFailures = 0;
  consultationAnswersNextAt = Date.now() + consultationAnswersBaseDelay();
  consultationAnswersTimer = window.setInterval(() => {
    if (!document.hidden && navigator.onLine !== false && Date.now() >= consultationAnswersNextAt) {
      void refreshConsultationPublicAnswers({ automatic: true });
    }
  }, 30000);
}

function consultationStillOpen(token) {
  return state.view === "formation-consultation" && !state.formationSupportMode && state.consultationToken === token;
}

function updateConsultationPublicAnswersPanel() {
  const panel = document.getElementById("consultation-public-answers");
  if (!panel) return;
  const openIds = new Set([...panel.querySelectorAll("[data-proposal-id][open]")].map((row) => row.dataset.proposalId));
  const comparison = panel.querySelector(".proposal-comparison");
  const comparisonOpen = Boolean(comparison?.open);
  const comparisonScroll = panel.querySelector(".proposal-comparison-scroll")?.scrollLeft || 0;
  panel.innerHTML = consultationPublicAnswersHtml();
  panel.querySelectorAll("[data-proposal-id]").forEach((row) => { row.open = openIds.has(row.dataset.proposalId); });
  const updatedComparison = panel.querySelector(".proposal-comparison");
  if (updatedComparison) updatedComparison.open = comparisonOpen;
  const scroll = panel.querySelector(".proposal-comparison-scroll");
  if (scroll) scroll.scrollLeft = comparisonScroll;
  const link = document.getElementById("consultation-answer-link");
  if (link) link.textContent = `参考回答を読む（${state.sharedConsultation?.proposals?.length || 0}件）`;
}

async function refreshConsultationPublicAnswers({ manual = false, automatic = false } = {}) {
  const token = state.consultationToken;
  if (!consultationStillOpen(token)) return;
  if (automatic && (document.hidden || navigator.onLine === false)) return;
  if (consultationAnswersRefreshPromise?.token === token) return consultationAnswersRefreshPromise.promise;
  const refreshEntry = { token, promise: null };
  consultationAnswersRefreshPromise = refreshEntry;
  const promise = (async () => {
    try {
      const response = await apiRequest("shared_formation_consultation_answers", { token,
        ...(state.sharedConsultation.answersVersion ? { knownVersion: state.sharedConsultation.answersVersion } : {}) });
      if (!consultationStillOpen(token)) return;
      const changed = response.notModified !== true && JSON.stringify(state.sharedConsultation.proposals ?? []) !== JSON.stringify(response.proposals ?? []);
      const hadError = Boolean(state.consultationAnswersError);
      if (response.notModified !== true) state.sharedConsultation.proposals = response.proposals ?? [];
      state.sharedConsultation.answersVersion = response.answersVersion || "";
      state.sharedConsultation.isActive = response.isActive;
      state.consultationAnswersError = "";
      consultationAnswersFailures = 0;
      consultationAnswersIdleChecks = !manual && !changed ? Math.min(consultationAnswersIdleChecks + 1, 3) : 0;
      consultationAnswersNextAt = Date.now() + Math.min(300_000,
        consultationAnswersBaseDelay() * 2 ** consultationAnswersIdleChecks);
      if (changed || hadError || manual) updateConsultationPublicAnswersPanel();
      if (response.isActive === false) {
        const availability = document.getElementById("consultation-availability");
        if (availability) availability.innerHTML = `<div class="notice info">この相談は受付終了です。参考回答を閲覧できます。編集中の下書きはこの端末に残っています。</div>`;
        const submit = document.querySelector('[data-form="submit-formation-consultation-proposal"] button[type="submit"]');
        if (submit) { submit.disabled = true; submit.textContent = "受付終了"; }
      }
    } catch (error) {
      if (!consultationStillOpen(token)) return;
      consultationAnswersFailures = Math.min(consultationAnswersFailures + 1, 3);
      consultationAnswersNextAt = Date.now() + Math.min(300_000,
        consultationAnswersBaseDelay() * 2 ** consultationAnswersFailures);
      if (error.code === "CONSULTATION_NOT_FOUND") {
        state.sharedConsultation.isActive = false;
        state.sharedConsultation.proposals = [];
        state.consultationAnswersError = "この相談URLは非公開になりました。下書きはこの端末に残っています。";
        stopConsultationAnswersPolling();
        const submit = document.querySelector('[data-form="submit-formation-consultation-proposal"] button[type="submit"]');
        if (submit) submit.disabled = true;
      } else {
        state.consultationAnswersError = "参考回答を更新できませんでした。編集中の内容は保持しています。更新ボタンで再試行できます。";
      }
      updateConsultationPublicAnswersPanel();
    } finally {
      if (consultationAnswersRefreshPromise === refreshEntry) consultationAnswersRefreshPromise = null;
    }
  })();
  refreshEntry.promise = promise;
  return promise;
}

function newConsultationRequestId() {
  if (window.crypto.randomUUID) return window.crypto.randomUUID();
  const bytes = window.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function prepareConsultationSubmission(draft) {
  const formations = (draft.formations ?? []).filter((formation) => (formation.members ?? []).some((member) =>
    member.generalQookkaId || member.generalName || member.tactic1Name || member.tactic2Name || member.tactic1QookkaId || member.tactic2QookkaId));
  if (!formations.length || formations.length > 10) throw new Error("武将を設定した部隊を1〜10部隊用意してください。空の追加部隊は送信しません。");
  const payload = {
    proposerName: String(draft.proposerName || "").trim().slice(0, 40),
    note: String(draft.note || "").trim().slice(0, 1000),
    isPublic: draft.isPublic === true,
    formations: formations.map((formation, index) => ({
      name: `第${index + 1}部隊`, note: "", troopType: "", troopLevel: null,
      members: [1,2,3].map((slot) => {
        const member = (formation.members ?? []).find((row) => Number(row.slot) === slot) ?? {};
        return { slot, generalQookkaId: member.generalQookkaId || "", generalName: member.generalName || "",
          tactic1QookkaId: member.tactic1QookkaId || "", tactic1Name: member.tactic1Name || "",
          tactic2QookkaId: member.tactic2QookkaId || "", tactic2Name: member.tactic2Name || "" };
      }),
    })),
  };
  if (!payload.proposerName) throw new Error("提案者名を入力してください。");
  if (payload.formations.some((formation) => formation.members.some((member) => !member.generalQookkaId))) {
    throw new Error("各部隊に大将・副将2名の3武将を設定してください。");
  }
  const ids = payload.formations.flatMap((formation) => formation.members.map((member) => member.generalQookkaId));
  if (new Set(ids).size !== ids.length) throw new Error("同じ武将を複数部隊に配置できません。");
  const signature = JSON.stringify(payload);
  if (!draft.requestId || draft.requestSignature !== signature) {
    draft.requestId = newConsultationRequestId();
    draft.requestSignature = signature;
  }
  return { ...payload, requestId: draft.requestId };
}

function updateConsultationSubmitStatus() {
  const fields = document.getElementById("consultation-proposal-fields");
  if (fields) fields.disabled = state.consultationSubmitting || state.sharedConsultation?.isActive === false;
  const button = document.querySelector('[data-form="submit-formation-consultation-proposal"] button[type="submit"]');
  if (button) {
    button.disabled = state.consultationSubmitting || state.sharedConsultation?.isActive === false;
    button.textContent = state.consultationSubmitting ? "送信中…" : state.sharedConsultation?.isActive === false ? "受付終了" : "この編成案を送信";
  }
  const errorPanel = document.getElementById("consultation-submit-error");
  if (errorPanel) {
    errorPanel.hidden = !state.consultationSubmissionError;
    errorPanel.textContent = state.consultationSubmissionError;
  }
}

async function submitConsultationAnswer(formData) {
  if (state.consultationSubmitting || state.consultationSubmitted || !state.consultationDraft || !state.consultationToken) return false;
  const token = state.consultationToken;
  const draft = state.consultationDraft;
  draft.proposerName = String(formData.get("proposerName") ?? draft.proposerName ?? "").trim();
  draft.note = String(formData.get("note") ?? draft.note ?? "").trim();
  draft.isPublic = formData.get("isPublic") === "on";
  state.consultationSubmissionError = "";
  state.consultationSubmitting = true;
  updateConsultationSubmitStatus();
  try {
    const proposal = prepareConsultationSubmission(draft);
    // 送信IDと最新の入力を送信前に保存。応答が失われても同じIDで再送する。
    persistFormationConsultationLocal();
    const context = state.supportSync?.key === `consultation:${token}` ? state.supportSync : null;
    const savedPayload = supportWorkspacePayload();
    const generalMap = new Map((state.sharedConsultation?.inventory?.generals ?? []).map((row) => [row.qookkaId, row]));
    for (const formation of savedPayload.draft.formations) for (const member of formation.members) {
      const general = generalMap.get(member.generalQookkaId);
      member.dupeCount = general?.dupeCount ?? null;
      member.inherentTacticName = general?.inherentTacticName || "";
    }
    if (context) await flushSupportCloudSave(context);
    const response = await apiRequest("formation_consultation_submit", { token, proposal });
    savedPayload.submitted = true;
    savedPayload.submittedAt = response.proposal?.createdAt || new Date().toISOString();
    if (consultationStillOpen(token) && state.consultationDraft === draft) {
      state.consultationSubmitted = true;
      state.consultationSubmittedAt = savedPayload.submittedAt;
      state.consultationDraft = savedPayload.draft;
      state.consultationPicker = null;
      persistFormationConsultationLocal();
      if (context) await flushSupportCloudSave(context);
      renderFormationConsultationBody();
      await refreshConsultationPublicAnswers({ manual: true });
    } else {
      // 送信待ちの間に別画面へ移っても、対象の相談だけを送信済みにする。
      const key = formationConsultationDraftStorageKey(token);
      try {
        const saved = JSON.parse(window.localStorage.getItem(key) || "null");
        if (saved?.draft?.requestId === proposal.requestId) window.localStorage.setItem(key,
          JSON.stringify({ ...saved, ...savedPayload, savedAt: new Date().toISOString() }));
      } catch {}
      if (context) { context.pending = savedPayload; await flushSupportCloudSave(context); }
    }
    return true;
  } catch (error) {
    if (consultationStillOpen(token)) {
      state.consultationSubmissionError = `${error.message || "送信を確認できませんでした。"} 下書きは保持しています。通信エラーの場合は同じ内容で再送できます。`;
      if (error.code === "CONSULTATION_REQUEST_CONFLICT") { delete draft.requestId; delete draft.requestSignature; }
      if (error.code === "CONSULTATION_CLOSED" || error.code === "CONSULTATION_NOT_FOUND") state.sharedConsultation.isActive = false;
      persistFormationConsultationLocal();
      showToast("送信できませんでした。下書きは保持しています。", "error");
    }
    return false;
  } finally {
    state.consultationSubmitting = false;
    updateConsultationSubmitStatus();
  }
}

function renderFormationConsultationBody() {
  captureConsultationInventoryState();
  if (state.formationSupportMode) {
    renderFormationSupportDirectBody();
    return;
  }
  const consultation = state.sharedConsultation;
  if (!consultation) return;
  const answers = `<section id="consultation-public-answers" class="consultation-public-answers" aria-label="参考回答">${consultationPublicAnswersHtml()}</section>`;
  if (consultation.isActive === false && !state.consultationSubmitted) {
    app.innerHTML = pageHtml({
      title: consultation.title || "編成相談", subtitle: "受付終了・参考回答",
      content: `<div class="page-content consultation-public-page"><div class="notice info">この相談は受付を終了しています。公開された回答は参考として閲覧できます。</div>${consultation.note ? `<div class="card consultation-request"><strong>相談内容</strong><p>${escapeHtml(consultation.note)}</p></div>` : ""}${answers}</div>`,
      showNav: false,
    });
    return;
  }
  if (state.consultationSubmitted) {
    app.innerHTML = pageHtml({
      title: consultation.title || "編成相談",
      subtitle: "提案を送信しました",
      content: `<div class="page-content consultation-public-page"><div class="card consultation-success"><div class="success-mark">✓</div><h2>提案を送信しました</h2><p>${state.consultationDraft?.isPublic ? "この回答は相談URLから参考として閲覧できます。" : "この回答は相談者だけに表示されます。"}</p><p>相談者が「採用」するとマイ編成にコピーされます。</p><a class="secondary-button" href="${escapeAttr(enemyDatabaseUrl())}">敵部隊DBへ</a></div>${supportSyncNoticeHtml()}<div class="section-heading"><h2>あなたが送信した回答</h2></div>${consultationProposalHtml({ ...state.consultationDraft, id: "saved-own-answer", createdAt: state.consultationSubmittedAt }, { readOnly: true, inventory: consultation.inventory })}${answers}</div>`,
      showNav: false,
    });
    return;
  }
  state.consultationDraft ??= newConsultationProposalDraft();
  normalizeConsultationProposalDraftForBuilder();
  const draft = state.consultationDraft;
  const inventory = consultation.inventory ?? { generals: [], tactics: [], lastImport: null };
  app.innerHTML = pageHtml({
    title: consultation.title || "編成相談",
    subtitle: "所持武将・戦法から編成案を作成",
    content: `
      <div class="page-content consultation-public-page">
        ${consultation.note ? `<div class="card consultation-request"><strong>相談内容</strong><p>${escapeHtml(consultation.note)}</p></div>` : ""}
        <div id="consultation-availability"></div>
        <a id="consultation-answer-link" class="consultation-answer-link" href="#consultation-public-answers">参考回答を読む（${consultation.proposals?.length || 0}件）</a>
        <div class="notice info">この相談では、相談者の<strong>全所持武将・凸・全所持戦法</strong>を使って提案できます。上の所持武将一覧で、武将選択に出す武将を絞れます。戦法は各武将の第1・第2枠から割り当てます。PCでは戦法パレットからドラッグもできます。</div>
        ${supportSyncNoticeHtml()}
        <div class="consultation-counts"><span>武将 <b>${inventory.generals.length}</b></span><span>戦法 <b>${inventory.tactics.length}</b></span>${inventory.lastImport?.importedAt ? `<span>所持更新 <b>${escapeHtml(formatDateTime(inventory.lastImport.importedAt))}</b></span>` : ""}</div>
        ${consultationInventoryHtml()}
        <div class="section-heading" id="consultation-builder-start"><h2>武将を組む</h2><span>最大10部隊</span></div>
        <div class="consultation-mobile-builder-hint">武将を決めたら、第1・第2戦法の枠をタップして戦法を選択します。</div>
        <form class="form-stack" data-form="submit-formation-consultation-proposal">
          <fieldset id="consultation-proposal-fields" class="form-stack consultation-submit-fields" ${state.consultationSubmitting ? "disabled" : ""}>
          <div class="card form-stack">
            <label class="field"><span>提案者名</span><input name="proposerName" maxlength="40" required data-consultation-path="proposerName" value="${escapeAttr(draft.proposerName)}" placeholder="ゲーム内名など" /></label>
            <label class="field"><span>提案全体のメモ（任意）</span><textarea name="note" maxlength="1000" rows="3" data-consultation-path="note" placeholder="狙い、運用順、注意点など">${escapeHtml(draft.note)}</textarea></label>
            <label class="consultation-public-consent"><input type="checkbox" name="isPublic" data-consultation-path="isPublic" ${draft.isPublic === true ? "checked" : ""} /><span><strong>相談URLに参考回答として表示する</strong><small>このURLを開ける人に、提案者名・メモ・編成が表示されます。チェックを外すと相談者だけに送ります。相談者は後から公開範囲を変更できます。</small></span></label>
          </div>
          <div class="consultation-builder-layout">
            <div class="consultation-builder-teams" tabindex="0" role="region" aria-label="編成案の部隊一覧">
              <div class="consultation-team-list">${draft.formations.map(consultationProposalFormationEditorHtml).join("")}</div>
              <button type="button" class="secondary-button add-consultation-formation" data-action="add-consultation-formation" ${draft.formations.length >= 10 ? "disabled" : ""}>＋ 部隊を追加</button>
            </div>
            <div class="consultation-builder-tactics">
              <div class="section-heading consultation-tactic-heading"><h2>戦法を割り当てる</h2><span>ドラッグ&ドロップ</span></div>
              ${consultationTacticPaletteHtml()}
            </div>
          </div>
          <div id="consultation-submit-error" class="notice danger" role="alert" ${state.consultationSubmissionError ? "" : "hidden"}>${escapeHtml(state.consultationSubmissionError)}</div>
          <button type="submit" class="primary-button" ${state.consultationSubmitting ? "disabled" : ""}>${state.consultationSubmitting ? "送信中…" : "この編成案を送信"}</button>
          </fieldset>
        </form>
        ${answers}
      </div>
      ${consultationPickerHtml()}`,
    showNav: false,
    shellClass: "consultation-wide-shell",
  });
  if (state.consultationPicker) window.setTimeout(() => document.getElementById("consultation-picker-search")?.focus(), 30);
}

async function renderFormationConsultation() {
  stopConsultationAnswersPolling();
  state.formationSupportMode = false;
  state.consultationSubmitted = false;
  state.consultationSubmissionError = "";
  state.consultationAnswersError = "";
  const token = state.consultationToken;
  state.consultationTacticPaletteSearch = "";
  state.consultationTacticPaletteKinds = [];
  state.consultationTacticPaletteGrades = ["S"];
  state.consultationTacticPaletteSource = "owned";
  state.consultationExpandedTacticSlots = {};
  state.consultationMobileTacticTarget = null;
  app.innerHTML = pageHtml({
    title: "編成相談",
    subtitle: "所持情報を読み込み中",
    content: `<div class="page-content"><div class="card"><p class="muted">読み込み中...</p></div></div>`,
    showNav: false,
  });
  try {
    if (!state.consultationToken) throw new Error("相談URLが不正です。");
    const response = await apiRequest("shared_formation_consultation", { token });
    if (!consultationStillOpen(token)) return;
    state.sharedConsultation = response.consultation;
    const localSaved = loadFormationConsultationLocal(token);
    const saved = await openSupportCloudWorkspace(`consultation:${token}`, localSaved);
    if (!consultationStillOpen(token)) return;
    initializeFormalConsultationCandidates(saved?.candidateGeneralIds);
    state.consultationDraft = saved?.draft ?? newConsultationProposalDraft();
    state.consultationLocalSavedAt = saved?.savedAt || "";
    applySupportWorkspaceSettings(saved);
    if (saved) persistFormationConsultationLocal();
    renderFormationConsultationBody();
    startConsultationAnswersPolling();
  } catch (error) {
    if (!consultationStillOpen(token)) return;
    app.innerHTML = pageHtml({
      title: "編成相談",
      subtitle: "相談URLを開けませんでした",
      content: `<div class="page-content"><div class="notice danger">${escapeHtml(error.message)}</div></div>`,
      showNav: false,
    });
  }
}

function renderFormationEditor() {
  const draft = state.formationDraft ?? newFormationDraft();
  state.formationDraft = draft;
  const missing = state.formationCopyMissing;
  app.innerHTML = pageHtml({
    title: draft.id ? "編成を編集" : "新しい編成",
    subtitle: "所持武将・所持戦法から選択",
    content: `
      <div class="page-content formation-editor-page">
        ${missing && (missing.generals?.length || missing.tactics?.length) ? `<div class="notice warning"><strong>手持ちにない項目があります</strong>${missing.generals?.length ? `<div>武将：${missing.generals.map(escapeHtml).join(" / ")}</div>` : ""}${missing.tactics?.length ? `<div>戦法：${missing.tactics.map(escapeHtml).join(" / ")}</div>` : ""}<small>不足箇所を入れ替えると保存できます。</small></div>` : ""}
        <form class="form-stack" data-form="save-my-formation">
          <div class="card form-stack">
            <div class="draft-status-row"><span>下書き</span><strong id="formation-draft-status">${escapeHtml(state.formationDraftStatus || "自動保存")}</strong></div>
            <label class="field"><span>編成名</span><input name="name" maxlength="60" data-formation-path="name" value="${escapeAttr(draft.name)}" placeholder="例：対計略・第1軍" /></label>
            <div class="two-col">
              <label class="field"><span>兵種</span><select name="troopType" data-formation-path="troopType">
                <option value="">未設定</option>
                ${[["infantry","足軽"],["siege","兵器"],["cavalry","馬"],["bow","弓"],["gun","鉄砲"]].map(([value,label]) => `<option value="${value}" ${draft.troopType === value ? "selected" : ""}>${label}</option>`).join("")}
              </select></label>
              <label class="field"><span>兵種Lv</span><select name="troopLevel" data-formation-path="troopLevel"><option value="">未設定</option>${Array.from({length:10},(_,i)=>i+1).map((lv)=>`<option value="${lv}" ${Number(draft.troopLevel)===lv?"selected":""}>Lv${lv}</option>`).join("")}</select></label>
            </div>
          </div>
          ${formationTagEditorHtml(draft)}
          ${formationGeneralBatchButtonHtml()}
          <div class="formation-dnd-help">武将・戦法は <strong>⋮⋮</strong> をドラッグして入れ替えできます。戦法は武将欄をタップして開き、別武将へ動かすときは両方を開いてください。</div>
          ${draft.members.map(memberEditorHtml).join("")}
          <div class="card"><label class="field"><span>メモ（任意）</span><textarea name="note" maxlength="500" rows="3" data-formation-path="note" placeholder="運用条件、注意点など">${escapeHtml(draft.note)}</textarea></label></div>
          <div class="privacy-notice"><span class="lock-mark">●</span><div><strong>保存しただけでは公開されません</strong><small>共有した編成だけ共有URLから閲覧できます。</small></div></div>
          <button type="submit" class="primary-button">編成を保存</button>
          ${draft.id ? `<button type="button" class="text-button danger-text" data-action="delete-my-formation" data-id="${escapeAttr(draft.id)}">この編成を削除</button>` : ""}
        </form>
      </div>
      ${formationPickerHtml()}`,
    activeNav: "formations",
    backAction: "back-to-formations",
    showNav: false,
  });
  if (state.formationPicker) window.setTimeout(() => document.getElementById("formation-picker-search")?.focus(), 30);
}

function shareUrlForFormation(formation) {
  if (!formation?.shareToken) return "";
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("formation", formation.shareToken);
  return url.toString();
}

async function copyText(value) {
  if (!value) return false;
  try { await navigator.clipboard.writeText(value); return true; }
  catch {
    const area = document.createElement("textarea");
    area.value = value;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}


function shareUrlForFormationSet(token) {
  if (!token) return "";
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("formation_set", token);
  return url.toString();
}

function sharedFormationCardHtml(formation, index) {
  return `
    <article class="card shared-formation-card">
      <div class="shared-set-card-heading">
        <div><span class="shared-set-number">${index + 1}</span><strong>${escapeHtml(formation.name || "名称未設定の編成")}</strong></div>
        <small>${escapeHtml(observationTroopText({ report_summary: { troopType: formation.troopType, troopLevel: formation.troopLevel } }) || "兵種未設定")}</small>
      </div>
      ${formationTagsHtml(formation)}
      <div class="formation-summary large">${formationSummaryMembers(formation)}</div>
      ${formation.note ? `<p class="formation-note">${escapeHtml(formation.note)}</p>` : ""}
      <div class="shared-card-footer">${formation.updatedAt ? `<small class="muted">更新 ${escapeHtml(formatDateTime(formation.updatedAt))}</small>` : ""}<button type="button" class="secondary-button compact-button" data-action="copy-shared-formation-to-mine" data-set-token="${escapeAttr(state.shareSetToken || "")}" data-formation-id="${escapeAttr(formation.id || "")}">マイ編成にコピー</button></div>
    </article>`;
}

async function renderSharedFormationSet() {
  app.innerHTML = pageHtml({
    title: "共有編成",
    subtitle: "複数部隊をまとめて表示",
    content: `<div class="page-content"><div class="card"><p class="muted">読み込み中...</p></div></div>`,
    showNav: false,
  });
  try {
    const response = await apiRequest("shared_formation_set", { token: state.shareSetToken });
    state.sharedFormationSet = response.shareSet;
    const set = state.sharedFormationSet;
    const formations = set.formations ?? [];
    app.innerHTML = pageHtml({
      title: set.title || "共有編成",
      subtitle: `${formations.length}編成`,
      content: `
        <div class="page-content shared-formation-page shared-formation-set-page">
          <div class="shared-set-intro"><span class="privacy-badge shared">共有セット</span><strong>${formations.length}編成</strong><small>このURLで共有された編成のみ表示しています。</small></div>
          ${formations.map(sharedFormationCardHtml).join("")}
          <button type="button" class="secondary-button" style="width:100%" data-action="close-shared-formation-set">自分の画面へ</button>
        </div>`,
      showNav: false,
    });
  } catch (error) {
    app.innerHTML = pageHtml({
      title: "共有編成",
      content: `<div class="page-content"><div class="notice danger">${escapeHtml(error.message)}</div><button type="button" class="secondary-button" style="width:100%;margin-top:12px" data-action="close-shared-formation-set">自分の画面へ</button></div>`,
      showNav: false,
    });
  }
}

async function renderSharedFormation() {
  app.innerHTML = pageHtml({
    title: "共有編成",
    subtitle: "共有された部隊情報",
    content: `<div class="page-content"><div class="card"><p class="muted">読み込み中...</p></div></div>`,
    showNav: false,
  });
  try {
    const response = await apiRequest("shared_formation", { token: state.shareToken });
    state.sharedFormation = response.formation;
    const formation = state.sharedFormation;
    app.innerHTML = pageHtml({
      title: formation.name || "共有編成",
      subtitle: observationTroopText({ report_summary: { troopType: formation.troopType, troopLevel: formation.troopLevel } }) || "兵種未設定",
      content: `
        <div class="page-content shared-formation-page">
          <div class="card shared-formation-card">
            <div class="shared-set-card-heading"><div><span class="privacy-badge shared">共有編成</span><strong>${escapeHtml(formation.name || "共有編成")}</strong></div><small>${escapeHtml(observationTroopText({ report_summary: { troopType: formation.troopType, troopLevel: formation.troopLevel } }) || "兵種未設定")}</small></div>
            ${formationTagsHtml(formation)}
            <div class="formation-summary large">${formationSummaryMembers(formation)}</div>
            ${formation.note ? `<p class="formation-note">${escapeHtml(formation.note)}</p>` : ""}
            <div class="shared-card-footer"><small class="muted">更新 ${escapeHtml(formatDateTime(formation.updatedAt))}</small><button type="button" class="primary-button compact-button" data-action="copy-shared-formation-to-mine" data-token="${escapeAttr(state.shareToken || "")}">マイ編成にコピー</button></div>
          </div>
          <button type="button" class="secondary-button" style="width:100%" data-action="close-shared-formation">自分の画面へ</button>
        </div>`,
      showNav: false,
    });
  } catch (error) {
    app.innerHTML = pageHtml({
      title: "共有編成",
      content: `<div class="page-content"><div class="notice danger">${escapeHtml(error.message)}</div><button type="button" class="secondary-button" style="width:100%;margin-top:12px" data-action="close-shared-formation">自分の画面へ</button></div>`,
      showNav: false,
    });
  }
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
      state.currentSeason = state.admin.settings?.enemy_current_season ?? state.admin.settings?.current_season ?? state.currentSeason;
      state.intelSeason = state.admin.settings?.intel_current_season ?? state.admin.settings?.current_season ?? state.intelSeason;
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
      <div class="card-header"><div><h2>マイ編成の所持情報</h2><small>低頻度の設定・更新</small></div></div>
      <p class="muted">Qookka共有URLから所持武将・所持戦法を同期し、武将の凸を設定します。普段の編成登録・編集は「マイ編成」から行います。</p>
      <button type="button" class="secondary-button" style="width:100%" data-action="navigate" data-view="inventory">所持情報を管理</button>
    </div>

    <div class="card">
      <div class="card-header"><div><h2>武将・戦法マスタ</h2><small>OCRの誤読補正辞書</small></div></div>
      <p class="muted">OCRで読み取った名称を、登録済みの正しい武将名・戦法名へ近似照合します。閲覧は全員、修正は管理者のみ可能です。</p>
      <button type="button" class="secondary-button" style="width:100%" data-action="navigate" data-view="masters">マスタを確認</button>
    </div>

    ${
      member?.role === "admin" && adminData
        ? `<div class="card form-stack season-reset-card">
            <div class="card-header"><div><h2>シーズン切替</h2><small>管理者限定・過去データは削除しません</small></div></div>
            <div class="notice info">現在シーズンの記録は履歴として残したまま、新しいシーズンを空の状態から開始します。敵一覧と諜報は個別に切り替えられます。</div>
            <div class="season-reset-grid">
              <form class="season-reset-panel form-stack" data-form="reset-enemy-season">
                <div><strong>敵一覧</strong><small>現在：${escapeHtml(adminData.settings.enemy_current_season ?? state.currentSeason ?? "未設定")}</small></div>
                <label class="field"><span>次のシーズン名</span><input name="newSeason" maxlength="60" placeholder="例：PK2" required /></label>
                <button type="submit" class="danger-button">敵一覧を新シーズンへ切替</button>
                <p class="muted compact-note">現在シーズンの観測記録は残り、新シーズンの敵一覧だけ0件から始まります。</p>
              </form>
              <form class="season-reset-panel form-stack" data-form="reset-intel-season">
                <div><strong>諜報</strong><small>現在：${escapeHtml(adminData.settings.intel_current_season ?? state.intelSeason ?? "未設定")}</small></div>
                <label class="field"><span>次のシーズン名</span><input name="newSeason" maxlength="60" placeholder="例：PK2" required /></label>
                <button type="submit" class="danger-button">諜報を新シーズンへ切替</button>
                <p class="muted compact-note">ポイント・ランキング・フィード・称号を0から開始し、旧シーズン実績はDBに残します。</p>
              </form>
            </div>
          </div>
          <div class="card form-stack">
            <div class="card-header"><div><h2>OCR上限</h2><small>月900枚を超える設定は不可</small></div></div>
            <form class="form-stack" data-form="update-limits">
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
            <div class="card-header"><div><h2>Discord連携・称号ロール</h2><small>${escapeHtml(state.intelSeason || "未設定")}用の設定</small></div></div>
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
            <p class="muted" style="margin:0">諜報を新シーズンへ切り替えると、現在のDiscordサーバーID・称号ロールIDを引き継ぎ、0ptの状態へ同期します。必要な場合だけここで設定を変更してください。Botの「ロールの管理」権限と、Botロールが称号ロールより上にあることが必要です。</p>
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
  state.currentSeason = state.admin.settings?.enemy_current_season ?? state.admin.settings?.current_season ?? state.currentSeason;
  state.intelSeason = state.admin.settings?.intel_current_season ?? state.admin.settings?.current_season ?? state.intelSeason;
  renderSettingsBody();
}

let searchTimer = null;

function scheduleEnemySearch() {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(async () => {
    try {
      const response = await apiRequest("list_enemies", {
        playerSearch: state.enemyPlayerSearch,
        groupSearch: state.enemyGroupSearch,
        formationSearch: state.enemyFormationSearch,
      });
      state.enemies = response.enemies ?? [];
      state.currentSeason = response.currentSeason ?? state.currentSeason;
      renderEnemyListBody();
    } catch (error) {
      showToast(error.message, "error");
    }
  }, 300);
}


let formationDragState = null;
let formationPointerDrag = null;

function formationDndDescriptor(element) {
  if (!element) return null;
  const rawType = element.dataset.dndType || element.dataset.dndDropType || "general";
  const type = rawType === "tactic" ? "tactic" : "general";
  return {
    context: element.dataset.dndContext === "consultation" ? "consultation" : "my",
    type,
    sourceKind: element.dataset.dndSourceKind || "",
    targetKind: element.dataset.dndTargetKind || "",
    formationIndex: element.dataset.formationIndex === undefined ? null : Number(element.dataset.formationIndex),
    slot: element.dataset.slot === undefined ? null : Number(element.dataset.slot),
    field: type === "tactic" && element.dataset.field ? (element.dataset.field === "tactic2" ? "tactic2" : "tactic1") : null,
    tacticId: element.dataset.tacticId || "",
    tacticName: element.dataset.tacticName || "",
  };
}

function formationDndCompatible(source, target) {
  if (!source || !target) return false;
  if (source.context !== target.context || source.type !== target.type) return false;
  if (source.context === "consultation") {
    if (source.type === "general") {
      if (!Number.isFinite(source.formationIndex) || !Number.isFinite(target.formationIndex)) return false;
      return Number(source.formationIndex) !== Number(target.formationIndex) || Number(source.slot) !== Number(target.slot);
    }
    if (["pool","teachable"].includes(source.sourceKind)) return ["member","slot"].includes(target.targetKind) && Number.isFinite(target.formationIndex) && Number.isFinite(target.slot);
    if (target.targetKind === "slot") {
      return Number(source.formationIndex) !== Number(target.formationIndex) || Number(source.slot) !== Number(target.slot) || source.field !== target.field;
    }
    if (target.targetKind === "member") {
      return Number(source.formationIndex) !== Number(target.formationIndex) || Number(source.slot) !== Number(target.slot);
    }
    return false;
  }
  if (source.type === "general") return Number(source.slot) !== Number(target.slot);
  return Number(source.slot) !== Number(target.slot) || source.field !== target.field;
}

function clearFormationDndHighlight() {
  document.querySelectorAll(".formation-dnd-over").forEach((node) => node.classList.remove("formation-dnd-over"));
  document.querySelectorAll(".formation-dnd-source").forEach((node) => node.classList.remove("formation-dnd-source"));
  document.body.classList.remove("formation-dragging");
}

function formationDndTargetAt(x, y, source) {
  const node = document.elementFromPoint(x, y)?.closest?.(`[data-dnd-drop-type="${source?.type || ""}"]`);
  const target = formationDndDescriptor(node);
  return formationDndCompatible(source, target) ? { node, target } : null;
}

function consultationMemberAt(descriptor) {
  if (!descriptor || !Number.isFinite(descriptor.formationIndex) || !Number.isFinite(descriptor.slot)) return null;
  const formation = state.consultationDraft?.formations?.[Number(descriptor.formationIndex)];
  const member = formation?.members?.find((row) => Number(row.slot) === Number(descriptor.slot));
  return formation && member ? { formation, member } : null;
}

function emptyConsultationMember(slot) {
  return { slot:Number(slot), generalQookkaId:"", generalName:"", tactic1QookkaId:"", tactic1Name:"", tactic2QookkaId:"", tactic2Name:"" };
}

function swapConsultationGeneralCells(source, target) {
  const a = consultationMemberAt(source);
  const b = consultationMemberAt(target);
  if (!a || !b) return false;
  const aPayload = { ...a.member, slot:Number(target.slot) };
  const bPayload = { ...b.member, slot:Number(source.slot) };
  const aIndex = a.formation.members.findIndex((row)=>Number(row.slot)===Number(source.slot));
  const bIndex = b.formation.members.findIndex((row)=>Number(row.slot)===Number(target.slot));
  if (aIndex < 0 || bIndex < 0) return false;
  a.formation.members[aIndex] = bPayload;
  b.formation.members[bIndex] = aPayload;
  a.formation.members.sort((x,y)=>Number(x.slot)-Number(y.slot));
  b.formation.members.sort((x,y)=>Number(x.slot)-Number(y.slot));
  return true;
}

function assignConsultationPaletteTactic(source, target) {
  const targetEntry = consultationMemberAt(target);
  if (!targetEntry?.member?.generalQookkaId) { showToast("先に武将を選択してください。", "error"); return false; }
  const teachable = source.sourceKind === "teachable";
  const tactic = teachable
    ? consultationTeachableTactics().find((row) => normalizeSearchText(consultationTacticBaseName(row.name)) === normalizeSearchText(consultationTacticBaseName(source.tacticName)))
    : (state.sharedConsultation?.inventory?.tactics ?? []).find((row)=>row.qookkaId === source.tacticId);
  if (!tactic) return false;
  const baseName = consultationTacticBaseName(tactic.name);
  const assignedNames = [targetEntry.member.tactic1Name, targetEntry.member.tactic2Name].map(consultationTacticBaseName);
  if (assignedNames.some((name) => normalizeSearchText(name) === normalizeSearchText(baseName))) {
    showToast("この武将にはすでに設定されています。", "error"); return false;
  }
  const limit = FORMATION_TACTIC_COPY_LIMITS[baseName] ?? (teachable ? 1 : maxTacticCopies(tactic));
  if (consultationTacticUsageCount("", baseName) >= limit) {
    showToast("この戦法はすでに使用されています。", "error"); return false;
  }
  const field = target.targetKind === "slot" && target.field
    ? target.field
    : (!targetEntry.member.tactic1Name ? "tactic1" : !targetEntry.member.tactic2Name ? "tactic2" : "");
  if (!field) { showToast("この武将には戦法が2つ設定済みです。外す戦法へ直接ドロップすると置き換えできます。", "error"); return false; }
  targetEntry.member[`${field}QookkaId`] = teachable ? "" : tactic.qookkaId;
  targetEntry.member[`${field}Name`] = teachable ? `${baseName}（伝授）` : tactic.name;
  return true;
}

function swapConsultationTacticCells(source, target) {
  const from = consultationMemberAt(source);
  const to = consultationMemberAt(target);
  if (!from || !to || !source.field || !target.field) return false;
  const fromId = `${source.field}QookkaId`;
  const fromName = `${source.field}Name`;
  const toId = `${target.field}QookkaId`;
  const toName = `${target.field}Name`;
  const id = from.member[fromId] || "";
  const name = from.member[fromName] || "";
  from.member[fromId] = to.member[toId] || "";
  from.member[fromName] = to.member[toName] || "";
  to.member[toId] = id;
  to.member[toName] = name;
  return true;
}

function moveConsultationAssignedTactic(source, target) {
  const from = consultationMemberAt(source);
  const to = consultationMemberAt(target);
  if (!from || !to || !source.field) return false;
  if (!to.member.generalQookkaId) { showToast("先に武将を選択してください。", "error"); return false; }
  const idKey = `${source.field}QookkaId`;
  const nameKey = `${source.field}Name`;
  const tacticId = from.member[idKey] || "";
  const tacticName = from.member[nameKey] || "";
  if (!tacticId && !tacticName) return false;
  if (tacticId && (to.member.tactic1QookkaId === tacticId || to.member.tactic2QookkaId === tacticId)) return false;
  const targetField = !to.member.tactic1QookkaId ? "tactic1" : !to.member.tactic2QookkaId ? "tactic2" : "";
  if (!targetField) { showToast("移動先の武将には戦法が2つ設定済みです。", "error"); return false; }
  from.member[idKey] = "";
  from.member[nameKey] = "";
  to.member[`${targetField}QookkaId`] = tacticId;
  to.member[`${targetField}Name`] = tacticName;
  return true;
}

function performFormationDndSwap(source, target) {
  if (source?.context !== "my" && state.consultationSubmitting) return false;
  if (!formationDndCompatible(source, target)) return false;
  if (source.context === "my") {
    if (!state.formationDraft) return false;
    if (source.type === "general") swapMemberSlots(state.formationDraft.members, source.slot, target.slot);
    else swapTacticSlots(state.formationDraft.members, source, target);
    scheduleFormationDraftSave();
    renderFormationEditor();
    return true;
  }
  let changed = false;
  if (source.type === "general") changed = swapConsultationGeneralCells(source, target);
  else if (["pool","teachable"].includes(source.sourceKind)) changed = assignConsultationPaletteTactic(source, target);
  else if (target.targetKind === "slot") changed = swapConsultationTacticCells(source, target);
  else changed = moveConsultationAssignedTactic(source, target);
  if (!changed) return false;
  persistConsultationWorkspaceLocal();
  renderFormationConsultationBody();
  return true;
}

function createFormationDragGhost(sourceElement) {
  const ghost = document.createElement("div");
  ghost.className = "formation-drag-ghost";
  const strong = sourceElement.querySelector("strong, .selected-general-main > span, span");
  ghost.textContent = strong?.textContent?.trim() || (sourceElement.dataset.dndType === "tactic" ? "戦法を移動" : "武将を移動");
  document.body.appendChild(ghost);
  return ghost;
}

function positionFormationDragGhost(ghost, x, y) {
  if (!ghost) return;
  ghost.style.transform = `translate(${Math.round(x + 14)}px, ${Math.round(y + 14)}px)`;
}

document.addEventListener("dragstart", (event) => {
  const element = event.target.closest?.("[data-dnd-type]");
  if (!element || element.getAttribute("draggable") !== "true") return;
  const source = formationDndDescriptor(element);
  formationDragState = source;
  element.classList.add("formation-dnd-source");
  document.body.classList.add("formation-dragging");
  try {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(source));
  } catch {}
});

document.addEventListener("dragover", (event) => {
  if (!formationDragState) return;
  const targetElement = event.target.closest?.(`[data-dnd-drop-type="${formationDragState.type}"]`);
  const target = formationDndDescriptor(targetElement);
  document.querySelectorAll(".formation-dnd-over").forEach((node) => node.classList.remove("formation-dnd-over"));
  if (!formationDndCompatible(formationDragState, target)) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
  targetElement.classList.add("formation-dnd-over");
});

document.addEventListener("drop", (event) => {
  if (!formationDragState) return;
  const targetElement = event.target.closest?.(`[data-dnd-drop-type="${formationDragState.type}"]`);
  const target = formationDndDescriptor(targetElement);
  if (!formationDndCompatible(formationDragState, target)) return;
  event.preventDefault();
  const source = formationDragState;
  formationDragState = null;
  clearFormationDndHighlight();
  performFormationDndSwap(source, target);
});

document.addEventListener("dragend", () => {
  formationDragState = null;
  clearFormationDndHighlight();
});

document.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  const handle = event.target.closest?.(".formation-dnd-handle");
  const sourceElement = handle?.closest?.("[data-dnd-type]");
  if (!handle || !sourceElement || sourceElement.getAttribute("draggable") !== "true") return;
  event.preventDefault();
  formationPointerDrag = {
    pointerId: event.pointerId,
    source: formationDndDescriptor(sourceElement),
    sourceElement,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    targetNode: null,
    target: null,
    ghost: null,
  };
  try { handle.setPointerCapture(event.pointerId); } catch {}
}, { passive: false });

document.addEventListener("pointermove", (event) => {
  const drag = formationPointerDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  if (!drag.active && Math.hypot(dx, dy) < 7) return;
  if (!drag.active) {
    drag.active = true;
    drag.sourceElement.classList.add("formation-dnd-source");
    document.body.classList.add("formation-dragging");
    drag.ghost = createFormationDragGhost(drag.sourceElement);
  }
  event.preventDefault();
  positionFormationDragGhost(drag.ghost, event.clientX, event.clientY);
  drag.targetNode?.classList.remove("formation-dnd-over");
  const found = formationDndTargetAt(event.clientX, event.clientY, drag.source);
  drag.targetNode = found?.node || null;
  drag.target = found?.target || null;
  drag.targetNode?.classList.add("formation-dnd-over");
}, { passive: false });

function finishFormationPointerDrag(event) {
  const drag = formationPointerDrag;
  if (!drag || drag.pointerId !== event.pointerId) return;
  formationPointerDrag = null;
  drag.ghost?.remove();
  clearFormationDndHighlight();
  if (drag.active && drag.target) {
    event.preventDefault();
    performFormationDndSwap(drag.source, drag.target);
  }
}

document.addEventListener("pointerup", finishFormationPointerDrag, { passive: false });
document.addEventListener("pointercancel", finishFormationPointerDrag, { passive: false });

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.id === "consultation-picker-search") {
    if (state.consultationPicker) {
      state.consultationPicker.query = target.value;
      if (!event.isComposing && target.dataset.composing !== "true") refreshConsultationPickerOptions();
    }
    return;
  }
  if (target.id === "consultation-tactic-palette-search" || target.id === "consultation-mobile-tactic-search") {
    state.consultationTacticPaletteSearch = target.value;
    if (!event.isComposing && target.dataset.composing !== "true") refreshConsultationTacticPaletteList();
    persistConsultationWorkspaceLocal();
    return;
  }
  const consultationPath = target.dataset?.consultationPath;
  if (consultationPath && state.consultationDraft) {
    state.consultationDraft[consultationPath] = target.type === "checkbox" ? target.checked : target.value;
    persistConsultationWorkspaceLocal();
    return;
  }
  const consultationFormationPath = target.dataset?.consultationFormationPath;
  if (consultationFormationPath && state.consultationDraft) {
    const formation = state.consultationDraft.formations?.[Number(target.dataset.index)];
    if (formation) formation[consultationFormationPath] = target.value;
    persistConsultationWorkspaceLocal();
    return;
  }
  if (target.id === "formation-share-title") {
    state.formationShareTitle = target.value;
    return;
  }
  if (target.id === "inventory-search") {
    state.inventorySearch = target.value;
    if (!event.isComposing && target.dataset.composing !== "true") applyInventorySearchFilter();
    return;
  }
  if (target.id === "formation-picker-search") {
    if (state.formationPicker) {
      state.formationPicker.query = target.value;
      if (!event.isComposing && target.dataset.composing !== "true") refreshFormationPickerOptions();
    }
    return;
  }
  const formationPath = target.dataset?.formationPath;
  if (formationPath && state.formationDraft) {
    state.formationDraft[formationPath] = target.value;
    scheduleFormationDraftSave();
    return;
  }
  if (["enemy-player-search", "enemy-group-search", "enemy-formation-search"].includes(target.id)) {
    if (target.id === "enemy-player-search") state.enemyPlayerSearch = target.value;
    else if (target.id === "enemy-group-search") state.enemyGroupSearch = target.value;
    else state.enemyFormationSearch = target.value;
    if (!event.isComposing && target.dataset.composing !== "true") scheduleEnemySearch();
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
  if (["master-search", "enemy-player-search", "enemy-group-search", "enemy-formation-search", "inventory-search", "formation-picker-search", "consultation-picker-search", "consultation-tactic-palette-search", "consultation-mobile-tactic-search"].includes(target?.id)) {
    target.dataset.composing = "true";
  }
});

document.addEventListener("compositionend", (event) => {
  const target = event.target;
  if (!["master-search", "enemy-player-search", "enemy-group-search", "enemy-formation-search", "inventory-search", "formation-picker-search", "consultation-picker-search", "consultation-tactic-palette-search", "consultation-mobile-tactic-search"].includes(target?.id)) return;
  delete target.dataset.composing;
  if (target.id === "consultation-picker-search") {
    if (state.consultationPicker) {
      state.consultationPicker.query = target.value;
      refreshConsultationPickerOptions();
    }
    return;
  }
  if (target.id === "consultation-tactic-palette-search" || target.id === "consultation-mobile-tactic-search") {
    state.consultationTacticPaletteSearch = target.value;
    refreshConsultationTacticPaletteList();
    return;
  }
  if (target.id === "master-search") {
    state.masterSearch = target.value;
    applyMasterSearchFilter();
    return;
  }
  if (target.id === "inventory-search") {
    state.inventorySearch = target.value;
    applyInventorySearchFilter();
    return;
  }
  if (target.id === "formation-picker-search") {
    if (state.formationPicker) {
      state.formationPicker.query = target.value;
      refreshFormationPickerOptions();
    }
    return;
  }
  if (target.id === "enemy-player-search") state.enemyPlayerSearch = target.value;
  else if (target.id === "enemy-group-search") state.enemyGroupSearch = target.value;
  else if (target.id === "enemy-formation-search") state.enemyFormationSearch = target.value;
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
  if (target?.hasAttribute?.("data-hide-used-consultation-tactics")) {
    state.consultationHideUsedTactics = Boolean(target.checked);
    document.querySelectorAll("[data-hide-used-consultation-tactics]").forEach((checkbox) => { checkbox.checked = state.consultationHideUsedTactics; });
    persistConsultationWorkspaceLocal();
    refreshConsultationTacticPaletteList();
    return;
  }
  if (target?.dataset?.consultationPath && state.consultationDraft) {
    state.consultationDraft[target.dataset.consultationPath] = target.type === "checkbox" ? target.checked : target.value;
    persistConsultationWorkspaceLocal();
    return;
  }
  if (target?.dataset?.consultationCandidateId) {
    const id = String(target.dataset.consultationCandidateId || "");
    const general = state.sharedConsultation?.inventory?.generals?.find((row) => String(row.qookkaId || "") === id);
    if (general) {
      general.supportCandidate = Boolean(target.checked);
      persistConsultationWorkspaceLocal();
      target.closest(".consultation-general-chip")?.classList.toggle("candidate-selected", general.supportCandidate);
      updateConsultationCandidateDisplay();
    }
    return;
  }
  if (["consultation-picker-star", "consultation-picker-faction", "consultation-picker-cost"].includes(target.id)) {
    if (state.consultationPicker?.kind === "general") {
      state.consultationPicker.filters ??= { ...(state.consultationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" }) };
      const key = target.id === "consultation-picker-star" ? "star" : target.id === "consultation-picker-faction" ? "faction" : "cost";
      state.consultationPicker.filters[key] = target.value;
      state.consultationGeneralPickerFilters = { ...state.consultationPicker.filters };
      refreshConsultationPickerOptions();
    }
    return;
  }
  const consultationFormationPath = target.dataset?.consultationFormationPath;
  if (consultationFormationPath && state.consultationDraft) {
    const formation = state.consultationDraft.formations?.[Number(target.dataset.index)];
    if (formation) formation[consultationFormationPath] = target.value;
    persistConsultationWorkspaceLocal();
    return;
  }
  if (["inventory-star-filter", "inventory-faction-filter", "inventory-cost-filter"].includes(target.id)) {
    const key = target.id === "inventory-star-filter" ? "star" : target.id === "inventory-faction-filter" ? "faction" : "cost";
    state.inventoryFilters[key] = target.value;
    applyInventorySearchFilter();
    return;
  }
  if (["formation-picker-star", "formation-picker-faction", "formation-picker-cost"].includes(target.id)) {
    if (state.formationPicker?.kind === "general") {
      state.formationPicker.filters ??= { ...(state.formationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" }) };
      const key = target.id === "formation-picker-star" ? "star" : target.id === "formation-picker-faction" ? "faction" : "cost";
      state.formationPicker.filters[key] = target.value;
      state.formationGeneralPickerFilters = { ...state.formationPicker.filters };
      refreshFormationPickerOptions();
    }
    return;
  }
  const formationPath = target.dataset?.formationPath;
  if (formationPath && state.formationDraft) {
    state.formationDraft[formationPath] = target.value;
    scheduleFormationDraftSave();
    return;
  }
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



  if (form.dataset.form === "open-formation-consultation-url") {
    const token = parseConsultationTokenInput(formData.get("url"));
    if (!token) { showToast("編成相談URLを確認してください。", "error"); return; }
    state.formationSupportMode = false;
    state.consultationToken = token;
    state.sharedConsultation = null;
    state.consultationDraft = null;
    state.consultationPicker = null;
    state.consultationSwap = null;
    state.consultationSubmitted = false;
    await navigate("formation-consultation");
    return;
  }

  if (form.dataset.form === "open-qookka-formation-support") {
    showLoading("Qookkaから手持ちを読み込み中...");
    try {
      const response = await apiRequest("qookka_inventory_preview", { url: formData.get("url") });
      const name = String(formData.get("name") ?? "").trim();
      state.formationSupportMode = true;
      state.formationSupportName = name;
      state.formationSupportWorkspaceKey = `direct:${newConsultationRequestId()}`;
      state.consultationToken = "";
      for (const general of response.inventory?.generals ?? []) general.supportCandidate = false;
      state.sharedConsultation = {
        title: name ? `${name}さんの編成` : "他人の編成",
        note: "",
        inventory: response.inventory,
      };
      state.consultationDraft = newConsultationProposalDraft();
      state.consultationPicker = null;
      state.consultationTacticPaletteSearch = "";
      state.consultationTacticPaletteKinds = [];
      state.consultationTacticPaletteGrades = ["S"];
      state.consultationTacticPaletteSource = "owned";
      state.consultationHideUsedTactics = false;
      state.consultationSwap = null;
      state.consultationExpandedTacticSlots = {};
      state.consultationMobileTacticTarget = null;
      state.consultationSubmitted = false;
      state.consultationSubmittedAt = "";
      state.consultationInventoryOpen = null;
      await openSupportCloudWorkspace(state.formationSupportWorkspaceKey, null);
      persistFormationSupportLocal();
      await navigate("formation-support-workspace");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
    return;
  }

  if (form.dataset.form === "create-formation-consultation") {
    showLoading("相談URLを作成中...");
    try {
      const response = await apiRequest("my_formation_consultation_create", {
        consultation: { title: formData.get("title"), note: formData.get("note") },
      });
      const url = formationConsultationUrl(response.consultation?.shareToken || "");
      const copied = await copyText(url);
      showToast(copied ? "編成相談URLを作成してコピーしました。" : "編成相談URLを作成しました。", copied ? "success" : "error");
      await navigate("formations");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
    return;
  }

  if (form.dataset.form === "submit-formation-consultation-proposal") {
    await submitConsultationAnswer(formData);
    return;
  }

  if (form.dataset.form === "qookka-sync") {
    showLoading("Qookkaから所持情報を取得中...");
    try {
      const response = await apiRequest("my_inventory_sync", { url: formData.get("url") });
      state.myInventory = response.inventory;
      const result = response.result ?? {};
      const changes = [
        ...(result.addedGenerals ?? []).map((name) => `武将 +${name}`),
        ...(result.removedGenerals ?? []).map((name) => `武将 -${name}`),
        ...(result.addedTactics ?? []).map((name) => `戦法 +${name}`),
        ...(result.removedTactics ?? []).map((name) => `戦法 -${name}`),
      ];
      showToast(`同期完了：武将${result.generalCount ?? 0} / 戦法${result.tacticCount ?? 0}${changes.length ? `（変更${changes.length}件）` : "（変更なし）"}`, "success");
      if (state.view === "inventory") renderMyInventoryBody();
      else if (state.view === "formations") { state.myFormations = (await apiRequest("my_formations")).formations ?? []; renderMyFormationsBody(); }
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
    return;
  }

  if (form.dataset.form === "save-my-formation") {
    if (!state.formationDraft) return;
    if (state.formationDraftSaveTimer) { window.clearTimeout(state.formationDraftSaveTimer); state.formationDraftSaveTimer = null; }
    showLoading("編成を保存中...");
    try {
      state.formationDraft.name = String(formData.get("name") ?? "").trim();
      state.formationDraft.note = String(formData.get("note") ?? "").trim();
      state.formationDraft.troopType = String(formData.get("troopType") ?? "");
      state.formationDraft.troopLevel = formData.get("troopLevel") ? Number(formData.get("troopLevel")) : null;
      await apiRequest("my_formation_save", { formation: state.formationDraft });
      state.formationDraft = null;
      state.formationPicker = null;
      state.formationDraftRemote = null;
      state.formationCopyMissing = null;
      showToast("編成を保存しました。", "success");
      await navigate("formations");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
    return;
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


  if (form.dataset.form === "reset-enemy-season") {
    const newSeason = String(formData.get("newSeason") ?? "").trim();
    if (!newSeason) return;
    const fromSeason = state.admin?.settings?.enemy_current_season ?? state.currentSeason ?? "未設定";
    if (!window.confirm(`敵一覧を「${fromSeason}」から「${newSeason}」へ切り替えます。\n${fromSeason}の観測記録は削除せず履歴として残ります。実行しますか？`)) return;
    showLoading("敵一覧を新シーズンへ切替中...");
    try {
      const response = await apiRequest("admin_reset_enemy_season", { newSeason });
      state.currentSeason = response.settings?.enemy_current_season ?? newSeason;
      state.enemies = [];
      showToast(`敵一覧を${state.currentSeason}へ切り替えました。${response.preservedObservationCount ?? 0}件の旧観測は履歴として保持しています。`, "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
    return;
  }

  if (form.dataset.form === "reset-intel-season") {
    const newSeason = String(formData.get("newSeason") ?? "").trim();
    if (!newSeason) return;
    const fromSeason = state.admin?.settings?.intel_current_season ?? state.intelSeason ?? "未設定";
    if (!window.confirm(`諜報を「${fromSeason}」から「${newSeason}」へ切り替えます。\n${fromSeason}のポイント・ランキング・フィードは削除せず履歴として残ります。実行しますか？`)) return;
    showLoading("諜報を新シーズンへ切替中...");
    try {
      const response = await apiRequest("admin_reset_intel_season", { newSeason });
      state.intelSeason = response.settings?.intel_current_season ?? newSeason;
      state.intel = null;
      showToast(`諜報を${state.intelSeason}へ切り替えました。旧シーズンの${response.preservedPointEvents ?? 0}件のポイント記録は保持しています。`, "success");
      await refreshAdmin();
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      hideLoading();
    }
    return;
  }

  if (form.dataset.form === "update-limits") {
    showLoading("上限を更新中...");
    try {
      await apiRequest("admin_update_limits", {
        globalDaily: Number(formData.get("globalDaily")),
        globalMonthly: Number(formData.get("globalMonthly")),
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
  if (state.consultationSubmitting && state.view === "formation-consultation"
      && action.includes("consultation") && action !== "refresh-consultation-answers") return;

  if (action === "clear-enemy-search") {
    state.enemyPlayerSearch = "";
    state.enemyGroupSearch = "";
    state.enemyFormationSearch = "";
    await renderEnemies();
    return;
  }
  if (action === "open-formation-support") {
    await navigate("formation-support-start");
    return;
  }
  if (["refresh-support-cloud-list", "open-support-cloud-draft", "delete-support-cloud-draft", "support-use-remote", "support-use-local", "support-retry-sync"].includes(action)) {
    button.disabled = true;
    try {
      if (action === "refresh-support-cloud-list") await refreshSupportCloudDraftList();
      else if (action === "open-support-cloud-draft") await openSavedSupportCloudDraft(button.dataset.key || "");
      else if (action === "delete-support-cloud-draft") await deleteSavedSupportCloudDraft(button.dataset.key || "");
      else if (action === "support-retry-sync") await retrySupportCloudSync();
      else await resolveSupportSync(action === "support-use-remote");
    } catch (error) {
      showToast(error.message, "error");
      if (action === "delete-support-cloud-draft") await refreshSupportCloudDraftList();
    } finally { button.disabled = false; }
    return;
  }
  if (action === "resume-formation-support") {
    const localSaved = loadFormationSupportLocal();
    if (!restoreFormationSupportLocal(localSaved)) { showToast("再開できる下書きがありません。", "error"); return; }
    const saved = await openSupportCloudWorkspace(state.formationSupportWorkspaceKey, localSaved);
    if (saved) restoreFormationSupportLocal({ ...saved, workspaceKey: state.formationSupportWorkspaceKey });
    persistFormationSupportLocal();
    await navigate("formation-support-workspace");
    return;
  }
  if (action === "discard-formation-support") {
    if (!window.confirm("この端末の編成支援の下書きを削除しますか？アカウントの保存は一覧から削除できます。")) return;
    if (state.supportSync?.kind === "direct") {
      if (state.supportSync.timer) window.clearTimeout(state.supportSync.timer);
      state.supportSync.pending = null;
    }
    clearFormationSupportLocal();
    state.formationSupportMode = false;
    state.sharedConsultation = null;
    state.consultationDraft = null;
    await renderFormationSupportStart();
    return;
  }
  if (action === "back-to-formation-support-start") {
    if (state.formationSupportMode) persistFormationSupportLocal();
    state.consultationPicker = null;
    state.consultationSwap = null;
    await navigate("formation-support-start");
    return;
  }
  if (action === "copy-formation-support-result") {
    const hasGeneral = (state.consultationDraft?.formations ?? []).some((formation) => (formation.members ?? []).some((member) => member.generalName));
    if (!hasGeneral) { showToast("武将を選択してからコピーしてください。", "error"); return; }
    const text = formationSupportResultText();
    const copied = await copyText(text);
    showToast(copied ? "編成案をコピーしました。" : "コピーできませんでした。", copied ? "success" : "error");
    return;
  }
  if (action === "set-support-dupe") {
    if (!state.formationSupportMode) return;
    const id = button.dataset.id || "";
    const value = Number(button.dataset.value);
    const general = state.sharedConsultation?.inventory?.generals?.find((row) => row.qookkaId === id);
    if (!general || !Number.isInteger(value) || value < 0 || value > 5) return;
    const nextValue = value > 0 && Number(general.dupeCount) === value ? 0 : value;
    general.dupeCount = nextValue;
    persistFormationSupportLocal();
    renderFormationSupportDirectBody();
    return;
  }

  if (action === "toggle-support-candidate") {
    const id = button.dataset.id || "";
    const general = state.sharedConsultation?.inventory?.generals?.find((row) => row.qookkaId === id);
    if (!general) return;
    general.supportCandidate = !consultationGeneralCandidateEnabled(general);
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBody();
    return;
  }
  if (action === "show-all-consultation-candidates" || action === "hide-all-consultation-candidates") {
    setConsultationCandidateVisibility(action === "show-all-consultation-candidates");
    updateConsultationCandidateDisplay();
    return;
  }
  if (action === "toggle-formation-tactic-panel") {
    const slot = Number(button.dataset.slot);
    const member = state.formationDraft?.members?.find((row) => Number(row.slot) === slot);
    if (!member?.generalName) return;
    const slots = new Set(state.formationExpandedTacticSlots ?? []);
    if (slots.has(slot)) slots.delete(slot); else slots.add(slot);
    state.formationExpandedTacticSlots = [...slots];
    renderFormationEditor();
    return;
  }
  if (action === "toggle-consultation-tactic-panel") {
    const formationIndex = Number(button.dataset.formationIndex);
    const slot = Number(button.dataset.slot);
    const formation = state.consultationDraft?.formations?.[formationIndex];
    const member = formation?.members?.find((row) => Number(row.slot) === slot);
    if (!member?.generalName) return;
    state.consultationExpandedTacticSlots ??= {};
    const key = String(formationIndex);
    const slots = new Set(state.consultationExpandedTacticSlots[key] ?? []);
    if (slots.has(slot)) slots.delete(slot); else slots.add(slot);
    state.consultationExpandedTacticSlots[key] = [...slots];
    renderFormationConsultationBody();
    return;
  }
  if (action === "formation-dnd-handle") return;

  if (action === "set-consultation-palette-source") {
    state.consultationTacticPaletteSource = button.dataset.source === "teachable" ? "teachable" : "owned";
    state.consultationTacticPaletteSearch = "";
    state.consultationTacticPaletteKinds = [];
    state.consultationTacticPaletteGrades = ["S"];
    persistConsultationWorkspaceLocal();
    refreshConsultationTacticPalette();
    return;
  }

  if (action === "toggle-consultation-palette-grade") {
    const grade = String(button.dataset.grade || "all");
    state.consultationTacticPaletteGrades = grade === "all" ? [] : [grade];
    refreshTacticGradeFilterButtons("toggle-consultation-palette-grade", state.consultationTacticPaletteGrades);
    refreshConsultationTacticPaletteList();
    collapseConsultationPaletteFilters();
    persistConsultationWorkspaceLocal();
    return;
  }
  if (action === "toggle-consultation-palette-kind") {
    const kind = String(button.dataset.kind || "all");
    state.consultationTacticPaletteKinds = kind === "all" ? [] : [kind];
    refreshTacticKindFilterButtons("toggle-consultation-palette-kind", state.consultationTacticPaletteKinds);
    refreshConsultationTacticPaletteList();
    collapseConsultationPaletteFilters();
    persistConsultationWorkspaceLocal();
    return;
  }
  if (action === "jump-to-consultation-builder") {
    button.closest("details")?.removeAttribute("open");
    document.getElementById("consultation-builder-start")?.scrollIntoView({ behavior:"smooth", block:"start" });
    return;
  }

  if (action === "edit-consultation-tactic-slot") {
    const target = { formationIndex:Number(button.dataset.formationIndex), slot:Number(button.dataset.slot), field:button.dataset.field === "tactic2" ? "tactic2" : "tactic1" };
    const entry = consultationMemberAt(target);
    if (!entry?.member?.generalQookkaId) { showToast("先に武将を選択してください。", "error"); return; }
    if (isConsultationMobileViewport()) {
      state.consultationMobileTacticTarget = target;
      mountConsultationMobileTacticPicker();
      return;
    }
    if (!entry.member[`${target.field}Name`]) {
      const value = window.prompt("未所持など、手入力する戦法名", "");
      if (value === null) return;
      const name = String(value).trim().slice(0, 100);
      entry.member[`${target.field}QookkaId`] = "";
      entry.member[`${target.field}Name`] = name;
      persistConsultationWorkspaceLocal();
      renderFormationConsultationBody();
    }
    return;
  }

  if (action === "close-mobile-consultation-tactic-picker") {
    state.consultationMobileTacticTarget = null;
    document.querySelector(".consultation-mobile-tactic-backdrop")?.remove();
    document.querySelector(".consultation-mobile-tactic-sheet")?.remove();
    return;
  }

  if (action === "assign-mobile-consultation-tactic") {
    const target = state.consultationMobileTacticTarget;
    if (!target) return;
    const source = {
      sourceKind: button.dataset.sourceKind === "teachable" ? "teachable" : "pool",
      tacticId: button.dataset.tacticId || "",
      tacticName: button.dataset.tacticName || "",
    };
    if (!assignConsultationPaletteTactic(source, { ...target, targetKind:"slot" })) return;
    persistConsultationWorkspaceLocal();
    const entry = consultationMemberAt(target);
    if (target.field === "tactic1" && entry?.member?.generalQookkaId && !entry.member.tactic2Name) {
      state.consultationMobileTacticTarget = { ...target, field:"tactic2" };
      rerenderFormationConsultationPreserveScroll();
      showToast("第1戦法に設定しました。続けて第2戦法を選べます。", "success");
    } else {
      state.consultationMobileTacticTarget = null;
      rerenderFormationConsultationPreserveScroll();
    }
    return;
  }

  if (action === "input-mobile-consultation-manual-tactic") {
    const target = state.consultationMobileTacticTarget;
    const entry = consultationMemberAt(target);
    if (!target || !entry?.member?.generalQookkaId) return;
    const current = entry.member[`${target.field}Name`] || "";
    const value = window.prompt("未所持など、手入力する戦法名", current);
    if (value === null) return;
    const name = String(value).trim().slice(0, 100);
    entry.member[`${target.field}QookkaId`] = "";
    entry.member[`${target.field}Name`] = name;
    persistConsultationWorkspaceLocal();
    if (target.field === "tactic1" && !entry.member.tactic2Name) {
      state.consultationMobileTacticTarget = { ...target, field:"tactic2" };
      rerenderFormationConsultationPreserveScroll();
    } else {
      state.consultationMobileTacticTarget = null;
      rerenderFormationConsultationPreserveScroll();
    }
    return;
  }

  if (action === "input-consultation-manual-tactic") {
    const entry = consultationMemberAt({ formationIndex:Number(button.dataset.formationIndex), slot:Number(button.dataset.slot) });
    const field = button.dataset.field === "tactic2" ? "tactic2" : "tactic1";
    if (!entry?.member?.generalQookkaId) { showToast("先に武将を選択してください。", "error"); return; }
    const current = entry.member[`${field}Name`] || "";
    const value = window.prompt("未所持など、手入力する戦法名", current);
    if (value === null) return;
    const name = String(value).trim().slice(0, 100);
    entry.member[`${field}QookkaId`] = "";
    entry.member[`${field}Name`] = name;
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBody();
    return;
  }

  if (action === "remove-consultation-tactic") {
    const entry = consultationMemberAt({ formationIndex:Number(button.dataset.formationIndex), slot:Number(button.dataset.slot) });
    const field = button.dataset.field === "tactic2" ? "tactic2" : "tactic1";
    if (entry?.member) {
      entry.member[`${field}QookkaId`] = "";
      entry.member[`${field}Name`] = "";
      persistConsultationWorkspaceLocal();
      if (isConsultationMobileViewport()) rerenderFormationConsultationPreserveScroll();
      else renderFormationConsultationBody();
    }
    return;
  }

  if (action === "toggle-formation-tactic-grade") {
    if (state.formationPicker?.kind !== "tactic") return;
    const grade = String(button.dataset.grade || "all");
    const selected = grade === "all" ? [] : [grade];
    state.formationPicker.gradeFilters = selected;
    state.formationTacticPickerGrades = selected;
    refreshTacticGradeFilterButtons("toggle-formation-tactic-grade", selected);
    refreshFormationPickerOptions();
    return;
  }
  if (action === "toggle-consultation-tactic-grade") {
    if (state.consultationPicker?.kind !== "tactic") return;
    const grade = String(button.dataset.grade || "all");
    const selected = grade === "all" ? [] : [grade];
    state.consultationPicker.gradeFilters = selected;
    state.consultationTacticPickerGrades = selected;
    refreshTacticGradeFilterButtons("toggle-consultation-tactic-grade", selected);
    refreshConsultationPickerOptions();
    return;
  }

  if (action === "toggle-formation-tactic-kind") {
    if (state.formationPicker?.kind !== "tactic") return;
    const kind = String(button.dataset.kind || "all");
    const selected = kind === "all" ? [] : [kind];
    state.formationPicker.kindFilters = selected;
    state.formationTacticPickerKinds = selected;
    refreshTacticKindFilterButtons("toggle-formation-tactic-kind", selected);
    refreshFormationPickerOptions();
    return;
  }
  if (action === "toggle-consultation-tactic-kind") {
    if (state.consultationPicker?.kind !== "tactic") return;
    const kind = String(button.dataset.kind || "all");
    const selected = kind === "all" ? [] : [kind];
    state.consultationPicker.kindFilters = selected;
    state.consultationTacticPickerKinds = selected;
    refreshTacticKindFilterButtons("toggle-consultation-tactic-kind", state.consultationPicker.kindFilters);
    refreshConsultationPickerOptions();
    return;
  }

  if (action === "toggle-formation-favorite") {
    const kind = button.dataset.kind === "general" ? "general" : "tactic";
    const id = button.dataset.id || "";
    const source = kind === "general" ? (state.myInventory?.generals ?? []) : (state.myInventory?.tactics ?? []);
    const item = source.find((row) => row.qookkaId === id);
    if (!item) return;
    const next = !item.favorite;
    item.favorite = next;
    button.classList.toggle("selected", next);
    button.setAttribute("aria-pressed", next ? "true" : "false");
    try { await apiRequest("my_formation_favorite", { itemType: kind, qookkaId: id, favorite: next }); }
    catch (error) { item.favorite = !next; showToast(error.message, "error"); }
    if (state.formationPicker) refreshFormationPickerOptions();
    return;
  }
  if (action === "toggle-formation-tag") {
    if (!state.formationDraft) return;
    const tag = String(button.dataset.tag || "").trim();
    const tags = new Set(state.formationDraft.tags ?? []);
    if (tags.has(tag)) tags.delete(tag); else if (tags.size < 8) tags.add(tag);
    state.formationDraft.tags = [...tags];
    scheduleFormationDraftSave();
    renderFormationEditor();
    return;
  }
  if (action === "add-formation-tag") {
    if (!state.formationDraft) return;
    const input = document.getElementById("formation-custom-tag");
    const tag = String(input?.value || "").trim().slice(0,20);
    if (!tag) return;
    const tags = new Set(state.formationDraft.tags ?? []);
    if (tags.size >= 8 && !tags.has(tag)) { showToast("タグは8個までです。", "error"); return; }
    tags.add(tag); state.formationDraft.tags = [...tags];
    scheduleFormationDraftSave(); renderFormationEditor(); return;
  }
  if (action === "resume-formation-draft") {
    const payload = state.formationDraftRemote?.payload;
    if (!payload) return;
    state.formationDraft = structuredClone(payload);
    state.formationDraftStatus = "自動保存済み";
    state.formationCopyMissing = null;
    await navigate("formation-edit");
    return;
  }
  if (action === "discard-formation-draft") {
    if (state.formationDraftSaveTimer) { window.clearTimeout(state.formationDraftSaveTimer); state.formationDraftSaveTimer = null; }
    await apiRequest("my_formation_draft_delete").catch(() => {});
    state.formationDraftRemote = null;
    state.formationDraft = null;
    renderMyFormationsBody();
    return;
  }
  if (action === "move-formation") {
    if (state.formationReorderBusy) return;
    const id = button.dataset.id || "";
    const direction = button.dataset.direction === "up" ? -1 : 1;
    const index = state.myFormations.findIndex((row) => row.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= state.myFormations.length) return;
    const next = [...state.myFormations];
    [next[index], next[target]] = [next[target], next[index]];
    state.myFormations = next;
    renderMyFormationsBody();
    state.formationReorderBusy = true;
    try {
      const response = await apiRequest("my_formation_reorder", { formationIds: next.map((row) => row.id) });
      state.myFormations = response.formations ?? next;
    } catch (error) { showToast(error.message, "error"); await loadMyFormationData({ force: true }); }
    finally { state.formationReorderBusy = false; renderMyFormationsBody(); }
    return;
  }
  if (action === "restore-formation-history") {
    if (!window.confirm("この履歴の状態へ戻しますか？ 現在の状態も履歴に残ります。")) return;
    showLoading("履歴を復元中...");
    try { await apiRequest("my_formation_history_restore", { historyId: button.dataset.id }); await loadMyFormationData({ force: true }); showToast("以前の状態へ戻しました。", "success"); renderMyFormationsBody(); }
    catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
    return;
  }
  if (action === "rename-formation-share-set") {
    const title = window.prompt("共有セット名", button.dataset.title || "");
    if (title === null) return;
    try { await apiRequest("my_formation_share_set_update", { id: button.dataset.id, title }); await loadMyFormationData({ force: true }); renderMyFormationsBody(); }
    catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "regenerate-formation-share-set") {
    try {
      const response = await apiRequest("my_formation_share_set_regenerate", { id: button.dataset.id });
      const url = shareUrlForFormationSet(response.shareSet?.shareToken || "");
      await copyText(url);
      showToast("新しいまとめ共有URLを発行してコピーしました。", "success");
      await loadMyFormationData({ force: true }); renderMyFormationsBody();
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "regenerate-formation-link") {
    try {
      const response = await apiRequest("my_formation_share", { id: button.dataset.id });
      const url = shareUrlForFormation(response.formation);
      await copyText(url);
      showToast("新しい共有URLを発行してコピーしました。", "success");
      await loadMyFormationData({ force: true }); renderMyFormationsBody();
    } catch (error) { showToast(error.message, "error"); }
    return;
  }
  if (action === "copy-shared-formation-to-mine") {
    showLoading("手持ちと照合中...");
    try {
      if (!state.myInventory) await loadMyFormationData({ force: true });
      const response = await apiRequest("shared_formation_copy_preview", { token: button.dataset.token || "", setToken: button.dataset.setToken || "", formationId: button.dataset.formationId || "" });
      const source = response.formation;
      const draft = cloneFormationForEdit(source);
      draft.id = "";
      draft.isShared = false;
      draft.shareToken = null;
      draft.name = `${source.name || "共有編成"}（コピー）`;
      const ownedGenerals = new Set((state.myInventory?.generals ?? []).map((row) => row.qookkaId));
      const ownedTactics = new Set((state.myInventory?.tactics ?? []).map((row) => row.qookkaId));
      for (const member of draft.members ?? []) {
        if (member.generalQookkaId && !ownedGenerals.has(member.generalQookkaId)) {
          member.generalQookkaId = ""; member.generalName = "";
          member.tactic1QookkaId = ""; member.tactic1Name = "";
          member.tactic2QookkaId = ""; member.tactic2Name = "";
          continue;
        }
        if (member.tactic1QookkaId && !ownedTactics.has(member.tactic1QookkaId)) { member.tactic1QookkaId = ""; member.tactic1Name = ""; }
        if (member.tactic2QookkaId && !ownedTactics.has(member.tactic2QookkaId)) { member.tactic2QookkaId = ""; member.tactic2Name = ""; }
      }
      state.formationDraft = draft;
      state.formationCopyMissing = { generals: response.missingGenerals ?? [], tactics: response.missingTactics ?? [] };
      scheduleFormationDraftSave();
      await navigate("formation-edit");
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
    return;
  }

  if (action === "reload-app") window.location.reload();
  if (action === "navigate") await navigate(button.dataset.view);
  if (action === "back-to-settings") await navigate("settings");
  if (action === "back-to-formations") {
    state.formationDraft = null;
    state.formationPicker = null;
    state.formationExpandedTacticSlots = [];
    state.activeConsultation = null;
    state.activeConsultationId = "";
    await navigate("formations");
  }
  if (action === "new-formation-consultation") {
    if (!state.myInventory?.generals?.length || !state.myInventory?.tactics?.length) {
      showToast("先に所持武将・所持戦法を同期してください。", "error");
      return;
    }
    await navigate("formation-consultation-create");
  }
  if (action === "copy-formation-consultation") {
    const url = formationConsultationUrl(button.dataset.token || "");
    const copied = await copyText(url);
    showToast(copied ? "編成相談URLをコピーしました。" : "相談URLをコピーできませんでした。", copied ? "success" : "error");
  }
  if (action === "open-formation-consultation-detail") {
    state.activeConsultationId = button.dataset.id || "";
    await navigate("formation-consultation-detail");
  }
  if (action === "revoke-formation-consultation") {
    if (!window.confirm("この編成相談の受付を終了しますか？公開済みの回答は同じURLで参考として閲覧できます。")) return;
    showLoading("相談受付を終了中...");
    try {
      await apiRequest("my_formation_consultation_revoke", { id: button.dataset.id });
      showToast("編成相談の受付を終了しました。", "success");
      state.activeConsultation = null;
      await navigate("formations");
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "refresh-consultation-answers") {
    button.disabled = true;
    try { await refreshConsultationPublicAnswers({ manual: true }); }
    finally { button.disabled = false; }
  }
  if (action === "set-consultation-proposal-visibility") {
    const isPublic = button.dataset.public === "true";
    if (isPublic && !window.confirm("この回答の提案者名・コメント・編成を、相談URLの参考回答として公開しますか？")) return;
    showLoading("回答の公開範囲を変更中...");
    try {
      await apiRequest("my_formation_consultation_proposal_visibility", { proposalId: button.dataset.id, isPublic });
      showToast(isPublic ? "相談URLの参考回答に表示しました。" : "参考回答を非公開にしました。", "success");
      await renderFormationConsultationDetail();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "set-consultation-url-visibility") {
    const isShared = button.dataset.shared === "true";
    if (!isShared && !window.confirm("この相談URLを非公開にしますか？回答の閲覧と新しい回答の受付が終了します。保存済みの回答は残ります。")) return;
    showLoading("相談URLを変更中...");
    try {
      await apiRequest("my_formation_consultation_url_visibility", { id: button.dataset.id, isShared });
      showToast(isShared ? "参考URLを発行しました。" : "相談URLを非公開にしました。", "success");
      await renderFormationConsultationDetail();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "adopt-formation-consultation-proposal") {
    if (!window.confirm("この提案をマイ編成へコピーしますか？既存編成は変更しません。")) return;
    showLoading("提案をマイ編成へ採用中...");
    try {
      const response = await apiRequest("my_formation_consultation_adopt", { proposalId: button.dataset.id });
      showToast(`${response.formations?.length || 0}部隊をマイ編成へ追加しました。`, "success");
      await renderFormationConsultationDetail();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "delete-formation-consultation-proposal") {
    if (!window.confirm("この提案を削除しますか？")) return;
    showLoading("提案を削除中...");
    try {
      await apiRequest("my_formation_consultation_proposal_delete", { proposalId: button.dataset.id });
      showToast("提案を削除しました。", "success");
      await renderFormationConsultationDetail();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "new-consultation-proposal") {
    clearFormationConsultationLocal(state.consultationToken);
    state.consultationSubmitted = false;
    state.consultationSubmissionError = "";
    state.consultationDraft = newConsultationProposalDraft();
    state.consultationPicker = null;
    state.consultationSwap = null;
    state.consultationExpandedTacticSlots = {};
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBody();
  }
  if (action === "add-consultation-formation") {
    if (!state.consultationDraft || state.consultationDraft.formations.length >= 10) return;
    state.consultationDraft.formations.push(newConsultationProposalFormation(state.consultationDraft.formations.length));
    normalizeConsultationProposalDraftForBuilder();
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBodyPreserveScroll();
  }
  if (action === "remove-consultation-formation") {
    if (!state.consultationDraft || state.consultationDraft.formations.length <= 1) return;
    state.consultationDraft.formations.splice(Number(button.dataset.index), 1);
    normalizeConsultationProposalDraftForBuilder();
    state.consultationPicker = null;
    state.consultationSwap = null;
    state.consultationExpandedTacticSlots = {};
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBodyPreserveScroll();
  }
  if (action === "open-consultation-picker") {
    state.consultationSwap = null;
    const kind = button.dataset.kind === "general" ? "general" : "tactic";
    const formationIndex = Number(button.dataset.formationIndex);
    const formation = state.consultationDraft?.formations?.[formationIndex];
    const slot = Number(button.dataset.slot || 1);
    const member = formation?.members?.find((row) => Number(row.slot) === slot);
    state.consultationPicker = {
      kind,
      formationIndex,
      slot,
      field: kind === "general" ? "generals" : "tactics",
      query: "",
      selectedIds: kind === "general"
        ? (formation?.members ?? []).map((row) => row.generalQookkaId).filter(Boolean)
        : [member?.tactic1QookkaId, member?.tactic2QookkaId].filter(Boolean),
      filters: kind === "general" ? { ...(state.consultationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" }) } : null,
      kindFilters: kind === "tactic" ? [...(state.consultationTacticPickerKinds ?? [])] : [],
      gradeFilters: kind === "tactic" ? [...(state.consultationTacticPickerGrades ?? ["S"])] : [],
    };
    renderFormationConsultationBodyPreserveScroll();
  }
  if (action === "close-consultation-picker") {
    state.consultationPicker = null;
    renderFormationConsultationBodyPreserveScroll();
  }
  if (action === "clear-consultation-multi-choice") {
    if (!state.consultationPicker) return;
    state.consultationPicker.selectedIds = [];
    refreshConsultationPickerOptions({ selectionOnly: true });
  }
  if (action === "toggle-consultation-choice") {
    const picker = state.consultationPicker;
    if (!picker) return;
    const id = button.dataset.id || "";
    const selected = [...(picker.selectedIds ?? [])];
    const index = selected.indexOf(id);
    if (index >= 0) selected.splice(index, 1);
    else {
      const limit = picker.kind === "general" ? 3 : 2;
      if (selected.length >= limit) { showToast(picker.kind === "general" ? "武将は3体まで選択できます。" : "戦法は2個まで選択できます。", "error"); return; }
      selected.push(id);
    }
    picker.selectedIds = selected;
    refreshConsultationPickerOptions({ selectionOnly: true });
  }
  if (action === "confirm-consultation-multi-choice") {
    const picker = state.consultationPicker;
    const formation = state.consultationDraft?.formations?.[picker?.formationIndex];
    if (!picker || !formation) return;
    if (picker.kind === "general") {
      const inventory = state.sharedConsultation?.inventory?.generals ?? [];
      const oldById = new Map((formation.members ?? []).filter((row) => row.generalQookkaId).map((row) => [row.generalQookkaId, { ...row }]));
      formation.members = [1,2,3].map((slot, index) => {
        const id = picker.selectedIds?.[index] || "";
        if (!id) return { slot, generalQookkaId:"", generalName:"", tactic1QookkaId:"", tactic1Name:"", tactic2QookkaId:"", tactic2Name:"" };
        const general = inventory.find((row) => row.qookkaId === id);
        const old = oldById.get(id);
        return { slot, generalQookkaId:id, generalName:general?.name || old?.generalName || "", tactic1QookkaId:old?.tactic1QookkaId || "", tactic1Name:old?.tactic1Name || "", tactic2QookkaId:old?.tactic2QookkaId || "", tactic2Name:old?.tactic2Name || "" };
      });
    } else {
      const member = formation.members?.find((row) => Number(row.slot) === Number(picker.slot));
      if (!member) return;
      const tactics = state.sharedConsultation?.inventory?.tactics ?? [];
      const ids = picker.selectedIds ?? [];
      const first = tactics.find((row) => row.qookkaId === ids[0]);
      const second = tactics.find((row) => row.qookkaId === ids[1]);
      member.tactic1QookkaId = ids[0] || ""; member.tactic1Name = first?.name || "";
      member.tactic2QookkaId = ids[1] || ""; member.tactic2Name = second?.name || "";
    }
    state.consultationPicker = null;
    persistConsultationWorkspaceLocal();
    renderFormationConsultationBodyPreserveScroll();
  }
  if (action === "start-consultation-swap") {
    state.consultationSwap = { kind: button.dataset.kind === "tactic" ? "tactic" : "general", formationIndex: Number(button.dataset.formationIndex), first: null };
    renderFormationConsultationBody();
  }
  if (action === "cancel-consultation-swap") {
    state.consultationSwap = null;
    renderFormationConsultationBody();
  }
  if (action === "select-consultation-swap-general") {
    const swap = state.consultationSwap;
    const formationIndex = Number(button.dataset.formationIndex);
    const slot = Number(button.dataset.slot);
    if (!swap || swap.kind !== "general" || Number(swap.formationIndex) !== formationIndex) return;
    if (!swap.first) {
      swap.first = { slot };
      renderFormationConsultationBody();
    } else {
      const formation = state.consultationDraft?.formations?.[formationIndex];
      if (!formation) return;
      if (Number(swap.first.slot) === slot) { swap.first = null; renderFormationConsultationBody(); return; }
      swapMemberSlots(formation.members, swap.first.slot, slot);
      state.consultationSwap = null;
      renderFormationConsultationBody();
    }
  }
  if (action === "select-consultation-swap-tactic") {
    const swap = state.consultationSwap;
    const formationIndex = Number(button.dataset.formationIndex);
    const target = { slot: Number(button.dataset.slot), field: button.dataset.field === "tactic2" ? "tactic2" : "tactic1" };
    if (!swap || swap.kind !== "tactic" || Number(swap.formationIndex) !== formationIndex) return;
    if (!swap.first) {
      swap.first = target;
      renderFormationConsultationBody();
    } else {
      const formation = state.consultationDraft?.formations?.[formationIndex];
      if (!formation) return;
      if (Number(swap.first.slot) === target.slot && swap.first.field === target.field) { swap.first = null; renderFormationConsultationBody(); return; }
      swapTacticSlots(formation.members, swap.first, target);
      state.consultationSwap = null;
      renderFormationConsultationBody();
    }
  }
  if (action === "begin-share-formations") {
    state.formationShareSelection = [];
    state.formationShareTitle = "";
    await navigate("formation-share-select");
  }
  if (action === "toggle-formation-share-selection") {
    const id = button.dataset.id || "";
    const selected = new Set(state.formationShareSelection ?? []);
    if (selected.has(id)) selected.delete(id);
    else {
      if (selected.size >= 20) { showToast("まとめて共有できる編成は20件までです。", "error"); return; }
      selected.add(id);
    }
    state.formationShareSelection = [...selected];
    renderFormationShareSelector();
  }
  if (action === "clear-formation-share-selection") {
    state.formationShareSelection = [];
    renderFormationShareSelector();
  }
  if (action === "cancel-formation-share-selection") {
    state.formationShareSelection = [];
    await navigate("formations");
  }
  if (action === "create-formation-share-set") {
    const ids = [...new Set(state.formationShareSelection ?? [])];
    if (!ids.length) return;
    showLoading("共有URLを作成中...");
    try {
      const title = String(document.getElementById("formation-share-title")?.value || state.formationShareTitle || "").trim();
      const response = await apiRequest("my_formation_share_set_create", { formationIds: ids, title });
      const url = shareUrlForFormationSet(response.shareSet?.shareToken || "");
      const copied = await copyText(url);
      state.formationShareSelection = [];
      showToast(copied ? `${ids.length}編成の共有URLを作成してコピーしました。` : "共有URLを作成しました。", copied ? "success" : "error");
      await navigate("formations");
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "copy-formation-share-set") {
    const url = shareUrlForFormationSet(button.dataset.token || "");
    const copied = await copyText(url);
    showToast(copied ? "まとめ共有URLをコピーしました。" : "共有URLをコピーできませんでした。", copied ? "success" : "error");
  }
  if (action === "revoke-formation-share-set") {
    if (!window.confirm("このまとめ共有URLを無効にしますか？")) return;
    showLoading("共有を解除中...");
    try {
      await apiRequest("my_formation_share_set_revoke", { id: button.dataset.id });
      showToast("まとめ共有を解除しました。", "success");
      await renderMyFormations();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "new-my-formation") {
    if (!state.myInventory?.generals?.length) { showToast("先に所持情報を同期してください。", "error"); return; }
    state.formationDraft = newFormationDraft();
    state.formationPicker = null;
    state.formationSwap = null;
    state.formationExpandedTacticSlots = [];
    state.formationCopyMissing = null;
    state.formationDraftStatus = "自動保存";
    scheduleFormationDraftSave();
    await navigate("formation-edit");
  }
  if (action === "edit-my-formation") {
    const formation = state.myFormations.find((row) => row.id === button.dataset.id);
    if (!formation) return;
    state.formationDraft = cloneFormationForEdit(formation);
    state.formationPicker = null;
    state.formationSwap = null;
    state.formationExpandedTacticSlots = [];
    state.formationCopyMissing = null;
    state.formationDraftStatus = "自動保存";
    scheduleFormationDraftSave();
    await navigate("formation-edit");
  }
  if (action === "open-formation-picker") {
    state.formationSwap = null;
    const kind = button.dataset.kind === "general" ? "general" : "tactic";
    const slot = Number(button.dataset.slot || 1);
    const member = state.formationDraft?.members?.find((row) => Number(row.slot) === slot);
    state.formationPicker = {
      kind,
      slot,
      field: kind === "general" ? "generals" : "tactics",
      query: "",
      selectedIds: kind === "general"
        ? (state.formationDraft?.members ?? []).map((row) => row.generalQookkaId).filter(Boolean)
        : [member?.tactic1QookkaId, member?.tactic2QookkaId].filter(Boolean),
      filters: kind === "general" ? { ...(state.formationGeneralPickerFilters ?? { star: "5", faction: "all", cost: "all" }) } : null,
      kindFilters: kind === "tactic" ? [...(state.formationTacticPickerKinds ?? [])] : [],
      gradeFilters: kind === "tactic" ? [...(state.formationTacticPickerGrades ?? ["S"])] : [],
    };
    renderFormationEditor();
  }
  if (action === "close-formation-picker") {
    state.formationPicker = null;
    renderFormationEditor();
  }
  if (action === "clear-formation-multi-choice") {
    if (!state.formationPicker) return;
    state.formationPicker.selectedIds = [];
    refreshFormationPickerOptions({ selectionOnly: true });
  }
  if (action === "toggle-formation-choice") {
    const picker = state.formationPicker;
    if (!picker) return;
    const id = button.dataset.id || "";
    const selected = [...(picker.selectedIds ?? [])];
    const index = selected.indexOf(id);
    if (index >= 0) selected.splice(index, 1);
    else {
      const limit = picker.kind === "general" ? 3 : 2;
      if (selected.length >= limit) { showToast(picker.kind === "general" ? "武将は3体まで選択できます。" : "戦法は2個まで選択できます。", "error"); return; }
      selected.push(id);
    }
    picker.selectedIds = selected;
    refreshFormationPickerOptions({ selectionOnly: true });
  }
  if (action === "confirm-formation-multi-choice") {
    const picker = state.formationPicker;
    if (!picker || !state.formationDraft) return;
    if (picker.kind === "general") {
      const generals = state.myInventory?.generals ?? [];
      const oldById = new Map((state.formationDraft.members ?? []).filter((row) => row.generalQookkaId).map((row) => [row.generalQookkaId, { ...row }]));
      state.formationDraft.members = [1,2,3].map((slot, index) => {
        const id = picker.selectedIds?.[index] || "";
        if (!id) return { slot, generalQookkaId:"", generalName:"", tactic1QookkaId:"", tactic1Name:"", tactic2QookkaId:"", tactic2Name:"" };
        const general = generals.find((row) => row.qookkaId === id);
        const old = oldById.get(id);
        return { slot, generalQookkaId:id, generalName:general?.name || old?.generalName || "", tactic1QookkaId:old?.tactic1QookkaId || "", tactic1Name:old?.tactic1Name || "", tactic2QookkaId:old?.tactic2QookkaId || "", tactic2Name:old?.tactic2Name || "" };
      });
    } else {
      const member = state.formationDraft.members?.find((row) => Number(row.slot) === Number(picker.slot));
      if (!member) return;
      const tactics = state.myInventory?.tactics ?? [];
      const ids = picker.selectedIds ?? [];
      const first = tactics.find((row) => row.qookkaId === ids[0]);
      const second = tactics.find((row) => row.qookkaId === ids[1]);
      member.tactic1QookkaId = ids[0] || ""; member.tactic1Name = first?.name || "";
      member.tactic2QookkaId = ids[1] || ""; member.tactic2Name = second?.name || "";
    }
    state.formationPicker = null;
    scheduleFormationDraftSave();
    renderFormationEditor();
  }
  if (action === "start-formation-swap") {
    state.formationSwap = { kind: button.dataset.kind === "tactic" ? "tactic" : "general", first: null };
    renderFormationEditor();
  }
  if (action === "cancel-formation-swap") {
    state.formationSwap = null;
    renderFormationEditor();
  }
  if (action === "select-formation-swap-general") {
    const swap = state.formationSwap;
    const slot = Number(button.dataset.slot);
    if (!swap || swap.kind !== "general" || !state.formationDraft) return;
    if (!swap.first) {
      swap.first = { slot };
      renderFormationEditor();
    } else {
      if (Number(swap.first.slot) === slot) { swap.first = null; renderFormationEditor(); return; }
      swapMemberSlots(state.formationDraft.members, swap.first.slot, slot);
      state.formationSwap = null;
      scheduleFormationDraftSave();
      renderFormationEditor();
    }
  }
  if (action === "select-formation-swap-tactic") {
    const swap = state.formationSwap;
    const target = { slot: Number(button.dataset.slot), field: button.dataset.field === "tactic2" ? "tactic2" : "tactic1" };
    if (!swap || swap.kind !== "tactic" || !state.formationDraft) return;
    if (!swap.first) {
      swap.first = target;
      renderFormationEditor();
    } else {
      if (Number(swap.first.slot) === target.slot && swap.first.field === target.field) { swap.first = null; renderFormationEditor(); return; }
      swapTacticSlots(state.formationDraft.members, swap.first, target);
      state.formationSwap = null;
      scheduleFormationDraftSave();
      renderFormationEditor();
    }
  }
  if (action === "set-my-dupe") {
    const general = state.myInventory?.generals?.find((row) => row.qookkaId === button.dataset.id);
    if (!general) return;
    const selected = Number(button.dataset.value);
    const previous = Number(general.dupeCount || 0);
    const next = previous === selected ? 0 : selected;
    general.dupeCount = next;
    const control = button.closest(".dupe-control");
    control?.querySelectorAll(".dupe-dot-button").forEach((dot) => {
      const active = Number(dot.dataset.value) <= next;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-pressed", active ? "true" : "false");
    });
    const label = control?.querySelector("[data-dupe-label]");
    if (label) label.textContent = `${next}凸`;
    try {
      await apiRequest("my_general_dupe", { qookkaId: general.qookkaId, dupeCount: next });
    } catch (error) {
      general.dupeCount = previous;
      showToast(error.message, "error");
      renderMyInventoryBody();
    }
  }
  if (action === "delete-my-formation") {
    if (!window.confirm("この編成を削除しますか？共有URLも無効になります。")) return;
    if (state.formationDraftSaveTimer) { window.clearTimeout(state.formationDraftSaveTimer); state.formationDraftSaveTimer = null; }
    showLoading("編成を削除中...");
    try {
      await apiRequest("my_formation_delete", { id: button.dataset.id });
      await apiRequest("my_formation_draft_delete").catch(() => {});
      state.formationDraft = null;
      state.formationDraftRemote = null;
      showToast("編成を削除しました。", "success");
      await navigate("formations");
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "share-my-formation") {
    showLoading("共有URLを発行中...");
    try {
      const response = await apiRequest("my_formation_share", { id: button.dataset.id });
      const url = shareUrlForFormation(response.formation);
      const copied = await copyText(url);
      showToast(copied ? "共有URLを発行してコピーしました。" : "共有URLを発行しました。コピーできないため編成一覧から再度コピーしてください。", copied ? "success" : "error");
      await renderMyFormations();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "copy-formation-link") {
    const formation = state.myFormations.find((row) => row.id === button.dataset.id);
    const url = shareUrlForFormation(formation);
    if (!url) { showToast("共有URLがありません。", "error"); return; }
    const copied = await copyText(url);
    showToast(copied ? "共有URLをコピーしました。" : "共有URLをコピーできませんでした。", copied ? "success" : "error");
  }
  if (action === "unshare-my-formation") {
    if (!window.confirm("共有を解除しますか？現在の共有URLは無効になります。")) return;
    showLoading("共有を解除中...");
    try {
      await apiRequest("my_formation_unshare", { id: button.dataset.id });
      showToast("共有を解除しました。", "success");
      await renderMyFormations();
    } catch (error) { showToast(error.message, "error"); }
    finally { hideLoading(); }
  }
  if (action === "close-shared-formation") {
    const url = new URL(window.location.href);
    url.searchParams.delete("formation");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    state.shareToken = "";
    state.sharedFormation = null;
    await navigate("formations");
  }
  if (action === "close-shared-formation-set") {
    const url = new URL(window.location.href);
    url.searchParams.delete("formation_set");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    state.shareSetToken = "";
    state.sharedFormationSet = null;
    await navigate("formations");
  }

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
      if (state.supportSync) {
        if (state.supportSync.timer) window.clearTimeout(state.supportSync.timer);
        state.supportSync.linked = false; state.supportSync.pending = null;
      }
      state.supportCloudLinked = false; state.supportCloudAccountId = null; state.supportCloudDrafts = [];
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
    if (!window.confirm("この記録を削除しますか？元に戻せません。")) return;
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
      await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`, { updateViaCache: "none" });
    } catch {
      // Service Workerの更新失敗だけでアプリ本体は停止させない。
    }
  });
}

initialize();
