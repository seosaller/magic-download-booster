export function isMp3Header(bytes: Uint8Array) {
  return (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && typeof bytes[1] === "number" && (bytes[1] & 0xe0) === 0xe0 && (bytes[1] & 0x06) === 0x02);
}
export function downloadFailure(request: Request, message: string, status = 502) {
  if (request.headers.get("sec-fetch-dest") === "iframe") {
    const payload = JSON.stringify({ type: "download-error", message }).replace(/</g, "\\u003c");
    return new Response(`<!doctype html><title>Download unavailable</title><script>parent.postMessage(${payload},location.origin)</script>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; frame-ancestors 'self'" } });
  }
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}