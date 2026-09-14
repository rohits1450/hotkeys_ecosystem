export function base64Encode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}

export function base64Decode(text: string): string {
  return decodeURIComponent(escape(atob(text)));
}

export function tryBase64AutoDetect(text: string): { direction: "encode" | "decode"; result: string } {
  const trimmed = text.trim();
  const looksEncoded = /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0;
  if (looksEncoded) {
    try {
      return { direction: "decode", result: base64Decode(trimmed) };
    } catch {
      // fall through to encode
    }
  }
  return { direction: "encode", result: base64Encode(text) };
}

export function formatJson(text: string): string {
  const parsed = JSON.parse(text);
  return JSON.stringify(parsed, null, 2);
}

export function minifyCss(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .replace(/\s+/g, " ")
    .trim();
}
