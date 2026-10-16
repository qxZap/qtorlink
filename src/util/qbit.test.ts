import { describe, expect, it } from "vitest";
import { sendToQbit, takeQbitFlags } from "./qbit";

describe("takeQbitFlags", () => {
  it("moves qbit flags into env and leaves the rest", () => {
    const env: Record<string, string | undefined> = {};
    const rest = takeQbitFlags(
      ["--QBIT_SAVEPATH=E:/Games", "--qbit-url=http://nas:8666", "magnet:?x", "--QBIT_NOPE=1"],
      env,
    );
    expect(env).toEqual({ QBIT_SAVEPATH: "E:/Games", QBIT_URL: "http://nas:8666" });
    expect(rest).toEqual(["magnet:?x", "--QBIT_NOPE=1"]);
  });
});

type Call = { url: string; init?: RequestInit };

function fake(responses: Response[]) {
  const calls: Call[] = [];
  const impl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return responses.shift()!;
  };
  return { calls, impl };
}

describe("sendToQbit", () => {
  it("adds magnets without login when no user is set", async () => {
    const { calls, impl } = fake([new Response("Ok.")]);
    await sendToQbit(["magnet:?a", "magnet:?b"], {}, impl);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("http://localhost:8080/api/v2/torrents/add");
    expect((calls[0]!.init!.body as URLSearchParams).get("urls")).toBe("magnet:?a\nmagnet:?b");
  });

  it("logs in and forwards the session cookie", async () => {
    const { calls, impl } = fake([
      new Response("Ok.", { headers: { "set-cookie": "SID=abc; HttpOnly; path=/" } }),
      new Response("Ok."),
    ]);
    await sendToQbit(["magnet:?a"], { QBIT_URL: "http://nas:9090/", QBIT_USER: "u", QBIT_PASS: "p" }, impl);
    expect(calls[0]!.url).toBe("http://nas:9090/api/v2/auth/login");
    expect((calls[1]!.init!.headers as Record<string, string>).Cookie).toBe("SID=abc");
  });

  it("passes the save path when set", async () => {
    const { calls, impl } = fake([new Response("Ok.")]);
    await sendToQbit(["magnet:?a"], { QBIT_SAVEPATH: "E:/plex" }, impl);
    expect((calls[0]!.init!.body as URLSearchParams).get("savepath")).toBe("E:/plex");
  });

  it("throws on a failed login", async () => {
    const { impl } = fake([new Response("Fails.")]);
    await expect(sendToQbit(["magnet:?a"], { QBIT_USER: "u" }, impl)).rejects.toThrow(/login/);
  });

  it("throws on a rejected add", async () => {
    const { impl } = fake([new Response("Fails.", { status: 415 })]);
    await expect(sendToQbit(["magnet:?a"], {}, impl)).rejects.toThrow(/add failed/);
  });
});
