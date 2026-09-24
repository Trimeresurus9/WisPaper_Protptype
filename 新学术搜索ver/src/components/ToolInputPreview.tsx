import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  FileSpreadsheet,
  Image as ImageIcon,
  Maximize2,
  MousePointer2,
  Shapes,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

type PreviewKind = 'figure' | 'chart' | 'data';

const zoomLevels = [100, 200, 400];

function RasterArtwork({ kind }: { kind: Exclude<PreviewKind, 'data'> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#dce5ec';
    context.lineWidth = 1;
    context.strokeRect(8.5, 8.5, 158, 86);

    if (kind === 'figure') {
      const nodes = [
        { x: 20, y: 24, w: 34, h: 22, color: '#e2edf7' },
        { x: 70, y: 17, w: 38, h: 28, color: '#d6e8f6' },
        { x: 122, y: 25, w: 30, h: 22, color: '#dcefe8' },
        { x: 71, y: 65, w: 38, h: 20, color: '#edf1f4' },
      ];
      context.strokeStyle = '#8fb3cf';
      context.lineWidth = 2;
      context.beginPath();
      context.moveTo(54, 35);
      context.lineTo(70, 31);
      context.moveTo(108, 31);
      context.lineTo(122, 36);
      context.moveTo(89, 45);
      context.lineTo(90, 65);
      context.stroke();
      nodes.forEach((node) => {
        context.fillStyle = node.color;
        context.fillRect(node.x, node.y, node.w, node.h);
        context.strokeStyle = '#9fb8ca';
        context.strokeRect(node.x + 0.5, node.y + 0.5, node.w - 1, node.h - 1);
        context.fillStyle = '#7895aa';
        context.fillRect(node.x + 8, node.y + 7, node.w - 16, 3);
        context.fillRect(node.x + 8, node.y + 13, Math.max(8, node.w - 22), 2);
      });
    } else {
      context.strokeStyle = '#dce5ec';
      context.lineWidth = 1;
      [31, 51, 71].forEach((y) => {
        context.beginPath();
        context.moveTo(25, y);
        context.lineTo(153, y);
        context.stroke();
      });
      context.strokeStyle = '#7da7c6';
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(28, 72);
      context.lineTo(57, 62);
      context.lineTo(87, 66);
      context.lineTo(119, 42);
      context.lineTo(151, 29);
      context.stroke();
      context.fillStyle = '#72ad91';
      [34, 46, 31, 57].forEach((height, index) => {
        context.fillRect(34 + index * 28, 82 - height, 12, height);
      });
    }
  }, [kind]);

  return (
    <canvas
      ref={canvasRef}
      width={176}
      height={104}
      className="h-full w-full"
      style={{ imageRendering: 'pixelated' }}
      aria-label="位图示例"
    />
  );
}

function VectorArtwork({ kind }: { kind: Exclude<PreviewKind, 'data'> }) {
  if (kind === 'chart') {
    return (
      <div className="relative h-full w-full overflow-hidden bg-white" aria-label="矢量图表示例">
        <div className="absolute inset-x-[10%] bottom-[14%] top-[10%] border-b border-l border-[#a9bac7]">
          {[20, 45, 70].map((top) => <span key={top} className="absolute left-0 right-0 h-px bg-[#e6edf2]" style={{ top: `${top}%` }} />)}
          {[44, 61, 38, 75].map((height, index) => (
            <span key={height} className="absolute bottom-0 w-[8%] rounded-t-[3px] bg-[#79ad92]" style={{ height: `${height}%`, left: `${10 + index * 19}%` }} />
          ))}
          {[
            { left: 9, top: 70, rotate: -19, width: 23 },
            { left: 31, top: 57, rotate: 7, width: 22 },
            { left: 52, top: 51, rotate: -27, width: 27 },
            { left: 76, top: 30, rotate: -18, width: 17 },
          ].map((line, index) => (
            <span key={index} className="absolute h-[3px] origin-left rounded-full bg-[#5d91b8]" style={{ left: `${line.left}%`, top: `${line.top}%`, width: `${line.width}%`, transform: `rotate(${line.rotate}deg)` }} />
          ))}
          {[[9, 70], [31, 57], [52, 51], [76, 30], [92, 21]].map(([left, top]) => (
            <span key={`${left}-${top}`} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#5d91b8] shadow-sm" style={{ left: `${left}%`, top: `${top}%` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-white" aria-label="矢量结构图示例">
      <div className="absolute left-[11%] top-[33%] h-[2px] w-[24%] bg-[#8fb3cf]" />
      <div className="absolute left-[37%] top-[33%] h-[2px] w-[25%] bg-[#8fb3cf]" />
      <div className="absolute left-[49%] top-[42%] h-[25%] w-[2px] bg-[#8fb3cf]" />
      {[
        { left: '7%', top: '22%', width: '25%', tone: 'bg-[#e2edf7]', icon: <ImageIcon className="h-8 w-8 text-[#658aa6]" /> },
        { left: '38%', top: '16%', width: '24%', tone: 'bg-[#d6e8f6]', icon: <Shapes className="h-8 w-8 text-[#527d9e]" /> },
        { left: '68%', top: '22%', width: '24%', tone: 'bg-[#dcefe8]', icon: <Check className="h-8 w-8 text-[#50896f]" /> },
        { left: '38%', top: '68%', width: '24%', tone: 'bg-[#edf1f4]', icon: <MousePointer2 className="h-7 w-7 text-[#718391]" /> },
      ].map((node, index) => (
        <div key={index} className={`absolute grid aspect-[1.65] place-items-center rounded-xl border border-[#b9cad7] shadow-[0_6px_14px_rgba(61,92,126,0.08)] ${node.tone}`} style={{ left: node.left, top: node.top, width: node.width }}>
          {node.icon}
        </div>
      ))}
    </div>
  );
}

function DataArtwork() {
  const rows = [
    ['Group', 'Day 0', 'Day 7', 'Day 14'],
    ['Control', '28', '39', '57'],
    ['Method A', '31', '44', '62'],
    ['Method B', '36', '57', '78'],
  ];

  return (
    <div className="flex h-full w-full items-center bg-white p-[7%]" aria-label="表格数据预览">
      <div className="grid w-full grid-cols-4 overflow-hidden rounded-lg border-l border-t border-[#d8e5de] shadow-sm">
        {rows.flatMap((row, rowIndex) => row.map((cell, columnIndex) => (
          <div key={`${rowIndex}-${columnIndex}`} className={`truncate border-b border-r border-[#d8e5de] px-3 py-3 text-[11px] ${rowIndex === 0 ? 'bg-[#e6f3ec] font-semibold text-[#3c775a]' : columnIndex === 0 ? 'bg-[#fbfcfc] font-medium text-[#53646f]' : 'text-[#71808c]'}`}>
            {cell}
          </div>
        )))}
      </div>
    </div>
  );
}

function InputComparisonArtwork({ kind }: { kind: Exclude<PreviewKind, 'data'> }) {
  return (
    <div className="grid h-full w-full grid-cols-2 divide-x-2 divide-[#cfd9e1] bg-white" aria-label="矢量图与位图对比示例">
      <div className="relative min-w-0 overflow-hidden">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#e7f6ee] px-2.5 py-1 text-[9px] font-semibold text-[#27815a] shadow-sm">矢量图</span>
        <VectorArtwork kind={kind} />
      </div>
      <div className="relative min-w-0 overflow-hidden">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#fff2e3] px-2.5 py-1 text-[9px] font-semibold text-[#a5651d] shadow-sm">位图</span>
        <RasterArtwork kind={kind} />
      </div>
    </div>
  );
}

function OutputArtwork({ kind }: { kind: PreviewKind }) {
  if (kind === 'chart') return <DataArtwork />;
  if (kind === 'data') return <VectorArtwork kind="chart" />;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f3f6f8] p-[7%]" aria-label="可编辑幻灯片输出示例">
      <div className="relative h-full w-full overflow-hidden rounded-lg border border-[#d8e1e8] bg-white shadow-[0_10px_24px_rgba(61,92,126,0.1)]">
        <div className="absolute inset-x-0 top-0 h-8 border-b border-[#e7ecf0] bg-[#fafbfc]">
          <div className="absolute left-3 top-3 flex gap-1.5">{[0, 1, 2].map((item) => <span key={item} className="h-2 w-2 rounded-full bg-[#dce4ea]" />)}</div>
        </div>
        <div className="absolute bottom-[8%] left-[10%] right-[8%] top-[20%] overflow-hidden rounded-md border border-[#e2e8ed] bg-white">
          <VectorArtwork kind="figure" />
          <div className="pointer-events-none absolute left-[35%] top-[12%] h-[40%] w-[30%] border-2 border-[#4f8fbe]">
            {['-left-1.5 -top-1.5', '-right-1.5 -top-1.5', '-bottom-1.5 -left-1.5', '-bottom-1.5 -right-1.5'].map((position) => <span key={position} className={`absolute h-3 w-3 rounded-sm border-2 border-white bg-[#4f8fbe] ${position}`} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoomSurface({ children, zoom, label }: { children: React.ReactNode; zoom: number; label: string }) {
  return (
    <div className="flex min-h-[300px] overflow-auto rounded-[14px] border border-[#dbe4eb] bg-[#eaf0f5] p-3 shadow-inner">
      <div className="m-auto shrink-0" style={{ width: 440 * (zoom / 100), height: 260 * (zoom / 100) }}>
        <div aria-label={label} className="h-[260px] w-[440px] origin-top-left overflow-hidden rounded-[12px] border border-[#d9e2e9] bg-white shadow-[0_12px_30px_rgba(61,92,126,0.12)]" style={{ transform: `scale(${zoom / 100})` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ToolInputPreview({
  kind,
  demo,
}: {
  kind: PreviewKind;
  demo: React.ReactNode;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = zoomLevels[zoomIndex];
  const isData = kind === 'data';

  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isModalOpen]);

  const description = isData
    ? '放大检查列名与数值，确认输入数据是否完整。'
    : '左侧矢量图放大后仍然清晰；右侧位图会出现像素，转换后整体保留。';

  return (
    <>
      <div className="relative flex h-full min-h-[440px] overflow-hidden rounded-[14px] bg-[#f5f8fc] p-3 lg:min-h-[520px]">
        <div className="flex min-h-0 flex-1 items-center overflow-hidden rounded-[12px] bg-[#eef6fd]">
          {demo}
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/92 px-4 py-2.5 text-xs font-semibold text-[#4d5e6f] shadow-[0_8px_24px_rgba(61,92,126,0.16)] backdrop-blur transition hover:-translate-y-0.5 hover:text-[#0d78ff]"
        >
          <Maximize2 className="h-3.5 w-3.5" />查看输入与输出示例
        </button>
      </div>

      {isModalOpen ? createPortal((
        <div role="dialog" aria-modal="true" aria-labelledby="tool-example-title" className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#17212b]/45 p-4 backdrop-blur-[3px]" onMouseDown={(event) => { if (event.currentTarget === event.target) setIsModalOpen(false); }}>
          <div className="flex max-h-[92vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-[24px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(23,33,43,0.28)]">
            <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ecf0] px-6 py-5">
              <div>
                <h2 id="tool-example-title" className="text-xl font-semibold tracking-[-0.025em] text-[#22262c]">输入与输出示例</h2>
                <p className="mt-1 text-xs text-[#8491a0]">放大查看细节，对比转换前后的结构。</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full border border-[#dce4eb] bg-white p-1">
                  <button type="button" onClick={() => setZoomIndex((value) => Math.max(0, value - 1))} disabled={zoomIndex === 0} className="rounded-full p-1.5 text-[#657689] transition hover:bg-[#f1f5f8] disabled:opacity-30" aria-label="缩小预览"><ZoomOut className="h-3.5 w-3.5" /></button>
                  <span className="min-w-11 text-center text-[10px] font-semibold tabular-nums text-[#526476]">{zoom}%</span>
                  <button type="button" onClick={() => setZoomIndex((value) => Math.min(zoomLevels.length - 1, value + 1))} disabled={zoomIndex === zoomLevels.length - 1} className="rounded-full p-1.5 text-[#657689] transition hover:bg-[#f1f5f8] disabled:opacity-30" aria-label="放大预览"><ZoomIn className="h-3.5 w-3.5" /></button>
                </div>
                <button type="button" onClick={() => setIsModalOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-[#dfe5ea] text-[#718091] transition hover:bg-[#f3f6f8] hover:text-[#22262c]" aria-label="关闭示例弹窗"><X className="h-4 w-4" /></button>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-6 lg:grid-cols-2">
              <section className="min-w-0">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#34424e]">输入示例</h3>
                  <span className="rounded-full bg-[#e7f6ee] px-2.5 py-1 text-[10px] font-semibold text-[#27815a]">{isData ? '数据文件' : '并排对比'}</span>
                </div>
                <ZoomSurface zoom={zoom} label="输入示例预览">
                  {isData ? <DataArtwork /> : <InputComparisonArtwork kind={kind} />}
                </ZoomSurface>
              </section>

              <section className="min-w-0">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#34424e]">输出示例</h3>
                  <span className="rounded-full bg-[#edf4fb] px-2.5 py-1 text-[10px] font-semibold text-[#557596]">{kind === 'figure' ? '元素可编辑' : kind === 'chart' ? '单元格可编辑' : '高清图片'}</span>
                </div>
                <ZoomSurface zoom={zoom} label="输出示例预览">
                  <OutputArtwork kind={kind} />
                </ZoomSurface>
              </section>
            </div>

            <footer className="flex items-start gap-2.5 border-t border-[#e7ecf0] bg-[#f8fafb] px-6 py-4 text-xs leading-5 text-[#718091]">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e7f6ee] text-[#27815a]">
                {isData ? <FileSpreadsheet className="h-3 w-3" /> : <Shapes className="h-3 w-3" />}
              </span>
              <div><b className="font-semibold text-[#34424e]">{isData ? '输入数据' : '矢量图与位图'}</b><span className="mx-1 text-[#c0c9d1]">·</span>{description}</div>
            </footer>
          </div>
        </div>
      ), document.body) : null}
    </>
  );
}
