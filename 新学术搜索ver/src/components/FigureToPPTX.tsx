import React, { useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Check,
  Crop,
  FileSpreadsheet,
  FileText,
  History,
  LoaderCircle,
  Presentation,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { FigureExplodeDemo } from './figure-to-pptx/FigureExplodeDemo';
import { FigureToExcelDemo } from './figure-to-pptx/FigureToExcelDemo';

type WorkflowStep = 'input' | 'select' | 'generating' | 'result';
type JobStatus = 'success' | 'processing' | 'failed';

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HistoryJob {
  id: string;
  fileName: string;
  page: number;
  createdAt: string;
  status: JobStatus;
  figure: 'pipeline' | 'chart' | 'network';
}

const initialHistory: HistoryJob[] = [
  {
    id: 'history-1',
    fileName: 'Multimodal_reasoning_survey.pdf',
    page: 6,
    createdAt: '今天 10:24',
    status: 'success',
    figure: 'pipeline',
  },
  {
    id: 'history-2',
    fileName: 'Cell_state_transition.pdf',
    page: 12,
    createdAt: '昨天 18:40',
    status: 'success',
    figure: 'network',
  },
  {
    id: 'history-3',
    fileName: 'Retrieval_benchmark.pdf',
    page: 4,
    createdAt: '8 月 15 日',
    status: 'failed',
    figure: 'chart',
  },
];

const statusText: Record<JobStatus, string> = {
  success: '已完成',
  processing: '生成中',
  failed: '生成失败',
};

function PipelineFigure({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white ${compact ? 'h-full p-2' : 'h-[220px] p-5'}`}>
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(#e2e8f0_1px,transparent_1px),linear-gradient(90deg,#e2e8f0_1px,transparent_1px)] [background-size:18px_18px]" />
      <div className="relative flex h-full items-center justify-between gap-2">
        {[
          { title: compact ? 'PDF' : 'Research PDF', subtitle: 'Input', color: 'bg-blue-600 text-white' },
          { title: compact ? 'OCR' : 'Vision OCR', subtitle: 'Parse', color: 'bg-slate-950 text-white' },
          { title: compact ? 'Graph' : 'Structure graph', subtitle: 'Rebuild', color: 'bg-cyan-100 text-cyan-950' },
          { title: compact ? 'PPTX' : 'Editable PPTX', subtitle: 'Output', color: 'bg-blue-50 text-blue-800' },
        ].map((item, index) => (
          <React.Fragment key={item.title}>
            <div className={`relative z-10 flex shrink-0 flex-col items-center justify-center rounded-lg border border-slate-200 text-center shadow-sm ${item.color} ${compact ? 'h-10 w-10 text-[7px]' : 'h-24 w-[21%]'}`}>
              <span className={compact ? 'font-semibold' : 'text-sm font-semibold'}>{item.title}</span>
              {!compact && <span className="mt-1 text-[10px] opacity-70">{item.subtitle}</span>}
            </div>
            {index < 3 && <ArrowRight className={`relative z-10 shrink-0 text-blue-500 ${compact ? 'h-3 w-3' : 'h-5 w-5'}`} />}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TableFigure({ compact = false }: { compact?: boolean }) {
  const rows = [
    ['Model', 'Accuracy', 'F1', 'Latency'],
    ['Base', '78.4', '76.9', '42 ms'],
    ['Ours-S', '84.7', '83.6', '31 ms'],
    ['Ours-L', '89.2', '88.5', '38 ms'],
  ];

  return (
    <div className={`overflow-hidden rounded-xl border border-emerald-100 bg-white ${compact ? 'h-full p-1.5' : 'h-[220px] p-5'}`}>
      <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 text-emerald-700">
        <FileSpreadsheet className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
        {!compact ? <span className="text-[10px] font-semibold">Table 2 · Editable worksheet</span> : null}
      </div>
      <div className={`mt-2 grid grid-cols-4 overflow-hidden border-l border-t border-slate-200 ${compact ? 'text-[5px]' : 'text-[10px]'}`}>
        {rows.flatMap((row, rowIndex) => row.map((cell, columnIndex) => (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className={`truncate border-b border-r border-slate-200 px-2 ${compact ? 'py-0.5' : 'py-3'} ${rowIndex === 0 ? 'bg-emerald-50 font-semibold text-emerald-800' : columnIndex === 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}
          >
            {cell}
          </div>
        )))}
      </div>
    </div>
  );
}

function MiniFigure({ type }: { type: HistoryJob['figure'] }) {
  if (type === 'pipeline') return <PipelineFigure compact />;

  if (type === 'chart') {
    return (
      <div className="flex h-full items-end gap-1 rounded-lg border border-slate-200 bg-white p-2">
        {[42, 68, 54, 86, 72].map((height, index) => (
          <span key={index} className="flex-1 rounded-t-sm bg-blue-500" style={{ height: `${height}%`, opacity: 0.55 + index * 0.08 }} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-full rounded-lg border border-slate-200 bg-white">
      {[
        ['18%', '30%'],
        ['62%', '20%'],
        ['45%', '68%'],
        ['78%', '70%'],
      ].map(([left, top], index) => (
        <span key={index} className="absolute h-4 w-4 rounded-full border-2 border-white bg-blue-500 shadow" style={{ left, top }} />
      ))}
      <span className="absolute left-[24%] top-[37%] h-px w-[40%] rotate-[-12deg] bg-blue-300" />
      <span className="absolute left-[48%] top-[50%] h-px w-[31%] rotate-[48deg] bg-blue-300" />
    </div>
  );
}

export function FigureToPPTX({ fromReader = false, onBackToReader, onBackToTools, output = 'pptx' }: { fromReader?: boolean; onBackToReader?: () => void; onBackToTools?: () => void; output?: 'pptx' | 'excel' }) {
  const isExcel = output === 'excel';
  const [step, setStep] = useState<WorkflowStep>(fromReader ? 'select' : 'input');
  const [fileName, setFileName] = useState(fromReader ? 'Current_reader_paper.pdf' : 'Multimodal_reasoning_survey.pdf');
  const [page, setPage] = useState(fromReader ? 8 : 6);
  const [zoom, setZoom] = useState(100);
  const [selection, setSelection] = useState<SelectionRect>({ x: 15, y: 27, width: 70, height: 45 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [generationLabel, setGenerationLabel] = useState('排队中');
  const [history, setHistory] = useState(initialHistory);
  const [showHistory, setShowHistory] = useState(true);
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step !== 'generating') return;

    const stages = [
      { delay: 260, progress: 18, label: '正在解析选区' },
      { delay: 900, progress: 46, label: isExcel ? '正在识别表头与单元格' : '正在识别文字与形状' },
      { delay: 1650, progress: 74, label: isExcel ? '正在校准行列与数据类型' : '正在重建图形结构' },
      { delay: 2400, progress: 94, label: isExcel ? '正在生成可编辑 Excel' : '正在组装可编辑 PPTX' },
      { delay: 3100, progress: 100, label: '生成完成' },
    ];
    const timers = stages.map((stage) => window.setTimeout(() => {
      setProgress(stage.progress);
      setGenerationLabel(stage.label);
      if (stage.progress === 100) {
        window.setTimeout(() => {
          setStep('result');
          setHistory((current) => [
            {
              id: `history-${Date.now()}`,
              fileName,
              page,
              createdAt: '刚刚',
              status: 'success',
              figure: 'pipeline',
            },
            ...current.filter((job) => job.createdAt !== '刚刚'),
          ]);
        }, 360);
      }
    }, stage.delay));

    return () => timers.forEach(window.clearTimeout);
  }, [step, fileName, page, isExcel]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const uploadFile = (file?: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setToast('请选择 PDF 文件');
      return;
    }
    setFileName(file.name);
    setPage(1);
    setStep('select');
  };

  const pointerPosition = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)),
    };
  };

  const beginSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (step !== 'select') return;
    const start = pointerPosition(event);
    setSelectionStart(start);
    setSelection({ x: start.x, y: start.y, width: 0, height: 0 });
    setIsSelecting(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const updateSelection = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isSelecting) return;
    const point = pointerPosition(event);
    setSelection({
      x: Math.min(point.x, selectionStart.x),
      y: Math.min(point.y, selectionStart.y),
      width: Math.abs(point.x - selectionStart.x),
      height: Math.abs(point.y - selectionStart.y),
    });
  };

  const finishSelection = () => setIsSelecting(false);
  const hasValidSelection = selection.width >= 12 && selection.height >= 10;

  const startGeneration = () => {
    if (!hasValidSelection) {
      setToast(isExcel ? '请先框选一个有效的表格区域' : '请先框选一个有效的插图区域');
      return;
    }
    setProgress(4);
    setGenerationLabel('排队中');
    setStep('generating');
  };

  const downloadPrototype = () => {
    setToast(`原型演示：${isExcel ? 'Excel' : 'PPTX'} 下载已触发`);
  };

  const resetWorkspace = () => {
    setStep('select');
    setProgress(0);
    setGenerationLabel('排队中');
  };

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden bg-[#f7f9fc] text-[#22262c]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_72%_12%,rgba(194,224,251,0.7),transparent_46%),radial-gradient(circle_at_28%_4%,rgba(232,243,253,0.92),transparent_38%)]" />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/80 bg-white/82 px-6 backdrop-blur-xl lg:px-10">
        <div className="flex items-center gap-3 text-sm">
          <button type="button" onClick={onBackToTools} className="text-[#8a949f] transition hover:text-[#22262c]">工具中心</button>
          <span className="text-[#c8d0d8]">/</span>
          <span className="font-semibold tracking-[-0.01em] text-[#22262c]">{isExcel ? '论文表格转 Excel' : '论文插图转 PPT'}</span>
          <span className="rounded-md bg-[#edf4fb] px-2 py-1 text-[10px] font-medium text-[#557596]">Beta</span>
        </div>
        <div className="flex items-center gap-2">
          {fromReader && onBackToReader ? (
            <button onClick={onBackToReader} className="inline-flex items-center gap-2 rounded-full border border-[#dfe6ed] bg-white/80 px-3.5 py-2 text-xs font-medium text-[#596571] transition hover:bg-white">
              <ArrowLeft className="h-3.5 w-3.5" /> 返回阅读器
            </button>
          ) : null}
          <button onClick={() => setShowHistory((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-[#dfe6ed] bg-white/80 px-3.5 py-2 text-xs font-medium text-[#596571] transition hover:bg-white">
            <History className="h-3.5 w-3.5" /> {showHistory ? '收起历史' : '历史记录'}
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1280px] px-6 pb-16 pt-10 lg:px-10 lg:pt-12">
        <section className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-[40px] font-semibold tracking-[-0.05em] text-[#22262c] sm:text-[48px]">{isExcel ? '论文表格转 Excel' : '论文插图转 PPT'}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-full border border-white/90 bg-white/65 p-1.5 shadow-[0_8px_28px_rgba(61,92,126,0.06)] backdrop-blur-sm">
            {[
              ['1', '选择 PDF'],
              ['2', isExcel ? '框选表格' : '框选插图'],
              ['3', isExcel ? '生成 Excel' : '生成 PPTX'],
            ].map(([number, label], index) => {
              const activeIndex = step === 'input' ? 0 : step === 'select' ? 1 : 2;
              return (
                <div key={number} className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs transition-colors ${index === activeIndex ? 'bg-[#22262c] text-white shadow-[0_6px_16px_rgba(34,38,44,0.14)]' : index < activeIndex ? 'text-[#5c7893]' : 'text-[#a0a9b2]'}`}>
                  <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${index === activeIndex ? 'bg-white/12' : index < activeIndex ? 'bg-[#e5f0fa]' : 'bg-[#f1f4f7]'}`}>{index < activeIndex ? <Check className="h-3 w-3" /> : number}</span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="grid gap-5">
          <section className="min-w-0 overflow-hidden rounded-[30px] border border-white/90 bg-white/90 shadow-[0_22px_70px_rgba(61,92,126,0.10)] backdrop-blur-sm">
            {step === 'input' ? (
              <div className="grid min-h-[540px] gap-10 p-8 sm:p-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center lg:p-12 xl:gap-14 xl:p-14">
                <div className="max-w-[420px]">
                  <p className="text-[11px] font-medium tracking-[0.12em] text-[#6685a2]">开始转换</p>
                  <h2 className="mt-4 text-[34px] font-semibold leading-[1.14] tracking-[-0.045em] text-[#22262c] sm:text-[40px]">{isExcel ? '把论文表格，变成结构清晰的可编辑 Excel' : '把论文插图，变成真正可编辑的 PPTX'}</h2>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-[#22262c] px-5 py-3 text-sm font-medium text-white shadow-[0_8px_20px_rgba(34,38,44,0.14)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#111418] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7fa7cc] focus-visible:ring-offset-2">
                      <Upload className="h-4 w-4" /> 上传 PDF
                    </button>
                    <button onClick={() => setStep('select')} className="inline-flex items-center gap-2 rounded-full border border-[#dbe3ea] bg-white/80 px-5 py-3 text-sm font-medium text-[#45515d] transition duration-300 hover:-translate-y-0.5 hover:border-[#c2d0dc] hover:bg-white">
                      <FileText className="h-4 w-4" /> 体验示例
                    </button>
                    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => uploadFile(event.target.files?.[0])} />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[24px] border border-white bg-[#eef6fd] p-3 shadow-[0_22px_56px_rgba(61,92,126,0.11)]">
                  <Player
                    component={isExcel ? FigureToExcelDemo : FigureExplodeDemo}
                    durationInFrames={180}
                    compositionWidth={900}
                    compositionHeight={420}
                    fps={30}
                    autoPlay
                    loop
                    controls={false}
                    clickToPlay
                    acknowledgeRemotionLicense
                    style={{ width: '100%', aspectRatio: '900 / 420', borderRadius: 14, overflow: 'hidden' }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#e8edf2] bg-white/85 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f3f5f7] text-[#65717c]"><FileText className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">{fileName}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">PDF · 第 {page} 页</p>
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-[#e0e6ec] px-2.5 py-1.5 text-[10px] font-medium text-[#65717c] transition hover:bg-[#f7f9fb]">更换文件</button>
                    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(event) => uploadFile(event.target.files?.[0])} />
                  </div>
                  <div className="flex items-center gap-1 rounded-xl border border-[#e0e6ec] bg-[#f5f7f9] p-1">
                    <button onClick={() => setZoom((value) => Math.max(70, value - 10))} className="rounded-md p-1.5 text-slate-500 hover:bg-white"><ZoomOut className="h-3.5 w-3.5" /></button>
                    <span className="min-w-10 text-center text-[10px] font-medium text-slate-600">{zoom}%</span>
                    <button onClick={() => setZoom((value) => Math.min(140, value + 10))} className="rounded-md p-1.5 text-slate-500 hover:bg-white"><ZoomIn className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                <div className="grid min-h-[650px] lg:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="relative flex min-h-[600px] items-center justify-center overflow-auto bg-[#edf3f8] p-8 lg:p-10">
                    <div
                      ref={canvasRef}
                      className={`relative aspect-[0.72] w-full max-w-[560px] select-none overflow-hidden rounded-[3px] bg-white shadow-[0_18px_50px_rgba(45,66,88,0.16)] ${step === 'select' ? 'cursor-crosshair' : ''}`}
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
                      onPointerDown={beginSelection}
                      onPointerMove={updateSelection}
                      onPointerUp={finishSelection}
                    >
                      <div className="pointer-events-none p-[8%] text-slate-800">
                        <p className="text-[10px] font-semibold">{isExcel ? '4. Benchmark results' : '4. Multimodal reasoning pipeline'}</p>
                        <div className="mt-2 h-1.5 w-4/5 rounded bg-slate-200" />
                        <div className="mt-1 h-1.5 w-3/5 rounded bg-slate-100" />
                        <div className="mt-8">{isExcel ? <TableFigure /> : <PipelineFigure />}</div>
                        <p className="mt-4 text-[8px] leading-4 text-slate-500">{isExcel ? 'Table 2. Comparison of accuracy, F1 score, and inference latency across model variants.' : 'Figure 3. The proposed pipeline converts visual observations into a structured reasoning graph before synthesizing the final response.'}</p>
                        <div className="mt-5 space-y-1.5">{[92, 98, 86, 95, 70].map((width) => <div key={width} className="h-1.5 rounded bg-slate-100" style={{ width: `${width}%` }} />)}</div>
                      </div>
                      {step !== 'result' && (
                        <div
                          className={`pointer-events-none absolute border-2 ${step === 'generating' ? 'animate-pulse border-blue-400 bg-blue-500/10' : 'border-blue-600 bg-blue-500/5'}`}
                          style={{ left: `${selection.x}%`, top: `${selection.y}%`, width: `${selection.width}%`, height: `${selection.height}%` }}
                        >
                          {step === 'select' && hasValidSelection ? <span className="absolute -top-7 left-0 rounded-md bg-blue-600 px-2 py-1 text-[9px] font-medium text-white">选区 {Math.round(selection.width)} × {Math.round(selection.height)}</span> : null}
                          {step === 'select' && hasValidSelection ? [
                            '-left-1.5 -top-1.5', '-right-1.5 -top-1.5', '-bottom-1.5 -left-1.5', '-bottom-1.5 -right-1.5',
                          ].map((position) => <span key={position} className={`absolute h-3 w-3 rounded-sm border-2 border-white bg-blue-600 ${position}`} />) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  <aside className="border-l border-[#e8edf2] bg-white/92 p-6">
                    {step === 'select' ? (
                      <div className="flex h-full flex-col">
                        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#eaf3fb] text-[#5d7e9d]"><Crop className="h-5 w-5" /></div>
                        <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-[#22262c]">{isExcel ? '框选目标表格' : '框选目标插图'}</h3>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {isExcel ? '在左侧论文页面拖动，完整框住目标表格。' : '在左侧论文页面拖动，完整框住目标插图。'}<br />
                          <span className="text-[10px] text-slate-400">{isExcel ? 'Drag on the page to enclose the entire table.' : 'Drag on the page to enclose the entire figure.'}</span>
                        </p>
                        <div className="mt-4 rounded-[16px] border border-[#e3e9ee] bg-white p-4">
                          <h4 className="text-[11px] font-semibold text-slate-800">框选建议 <span className="font-normal text-slate-400">Selection tips</span></h4>
                          <ol className="mt-3 space-y-2.5">
                            {(isExcel ? [
                              ['从左上角拖动到右下角', 'Drag from top-left to bottom-right'],
                              ['包含完整表头、行列与脚注', 'Include headers, rows, columns, and footnotes'],
                              ['避开正文、页眉页脚等无关内容', 'Exclude body text, headers, and footers'],
                            ] : [
                              ['从左上角拖动到右下角', 'Drag from top-left to bottom-right'],
                              ['包含标题、图例、标注和连接线', 'Include titles, legends, labels, and connectors'],
                              ['避开正文、页眉页脚等无关内容', 'Exclude body text, headers, and footers'],
                            ]).map(([guide, guideEn], index) => (
                              <li key={guide} className="flex items-start gap-2.5 text-[11px] leading-4 text-slate-500">
                                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#eaf3fb] text-[9px] font-semibold text-[#5d7e9d]">{index + 1}</span>
                                <span>{guide}<br /><span className="text-[9px] text-slate-400">{guideEn}</span></span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="mt-5 rounded-[16px] bg-[#f5f8fa] p-4">
                          <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">当前页</span><span className="font-semibold text-slate-900">第 {page} 页</span></div>
                          <div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-slate-500">选区状态</span><span className={`font-semibold ${hasValidSelection ? 'text-emerald-600' : 'text-amber-600'}`}>{hasValidSelection ? '有效' : '请重新框选'}</span></div>
                          <p className={`mt-3 border-t border-[#e5eaee] pt-3 text-[10px] leading-4 ${hasValidSelection ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {hasValidSelection
                              ? <>选区已就绪，确认完整后即可生成。<br /><span className="text-[9px] opacity-75">Selection ready. Check it, then generate.</span></>
                              : <>当前选区过小，请重新框选完整{isExcel ? '表格' : '插图'}。<br /><span className="text-[9px] opacity-75">Selection too small. Please select the full {isExcel ? 'table' : 'figure'}.</span></>}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between rounded-[16px] border border-[#e3e9ee] px-3 py-2">
                          <button onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></button>
                          <span className="text-xs font-medium">第 {page} 页</span>
                          <button onClick={() => setPage((value) => value + 1)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"><ArrowRight className="h-4 w-4" /></button>
                        </div>
                        <div className="mt-auto space-y-2 pt-6">
                          <button onClick={startGeneration} disabled={!hasValidSelection} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#22262c] px-4 py-3 text-sm font-medium text-white shadow-[0_8px_20px_rgba(34,38,44,0.12)] transition hover:bg-[#111418] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
                            <Sparkles className="h-4 w-4" /> 生成可编辑 {isExcel ? 'Excel' : 'PPTX'}
                          </button>
                          <button onClick={() => setSelection({ x: 15, y: 27, width: 70, height: 45 })} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e0e6ec] px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-[#f7f9fb]">
                            <RotateCcw className="h-3.5 w-3.5" /> 恢复示例选区
                          </button>
                        </div>
                      </div>
                    ) : step === 'generating' ? (
                      <div className="flex h-full flex-col">
                        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#22262c] text-white"><LoaderCircle className="h-5 w-5 animate-spin" /></div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-950">正在生成</h3>
                        <div className="mt-6">
                          <div className="flex items-center justify-between text-xs"><span className="font-medium text-slate-700">{generationLabel}</span><span className="tabular-nums text-slate-400">{progress}%</span></div>
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#6f91b1] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                        </div>
                        <div className="mt-6 space-y-3">
                          {(isExcel ? ['解析 PDF 选区', '识别表头与单元格', '校准行列与数据类型', '生成 Excel 文件'] : ['解析 PDF 选区', '识别文字与形状', '重建层级和连接', '生成 PPTX 文件']).map((label, index) => {
                            const threshold = [15, 42, 70, 92][index];
                            const done = progress >= threshold;
                            return <div key={label} className="flex items-center gap-3 text-xs"><span className={`grid h-6 w-6 place-items-center rounded-full ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{done ? <Check className="h-3.5 w-3.5" /> : index + 1}</span><span className={done ? 'text-slate-700' : 'text-slate-400'}>{label}</span></div>;
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-full flex-col">
                        <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edf6f2] text-[#4d7b69]"><Check className="h-5 w-5" /></div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-950">{isExcel ? 'Excel' : 'PPTX'} 已生成</h3>
                        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">{isExcel ? <TableFigure compact={false} /> : <PipelineFigure compact={false} />}</div>
                        <div className="mt-auto space-y-2 pt-5">
                          <button onClick={downloadPrototype} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#22262c] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#111418]"><ArrowDownToLine className="h-4 w-4" /> 下载 {isExcel ? 'Excel' : 'PPTX'}</button>
                          <button onClick={resetWorkspace} className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#e0e6ec] px-4 py-2.5 text-xs font-medium text-slate-600 transition hover:bg-[#f7f9fb]"><RefreshCw className="h-3.5 w-3.5" /> 调整选区并重新生成</button>
                          {fromReader && onBackToReader ? <button onClick={onBackToReader} className="inline-flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-blue-600"><ArrowLeft className="h-3.5 w-3.5" /> 返回原文继续阅读</button> : null}
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </>
            )}
          </section>

          {showHistory ? (
            <aside className="rounded-[24px] border border-white/90 bg-white/78 p-5 shadow-[0_14px_40px_rgba(61,92,126,0.07)] backdrop-blur-sm">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold tracking-[-0.01em] text-[#22262c]">转换历史</h2>
                <span className="rounded-md bg-[#f0f3f6] px-2 py-1 text-[10px] font-medium text-[#77828d]">{history.length} 条</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {history.map((job) => (
                  <article key={job.id} className="group rounded-[18px] border border-[#e5ebf0] bg-white/72 p-3.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cad9e6] hover:bg-white hover:shadow-[0_10px_24px_rgba(61,92,126,0.07)]">
                    <div className="flex gap-3">
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-50">{isExcel ? <TableFigure compact /> : <MiniFigure type={job.figure} />}</div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-slate-800" title={job.fileName}>{job.fileName}</p>
                        <p className="mt-1 text-[9px] text-slate-400">第 {job.page} 页 · {job.createdAt}</p>
                        <span className={`mt-2 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-medium ${job.status === 'success' ? 'bg-[#edf6f2] text-[#4d7b69]' : job.status === 'failed' ? 'bg-[#f8eeee] text-[#a35d5d]' : 'bg-[#edf4fb] text-[#557596]'}`}>
                          {job.status === 'processing' ? <LoaderCircle className="h-2.5 w-2.5 animate-spin" /> : null}{statusText[job.status]}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
                      {job.status === 'success' ? <button onClick={downloadPrototype} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#557596] hover:bg-[#edf4fb]"><ArrowDownToLine className="h-3 w-3" /> 下载</button> : <button onClick={() => { setFileName(job.fileName); setPage(job.page); setStep('generating'); }} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-medium text-[#557596] hover:bg-[#edf4fb]"><RefreshCw className="h-3 w-3" /> 重试</button>}
                      <button onClick={() => setHistory((current) => current.filter((item) => item.id !== job.id))} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="删除记录"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </article>
                ))}
              </div>
            </aside>
          ) : null}
        </div>

      </main>

      {toast ? <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#22262c] px-4 py-3 text-xs font-medium text-white shadow-[0_12px_30px_rgba(34,38,44,0.2)]">{toast}</div> : null}
    </div>
  );
}
