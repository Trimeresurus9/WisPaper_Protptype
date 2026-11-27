import type JSZip from 'jszip';

export interface SlideObject {
  id: string;
  kind: 'image' | 'group' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  preview?: string;
  text?: string;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  connections?: Array<{ to: string; color: string; width: number }>;
}

const P = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const SLIDE = 'ppt/slides/slide1.xml';
const MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
const TEXT_PREFIX = 'WisPaper.Text.';
const LEGACY = 'WisPaper.OriginalArtwork';
const DEFAULT_COLOR = '#263F52';

const child = (el: Element | undefined, name: string) =>
  el && Array.from(el.children).find(node => node.localName === name);
const desc = (el: Element | Document, ns: string, name: string) =>
  Array.from(el.getElementsByTagNameNS(ns, name));
const num = (el: Element | undefined, attr: string) => Number(el?.getAttribute(attr) ?? 0);
const nativeInfo = (sp: Element) => child(sp.firstElementChild ?? undefined, 'cNvPr');
const nativeName = (sp: Element) => nativeInfo(sp)?.getAttribute('name') ?? '';
const objectId = (sp: Element) => {
  const name = nativeName(sp);
  if (name === LEGACY) return LEGACY;
  return name.startsWith(TEXT_PREFIX) ? name.slice(TEXT_PREFIX.length) : 'pptx-' + nativeInfo(sp)?.getAttribute('id');
};
const transform = (sp: Element) => child(child(sp, sp.localName === 'grpSp' ? 'grpSpPr' : 'spPr'), 'xfrm');
const drawing = (sp: Element) => ['grpSp', 'pic', 'sp', 'cxnSp', 'graphicFrame'].includes(sp.localName);
const xml = (s: string) => new DOMParser().parseFromString(s, 'application/xml');
const serialize = (doc: Document) => new XMLSerializer().serializeToString(doc);
const hex = (value: string | null | undefined, fallback: string) =>
  value && /^#?[0-9a-f]{6}$/i.test(value) ? '#' + value.replace('#', '') : fallback;

async function xmlPart(zip: JSZip, path: string) {
  const part = zip.file(path);
  if (!part) throw new Error('演示文稿缺少必要内容');
  const doc = xml(await part.async('string'));
  if (doc.getElementsByTagName('parsererror').length) throw new Error('无法读取演示文稿');
  return doc;
}

async function openSlide(presentation: Blob) {
  const { default: Zip } = await import('jszip');
  const zip = await Zip.loadAsync(await presentation.arrayBuffer());
  const [doc, config] = await Promise.all([xmlPart(zip, SLIDE), xmlPart(zip, 'ppt/presentation.xml')]);
  const tree = desc(doc, P, 'spTree')[0];
  const size = desc(config, P, 'sldSz')[0];
  const unitX = num(size, 'cx') / 960;
  const unitY = num(size, 'cy') / 540;
  if (!tree || !(unitX > 0 && unitY > 0)) throw new Error('无法读取幻灯片画布');
  const shapes = Array.from(tree.children).filter(drawing);
  // Pre-editor samples used independent chart fragments and labels. Keep the complete native
  // illustration together on edit, including its internal shape IDs and connector bindings.
  const hasLegacy = shapes.some(sp => nativeName(sp) === 'paper') && shapes.some(sp => nativeName(sp) === 'feature');
  const legacy = hasLegacy ? shapes.filter(sp => !nativeName(sp).startsWith(TEXT_PREFIX)) : [];
  return { zip, doc, tree, shapes, legacy, unitX, unitY };
}

type Slide = Awaited<ReturnType<typeof openSlide>>;
type Bounds = Pick<SlideObject, 'x' | 'y' | 'width' | 'height'>;
const fullSlide = { x: 0, y: 0, width: 960, height: 540 };

function box(xfrm: Element | undefined, childSpace = false): Bounds {
  const offset = child(xfrm, childSpace ? 'chOff' : 'off');
  const extent = child(xfrm, childSpace ? 'chExt' : 'ext');
  return { x: num(offset, 'x'), y: num(offset, 'y'), width: num(extent, 'cx'), height: num(extent, 'cy') };
}

function modelBox(sp: Element, slide: Slide): Bounds {
  const b = box(transform(sp));
  return { x: b.x / slide.unitX, y: b.y / slide.unitY, width: b.width / slide.unitX, height: b.height / slide.unitY };
}

// Build previews from the actual native rectangles and nested, rotated pieces in the exported groups.
function svgPart(sp: Element): string {
  const xf = transform(sp);
  const { x, y, width, height } = box(xf);
  if (sp.localName === 'grpSp') {
    const inner = box(xf, true);
    if (!inner.width || !inner.height) return '';
    const content = Array.from(sp.children).filter(drawing).map(svgPart).join('');
    return `<g transform="translate(${x} ${y}) scale(${width / inner.width} ${height / inner.height}) translate(${-inner.x} ${-inner.y})">${content}</g>`;
  }
  const props = child(sp, 'spPr');
  const geom = child(props, 'prstGeom');
  const line = child(props, 'ln');
  const fill = hex(child(child(props, 'solidFill'), 'srgbClr')?.getAttribute('val'), 'none');
  const stroke = hex(child(child(line, 'solidFill'), 'srgbClr')?.getAttribute('val'), 'none');
  const adjustment = Number(child(child(geom, 'avLst'), 'gd')?.getAttribute('fmla')?.split(' ')[1] ?? 16667);
  const r = geom?.getAttribute('prst') === 'roundRect' ? Math.min(width, height) * adjustment / 100000 : 0;
  const rotation = num(xf, 'rot') / 60000;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${num(line, 'w')}" transform="rotate(${rotation} ${x + width / 2} ${y + height / 2})"/>`;
}

function groupPreview(sp: Element) {
  const b = box(transform(sp), true);
  const content = Array.from(sp.children).filter(drawing).map(svgPart).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${b.x} ${b.y} ${b.width} ${b.height}" preserveAspectRatio="none">${content}</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function filePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('无法读取示例预览'));
    reader.readAsDataURL(file);
  });
}

function textStyle(sp: Element) {
  const font = desc(sp, A, 'rPr')[0];
  const alignment = desc(sp, A, 'pPr')[0]?.getAttribute('algn');
  const text = desc(sp, A, 'p').map(p => desc(p, A, 't').map(t => t.textContent ?? '').join('')).join('\n');
  return {
    text, fontSize: num(font, 'sz') / 75 || 24,
    color: hex(child(child(font, 'solidFill'), 'srgbClr')?.getAttribute('val'), DEFAULT_COLOR),
    bold: font?.getAttribute('b') === '1',
    align: alignment === 'ctr' ? 'center' as const : alignment === 'r' ? 'right' as const : 'left' as const,
  };
}

function ends(connector: Element) {
  const binding = child(connector.firstElementChild ?? undefined, 'cNvCxnSpPr');
  return { start: child(binding, 'stCxn'), end: child(binding, 'endCxn') };
}

export async function readSlideObjects(presentation: Blob, image: File): Promise<SlideObject[]> {
  const slide = await openSlide(presentation);
  const result: SlideObject[] = [];
  if (slide.legacy.length) result.push({ id: LEGACY, kind: 'group', ...fullSlide, preview: await filePreview(image) });
  const byNativeId = new Map<string, SlideObject>();
  for (const sp of slide.shapes) {
    if (slide.legacy.includes(sp)) continue;
    const base = { id: objectId(sp), ...modelBox(sp, slide) };
    let obj: SlideObject;
    if (sp.localName === 'pic') obj = { ...base, kind: 'image' };
    else if (sp.localName === 'grpSp') obj = { ...base, kind: 'group', preview: base.id === LEGACY ? await filePreview(image) : groupPreview(sp) };
    else if (sp.localName === 'sp' && child(sp, 'txBody')) obj = { ...base, kind: 'text', ...textStyle(sp) };
    else continue;
    result.push(obj);
    byNativeId.set(nativeInfo(sp)!.getAttribute('id')!, obj);
  }
  for (const connector of slide.shapes.filter(sp => sp.localName === 'cxnSp')) {
    const { start, end } = ends(connector);
    const from = byNativeId.get(start?.getAttribute('id') ?? '');
    const to = byNativeId.get(end?.getAttribute('id') ?? '');
    if (!from || !to) continue;
    const line = child(child(connector, 'spPr'), 'ln');
    (from.connections ??= []).push({
      to: to.id,
      color: hex(child(child(line, 'solidFill'), 'srgbClr')?.getAttribute('val'), '#8399A8'),
      width: num(line, 'w') / slide.unitX,
    });
  }
  return result;
}

function setBox(xfrm: Element, value: Bounds, slide: Slide) {
  const offset = child(xfrm, 'off')!;
  const extent = child(xfrm, 'ext')!;
  offset.setAttribute('x', String(Math.round(value.x * slide.unitX)));
  offset.setAttribute('y', String(Math.round(value.y * slide.unitY)));
  extent.setAttribute('cx', String(Math.round(value.width * slide.unitX)));
  extent.setAttribute('cy', String(Math.round(value.height * slide.unitY)));
}

function fragment(slide: Slide, markup: string) {
  const root = xml(`<root xmlns:p="${P}" xmlns:a="${A}">${markup}</root>`).documentElement;
  return slide.doc.importNode(root.firstElementChild!, true);
}

const blankTransform = '<a:off x="0" y="0"/><a:ext cx="0" cy="0"/>';

function groupLegacy(slide: Slide, id: number) {
  const group = fragment(slide, `
    <p:grpSp>
      <p:nvGrpSpPr><p:cNvPr id="${id}" name="${LEGACY}"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm>${blankTransform}<a:chOff x="0" y="0"/>
        <a:chExt cx="${960 * slide.unitX}" cy="${540 * slide.unitY}"/></a:xfrm></p:grpSpPr>
    </p:grpSp>`);
  slide.tree.insertBefore(group, slide.legacy[0]);
  slide.legacy.forEach(sp => group.appendChild(sp));
  return group;
}

function writeText(slide: Slide, sp: Element, obj: SlideObject) {
  const body = fragment(slide, '<p:txBody><a:bodyPr lIns="0" tIns="0" rIns="0" bIns="0" anchor="ctr" wrap="square"><a:noAutofit/></a:bodyPr><a:lstStyle/></p:txBody>');
  const size = Math.round((obj.fontSize ?? 24) * 75);
  const fill = hex(obj.color, DEFAULT_COLOR).slice(1);
  const alignment = obj.align === 'center' ? 'ctr' : obj.align === 'right' ? 'r' : 'l';
  for (const value of (obj.text ?? '').split(/\r\n?|\n/)) {
    const p = fragment(slide, `
      <a:p>
        <a:pPr algn="${alignment}"/>
        <a:r><a:rPr lang="zh-CN" sz="${size}" b="${obj.bold ? 1 : 0}">
          <a:solidFill><a:srgbClr val="${fill}"/></a:solidFill>
          <a:latin typeface="Arial"/><a:ea typeface="Microsoft YaHei"/>
        </a:rPr><a:t/></a:r>
        <a:endParaRPr lang="zh-CN" sz="${size}"/>
      </a:p>`);
    desc(p, A, 't')[0].textContent = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '');
    body.append(p);
  }
  child(sp, 'txBody')?.remove();
  sp.appendChild(body);
}

function textShape(slide: Slide, obj: SlideObject, id: number) {
  const sp = fragment(slide, `
    <p:sp>
      <p:nvSpPr><p:cNvPr id="${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>
      <p:spPr><a:xfrm>${blankTransform}</a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        <a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>
    </p:sp>`);
  nativeInfo(sp)!.setAttribute('name', TEXT_PREFIX + obj.id);
  slide.tree.insertBefore(sp, child(slide.tree, 'extLst') ?? null);
  return sp;
}

function port(b: Bounds, index: number) {
  return {
    x: b.x + ([.5, 0, .5, 1][index] ?? .5) * b.width,
    y: b.y + ([0, .5, 1, .5][index] ?? .5) * b.height,
  };
}

function reconnect(slide: Slide, shapes: Element[]) {
  const byId = new Map(shapes.map(s => [nativeInfo(s)?.getAttribute('id'), s]));
  for (const c of shapes.filter(sp => sp.localName === 'cxnSp')) {
    const { start, end } = ends(c);
    if (!start || !end) continue;
    const from = byId.get(start.getAttribute('id'));
    const to = byId.get(end.getAttribute('id'));
    if (!from || !to) { c.remove(); continue; }
    const a = port(modelBox(from, slide), num(start, 'idx'));
    const b = port(modelBox(to, slide), num(end, 'idx'));
    const xf = transform(c)!;
    setBox(xf, { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) }, slide);
    if (a.x > b.x) xf.setAttribute('flipH', '1'); else xf.removeAttribute('flipH');
    if (a.y > b.y) xf.setAttribute('flipV', '1'); else xf.removeAttribute('flipV');
  }
}

export async function exportSlideObjects(presentation: Blob, objects: SlideObject[]): Promise<Blob> {
  const slide = await openSlide(presentation);
  const before = serialize(slide.doc);
  let nextId = Math.max(1, ...desc(slide.tree, P, 'cNvPr').map(el => num(el, 'id'))) + 1;
  const originals = new Map<string, Element>();
  for (const sp of slide.shapes) {
    if (slide.legacy.includes(sp) || sp.localName === 'cxnSp') continue;
    if (sp.localName === 'pic' || sp.localName === 'grpSp' || (sp.localName === 'sp' && child(sp, 'txBody'))) {
      originals.set(objectId(sp), sp);
    }
  }
  if (slide.legacy.length) {
    const old = objects.find(o => o.id === LEGACY);
    if (!old) slide.legacy.forEach(sp => sp.remove());
    else if (old.x !== 0 || old.y !== 0 || old.width !== 960 || old.height !== 540) {
      originals.set(LEGACY, groupLegacy(slide, nextId++));
    }
  }
  for (const obj of objects) {
    if (![obj.x, obj.y, obj.width, obj.height].every(Number.isFinite) || obj.width <= 0 || obj.height <= 0) {
      throw new Error('幻灯片对象尺寸无效');
    }
    const original = originals.get(obj.id);
    const sp = original ?? (obj.kind === 'text' ? textShape(slide, obj, nextId++) : undefined);
    if (!sp) continue;
    setBox(transform(sp)!, obj, slide);
    if (obj.kind === 'text') {
      const old = original && textStyle(original);
      const changed = !old || old.text !== obj.text || old.fontSize !== (obj.fontSize ?? 24)
        || old.color !== hex(obj.color, DEFAULT_COLOR) || old.bold !== !!obj.bold || old.align !== (obj.align ?? 'left');
      if (changed) writeText(slide, sp, obj);
    }
    originals.delete(obj.id);
  }
  originals.forEach(sp => sp.remove());
  reconnect(slide, Array.from(slide.tree.children).filter(drawing));
  const updated = serialize(slide.doc);
  if (before === updated) return presentation;
  slide.zip.file(SLIDE, updated);
  // A thumbnail created before edits would show deleted shapes or old text in Office's file picker.
  const rels = await xmlPart(slide.zip, '_rels/.rels');
  for (const rel of Array.from(rels.documentElement.children)) {
    if (!rel.getAttribute('Type')?.endsWith('/thumbnail')) continue;
    slide.zip.remove(rel.getAttribute('Target')!.replace(/^\//, ''));
    rel.remove();
  }
  slide.zip.file('_rels/.rels', serialize(rels));
  return slide.zip.generateAsync({ type: 'blob', mimeType: MIME, compression: 'DEFLATE' });
}
