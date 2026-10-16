import { type FetchImpl } from "./net";

// Talks to qBittorrent's Web API (Options → Web UI). Configured by env so the
// password never lands in config.json:
//   QBIT_URL  (default http://localhost:8080)
//   QBIT_USER / QBIT_PASS  (omit when "bypass auth for localhost" is on)
//   QBIT_SAVEPATH  (omit to use qBittorrent's own default folder)
export interface QbitEnv {
  QBIT_URL?: string;
  QBIT_USER?: string;
  QBIT_PASS?: string;
  QBIT_SAVEPATH?: string;
}

const QBIT_KEYS = ["QBIT_URL", "QBIT_USER", "QBIT_PASS", "QBIT_SAVEPATH"];

// Pulls --QBIT_SAVEPATH=E:/x (or --qbit-savepath=E:/x) out of argv into env,
// returning the rest for the normal CLI parser.
export function takeQbitFlags(argv: string[], env: Record<string, string | undefined> = process.env): string[] {
  return argv.filter((arg) => {
    const m = /^--(qbit[-_][a-z]+)=(.*)$/is.exec(arg);
    const key = m?.[1]!.toUpperCase().replace("-", "_");
    if (!key || !QBIT_KEYS.includes(key)) return true;
    env[key] = m![2];
    return false;
  });
}

export async function sendToQbit(
  magnets: string[],
  env: QbitEnv = process.env,
  fetchImpl: FetchImpl = fetch,
): Promise<void> {
  const base = (env.QBIT_URL || "http://localhost:8080").replace(/\/+$/, "");
  // qBittorrent's CSRF check rejects requests whose Referer/Origin don't match its host.
  const headers: Record<string, string> = { Referer: base, Origin: base };

  if (env.QBIT_USER) {
    const login = await fetchImpl(`${base}/api/v2/auth/login`, {
      method: "POST",
      headers,
      body: new URLSearchParams({ username: env.QBIT_USER, password: env.QBIT_PASS ?? "" }),
    });
    const text = await login.text();
    if (!login.ok || text.trim() === "Fails.") throw new Error("qBittorrent login failed");
    // Cookie name varies by version (SID, QBT_SID_<port>), so keep whatever it sent.
    const cookie = login.headers.get("set-cookie")?.split(";")[0];
    if (cookie) headers.Cookie = cookie;
  }

  const res = await fetchImpl(`${base}/api/v2/torrents/add`, {
    method: "POST",
    headers,
    body: new URLSearchParams({
      urls: magnets.join("\n"),
      ...(env.QBIT_SAVEPATH ? { savepath: env.QBIT_SAVEPATH } : {}),
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`qBittorrent add failed (HTTP ${res.status})`);
  if (text.trim() === "Fails.") throw new Error("qBittorrent add failed (already added, or not a valid magnet)");
}
