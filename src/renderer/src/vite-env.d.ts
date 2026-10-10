/// <reference types="vite/client" />

interface Window {
  api: {
    getSteamPath: () => Promise<{ steamRoot: string; userdata: string } | { error: string; needsPick?: boolean }>;
    selectSteamFolder: () => Promise<{ steamRoot: string; userdata: string } | { error?: string; canceled?: boolean }>;
    getAccounts: () => Promise<string[]>;
    fetchNicknames: (ids: string[]) => Promise<Record<string, { name: string; avatar: string | null; level: number | null }>>;
    checkFolder: (data: { userdata: string; srcId: string }) => Promise<{ exists: boolean }>;
    checkUmbrella: () => Promise<{ exists: boolean }>;
    launchUmbrella: () => Promise<{ ok: boolean; error?: string }>;
    selectCustomExe: () => Promise<{ path?: string; canceled?: boolean }>;
    getLaunchPaths: () => Promise<{ steam: string; umbrella: string; custom: string }>;
    selectLaunchExe: (kind: "steam" | "umbrella" | "custom") => Promise<{ path?: string; canceled?: boolean }>;
    getCustomExe: () => Promise<{ path: string }>;
    launchCustom: () => Promise<{ ok: boolean; error?: string }>;
    doTransfer: (data: { srcId: string; dstId: string; userdata: string }) => Promise<{ ok: boolean; error?: string }>;
    onTransferProgress: (cb: (p: { copied: number; total: number; bytes: number; totalBytes: number }) => void) => () => void;
    killSteam: () => Promise<string[]>;
    startSteam: (root: string) => Promise<boolean>;
    getSettings: () => Promise<{ launchMode?: string; lang?: string }>;
    saveSettings: (settings: { launchMode?: string; lang?: string }) => Promise<void>;
    hideWindow: () => Promise<void>;
    openTelegram: () => Promise<void>;
  };
}