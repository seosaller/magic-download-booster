import { afterEach, expect, it } from "bun:test";
import { resolveThreadsPost } from "./threads.server";
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

it("resolves the supplied Threads share link to its canonical post before extraction", async () => {
  globalThis.fetch = Object.assign(async () => new Response(null, { status: 302, headers: { location: "https://www.threads.com/@pakdiaries01/post/DfccWTYDHyd?xmt=test" } }), { preconnect: originalFetch.preconnect });
  expect(await resolveThreadsPost("https://www.threads.com/share/GiR_Jpr1K")).toBe("https://www.threads.com/@pakdiaries01/post/DfccWTYDHyd");
});
it("blocks off-platform redirects before fetching them", async () => {
  let calls = 0;
  globalThis.fetch = Object.assign(async () => { calls++; return new Response(null, { status: 302, headers: { location: "https://127.0.0.1/private" } }); }, { preconnect: originalFetch.preconnect });
  await expect(resolveThreadsPost("https://www.threads.com/share/GiR_Jpr1K")).rejects.toThrow("Unsupported Threads redirect");
  expect(calls).toBe(1);
});