import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getSteamPath: () => ipcRenderer.invoke("get-steam-path"),
  selectSteamFolder: () => ipcRenderer.invoke("select-steam-folder"),
  getAccounts: () => ipcRenderer.invoke("get-accounts"),
  fetchNicknames: (ids: string[]) => ipcRenderer.invoke("fetch-nicknames", ids),
  checkFolder: (data: { userdata: string; srcId: string }) => ipcRenderer.invoke("check-folder", data),
  checkUmbrella: () => ipcRenderer.invoke("check-umbrella"),
  launchUmbrella: () => ipcRenderer.invoke("launch-umbrella"),
  selectCustomExe: () => ipcRenderer.invoke("select-launch-exe", "custom"),
  getLaunchPaths: () => ipcRenderer.invoke("get-launch-paths"),
  selectLaunchExe: (kind: "steam" | "umbrella" | "custom") => ipcRenderer.invoke("select-launch-exe", kind),
  getCustomExe: () => ipcRenderer.invoke("get-custom-exe"),
  launchCustom: () => ipcRenderer.invoke("launch-custom"),
  doTransfer: (data: { srcId: string; dstId: string; userdata: string }) => ipcRenderer.invoke("do-transfer", data),
  onTransferProgress: (cb: (p: { copied: number; total: number; bytes: number; totalBytes: number }) => void) => {
    const listener = (_e: unknown, p: any) => cb(p);
    ipcRenderer.on("transfer-progress", listener);
    return () => ipcRenderer.removeListener("transfer-progress", listener);
  },
  killSteam: () => ipcRenderer.invoke("kill-steam"),
  startSteam: (root: string) => ipcRenderer.invoke("start-steam", root),
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings: { launchMode?: string; lang?: string }) => ipcRenderer.invoke("save-settings", settings),
  hideWindow: () => ipcRenderer.invoke("hide-window"),
  openTelegram: () => ipcRenderer.invoke("open-telegram"),
});
