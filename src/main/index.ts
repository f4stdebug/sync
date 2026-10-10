import { app, BrowserWindow, ipcMain, screen, shell, dialog } from "electron";
import { join, dirname, basename } from "path";
import { existsSync, readdirSync, readFileSync, writeFileSync, rmSync } from "fs";
import { readdir, stat, copyFile, mkdir } from "fs/promises";
import { execSync } from "child_process";

const STEAM64_BASE = 76561197960265728n;
const DEFAULT_STEAM_ROOT = join(
  process.env["ProgramFiles(x86)"] || "C:/Program Files (x86)",
  "Steam",
);

interface Settings {
  launchMode?: string;
  steamPath?: string;
  steamExe?: string;
  umbrellaExe?: string;
  customPath?: string;
  lang?: string;
}

function getSettingsPath(): string {
  return join(app.getPath("userData"), "steamsync_settings.json");
}

function readSettings(): Settings {
  try {
    if (existsSync(getSettingsPath())) {
      return JSON.parse(readFileSync(getSettingsPath(), "utf-8"));
    }
  } catch {}
  return {};
}

function writeSettings(settings: Settings): void {
  try {
    writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), "utf-8");
  } catch {}
}

function regQuery(key: string, value: string): string | null {
  const roots = ["HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam", "HKLM\\SOFTWARE\\Valve\\Steam"];
  const candidates = [key, ...roots];
  for (const k of candidates) {
    try {
      const out = execSync(`reg query "${k}" /v ${value}`, { encoding: "utf-8", windowsHide: true });
      const m = out.match(new RegExp(`${value}\\s+REG_SZ\\s+(.+)`));
      if (m) return m[1].trim();
    } catch {}
  }
  return null;
}

function runningSteamPath(): string | null {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "(Get-Process steam -ErrorAction SilentlyContinue | Select-Object -First 1).Path"`,
      { encoding: "utf-8", windowsHide: true },
    ).trim();
    if (out && out.toLowerCase().endsWith("steam.exe")) return dirname(out);
  } catch {}
  return null;
}

function getSteamCandidates(): string[] {
  const cands: string[] = [];
  const add = (p?: string | null) => {
    if (!p) return;
    const norm = p.replace(/\//g, "\\").replace(/\\+$/, "");
    if (norm && !cands.some((c) => c.toLowerCase() === norm.toLowerCase())) cands.push(norm);
  };

  add(readSettings().steamPath);
  add(regQuery("HKCU\\Software\\Valve\\Steam", "SteamPath"));
  add(regQuery("HKLM\\SOFTWARE\\Valve\\Steam", "InstallPath"));
  add(runningSteamPath());
  add(DEFAULT_STEAM_ROOT);

  const subdirs = ["Steam", "Program Files (x86)\\Steam", "Program Files\\Steam", "Games\\Steam", "SteamLibrary"];
  for (const drive of "CDEFGHIJKLMNOPQRSTUVWXYZ") {
    const root = `${drive}:\\`;
    if (!existsSync(root)) continue;
    for (const sub of subdirs) {
      const p = join(root, sub);
      if (existsSync(join(p, "userdata")) || existsSync(join(p, "steamapps"))) add(p);
    }
  }
  return cands;
}

function getSteamIds(userdata: string): string[] {
  if (!existsSync(userdata)) return [];
  return readdirSync(userdata)
    .filter((e) => /^\d+$/.test(e) && existsSync(join(userdata, e)))
    .sort();
}

function resolveSteamRoot(): string {
  let best = "";
  let bestScore = -1;
  for (const root of getSteamCandidates()) {
    const userdata = join(root, "userdata");
    if (!existsSync(userdata)) continue;
    const ids = getSteamIds(userdata);
    if (ids.length === 0) continue;
    let score = ids.length;
    if (ids.some((id) => existsSync(join(userdata, id, "570")))) score += 1000;
    if (score > bestScore) {
      bestScore = score;
      best = root;
    }
  }
  return best;
}

function getUmbrellaExe(): string | null {
  const override = readSettings().umbrellaExe;
  if (override && existsSync(override)) return override;
  for (const dir of ["C:\\Umbrella", "C:\\umb"]) {
    if (!existsSync(dir)) continue;
    const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".exe"));
    if (files.length > 0) return join(dir, files[0]);
  }
  return null;
}

function getSteamExe(): string | null {
  const override = readSettings().steamExe;
  if (override && existsSync(override)) return override;
  const root = resolveSteamRoot();
  if (root) {
    const exe = join(root, "Steam.exe");
    if (existsSync(exe)) return exe;
  }
  return null;
}

function killSteam(): string[] {
  const killed: string[] = [];
  for (const proc of ["Steam.exe", "steamwebhelper.exe", "steamservice.exe"]) {
    try {
      execSync(`taskkill /F /IM ${proc} /T 2>nul`, { stdio: "pipe", windowsHide: true });
      killed.push(proc);
    } catch {
      // process already closed
    }
  }
  return killed;
}

function startSteam(steamRoot: string): Promise<boolean> {
  return new Promise(async (resolve) => {
    const exe = getSteamExe() || join(steamRoot, "Steam.exe");
    if (!existsSync(exe)) {
      resolve(false);
      return;
    }
    const result = await shell.openPath(exe);
    resolve(result === "");
  });
}

function getUserdataPath(): string {
  const root = resolveSteamRoot();
  return root ? join(root, "userdata") : "";
}

function id3ToSteam64(id3: string): string {
  return (BigInt(id3) + STEAM64_BASE).toString();
}

async function fetchProfile(steamId3: string): Promise<{ name: string | null; avatar: string | null; level: number | null }> {
  const steam64 = id3ToSteam64(steamId3);
  try {
    const res = await fetch(`https://steamcommunity.com/profiles/${steam64}/?xml=1`, {
      headers: { "User-Agent": "SteamSync/1.0" },
    });
    if (!res.ok) return { name: null, avatar: null, level: null };
    const xml = await res.text();
    const nameMatch = xml.match(/<steamID><!\[CDATA\[(.*?)\]\]><\/steamID>/);
    const avatarMatch = xml.match(/<avatarFull><!\[CDATA\[(.*?)\]\]><\/avatarFull>/);

    let level: number | null = null;
    try {
      const lvlRes = await fetch(`https://steamcommunity.com/profiles/${steam64}/badges/`, {
        headers: { "User-Agent": "SteamSync/1.0" },
      });
      if (lvlRes.ok) {
        const html = await lvlRes.text();
        const m = html.match(/friendPlayerLevelNum">(\d+)</);
        if (m) level = parseInt(m[1]);
      }
    } catch {}

    return { name: nameMatch?.[1] || null, avatar: avatarMatch?.[1] || null, level };
  } catch {
    return { name: null, avatar: null, level: null };
  }
}

async function collectFiles(dir: string, base: string, out: { rel: string; size: number }[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = join(dir, e.name);
    const rel = base ? join(base, e.name) : e.name;
    if (e.isDirectory()) {
      await collectFiles(full, rel, out);
    } else if (e.isFile()) {
      const st = await stat(full);
      out.push({ rel, size: st.size });
    }
  }
}

interface Progress {
  copied: number;
  total: number;
  bytes: number;
  totalBytes: number;
}

async function copyFolder(
  src: string,
  dst: string,
  onProgress?: (p: Progress) => void,
): Promise<{ ok: boolean; error?: string }> {
  if (!existsSync(src)) {
    return { ok: false, error: "Folder 570 not found — Dota 2 hasn't been launched on this account" };
  }

  const files: { rel: string; size: number }[] = [];
  await collectFiles(src, "", files);
  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  let copied = 0;
  let bytes = 0;
  let lastReport = 0;
  const report = (force = false) => {
    const now = Date.now();
    if (force || now - lastReport > 60) {
      lastReport = now;
      onProgress?.({ copied, total: files.length, bytes, totalBytes });
    }
  };

  try {
    if (existsSync(dst)) rmSync(dst, { recursive: true, force: true });
    report(true);
    for (const f of files) {
      const s = join(src, f.rel);
      const d = join(dst, f.rel);
      await mkdir(dirname(d), { recursive: true });
      await copyFile(s, d);
      copied++;
      bytes += f.size;
      report();
    }
    report(true);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to copy folder" };
  }
}

function getCustomExe(): string | null {
  const p = readSettings().customPath;
  if (p && existsSync(p)) return p;
  return null;
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): BrowserWindow {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().bounds;
  const w = Math.round(sw);
  const h = Math.round(sh);

  const win = new BrowserWindow({
    width: w,
    height: h,
    x: 0,
    y: 0,
    resizable: false,
    movable: false,
    maximizable: false,
    fullscreenable: false,
    frame: false,
    backgroundColor: "#080808",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: false,
    },
  });

  win.webContents.on("before-input-event", (e, input) => {
    if ((input.control || input.meta) && input.key.toLowerCase() === "i") {
      e.preventDefault();
    }
    if (input.key === "F12") {
      e.preventDefault();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  mainWindow = win;
  return win;
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("get-steam-path", async () => {
  const root = resolveSteamRoot();
  if (!root) return { error: "Steam not found", needsPick: true };
  const userdata = join(root, "userdata");
  return { steamRoot: root, userdata };
});

ipcMain.handle("select-steam-folder", async () => {
  const res = await dialog.showOpenDialog(mainWindow!, {
    title: "Select your Steam folder",
    message: "Choose the Steam folder (the one that contains the 'userdata' folder)",
    properties: ["openDirectory"],
  });
  if (res.canceled || res.filePaths.length === 0) return { canceled: true };

  let chosen = res.filePaths[0];
  if (basename(chosen).toLowerCase() === "userdata") chosen = dirname(chosen);

  if (!existsSync(join(chosen, "userdata"))) {
    return { error: "Invalid folder — 'userdata' not found inside" };
  }
  const ids = getSteamIds(join(chosen, "userdata"));
  if (ids.length === 0) {
    return { error: "No Steam accounts found in this folder" };
  }

  const s = readSettings();
  s.steamPath = chosen;
  writeSettings(s);
  return { steamRoot: chosen, userdata: join(chosen, "userdata") };
});

ipcMain.handle("get-accounts", async () => {
  const userdata = getUserdataPath();
  if (!userdata) return [];
  return getSteamIds(userdata);
});

ipcMain.handle("fetch-nicknames", async (_e, ids: string[]) => {
  const result: Record<string, { name: string; avatar: string | null; level: number | null }> = {};
  for (const id of ids) {
    const profile = await fetchProfile(id);
    result[id] = { name: profile.name || "???", avatar: profile.avatar, level: profile.level };
    await new Promise((r) => setTimeout(r, 200));
  }
  return result;
});

ipcMain.handle("check-folder", async (_e, { userdata, srcId }) => {
  const src = join(userdata, srcId, "570");
  return { exists: existsSync(src) };
});

ipcMain.handle("check-umbrella", async () => {
  return { exists: getUmbrellaExe() !== null };
});

ipcMain.handle("launch-umbrella", async () => {
  const exe = getUmbrellaExe();
  if (!exe) return { ok: false, error: "Umbrella loader not found in C:\\Umbrella or C:\\umb" };
  shell.openPath(exe);
  return { ok: true };
});

ipcMain.handle("get-launch-paths", async () => {
  const s = readSettings();
  return {
    steam: getSteamExe() || s.steamExe || "",
    umbrella: getUmbrellaExe() || s.umbrellaExe || "",
    custom: s.customPath || "",
  };
});

ipcMain.handle("select-launch-exe", async (_e, kind: "steam" | "umbrella" | "custom") => {
  const titles = {
    steam: "Select Steam executable",
    umbrella: "Select Secret DLC executable",
    custom: "Select executable to launch after transfer",
  };
  const res = await dialog.showOpenDialog(mainWindow!, {
    title: titles[kind] || titles.custom,
    properties: ["openFile"],
    filters: [{ name: "Executable", extensions: ["exe", "bat", "cmd", "lnk"] }],
  });
  if (res.canceled || res.filePaths.length === 0) return { canceled: true };
  const chosen = res.filePaths[0];
  const s = readSettings();
  if (kind === "steam") s.steamExe = chosen;
  else if (kind === "umbrella") s.umbrellaExe = chosen;
  else s.customPath = chosen;
  writeSettings(s);
  return { path: chosen };
});

ipcMain.handle("get-custom-exe", async () => {
  return { path: readSettings().customPath || "" };
});

ipcMain.handle("launch-custom", async () => {
  const exe = getCustomExe();
  if (!exe) return { ok: false, error: "Custom executable not set" };
  shell.openPath(exe);
  return { ok: true };
});

ipcMain.handle("do-transfer", async (_e, { srcId, dstId, userdata }) => {
  const src = join(userdata, srcId, "570");
  const dst = join(userdata, dstId, "570");
  return copyFolder(src, dst, (p) => mainWindow?.webContents.send("transfer-progress", p));
});

ipcMain.handle("kill-steam", () => killSteam());
ipcMain.handle("start-steam", (_e, root: string) => startSteam(root));
ipcMain.handle("get-settings", () => readSettings());
ipcMain.handle("save-settings", (_e, settings: Settings) => {
  const merged = { ...readSettings(), ...settings };
  writeSettings(merged);
  return merged;
});
ipcMain.handle("hide-window", () => mainWindow?.minimize());
ipcMain.handle("open-telegram", () => shell.openExternal("https://t.me/steamsync"));