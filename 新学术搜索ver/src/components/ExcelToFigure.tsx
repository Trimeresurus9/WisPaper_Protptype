import React, { useEffect, useRef, useState } from 'react';
import { Player } from '@remotion/player';
import {
  ArrowDownToLine,
  ArrowLeft,
  BarChart3,
  Check,
  FileJson,
  FileSpreadsheet,
  Image as ImageIcon,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { ExcelToFigureDemo } from './excel-to-figure/ExcelToFigureDemo';

type WorkflowStep = 'input' | 'configure' | 'generating' | 'result';
type Theme = 'journal' | 'fresh' | 'dark';

interface HistoryItem {
  id: string;
  fileName: string;
  prompt: string;
  createdAt: string;
  status: '已完成' | '生成中';
}

const sampleRows = [
  ['Group', 'Day 0', 'Day 7', 'Day 14'],
  ['Control', '28', '39', '57'],
  ['Method A', '31', '44', '62'],
  ['Method B', '36', '57', '78'],
];

const initialHistory: HistoryItem[] = [
  { id: 'figure-1', fileName: 'experiment_results.xlsx', prompt: '比较三个实验组随时间的变化', createdAt: '今天 11:08', status: '已完成' },
  { id: 'figure-2', fileName: 'survey_data.csv', prompt: '生成分组柱状图，突出显著差异', createdAt: '昨天 16:32', status: '已完成' },
];

const allowedDataFile = (file: File) => /\.(csv|xlsx|xls|json)$/i.test(file.name);

function DataFileIcon({ fileName }: { fileName: string }) {
  return fileName.toLowerCase().endsWith('.json')
    ? <FileJson className="h-5 w-5" />
    : <FileSpreadsheet className="h-5 w-5" />;
}

function GeneratedFigure({ theme }: { theme: Theme }) {
  const palette = theme === 'dark'
    ? { card: '#17202a', text: '#f8fafc', muted: '#9eb0bf', grid: '#334453', series: ['#94a3b8', '#6db5e3', '#62c597'] }
    : theme === 'fresh'
      ? { card: '#f5fbf8', text: '#22332b', muted: '#72877c', grid: '#dcebe3', series: ['#a2ada7', '#64a6c9', '#36a06c'] }
      : { card: '#ffffff', text: '#25313a', muted: '#7a8995', grid: '#e5ebef', series: ['#9aa8b2', '#4f8fb8', '#3e976b'] };

  return (
    <div className="h-full w-full rounded-[18px] p-5 sm:p-8" style={{ background: palette.card }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold sm:text-lg" style={{ color: palette.text }}>Growth across experimental groups</h3>
          <p className="mt-1 text-[11px] sm:text-xs" style={{ color: palette.muted }}>Mean value ± SD · n = 6</p>
        </div>
        <div className="flex flex-col gap-1.5 text-[9px] sm:text-[10px]" style={{ color: palette.muted }}>
          {['Control', 'Method A', 'Method B'].map((label, index) => <span key={label} className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: palette.series[index] }} />{label}</span>)}
        </div>
      </div>
      <svg viewBox="0 0 560 270" className="mt-2 h-[calc(100%-72px)] w-full overflow-visible" role="img" aria-label="生成的折线图预览">
        {[42, 92, 142, 192, 242].map((y, index) => <g key={y}><line x1="56" y1={y} x2="530" y2={y} stroke={palette.grid} /><text x="42" y={y + 4} textAnchor="end" fill={palette.muted} fontSize="10">{80 - index * 20}</text></g>)}
        <line x1="56" y1="24" x2="56" y2="242" stroke={palette.muted} strokeWidth="1.2" />
        <line x1="56" y1="242" x2="530" y2="242" stroke={palette.muted} strokeWidth="1.2" />
        {['Day 0', 'Day 7', 'Day 14'].map((label, index) => <text key={label} x={112 + index * 182} y="263" textAnchor="middle" fill={palette.muted} fontSize="11">{label}</text>)}
        {[
          { points: '112,172 294,145 476,105', color: palette.series[0] },
          { points: '112,163 294,132 476,91', color: palette.series[1] },
          { points: '112,151 294,100 476,54', color: palette.series[2] },
        ].map((line) => <g key={line.color}><polyline points={line.points} fill="none" stroke={line.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{line.points.split(' ').map((point) => { const [cx, cy] = point.split(','); return <circle key={point} cx={cx} cy={cy} r="5" fill={line.color} stroke={palette.card} strokeWidth="3" />; })}</g>)}
      </svg>
    </div>
  );
}

export function ExcelToFigure({ onBackToTools }: { onBackToTools: () => void }) {
  const [step, setStep] = useState<WorkflowStep>('input');
  const [fileName, setFileName] = useState('experiment_results.xlsx');
  const [fileSize, setFileSize] = useState('28 KB');
  const [prompt, setPrompt] = useState('比较三个实验组随时间的变化，生成适合学术论文使用的折线图；显示数据点和图例，使用克制的配色。');
  const [referenceName, setReferenceName] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [progress, setProgress] = useState(0);
  const [generationLabel, setGenerationLabel] = useState('正在读取数据');
  const [isDragging, setIsDragging] = useState(false);
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState(initialHistory);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (referenceUrl) URL.revokeObjectURL(referenceUrl); }, [referenceUrl]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (step !== 'generating') return;
    const stages = [
      { delay: 260, progress: 18, label: '正在读取数据结构' },
      { delay: 850, progress: 42, label: '正在理解图表要求' },
      { delay: 1500, progress: 68, label: referenceName ? '正在匹配参考图风格' : '正在设计图表样式' },
      { delay: 2250, progress: 91, label: '正在渲染高清图片' },
      { delay: 2900, progress: 100, label: '生成完成' },
    ];
    const timers = stages.map((stage) => window.setTimeout(() => {
      setProgress(stage.progress);
      setGenerationLabel(stage.label);
      if (stage.progress === 100) {
        window.setTimeout(() => {
          setStep('result');
          setHistory((items) => [{ id: `figure-${Date.now()}`, fileName, prompt, createdAt: '刚刚', status: '已完成' }, ...items.filter((item) => item.createdAt !== '刚刚')]);
        }, 320);
      }
    }, stage.delay));
    return () => timers.forEach(window.clearTimeout);
  }, [step, fileName, prompt, referenceName]);

  const uploadData = (file?: File) => {
    if (!file) return;
    if (!allowedDataFile(file)) {
      setToast('请选择 CSV、XLSX 或 JSON 文件');
      return;
    }
    setFileName(file.name);
    setFileSize(file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`);
    setStep('configure');
  };

  const uploadReference = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast('请选择图片文件');
      return;
    }
    if (referenceUrl) URL.revokeObjectURL(referenceUrl);
    setReferenceName(file.name);
    setReferenceUrl(URL.createObjectURL(file));
  };

  const startGeneration = () => {
    if (!prompt.trim()) {
      setToast('请先描述希望生成的图表');
      return;
    }
    setProgress(6);
    setGenerationLabel('正在读取数据');
    setStep('generating');
  };

  const reset = () => {
    setStep('configure');
    setProgress(0);
  };

  const activeIndex = step === 'input' ? 0 : step === 'configure' ? 1 : 2;

  return (
    <div className="relative min-h-screen flex-1 overflow-hidden rounded-tl-[18px] bg-white text-[#22262c]">
      <header className="flex h-[72px] items-center border-b border-[#edf0f3] bg-white px-6 lg:px-8">
        <button type="button" onClick={onBackToTools} className="inline-flex items-center gap-3 text-sm font-semibold transition hover:text-[#0d78ff]" aria-label="返回工具中心">
          <ArrowLeft className="h-5 w-5 text-[#728196]" /> Excel2fig
        </button>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 pb-16 pt-7 lg:px-8">
        <section className="mx-auto mb-7 max-w-[680px]">
          <div className="grid grid-cols-3 rounded-full bg-[#f1f3f7] p-1.5">
            {[
              ['1', '上传数据'],
              ['2', '描述图表'],
              ['3', '生成图片'],
            ].map(([number, label], index) => (
              <div key={number} className={`flex items-center justify-center gap-2 rounded-full px-3.5 py-2.5 text-sm font-medium transition-colors ${index === activeIndex ? 'bg-white text-[#22262c] shadow-[0_3px_12px_rgba(42,55,73,0.08)]' : index < activeIndex ? 'text-[#5c7893]' : 'text-[#8d99a8]'}`}>
                <span className={`grid h-6 w-6 place-items-center rounded-full text-xs ${index === activeIndex ? 'bg-[#22262c] text-white' : index < activeIndex ? 'bg-[#e5f0fa] text-[#5c7893]' : 'bg-white text-[#8d99a8]'}`}>{index < activeIndex ? <Check className="h-3.5 w-3.5" /> : number}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[18px] border border-[#dde3e9] bg-white shadow-[0_8px_24px_rgba(61,92,126,0.06)]">
          {step === 'input' ? (
            <div className="grid min-h-[560px] gap-5 p-5 lg:grid-cols-2">
              <div
                className={`flex min-h-[440px] flex-col items-center justify-center rounded-[14px] border border-dashed px-8 text-center transition-colors lg:min-h-[520px] ${isDragging ? 'border-[#0d78ff] bg-[#f2f8ff]' : 'border-[#9ccaff] bg-[#fbfdff]'}`}
                onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => { event.preventDefault(); setIsDragging(false); uploadData(event.dataTransfer.files?.[0]); }}
              >
                <div className="grid h-12 w-12 place-items-center rounded-full border border-[#e0e6ed] bg-white text-[#0d78ff] shadow-[0_4px_12px_rgba(61,92,126,0.08)]"><Upload className="h-5 w-5" /></div>
                <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">拖拽数据文件到此处</h1>
                <p className="mt-2 text-sm text-[#8a96a6]">上传数据，再用自然语言描述想要的图表</p>
                <button type="button" onClick={() => dataInputRef.current?.click()} className="mt-6 inline-flex min-w-[260px] items-center justify-center gap-2 rounded-full bg-[#22262c] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#111418] active:scale-[0.98]"><Upload className="h-4 w-4" />上传数据文件</button>
                <button type="button" onClick={() => setStep('configure')} className="mt-3 text-xs font-medium text-[#6e7f92] transition hover:text-[#0d78ff]">体验示例</button>
                <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] font-medium text-[#6e7f92]">
                  {['CSV', 'XLSX', 'JSON'].map((format) => <span key={format} className="rounded-lg border border-[#e3e8ed] bg-white px-2.5 py-1.5">{format}</span>)}
                </div>
                <p className="mt-4 text-xs text-[#8a96a6]">单个文件不超过 20 MB · 预计消耗 600 credits</p>
                <input ref={dataInputRef} type="file" accept=".csv,.xlsx,.xls,.json,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(event) => uploadData(event.target.files?.[0])} />
              </div>

              <div className="min-h-[440px] overflow-hidden rounded-[14px] bg-[#f5f8fc] lg:min-h-[520px]">
                <Player component={ExcelToFigureDemo} durationInFrames={180} compositionWidth={900} compositionHeight={680} fps={30} autoPlay loop controls={false} clickToPlay acknowledgeRemotionLicense style={{ width: '100%', height: '100%', minHeight: 520, overflow: 'hidden' }} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[#e8edf2] px-5 py-3">
                <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#eaf7f0] text-[#27875a]"><DataFileIcon fileName={fileName} /></div><div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-900">{fileName}</p><p className="mt-0.5 text-[10px] text-slate-400">{fileSize} · 4 columns · 3 data rows</p></div></div>
                <button type="button" onClick={() => dataInputRef.current?.click()} className="rounded-lg border border-[#dfe5eb] px-3 py-2 text-xs font-medium text-[#627184] transition hover:border-[#aac8e8] hover:text-[#0d78ff]">更换文件</button>
                <input ref={dataInputRef} type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={(event) => uploadData(event.target.files?.[0])} />
              </div>

              <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,1fr)_390px]">
                <div className="min-w-0 border-b border-[#e8edf2] bg-[#f7f9fb] p-6 lg:border-b-0 lg:border-r">
                  {step === 'generating' ? (
                    <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-[16px] border border-[#dde5eb] bg-white text-center"><div className="relative grid h-24 w-24 place-items-center"><svg className="absolute inset-0 h-full w-full -rotate-90"><circle cx="48" cy="48" r="42" fill="none" stroke="#edf1f4" strokeWidth="6" /><circle cx="48" cy="48" r="42" fill="none" stroke="#3d9d70" strokeWidth="6" strokeLinecap="round" strokeDasharray={264} strokeDashoffset={264 - (264 * progress) / 100} className="transition-all duration-500" /></svg><Sparkles className="h-8 w-8 text-[#318b62]" /></div><h2 className="mt-5 text-xl font-semibold">正在生成图表</h2><p className="mt-2 text-sm text-[#7e8c9c]">{generationLabel}</p><p className="mt-4 text-xs font-semibold text-[#318b62]">{progress}%</p></div>
                  ) : (
                    <div className="mx-auto flex h-full max-w-[820px] flex-col justify-center">
                      <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8391a0]">Data preview</p><h2 className="mt-1 text-lg font-semibold">数据预览</h2></div><span className="rounded-full bg-[#e8f5ee] px-3 py-1.5 text-[10px] font-semibold text-[#318b62]">已识别表头</span></div>
                      <div className="overflow-hidden rounded-[14px] border border-[#dde5eb] bg-white shadow-sm"><div className="grid grid-cols-4">{sampleRows.flatMap((row, rowIndex) => row.map((cell, columnIndex) => <div key={`${rowIndex}-${columnIndex}`} className={`min-w-0 truncate border-b border-r border-[#e6ebef] px-3 py-3 text-xs last:border-r-0 ${rowIndex === 0 ? 'bg-[#edf7f2] font-semibold text-[#39795a]' : columnIndex === 0 ? 'font-medium text-[#4f5e69]' : 'text-[#71808c]'}`}>{cell}</div>))}</div></div>
                      <div className="mt-5 rounded-[14px] border border-[#e1e7ec] bg-white p-4"><div className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-[#3d9d70]" />AI 数据理解</div><p className="mt-2 text-xs leading-5 text-[#738291]">识别到 1 个类别字段、3 个时间字段和 3 个实验组，可生成折线图、分组柱状图或热力图。</p></div>
                      {step === 'result' && <div className="mt-5 min-h-[360px] overflow-hidden rounded-[16px] border border-[#dce5eb] bg-white shadow-[0_16px_40px_rgba(61,92,126,0.1)]"><GeneratedFigure theme="journal" /></div>}
                    </div>
                  )}
                </div>

                <aside className="flex flex-col bg-white p-5 lg:p-6">
                  {step === 'result' ? (
                    <div className="flex h-full flex-col"><div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e8f6ef] text-[#27875a]"><Check className="h-5 w-5" /></div><h2 className="mt-4 text-xl font-semibold">图片已生成</h2><p className="mt-2 text-sm leading-6 text-[#7c8997]">已根据数据、Prompt{referenceName ? '和参考图' : ''}生成高清图表。</p><div className="mt-6 rounded-[14px] bg-[#f6f8fa] p-4 text-xs text-[#637282]"><div className="flex justify-between"><span>格式</span><b className="text-[#28333d]">PNG</b></div><div className="mt-3 flex justify-between"><span>分辨率</span><b className="text-[#28333d]">2400 × 1600</b></div></div><div className="mt-auto grid gap-3 pt-8"><button type="button" onClick={() => setToast('原型演示：PNG 下载已触发')} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#22262c] px-5 py-3 text-sm font-medium text-white"><ArrowDownToLine className="h-4 w-4" />下载 PNG</button><button type="button" onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dce3e9] px-5 py-3 text-sm font-medium text-[#516171]"><RefreshCw className="h-4 w-4" />调整后重新生成</button></div></div>
                  ) : step === 'generating' ? (
                    <div className="flex h-full flex-col items-center justify-center text-center"><LoaderCircle className="h-7 w-7 animate-spin text-[#3d9d70]" /><p className="mt-4 text-sm font-semibold">请稍候</p><p className="mt-2 text-xs leading-5 text-[#8592a0]">生成过程中请勿关闭页面</p></div>
                  ) : (
                    <div className="flex h-full flex-col">
                      <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#3d9d70]" /><h2 className="text-lg font-semibold">描述你想要的图表</h2></div>
                      <label className="mt-5 text-xs font-semibold text-[#566574]">Prompt <span className="text-red-500">*</span></label>
                      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={500} className="mt-2 min-h-[140px] resize-none rounded-[14px] border border-[#dce4ea] bg-[#fbfcfd] p-3.5 text-sm leading-6 outline-none transition focus:border-[#6eaedb] focus:ring-2 focus:ring-[#dcefff]" placeholder="例如：生成分组折线图，突出 Method B 的增长趋势……" />
                      <div className="mt-1 text-right text-[10px] text-[#9aa5b0]">{prompt.length}/500</div>

                      <div className="mt-5 flex items-center justify-between"><label className="text-xs font-semibold text-[#566574]">参考图片 <span className="font-normal text-[#9aa5b0]">可选</span></label>{referenceName && <button type="button" onClick={() => { if (referenceUrl) URL.revokeObjectURL(referenceUrl); setReferenceUrl(''); setReferenceName(''); }} className="text-[#8996a3] hover:text-red-500" aria-label="移除参考图片"><Trash2 className="h-3.5 w-3.5" /></button>}</div>
                      {referenceName ? <div className="mt-2 flex items-center gap-3 rounded-[12px] border border-[#dce5eb] p-2.5">{referenceUrl ? <img src={referenceUrl} alt="参考图预览" className="h-12 w-12 rounded-lg object-cover" /> : <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#eef3f7]"><ImageIcon className="h-5 w-5 text-[#738291]" /></div>}<div className="min-w-0"><p className="truncate text-xs font-medium">{referenceName}</p><p className="mt-1 text-[10px] text-[#8c98a4]">将参考配色、布局与视觉风格</p></div></div> : <button type="button" onClick={() => referenceInputRef.current?.click()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#cfd9e1] bg-[#fafcfd] py-4 text-xs font-medium text-[#6d7d8c] transition hover:border-[#8dbbdc] hover:text-[#0d78ff]"><ImageIcon className="h-4 w-4" />添加参考图片</button>}
                      <input ref={referenceInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => uploadReference(event.target.files?.[0])} />

                      <button type="button" onClick={startGeneration} disabled={!prompt.trim()} className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#22262c] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#111418] disabled:cursor-not-allowed disabled:bg-[#c8cdd2]"><Sparkles className="h-4 w-4" />生成图片</button>
                      <p className="mt-3 text-center text-[10px] text-[#929eaa]">预计消耗 600 credits</p>
                    </div>
                  )}
                </aside>
              </div>
            </>
          )}
        </section>

        <section className="mt-9">
          <h2 className="text-lg font-semibold">任务历史</h2>
          <div className="mt-4 overflow-hidden rounded-[16px] border border-[#dde4ea] bg-white">
            <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_130px_100px_60px] gap-4 border-b border-[#e8edf1] bg-[#f8fafb] px-5 py-3 text-xs font-medium text-[#8995a2] md:grid"><span>数据文件</span><span>Prompt</span><span>生成时间</span><span>状态</span><span>操作</span></div>
            {history.map((item) => <div key={item.id} className="grid gap-3 border-b border-[#edf1f4] px-5 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_130px_100px_60px] md:items-center md:gap-4"><div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#eaf7f0] text-[#27875a]"><DataFileIcon fileName={item.fileName} /></span><span className="truncate text-sm font-medium">{item.fileName}</span></div><p className="truncate text-xs text-[#6e7d8c]">{item.prompt}</p><span className="text-xs text-[#7e8b98]">{item.createdAt}</span><span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${item.status === '已完成' ? 'bg-[#e9f7f0] text-[#23835a]' : 'bg-blue-50 text-blue-600'}`}>{item.status}</span><button type="button" onClick={() => setToast('原型演示：历史图片下载已触发')} className="text-xs font-medium text-[#0d78ff]">下载</button></div>)}
          </div>
        </section>
      </main>

      {toast && <div className="fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#22262c] px-5 py-3 text-sm text-white shadow-xl"><Check className="h-4 w-4 text-[#7ee0af]" />{toast}<button type="button" onClick={() => setToast('')} aria-label="关闭提示"><X className="h-3.5 w-3.5 text-white/60" /></button></div>}
    </div>
  );
}
