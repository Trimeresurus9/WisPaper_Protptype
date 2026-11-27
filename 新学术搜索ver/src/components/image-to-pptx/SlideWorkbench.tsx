import React, { useEffect, useId, useRef, useState } from 'react';
import { PencilLine, Redo2, Trash2, Type, Undo2 } from 'lucide-react';
import type { SlideObject } from './slideModel';
import './slide-workbench.css';

interface SlideWorkbenchProps {
  objects: SlideObject[];
  image: File;
  onChange: (objects: SlideObject[]) => void;
}

const slideWidth = 960;
const slideHeight = 540;
const corners = ['nw', 'ne', 'se', 'sw'] as const;
type Corner = typeof corners[number];
type Bounds = Pick<SlideObject, 'x' | 'y' | 'width' | 'height'>;
type TextEdit = { object: SlideObject; text: string; isNew: boolean };
type Gesture = { pointer: number; origin: SlideObject; corner?: Corner; clientX: number; clientY: number; scale: number };

function positionStyle({ x, y, width, height }: Bounds): React.CSSProperties {
  return { left: x / slideWidth * 100 + '%', top: y / slideHeight * 100 + '%',
    width: width / slideWidth * 100 + '%', height: height / slideHeight * 100 + '%' };
}

function textStyle(object: SlideObject): React.CSSProperties {
  return { color: object.color || '#263F52', textAlign: object.align || 'left',
    fontWeight: object.bold ? 700 : 400, fontSize: (object.fontSize || 24) / (slideWidth / 100) + 'cqw' };
}

function replaceObject(objects: SlideObject[], changed: SlideObject) {
  return objects.map(object => object.id === changed.id ? changed : object);
}

function objectName(object: SlideObject, index: number) {
  if (object.kind === 'text') return '文本框 ' + (object.text?.slice(0, 22) || index + 1);
  return (object.kind === 'image' ? '图片 ' : '图形组 ') + (index + 1);
}

function moved(object: SlideObject, dx: number, dy: number): SlideObject {
  // Keep a small grab area on the slide, even for an image that initially fills it.
  const margin = Math.min(20, object.width, object.height);
  return { ...object, x: Math.round(Math.max(margin - object.width, Math.min(slideWidth - margin, object.x + dx))),
    y: Math.round(Math.max(margin - object.height, Math.min(slideHeight - margin, object.y + dy))) };
}

function resized(object: SlideObject, corner: Corner, dx: number, dy: number): SlideObject {
  const west = corner.endsWith('w');
  const north = corner.startsWith('n');
  let width = Math.max(20, object.width + (west ? -dx : dx));
  let height = Math.max(16, object.height + (north ? -dy : dy));
  if (object.kind !== 'text') {
    const scale = Math.max(0.05, Math.abs(dx / object.width) > Math.abs(dy / object.height)
      ? width / object.width : height / object.height);
    width = object.width * scale;
    height = object.height * scale;
  }
  return { ...object, width, height, x: west ? object.x + object.width - width : object.x,
    y: north ? object.y + object.height - height : object.y };
}

function SlideArtwork({ objects, imageUrl, editingId }: { objects: SlideObject[]; imageUrl: string; editingId?: string }) {
  const marker = useId().replace(/:/g, '');
  return (
    <>
      <svg className="pptx-wb-connectors" viewBox="0 0 960 540" aria-hidden="true">
        {objects.flatMap(from => (from.connections || []).flatMap((connection, i) => {
          const to = objects.find(item => item.id === connection.to);
          if (!to) return [];
          const markerId = marker + '-' + from.id + '-' + i;
          return <g key={markerId}>
            <defs><marker id={markerId} viewBox="0 0 18 18" markerWidth={18} markerHeight={18} refX={18} refY={9} markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0 0L18 9L0 18Z" fill={connection.color} />
            </marker></defs>
            <line x1={from.x + from.width} y1={from.y + from.height / 2} x2={to.x} y2={to.y + to.height / 2}
              stroke={connection.color} strokeWidth={connection.width} markerEnd={'url(#' + markerId + ')'} />
          </g>;
        }))}
      </svg>
      {objects.map(object => <div key={object.id} className="pptx-wb-art" style={positionStyle(object)}>
        {object.kind === 'text'
          ? <div className="pptx-wb-type" style={{ ...textStyle(object), visibility: editingId === object.id ? 'hidden' : undefined }}>{object.text}</div>
          : (object.preview || imageUrl) && <img alt="" draggable={false} src={object.preview || imageUrl} />}
      </div>)}
    </>
  );
}

export function SlideWorkbench({ objects, image, onChange }: SlideWorkbenchProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [edit, setEdit] = useState<TextEdit | null>(null);
  const editRef = useRef<TextEdit | null>(null);
  const [dragged, setDragged] = useState<SlideObject | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const history = useRef<{ past: SlideObject[][]; future: SlideObject[][] }>({ past: [], future: [] });
  const current = useRef(objects);
  current.current = objects;
  const hint = useId();

  useEffect(() => {
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  useEffect(() => {
    if (edit?.object.id) {
      textarea.current?.focus({ preventScroll: true });
      textarea.current?.select();
    }
  }, [edit?.object.id]);

  function commit(next: SlideObject[]) {
    history.current.past = [...history.current.past.slice(-59), current.current];
    history.current.future = [];
    current.current = next;
    onChange(next);
  }

  function setTextEdit(value: TextEdit | null) {
    editRef.current = value;
    setEdit(value);
  }

  function finishText(cancel = false) {
    const session = editRef.current;
    if (!session) return;
    setTextEdit(null);
    if (cancel) {
      if (session.isNew) setSelected(null);
      return;
    }
    const changed = { ...session.object, text: session.text };
    if (session.isNew) {
      if (changed.text.trim()) commit([...current.current, changed]);
      else setSelected(null);
    } else if (session.text !== session.object.text) {
      commit(replaceObject(current.current, changed));
    }
  }

  function editText(object: SlideObject, isNew = false) {
    finishText();
    setSelected(object.id);
    setTextEdit({ object, text: object.text ?? '', isNew });
  }

  function addText() {
    editText({ id: crypto.randomUUID(), kind: 'text', x: 300, y: 65,
      width: 360, height: 64, fontSize: 32, text: '输入文字' }, true);
  }

  function undo(forward = false) {
    finishText();
    const source = forward ? history.current.future : history.current.past;
    const destination = forward ? history.current.past : history.current.future;
    const next = source.pop();
    if (!next) return;
    destination.push(current.current);
    current.current = next;
    onChange(next);
    setSelected(id => next.some(item => item.id === id) ? id : null);
  }

  function remove() {
    finishText();
    if (!current.current.some(item => item.id === selected)) return;
    commit(current.current.filter(item => item.id !== selected));
    setSelected(null);
    surface.current?.focus({ preventScroll: true });
  }

  const editingObject = edit && { ...edit.object, text: edit.text };
  const visible = editingObject ? (edit.isNew ? [...objects, editingObject] : replaceObject(objects, editingObject))
    : dragged ? replaceObject(objects, dragged) : objects;
  const selection = visible.find(item => item.id === selected);

  function beginGesture(event: React.PointerEvent, object: SlideObject, corner?: Corner) {
    if (event.button !== 0 || !event.isPrimary || gesture.current || !surface.current) return;
    event.stopPropagation();
    finishText();
    setSelected(object.id);
    const target = surface.current;
    const scale = target.getBoundingClientRect().width / slideWidth;
    if (!scale) return;
    // Capture on the pressed element so a stationary double-click still reaches the object.
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { pointer: event.pointerId, origin: object, clientX: event.clientX, clientY: event.clientY, scale, corner };
  }

  function changeGesture(event: React.PointerEvent, finish = false) {
    const start = gesture.current;
    if (!start || event.pointerId !== start.pointer) return;
    const px = event.clientX - start.clientX;
    const py = event.clientY - start.clientY;
    const meaningful = Math.abs(px) + Math.abs(py) >= 2;
    const changed = meaningful ? (start.corner
      ? resized(start.origin, start.corner, px / start.scale, py / start.scale)
      : moved(start.origin, px / start.scale, py / start.scale)) : null;
    if (finish) {
      gesture.current = null;
      setDragged(null);
      if (changed) commit(replaceObject(current.current, changed));
    } else setDragged(changed);
  }

  function keyboard(event: React.KeyboardEvent) {
    if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
    const key = event.key.toLowerCase();
    const shortcut = event.ctrlKey || event.metaKey;
    if (shortcut && (key === 'z' || key === 'y')) {
      event.preventDefault();
      undo(key === 'y' || event.shiftKey);
      return;
    }
    if (key === 'escape') { setSelected(null); surface.current?.focus(); return; }
    if (!selection) return;
    if (key === 'delete' || key === 'backspace') {
      event.preventDefault();
      remove();
    } else if (key === 'enter' && selection.kind === 'text' && surface.current?.contains(event.target as Node)) {
      event.preventDefault();
      editText(selection);
    } else if (key.startsWith('arrow') && surface.current?.contains(event.target as Node)) {
      event.preventDefault();
      const step = event.shiftKey ? 10 : 1;
      const dx = key === 'arrowleft' ? -step : key === 'arrowright' ? step : 0;
      const dy = key === 'arrowup' ? -step : key === 'arrowdown' ? step : 0;
      const changed = event.altKey ? resized(selection, 'se', dx, dy) : moved(selection, dx, dy);
      commit(replaceObject(current.current, changed));
    }
  }

  return (
    <section className="pptx-wb" aria-label="幻灯片编辑器" onKeyDown={keyboard}>
      <span id={hint} className="sr-only">使用方向键移动对象，按住 Shift 加快移动，按住 Alt 调整大小。在文本框上按回车编辑文字。</span>
      <div className="pptx-wb-tools" role="group" aria-label="编辑工具">
        <button type="button" className="pptx-wb-add" onClick={addText} aria-label="添加文本框"><Type size={16} />文本框</button>
        {selection?.kind === 'text' && <>
          <button type="button" title="编辑文字" aria-label="编辑文字" onClick={() => editText(selection)}><PencilLine size={15} /></button>
          <select aria-label="字号" title="字号" value={selection.fontSize || 24} onChange={event =>
            commit(replaceObject(current.current, { ...selection, fontSize: Number(event.target.value) }))}>
            {[...new Set([16, 20, 24, 28, 32, 36, 40, 48, 64, selection.fontSize || 24])].sort((a, b) => a - b)
              .map(size => <option key={size} value={size}>{size}</option>)}
          </select>
        </>}
        <span className="pptx-wb-divider" />
        <button type="button" title="撤销" aria-label="撤销" disabled={!history.current.past.length} onClick={() => undo()}><Undo2 size={16} /></button>
        <button type="button" title="重做" aria-label="重做" disabled={!history.current.future.length} onClick={() => undo(true)}><Redo2 size={16} /></button>
        <button type="button" className="pptx-wb-remove" title="删除所选对象" aria-label="删除所选对象" disabled={!selection} onClick={remove}><Trash2 size={15} /></button>
      </div>

      <div className="pptx-wb-workspace">
        <aside className="pptx-wb-rail" aria-label="幻灯片列表">
          <div className="pptx-wb-thumbnail" aria-label="第 1 张幻灯片预览">
            <div className="pptx-wb-page" aria-hidden="true"><SlideArtwork objects={visible} imageUrl={imageUrl} /></div>
          </div>
          <span>1</span>
        </aside>
        <div className="pptx-wb-stage" onPointerDown={event => {
          if (event.target === event.currentTarget) { finishText(); setSelected(null); }
        }}>
          <div className="pptx-wb-page pptx-wb-surface" ref={surface} tabIndex={0} role="group" aria-label="第 1 张幻灯片画布" aria-describedby={hint}
            onPointerDown={event => { if (event.target === event.currentTarget) { finishText(); setSelected(null); } }}
            onPointerMove={event => changeGesture(event)} onPointerUp={event => changeGesture(event, true)}
            onPointerCancel={() => { gesture.current = null; setDragged(null); }}>
            <SlideArtwork objects={visible} imageUrl={imageUrl} editingId={edit?.object.id} />
            {visible.map((object, i) => <button key={object.id} type="button" className="pptx-wb-hit" style={positionStyle(object)}
              aria-label={objectName(object, i)} aria-pressed={selected === object.id}
              onPointerDown={event => beginGesture(event, object)} onFocus={() => setSelected(object.id)}
              onClick={() => setSelected(object.id)} onDoubleClick={() => { if (object.kind === 'text') editText(object); }} />)}
            {selection && <div className="pptx-wb-selection" style={positionStyle(selection)}>
              {!edit && corners.map(corner => <span key={corner} aria-hidden="true" className={'pptx-wb-handle pptx-wb-' + corner}
                onPointerDown={event => beginGesture(event, selection, corner)} />)}
            </div>}
            {editingObject && <div className="pptx-wb-edit" style={{ ...positionStyle(editingObject), ...textStyle(editingObject) }}>
              <textarea ref={textarea} aria-label="幻灯片文字" value={edit!.text} rows={1} spellCheck={false}
                onChange={event => setTextEdit({ ...edit!, text: event.target.value })} onBlur={() => finishText()}
                onKeyDown={event => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === 'Escape') { event.preventDefault(); finishText(true); surface.current?.focus(); }
                  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) { event.preventDefault(); textarea.current?.blur(); surface.current?.focus(); }
                }} />
            </div>}
          </div>
        </div>
      </div>
    </section>
  );
}
