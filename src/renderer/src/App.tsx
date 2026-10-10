import { useState, useEffect, useRef } from "react";

function getApi() {
  return (window as any).api;
}

interface Account {
  id: string;
  name: string;
  avatar: string;
  level: number | null;
}

function levelImg(level: number | null): string {
  const lvl = Math.min(level ?? 0, 99);
  return `./levels/level_${lvl.toString().padStart(3, "0")}.png`;
}

function formatBytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

type LaunchMode = "steam" | "umbrella" | "custom" | "none";
type Lang = "en" | "ru";

const T: Record<Lang, Record<string, string>> = {
  en: {
    loading: "Loading Steam accounts...",
    errTitle: "Transfer Blocked",
    errSteam: "Steam Not Found",
    pickFolder: "Select Steam Folder Manually",
    retry: "Retry Scan",
    returning: "Returning to selection in {s}s",
    ready: "Ready",
    heroTitle: "Move your Dota setup in seconds.",
    heroSub: "Pick the source account with the working config, choose the destination, and SteamSync handles folder 570 safely.",
    f1t: "Source check first",
    f1s: "The transfer starts only after folder 570 is found on the source account.",
    f2t: "Controlled restart",
    f2s: "Steam closes before the move and launches according to your settings.",
    f3t: "Clean account route",
    f3s: "The selected source and target stay visible before confirmation.",
    route: "Account Route",
    routeSub: "Source to target config transfer",
    srcAcc: "Source Account",
    dstAcc: "Target Account",
    id3: "ID3",
    search: "Search account...",
    selectAcc: "Select account",
    noRes: "No matches",
    source: "Source",
    target: "Target",
    notSel: "Not selected",
    waiting: "Waiting for account",
    accounts: "Accounts",
    folder: "Folder",
    launch: "Launch",
    launchSteam: "Steam",
    launchDlc: "DLC",
    launchCustom: "App",
    launchNone: "None",
    continue: "Continue",
    checking: "Checking Folder 570...",
    review: "Review",
    reviewTitle: "Confirm the config route.",
    reviewSub: "SteamSync will close Steam, copy folder 570 from the source profile into the target profile, then follow your launch setting.",
    step1: "Close Steam safely",
    step2: "Copy Dota 2 config folder",
    step3: "Launch per settings",
    confirmTitle: "Confirm Transfer",
    confirmSub: "Steam will restart during the operation.",
    willClose: "Steam will be",
    closed: "closed",
    copied: "copied",
    then: "then",
    aSteam: "Steam restarted",
    aDlc: "Secret DLC launched",
    aCustom: "custom app launched",
    aNone: "nothing launched",
    back: "Back",
    startTransfer: "Start Transfer",
    sCheck: "Checking Dota 2 folder...",
    sClose: "Closing Steam...",
    sCopy: "Copying configs...",
    sSteam: "Starting Steam...",
    sDlc: "Launching Secret DLC...",
    sCustom: "Launching custom app...",
    sFinish: "Finishing...",
    progressFiles: "{c} / {t} files",
    doneTitle: "Transfer Complete",
    doneSub: "Dota 2 configs are now synced to the target account.",
    backMenu: "Back to Menu",
    autoClose: "Auto-closing in {s}s",
    settings: "Settings",
    afterTransfer: "After transfer, launch",
    custom: "Custom application",
    choose: "Choose",
    notSet: "Not set",
    language: "Language",
    cfgSaved: "Config saved to %APPDATA%/steamsync",
  },
  ru: {
    loading: "Загрузка аккаунтов Steam...",
    errTitle: "Перенос заблокирован",
    errSteam: "Steam не найден",
    pickFolder: "Выбрать папку Steam вручную",
    retry: "Повторить скан",
    returning: "Возврат к выбору через {s}с",
    ready: "Готово",
    heroTitle: "Перенеси настройки Dota за секунды.",
    heroSub: "Выбери аккаунт-источник с рабочим конфигом, затем назначение — SteamSync аккуратно перенесёт папку 570.",
    f1t: "Сначала проверка источника",
    f1s: "Перенос начнётся только если папка 570 найдена на исходном аккаунте.",
    f2t: "Контролируемый перезапуск",
    f2s: "Steam закрывается перед копированием и запускается по твоим настройкам.",
    f3t: "Чистый маршрут аккаунтов",
    f3s: "Выбранные источник и цель видны перед подтверждением.",
    route: "Маршрут аккаунтов",
    routeSub: "Перенос конфига из источника в цель",
    srcAcc: "Аккаунт-источник",
    dstAcc: "Целевой аккаунт",
    id3: "ID3",
    search: "Поиск аккаунта...",
    selectAcc: "Выбери аккаунт",
    noRes: "Нет совпадений",
    source: "Источник",
    target: "Цель",
    notSel: "Не выбран",
    waiting: "Ожидание аккаунта",
    accounts: "Аккаунты",
    folder: "Папка",
    launch: "Запуск",
    launchSteam: "Steam",
    launchDlc: "DLC",
    launchCustom: "App",
    launchNone: "Нет",
    continue: "Продолжить",
    checking: "Проверяю папку 570...",
    review: "Проверка",
    reviewTitle: "Подтверди маршрут конфига.",
    reviewSub: "SteamSync закроет Steam, скопирует папку 570 с исходного профиля в целевой, затем выполнит запуск по настройке.",
    step1: "Безопасно закрыть Steam",
    step2: "Скопировать папку конфигов Dota 2",
    step3: "Запуск по настройкам",
    confirmTitle: "Подтверждение переноса",
    confirmSub: "Во время операции Steam будет перезапущен.",
    willClose: "Steam будет",
    closed: "закрыт",
    copied: "скопирована",
    then: "затем",
    aSteam: "Steam перезапущен",
    aDlc: "Secret DLC запущен",
    aCustom: "кастомное приложение запущено",
    aNone: "ничего не запущено",
    back: "Назад",
    startTransfer: "Начать перенос",
    sCheck: "Проверяю папку Dota 2...",
    sClose: "Закрываю Steam...",
    sCopy: "Копирую конфиги...",
    sSteam: "Запускаю Steam...",
    sDlc: "Запускаю Secret DLC...",
    sCustom: "Запускаю приложение...",
    sFinish: "Завершаю...",
    progressFiles: "{c} / {t} файлов",
    doneTitle: "Перенос завершён",
    doneSub: "Конфиги Dota 2 синхронизированы с целевым аккаунтом.",
    backMenu: "В меню",
    autoClose: "Автозакрытие через {s}с",
    settings: "Настройки",
    afterTransfer: "После переноса запускать",
    custom: "Своё приложение",
    choose: "Выбрать",
    notSet: "Не задано",
    language: "Язык",
    cfgSaved: "Конфиг: %APPDATA%/steamsync",
  },
};

function openTelegram(e?: React.MouseEvent) {
  e?.preventDefault();
  getApi().openTelegram();
}

function Spinner({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-5" style={{ animation: "fadeIn 0.35s ease-out" }}>
      <div className="relative w-14 h-14">
        <div className="absolute inset-0 rounded-full bg-white/10 blur-xl animate-pulse" />
        <svg className="relative w-14 h-14 animate-spin" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="19" stroke="#1d1d1d" strokeWidth="5" />
          <circle cx="24" cy="24" r="19" stroke="url(#sG)" strokeWidth="5" strokeLinecap="round" strokeDasharray="82 120" />
          <defs>
            <linearGradient id="sG" x1="8" y1="8" x2="40" y2="40">
              <stop stopColor="#ffffff" />
              <stop offset="1" stopColor="#737373" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className="text-neutral-400 text-sm tracking-wide">{text}</p>
    </div>
  );
}

function AccountSelect({ label, value, onChange, accounts, t }: {
  label: string; value: string; onChange: (v: string) => void; accounts: Account[]; t: (k: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const current = accounts.find((a) => a.id === value);
  const filtered = accounts.filter((a) =>
    (a.name + " " + a.id).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="group" ref={ref}>
      <label className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 mb-2 uppercase tracking-[0.22em]">
        {label}
        <span className="text-neutral-700 normal-case tracking-normal">{t("id3")}</span>
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-3 text-left appearance-none cursor-pointer rounded-2xl border border-white/10 bg-[#0b0b0b]/95 px-5 py-4 pr-12 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none transition-all duration-300 hover:border-white/20 hover:bg-[#101010] focus:border-white/40"
        >
          {current ? (
            <>
              <img src={levelImg(current.level)} className="w-5 h-5 shrink-0" />
              <span className="truncate">
                <span className="font-mono text-neutral-300">{current.id}</span>
                <span className="text-neutral-500"> — {current.name}</span>
              </span>
            </>
          ) : (
            <span className="text-neutral-500">{t("selectAcc")}</span>
          )}
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500 transition-colors duration-300 group-hover:text-white">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {open && (
          <div className="absolute z-50 mt-2 w-full rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-[0_24px_70px_rgba(0,0,0,0.8)] overflow-hidden" style={{ animation: "popIn 0.18s ease-out" }}>
            <div className="p-2 border-b border-white/[0.06]">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                className="w-full bg-[#080808] rounded-xl px-3 py-2 text-sm text-white outline-none border border-white/[0.06] focus:border-white/20"
              />
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <div className="px-4 py-3 text-sm text-neutral-600">{t("noRes")}</div>
              )}
              {filtered.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { onChange(a.id); setOpen(false); setQuery(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.06] ${a.id === value ? "bg-white/[0.04]" : ""}`}
                >
                  <img src={levelImg(a.level)} className="w-5 h-5 shrink-0" />
                  <span className="truncate text-sm">
                    <span className="font-mono text-neutral-300">{a.id}</span>
                    <span className="text-neutral-500"> — {a.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState<"loading" | "select" | "confirm" | "progress" | "done" | "error">("loading");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [srcId, setSrcId] = useState("");
  const [dstId, setDstId] = useState("");
  const [userdata, setUserdata] = useState("");
  const [steamRoot, setSteamRoot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progressText, setProgressText] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [loadDone, setLoadDone] = useState(0);
  const [loadTotal, setLoadTotal] = useState(0);
  const [hasUmbrella, setHasUmbrella] = useState(false);
  const [launchMode, _setLaunchMode] = useState<LaunchMode>("steam");
  const [launchPaths, setLaunchPaths] = useState({ steam: "", umbrella: "", custom: "" });
  const [lang, setLang] = useState<Lang>("en");
  const [showSettings, setShowSettings] = useState(false);
  const [needsPick, setNeedsPick] = useState(false);
  const [prog, setProg] = useState({ copied: 0, total: 0, bytes: 0, totalBytes: 0 });

  const t = (k: string, vars?: Record<string, string | number>) => {
    let s = T[lang][k] ?? k;
    if (vars) for (const [key, v] of Object.entries(vars)) s = s.replace(`{${key}}`, String(v));
    return s;
  };

  function setLaunchMode(v: LaunchMode) {
    _setLaunchMode(v);
    getApi()?.saveSettings({ launchMode: v });
  }

  const PROGRESS_STEPS = [
    t("sCheck"),
    t("sClose"),
    t("sCopy"),
    launchMode === "steam" ? t("sSteam")
      : launchMode === "umbrella" ? t("sDlc")
      : launchMode === "custom" ? t("sCustom")
      : t("sFinish"),
  ];

  async function load(manual = false) {
    const api = getApi();
    if (!api) {
      setStep("error");
      setError("API not loaded — restart the app");
      setCountdown(5);
      return;
    }
    try {
      let pathRes: any;
      if (manual) {
        pathRes = await api.selectSteamFolder();
        if (pathRes.canceled) return;
      } else {
        pathRes = await api.getSteamPath();
      }
      if (pathRes.error) {
        setNeedsPick(pathRes.needsPick === true);
        throw new Error(pathRes.error);
      }
      setNeedsPick(false);
      setUserdata(pathRes.userdata);
      setSteamRoot(pathRes.steamRoot);

      const ids = await api.getAccounts();
      if (ids.length === 0) throw new Error("No accounts found");
      setLoadTotal(ids.length);
      setLoadDone(0);

      const profiles: Record<string, { name: string; avatar: string | null; level: number | null }> = {};
      const queue = [...ids];

      async function worker() {
        while (queue.length > 0) {
          const id = queue.shift()!;
          const batch = await api.fetchNicknames([id]);
          profiles[id] = batch[id];
          setLoadDone((d) => d + 1);
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      await Promise.all([worker(), worker()]);
      setAccounts(ids.map((id: string) => ({
        id,
        name: profiles[id]?.name ?? "???",
        avatar: profiles[id]?.avatar ?? "",
        level: profiles[id]?.level ?? null,
      })));

      const umbrella = await api.checkUmbrella();
      setHasUmbrella(umbrella.exists);

      const paths = await api.getLaunchPaths();
      setLaunchPaths(paths);

      const saved = await api.getSettings();
      if (saved) {
        if (saved.lang) setLang(saved.lang as Lang);
        if (saved.launchMode) {
          const lm = saved.launchMode;
          if (lm === "umbrella" && !umbrella.exists) _setLaunchMode("steam");
          else if (lm === "custom" && !paths.custom) _setLaunchMode("steam");
          else _setLaunchMode(lm as LaunchMode);
        }
      }

      setStep("select");
    } catch (e: any) {
      setStep("error");
      setError(e.message);
      setCountdown(5);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const api = getApi();
    if (!api?.onTransferProgress) return;
    const off = api.onTransferProgress((p: any) => setProg(p));
    return off;
  }, []);

  useEffect(() => {
    if ((step === "error" || step === "done") && countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (step === "error" && countdown === 0 && !needsPick) {
      setStep("select");
    }
    if (step === "done" && countdown === 0) {
      setStep("select");
      setSrcId("");
      setDstId("");
    }
  }, [step, countdown, needsPick]);

  async function handleConfirm() {
    const api = getApi();
    setLoading(true);
    const check = await api.checkFolder({ userdata, srcId });
    if (!check.exists) {
      setError("Folder 570 not found on source account\nDota 2 hasn't been launched there");
      setStep("error");
      setCountdown(5);
      setLoading(false);
      return;
    }
    setStep("confirm");
    setLoading(false);
  }

  async function startTransfer() {
    const api = getApi();
    setStep("progress");
    setProgressStep(0);
    setProgressText(PROGRESS_STEPS[0]);
    setProg({ copied: 0, total: 0, bytes: 0, totalBytes: 0 });
    await new Promise((r) => setTimeout(r, 300));

    setProgressStep(1);
    setProgressText(PROGRESS_STEPS[1]);
    await api.killSteam();
    await new Promise((r) => setTimeout(r, 500));

    setProgressStep(2);
    setProgressText(PROGRESS_STEPS[2]);
    const res = await api.doTransfer({ srcId, dstId, userdata });
    if (!res.ok) {
      setStep("error");
      setError(res.error || "Transfer failed");
      setCountdown(5);
      return;
    }

    setProgressStep(3);
    setProgressText(PROGRESS_STEPS[3]);

    if (launchMode === "steam") await api.startSteam(steamRoot);
    else if (launchMode === "umbrella") await api.launchUmbrella();
    else if (launchMode === "custom") await api.launchCustom();

    await new Promise((r) => setTimeout(r, 800));
    setStep("done");
    setCountdown(10);
  }

  async function pickPath(kind: "steam" | "umbrella" | "custom") {
    const api = getApi();
    const res = await api.selectLaunchExe(kind);
    if (res?.path) {
      setLaunchPaths((p) => ({ ...p, [kind]: res.path }));
      if (kind === "umbrella") setHasUmbrella(true);
      setLaunchMode(kind === "custom" ? "custom" : kind === "umbrella" ? "umbrella" : "steam");
    }
  }

  function setLanguage(l: Lang) {
    setLang(l);
    getApi()?.saveSettings({ lang: l });
  }

  const srcAccount = accounts.find((a) => a.id === srcId);
  const dstAccount = accounts.find((a) => a.id === dstId);

  const props = { showSettings, setShowSettings, launchMode, hasUmbrella, launchPaths, setLaunchMode, lang, setLanguage, t, pickPath };

  if (step === "loading") {
    return (
      <Shell {...props}>
        <main className="relative z-10 flex-1 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-5" style={{ animation: "fadeIn 0.35s ease-out" }}>
            <Spinner text={t("loading")} />
            {loadTotal > 0 && (
              <p className="text-neutral-500 text-xs tracking-wide">({loadDone}/{loadTotal})</p>
            )}
          </div>
        </main>
      </Shell>
    );
  }

  if (step === "error") {
    return (
      <Shell {...props}>
        <main className="relative z-10 flex-1 min-h-0 flex items-stretch overflow-hidden p-4">
          <div className="w-full flex-1 min-h-0 flex bg-[#101010]/90" style={{ animation: "popIn 0.42s cubic-bezier(.2,.9,.2,1)" }}>
            <div className="relative overflow-hidden flex flex-1 min-h-0 flex-col items-center justify-center rounded-[26px] border border-red-400/15 bg-[#101010]/90 p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-300/40 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(248,113,113,0.1),transparent_35%)]" />
              <div className="relative w-full max-w-xl">
                <div className="w-20 h-20 mx-auto mb-7 rounded-3xl bg-red-500/10 flex items-center justify-center ring-1 ring-red-400/20 shadow-[0_0_40px_rgba(248,113,113,0.08)]">
                  <svg className="w-10 h-10 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black tracking-[-0.04em] text-white mb-3">{needsPick ? t("errSteam") : t("errTitle")}</h2>
                <p className="text-neutral-400 mb-8 whitespace-pre-line leading-relaxed">{error}</p>
                {needsPick ? (
                  <button onClick={() => load(true)} className="w-full py-4 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]">
                    {t("pickFolder")}
                  </button>
                ) : (
                  <>
                    <button onClick={() => load()} className="w-full py-4 bg-white text-black hover:bg-neutral-200 rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]">
                      {t("retry")}
                    </button>
                    {countdown > 0 && (
                      <p className="text-[11px] text-neutral-600 mt-4 tracking-wide">{t("returning", { s: countdown })}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </Shell>
    );
  }

  return (
    <Shell {...props}>
      <main className="relative z-10 flex-1 min-h-0 flex items-stretch overflow-hidden p-4">
        {step === "progress" ? (
          <div className="w-full flex-1 min-h-0 flex bg-[#101010]/90" style={{ animation: "fadeIn 0.45s ease-out" }}>
            <div className="relative overflow-hidden flex flex-1 min-h-0 flex-col justify-center rounded-[26px] border border-white/10 bg-[#101010]/90 p-10 shadow-[0_24px_90px_rgba(0,0,0,0.6)]">
              <div className="absolute -top-28 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-white/[0.07] blur-3xl" />
              <div className="relative mx-auto w-full max-w-3xl">
                <Spinner text={progressText} />
                <div className="mt-9 rounded-3xl border border-white/[0.07] bg-[#090909]/80 p-4">
                  <div className="h-3 overflow-hidden rounded-full bg-[#1a1a1a] ring-1 ring-white/[0.05]">
                    <div className="h-full rounded-full bg-white/70 shadow-[0_0_24px_rgba(255,255,255,0.2)] transition-all duration-700 ease-out"
                      style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }} />
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-5">
                    {PROGRESS_STEPS.map((label, i) => (
                      <div key={label} className="text-center">
                        <div className={`mx-auto mb-2 h-2 w-2 rounded-full transition-all duration-500 ${i <= progressStep ? "bg-white shadow-[0_0_16px_rgba(255,255,255,0.5)]" : "bg-neutral-800"}`} />
                        <p className={`text-[10px] leading-snug transition-colors duration-500 ${i <= progressStep ? "text-neutral-300" : "text-neutral-700"}`}>{label.replace("...", "")}</p>
                      </div>
                    ))}
                  </div>
                  {prog.total > 0 && (
                    <p className="text-center text-xs text-neutral-500 mt-4 tracking-wide">
                      {t("progressFiles", { c: prog.copied, t: prog.total })} · {formatBytes(prog.bytes)} / {formatBytes(prog.totalBytes)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : step === "done" ? (
          <div className="w-full flex-1 min-h-0 flex bg-[#101010]/90" style={{ animation: "popIn 0.55s cubic-bezier(.2,.9,.2,1)" }}>
            <div className="relative overflow-hidden flex flex-1 min-h-0 flex-col items-center justify-center rounded-[26px] border border-emerald-400/15 bg-[#101010]/90 p-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(52,211,153,0.12),transparent_35%)]" />
              <div className="relative w-full max-w-xl">
                <div className="w-20 h-20 mx-auto mb-7 rounded-3xl bg-emerald-400/10 flex items-center justify-center ring-1 ring-emerald-300/20 shadow-[0_0_60px_rgba(52,211,153,0.1)]">
                  <svg className="w-10 h-10 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="text-4xl font-black tracking-[-0.04em] mb-3">{t("doneTitle")}</h2>
                <p className="text-neutral-400 mb-8 leading-relaxed">{t("doneSub")}</p>
                <button onClick={() => { setStep("select"); setSrcId(""); setDstId(""); }}
                  className="w-full py-4 bg-white hover:bg-neutral-200 text-black rounded-2xl font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]">
                  {t("backMenu")}
                </button>
                <p className="text-[11px] text-neutral-600 mt-4 tracking-wide">{t("autoClose", { s: countdown })}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex-1 min-h-0 flex" style={{ animation: "slideUp 0.5s cubic-bezier(.2,.9,.2,1)" }}>
            {step === "select" ? (
              <div className="w-full flex-1 min-h-0 flex bg-[#101010]/90">
                <div className="relative grid grid-cols-[1fr_1.12fr] gap-4 items-stretch w-full flex-1 min-h-0 p-4">
                  <section className="relative overflow-hidden flex min-h-0 flex-col rounded-[26px] border border-white/[0.07] bg-[#0b0b0b]/70 p-7">
                    <div className="pointer-events-none absolute -left-20 top-16 h-56 w-56 rounded-full bg-white/[0.04] blur-3xl" />
                    <div className="relative flex min-h-0 flex-1 flex-col gap-6">
                      <div>
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-neutral-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
                          {t("ready")}
                        </div>
                        <h2 className="max-w-sm text-4xl font-black tracking-[-0.05em] leading-[0.95] text-white">{t("heroTitle")}</h2>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-500">{t("heroSub")}</p>
                      </div>
                      <div className="grid flex-1 min-h-0 grid-rows-3 gap-3">
                        <div className="flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.1)]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{t("f1t")}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t("f1s")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-neutral-200 ring-1 ring-white/10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{t("f2t")}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t("f2s")}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.06] text-neutral-200 ring-1 ring-white/10">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{t("f3t")}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-neutral-500">{t("f3s")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="relative flex min-h-0 flex-col rounded-[26px] border border-white/[0.07] bg-[#0a0a0a]/80 p-7">
                    <div className="flex items-center gap-4 mb-7">
                      <div className="grid w-12 h-12 place-items-center rounded-2xl bg-white text-black shadow-[0_0_36px_rgba(255,255,255,0.12)]">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold tracking-tight">{t("route")}</h3>
                        <p className="text-xs text-neutral-500">{t("routeSub")}</p>
                      </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col gap-5">
                      <div className="space-y-5">
                        <AccountSelect label={t("srcAcc")} value={srcId} onChange={setSrcId} accounts={accounts} t={t} />
                        <div className="flex items-center gap-3 px-2">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-white/10" />
                          <div className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-[#111] text-neutral-500 shadow-[0_0_22px_rgba(255,255,255,0.04)]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                            </svg>
                          </div>
                          <div className="h-px flex-1 bg-gradient-to-l from-transparent via-white/10 to-white/10" />
                        </div>
                        <AccountSelect label={t("dstAcc")} value={dstId} onChange={setDstId} accounts={accounts} t={t} />
                      </div>

                      <div className="grid flex-1 min-h-0 grid-rows-[1fr_auto] gap-3">
                        <div className="grid min-h-0 grid-cols-2 gap-3">
                          <div className="flex flex-col justify-between rounded-3xl border border-white/[0.06] bg-[#0a0a0a]/90 p-5 overflow-hidden relative min-h-[120px]">
                            {srcAccount?.avatar ? (
                              <>
                                <img src={srcAccount.avatar} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50" />
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                </svg>
                              </div>
                            )}
                            <div className="relative z-10 text-[10px] text-neutral-500 uppercase tracking-[0.22em]">{t("source")}</div>
                            <div className="relative z-10 mt-auto">
                              <div className="flex items-center gap-2">
                                <img src={levelImg(srcAccount?.level ?? null)} className="w-5 h-5" />
                                <span className="truncate font-mono text-sm text-white">{srcId || t("notSel")}</span>
                              </div>
                              <div className="mt-1.5 truncate text-xs text-neutral-400">{srcAccount?.name || t("waiting")}</div>
                            </div>
                          </div>
                          <div className="flex flex-col justify-between rounded-3xl border border-white/[0.06] bg-[#0a0a0a]/90 p-5 text-right overflow-hidden relative min-h-[120px]">
                            {dstAccount?.avatar ? (
                              <>
                                <img src={dstAccount.avatar} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50" />
                              </>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                <svg className="w-24 h-24 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                                </svg>
                              </div>
                            )}
                            <div className="relative z-10 text-[10px] text-neutral-500 uppercase tracking-[0.22em]">{t("target")}</div>
                            <div className="relative z-10 mt-auto">
                              <div className="flex items-center gap-2 justify-end">
                                <span className="truncate font-mono text-sm text-white">{dstId || t("notSel")}</span>
                                <img src={levelImg(dstAccount?.level ?? null)} className="w-5 h-5" />
                              </div>
                              <div className="mt-1.5 truncate text-xs text-neutral-400">{dstAccount?.name || t("waiting")}</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-2xl border border-white/[0.06] bg-[#080808]/70 px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">{t("accounts")}</div>
                            <div className="mt-1 text-lg font-bold text-white">{accounts.length}</div>
                          </div>
                          <div className="rounded-2xl border border-white/[0.06] bg-[#080808]/70 px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">{t("folder")}</div>
                            <div className="mt-1 text-lg font-bold text-white">570</div>
                          </div>
                          <div className="rounded-2xl border border-white/[0.06] bg-[#080808]/70 px-4 py-3">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-600">{t("launch")}</div>
                            <div className="mt-1 truncate text-lg font-bold text-white">{launchMode === "umbrella" ? t("launchDlc") : launchMode === "steam" ? t("launchSteam") : launchMode === "custom" ? t("launchCustom") : t("launchNone")}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleConfirm}
                      disabled={!srcId || !dstId || srcId === dstId || loading}
                      className="mt-7 w-full py-4 bg-white hover:bg-neutral-200 disabled:bg-[#202020] disabled:text-neutral-600 disabled:cursor-not-allowed text-black font-bold text-sm rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-[0_18px_45px_rgba(255,255,255,0.08)] disabled:shadow-none"
                    >
                      {loading ? t("checking") : t("continue")}
                    </button>
                  </section>
                </div>
              </div>
            ) : (
              <div className="w-full flex-1 min-h-0 flex bg-[#101010]/90" style={{ animation: "slideRight 0.38s cubic-bezier(.2,.9,.2,1)" }}>
                <div className="relative grid flex-1 min-h-0 grid-cols-[1fr_1.1fr] gap-4 p-4">
                  <section className="relative overflow-hidden flex min-h-0 flex-col justify-between rounded-[26px] border border-white/[0.07] bg-[#0b0b0b]/70 p-8">
                    <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-amber-300/[0.04] blur-3xl" />
                    <div className="relative">
                      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/15 bg-amber-300/[0.04] px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-amber-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.7)]" />
                        {t("review")}
                      </div>
                      <h2 className="max-w-sm text-4xl font-black tracking-[-0.05em] leading-[0.95] text-white">{t("reviewTitle")}</h2>
                      <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-500">{t("reviewSub")}</p>
                    </div>
                    <div className="relative grid grid-rows-3 gap-3">
                      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-600">Step 01</div>
                        <div className="mt-2 text-sm font-bold text-white">{t("step1")}</div>
                      </div>
                      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-600">Step 02</div>
                        <div className="mt-2 text-sm font-bold text-white">{t("step2")}</div>
                      </div>
                      <div className="rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-600">Step 03</div>
                        <div className="mt-2 text-sm font-bold text-white">{t("step3")}</div>
                      </div>
                    </div>
                  </section>

                  <section className="relative flex min-h-0 flex-col rounded-[26px] border border-white/[0.07] bg-[#0a0a0a]/80 p-8">
                    <div className="flex items-center gap-4 mb-7">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400/10 flex items-center justify-center ring-1 ring-amber-300/15">
                        <svg className="w-6 h-6 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight">{t("confirmTitle")}</h2>
                        <p className="text-sm text-neutral-500">{t("confirmSub")}</p>
                      </div>
                    </div>
                    <div className="grid flex-1 min-h-0 grid-cols-[1fr_auto_1fr] gap-4 items-stretch rounded-[26px] border border-white/[0.07] bg-[#0a0a0a]/80 p-5 mb-5">
                      <div>
                        <div className="text-[11px] text-neutral-500 uppercase tracking-[0.22em] mb-2">{t("source")}</div>
                        <div className="flex items-center gap-2">
                          <img src={levelImg(srcAccount?.level ?? null)} className="w-7 h-7" />
                          <div className="font-mono text-base text-white">{srcId}</div>
                        </div>
                        <div className="text-sm text-neutral-400 mt-1 truncate">{srcAccount?.name}</div>
                      </div>
                      <div className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-neutral-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
                        </svg>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-neutral-500 uppercase tracking-[0.22em] mb-2">{t("target")}</div>
                        <div className="flex items-center gap-2 justify-end">
                          <div className="font-mono text-base text-white">{dstId}</div>
                          <img src={levelImg(dstAccount?.level ?? null)} className="w-7 h-7" />
                        </div>
                        <div className="text-sm text-neutral-400 mt-1 truncate">{dstAccount?.name}</div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-400 mb-7 leading-relaxed rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                      {t("willClose")} <span className="text-red-300">{t("closed")}</span>, {t("folder")} <code className="text-white bg-white/10 px-2 py-1 rounded-lg text-xs">570</code> {t("copied")}, {t("then")}
                      {" "}{launchMode === "steam" ? t("aSteam") : launchMode === "umbrella" ? t("aDlc") : launchMode === "custom" ? t("aCustom") : t("aNone")}.
                    </p>
                    <div className="flex gap-3">
                      <button onClick={() => setStep("select")}
                        className="flex-1 py-3.5 bg-[#1a1a1a] hover:bg-[#222] rounded-2xl text-sm font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.98]">
                        {t("back")}
                      </button>
                      <button onClick={startTransfer}
                        className="flex-1 py-3.5 bg-white hover:bg-neutral-200 text-black font-bold text-sm rounded-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-[0_18px_45px_rgba(255,255,255,0.08)]">
                        {t("startTransfer")}
                      </button>
                    </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </Shell>
  );
}

function Shell({ children, showSettings, setShowSettings, launchMode, hasUmbrella, launchPaths, setLaunchMode, lang, setLanguage, t, pickPath }: {
  children: React.ReactNode;
  showSettings: boolean;
  setShowSettings: (v: boolean) => void;
  launchMode: LaunchMode;
  hasUmbrella: boolean;
  launchPaths: { steam: string; umbrella: string; custom: string };
  setLaunchMode: (v: LaunchMode) => void;
  lang: Lang;
  setLanguage: (l: Lang) => void;
  t: (k: string) => string;
  pickPath: (kind: "steam" | "umbrella" | "custom") => void;
}) {
  const opt = (val: LaunchMode, label: string) => (
    <button onClick={() => setLaunchMode(val)}
      className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 ${launchMode === val ? "bg-white/10 border border-white/20" : "border border-white/5 hover:border-white/10"}`}>
      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${launchMode === val ? "border-white" : "border-neutral-600"}`}>
        {launchMode === val && <div className="w-2 h-2 rounded-full bg-white" />}
      </div>
      <span className="text-sm text-white flex-1">{label}</span>
    </button>
  );

  const activeKind: "steam" | "umbrella" | "custom" | null =
    launchMode === "steam" ? "steam" : launchMode === "umbrella" ? "umbrella" : launchMode === "custom" ? "custom" : null;
  const activePath = activeKind ? launchPaths[activeKind] : "";

  return (
    <div className="min-h-screen bg-[#080808] flex flex-col text-white select-none overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_85%_75%,rgba(80,80,80,0.18),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-20 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.07] bg-[#080808]/80 backdrop-blur-xl" style={{ WebkitAppRegion: "drag" } as React.CSSProperties}>
        <div className="flex items-center gap-3 rounded-xl px-1 py-1">
          <span className="relative grid w-9 h-9 place-items-center rounded-xl text-white">
            <svg className="w-5 h-5" viewBox="0 0 32 32" fill="currentColor">
              <path d="M18.102 12.129c0-0 0-0 0-0.001 0-1.564 1.268-2.831 2.831-2.831s2.831 1.268 2.831 2.831c0 1.564-1.267 2.831-2.831 2.831-0 0-0 0-0.001 0h0c-0 0-0 0-0.001 0-1.563 0-2.83-1.267-2.83-2.83 0-0 0-0 0-0.001v0zM24.691 12.135c0-2.081-1.687-3.768-3.768-3.768s-3.768 1.687-3.768 3.768c0 2.081 1.687 3.768 3.768 3.768v0c2.080-0.003 3.765-1.688 3.768-3.767v-0zM10.427 23.76l-1.841-0.762c0.524 1.078 1.611 1.808 2.868 1.808 1.317 0 2.448-0.801 2.93-1.943l0.008-0.021c0.155-0.362 0.246-0.784 0.246-1.226 0-1.757-1.424-3.181-3.181-3.181-0.405 0-0.792 0.076-1.148 0.213l0.022-0.007 1.903 0.787c0.852 0.364 1.439 1.196 1.439 2.164 0 1.296-1.051 2.347-2.347 2.347-0.324 0-0.632-0.066-0.913-0.184l0.015 0.006zM15.974 1.004c-7.857 0.001-14.301 6.046-14.938 13.738l-0.004 0.054 8.038 3.322c0.668-0.462 1.495-0.737 2.387-0.737 0.001 0 0.002 0 0.002 0h-0c0.079 0 0.156 0.005 0.235 0.008l3.575-5.176v-0.074c0.003-3.12 2.533-5.648 5.653-5.648 3.122 0 5.653 2.531 5.653 5.653s-2.531 5.653-5.653 5.653h-0.131l-5.094 3.638c0 0.065 0.005 0.131 0.005 0.199 0 0.001 0 0.002 0 0.003 0 2.342-1.899 4.241-4.241 4.241-2.047 0-3.756-1.451-4.153-3.38l-0.005-0.027-5.755-2.383c1.841 6.345 7.601 10.905 14.425 10.905 8.281 0 14.994-6.713 14.994-14.994s-6.713-14.994-14.994-14.994c-0 0-0.001 0-0.001 0h0z" />
            </svg>
          </span>
          <span className="leading-none">
            <span className="block text-sm font-bold tracking-[0.18em] uppercase text-white">SteamSync</span>
            <span className="block mt-1 text-[10px] tracking-[0.22em] uppercase text-neutral-600">Dota 2 Config Bridge</span>
          </span>
        </div>
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button onClick={() => setShowSettings(!showSettings)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${showSettings ? "text-white bg-white/10" : "text-neutral-500 hover:text-white hover:bg-white/5"}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button onClick={() => getApi().hideWindow()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:bg-white/10 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
            </svg>
          </button>
          <button onClick={() => window.close()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-neutral-500 hover:bg-red-500/10 hover:text-red-300 transition-all duration-300 hover:scale-105 active:scale-95">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {showSettings && (
        <>
          <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} style={{ animation: "fadeIn 0.2s ease-out" }} />
          <div className="fixed inset-0 z-40 flex items-center justify-center p-8" onClick={() => setShowSettings(false)}>
            <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#121212] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.8)] max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ animation: "popIn 0.35s cubic-bezier(.2,.9,.2,1)" }}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold tracking-tight">{t("settings")}</h3>
                <button onClick={() => setShowSettings(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-all">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-[0.18em] mb-4">{t("afterTransfer")}</p>
              <div className="space-y-2">
                {opt("steam", t("launchSteam"))}
                {hasUmbrella && opt("umbrella", "Secret DLC")}
                {opt("custom", t("custom"))}
                {opt("none", t("launchNone"))}
              </div>

              <div className={`transition-all duration-500 ease-out overflow-hidden ${activeKind ? "max-h-44 opacity-100 mt-3" : "max-h-0 opacity-0 mt-0"}`}>
                <div className="rounded-xl border border-white/5 bg-[#0d0d0d] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-500">
                      {activeKind === "steam" ? t("launchSteam") : activeKind === "umbrella" ? "Secret DLC" : t("custom")}
                    </span>
                    <button
                      onClick={() => activeKind && pickPath(activeKind)}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/15 rounded-lg text-[11px] font-semibold transition-all"
                    >
                      {t("choose")}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-500 break-all leading-relaxed">{activePath || t("notSet")}</p>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 uppercase tracking-[0.18em] mt-6 mb-3">{t("language")}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["en", "ru"] as Lang[]).map((l) => (
                  <button key={l} onClick={() => setLanguage(l)}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${lang === l ? "bg-white/10 border border-white/20 text-white" : "border border-white/5 text-neutral-400 hover:border-white/10"}`}>
                    {l === "en" ? "English" : "Русский"}
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-neutral-600 mt-6 text-center">{t("cfgSaved")}</p>
            </div>
          </div>
        </>
      )}

      {children}
      <footer className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-white/[0.07] bg-[#080808]/75 backdrop-blur-xl">
        <p className="text-[11px] text-neutral-700 tracking-wide">SteamSync by Freaks</p>
        <a href="https://t.me/steamsync" onClick={openTelegram}
          className="text-neutral-600 hover:text-white transition-all duration-300 hover:scale-110">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.46-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.441-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.145.118.185.279.203.391.018.112.041.367.023.567z" />
          </svg>
        </a>
      </footer>
    </div>
  );
}
