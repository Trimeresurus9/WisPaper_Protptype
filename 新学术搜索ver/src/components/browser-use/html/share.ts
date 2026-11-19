import type { HtmlArtifact } from './artifact';

const maxBytes = 1024 * 1024;
const maxEncodedLength = 32000;
const tooLarge = '这份 HTML 超出分享链接的容量，可以下载文件发送。';

export async function makeShareUrl(file: HtmlArtifact): Promise<string> {
  const json = new Blob([JSON.stringify(file)]);
  if (json.size > maxBytes) throw new Error(tooLarge);
  const compress = typeof CompressionStream !== 'undefined';
  const bytes = new Uint8Array(await (compress
    ? new Response(json.stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()
    : json.arrayBuffer()));
  if (Math.ceil(bytes.length / 3) * 4 > maxEncodedLength) throw new Error(tooLarge);
  const payload = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL(import.meta.env.BASE_URL + 'html-preview.html', location.origin);
  url.hash = 'v1.' + (compress ? 'gz.' : 'raw.') + payload;
  return url.href;
}

export async function readShare(hash: string): Promise<HtmlArtifact> {
  const invalid = '链接可能不完整，请让分享者重新复制完整链接。';
  if (hash.length > maxEncodedLength + 10) throw new Error(invalid);
  const match = /^#v1\.(gz|raw)\.([A-Za-z0-9_-]+)$/.exec(hash);
  if (!match) throw new Error(invalid);
  try {
    const bytes = Uint8Array.from(atob(match[2].replace(/-/g, '+').replace(/_/g, '/')), ch => ch.charCodeAt(0));
    let stream = new Blob([bytes]).stream();
    if (match[1] === 'gz') stream = stream.pipeThrough(new DecompressionStream('gzip'));
    const reader = stream.getReader();
    const chunks: Uint8Array<ArrayBuffer>[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) {
        await reader.cancel();
        throw new Error(invalid);
      }
      chunks.push(new Uint8Array(value));
    }
    const file = JSON.parse(await new Blob(chunks).text());
    if (typeof file?.name === 'string' && typeof file.html === 'string' && file.html.trim()) return { name: file.name, html: file.html };
  } catch { /* Truncated and unsupported encodings use the same recovery path. */ }
  throw new Error(invalid);
}
