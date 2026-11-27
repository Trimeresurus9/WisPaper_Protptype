import React, { useEffect, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { ArrowDownToLine, ArrowLeft, Check, Clock3, FastForward, FileImage, LoaderCircle, Pause, Play, Presentation, RefreshCw, Trash2, Upload } from 'lucide-react';
import { IMAGE_PPTX_DOWNLOAD_COST } from '../utils/mockCredits';
import { createImagePptx, getImagePptxFilename } from '../utils/imageToPptx';
import { SlideWorkbench } from './image-to-pptx/SlideWorkbench';
import { readSlideObjects, exportSlideObjects, type SlideObject } from './image-to-pptx/slideModel';
import { ImageToPptxDemo, imageToPptxDemoFrames, imageToPptxPosterFrame } from './image-to-pptx/ImageToPptxDemo';
import { loadImagePptxHistory, removeImagePptxJob, saveImagePptxEdits, saveImagePptxJob, type ImagePptxJob } from './image-to-pptx/jobHistory';

const waitTime = 10 * 60 * 1000;
const activeJobKey = 'wispaper-image-to-pptx-active';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#22262c] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#111418] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-wait disabled:opacity-60';
const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded-full border border-[#dce4ec] bg-white px-5 py-2.5 text-sm font-medium text-[#526476] transition hover:border-[#acc4d9] hover:bg-[#f7fafd]';

function fileSize(bytes: number) {
  return bytes >= 1024 * 1024 ? (bytes / (1024 * 1024)).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1024)) + ' KB';
}

async function loadPipelineSample() {
  const [image, slides] = await Promise.all([
    fetch('/examples/image-to-pptx-sample.png', { cache: 'no-store' }),
    fetch('/media/image-to-pptx-pipeline-sample.pptx', { cache: 'no-store' }),
  ]);
  if (!image.ok || !slides.ok) throw new Error('示例文件未能载入，请重试或上传本地图片。');
  const [png, pptx] = await Promise.all([image.blob(), slides.blob()]);
  return {
    file: new File([png], '时序信号分类示例.png', { type: 'image/png' }),
    presentation: pptx.slice(0, pptx.size, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'),
  };
}

function download(presentation: Blob, filename: string) {
  const url = URL.createObjectURL(presentation);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function DemoPanel() {
  const player = useRef<PlayerRef>(null);
  const [autoPlay] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [playing, setPlaying] = useState(autoPlay);
  return (
    <div className="relative flex min-h-[240px] min-w-0 overflow-hidden rounded-[14px] bg-[#f5f8fc] p-3 lg:min-h-[520px]">
      <div role="img" aria-label="左侧图片中的科研流程图完整移入右侧幻灯片，中间节点短暂出现编辑选中框。" className="flex min-w-0 flex-1 items-center overflow-hidden rounded-[12px] bg-[#eef6fd]">
        <Player ref={player} component={ImageToPptxDemo} durationInFrames={imageToPptxDemoFrames} compositionWidth={900} compositionHeight={420} fps={30}
          autoPlay={autoPlay} initialFrame={autoPlay ? 0 : imageToPptxPosterFrame} loop initiallyMuted numberOfSharedAudioTags={0} controls={false} clickToPlay={false} acknowledgeRemotionLicense
          style={{ width: '100%', aspectRatio: '900 / 420' }} />
      </div>
      <button type="button" aria-label={playing ? '暂停演示动画' : '播放演示动画'}
        onClick={() => {
          if (playing) player.current?.pause();
          else player.current?.play();
          setPlaying(!playing);
        }}
        className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/90 bg-white/95 text-[#526476] shadow-sm transition hover:text-[#0d78ff]">
        {playing ? <Pause size={15} /> : <Play size={15} />}
      </button>
    </div>
  );
}

function SlidePreview({ file }: { file: File }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const source = URL.createObjectURL(file);
    setUrl(source);
    return () => URL.revokeObjectURL(source);
  }, [file]);
  return (
    <div className="flex min-h-[240px] min-w-0 items-center justify-center bg-[#eef4f9] p-5 sm:p-9 lg:min-h-[450px] lg:p-12">
      <div className="aspect-video w-full max-w-[860px] overflow-hidden rounded-[3px] bg-white shadow-[0_12px_38px_rgba(45,66,88,0.14)]">
        {url && <img src={url} alt={file.name + ' 的幻灯片预览'} className="h-full w-full object-contain" />}
      </div>
    </div>
  );
}

interface ImageToPptxProps {
  onBackToTools: () => void;
  isDownloadPaid: (jobId: string) => boolean;
  payForDownload: (jobId: string) => Promise<void>;
}

function ResultWorkspace({ job, paid, payForDownload, onEdit, onRestart }: {
  job: ImagePptxJob;
  paid: boolean;
  payForDownload: ImageToPptxProps['payForDownload'];
  onEdit: (objects: SlideObject[]) => void;
  onRestart: () => void;
}) {
  const [original, setOriginal] = useState<SlideObject[]>();
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(true);
  const objects = job.edits ?? original;
  const hasDraft = job.edits !== undefined;
  const filename = getImagePptxFilename(job.image.name);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (hasDraft) return;
    let current = true;
    setLoadError(false);
    readSlideObjects(job.presentation, job.image).then(result => {
      if (current) setOriginal(result);
    }).catch(() => { if (current) setLoadError(true); });
    return () => { current = false; };
  }, [job.presentation, job.image, hasDraft, attempt]);

  async function exportResult() {
    if (!objects || inFlight.current) return;
    inFlight.current = true;
    setExporting(true);
    setExportError('');
    try {
      const result = job.edits ? await exportSlideObjects(job.presentation, objects) : job.presentation;
      if (!mounted.current) return;
      await payForDownload(job.id);
      download(result, filename);
    } catch (cause) {
      if (mounted.current) setExportError(cause instanceof Error ? cause.message : '下载失败，请重试。');
    } finally {
      inFlight.current = false;
      if (mounted.current) setExporting(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_304px]">
      {objects ? <SlideWorkbench image={job.image} objects={objects} onChange={onEdit} /> : (
        <div className="flex min-h-[320px] items-center justify-center gap-3 bg-[#eef4f9] text-sm text-[#526476]">
          {loadError ? <><span role="alert">幻灯片未能载入</span><button type="button" className={secondaryButton} onClick={() => setAttempt(n => n + 1)}>重试</button></>
            : <><LoaderCircle size={18} className="animate-spin" /><span role="status">正在打开幻灯片…</span></>}
        </div>
      )}
      <div className="flex min-w-0 flex-col justify-center border-t border-[#e8edf2] p-6 lg:border-l lg:border-t-0">
        <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edf6f2] text-[#4d7b69]"><Check size={20} /></span>
        <h2 className="mt-4 text-lg font-semibold">PPTX 已生成</h2>
        <p className="mt-4 break-all text-sm text-[#526476]">{filename}</p>
        <p className="mt-1 text-xs text-[#728094]">1 张幻灯片{!hasDraft && ' · ' + fileSize(job.presentation.size)}</p>
        <button type="button" onClick={() => void exportResult()} disabled={!objects || exporting} className={primaryButton + ' mt-7 whitespace-nowrap !px-3'}>
          {exporting ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
          {exporting ? '正在准备下载…' : paid ? '重新下载 PPTX' : `付费并下载（${IMAGE_PPTX_DOWNLOAD_COST} credits）`}
        </button>
        {exportError && <p role="alert" className="mt-2 text-xs text-red-700">{exportError}</p>}
        <button type="button" disabled={exporting} onClick={onRestart} className={secondaryButton + ' mt-2'}><RefreshCw size={14} /> 转换另一张图片</button>
      </div>
    </div>
  );
}

export function ImageToPPTX({ onBackToTools, isDownloadPaid, payForDownload }: ImageToPptxProps) {
  const [jobs, setJobs] = useState<ImagePptxJob[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [restoring, setRestoring] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [storageMessage, setStorageMessage] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const toolPanel = useRef<HTMLElement>(null);
  const active = jobs.find(job => job.id === activeId);
  const waiting = Boolean(active && active.readyAt > now);
  const hasPending = jobs.some(job => job.readyAt > now);
  const activeStep = active ? (waiting ? 1 : 2) : 0;

  function selectJob(id: string | null) {
    setActiveId(id);
    try {
      if (id) sessionStorage.setItem(activeJobKey, id);
      else sessionStorage.removeItem(activeJobKey);
    } catch { /* The selected job can still be used in this view. */ }
  }

  useEffect(() => {
    let current = true;
    loadImagePptxHistory().then(entries => {
      if (!current) return;
      const time = Date.now();
      setNow(time);
      setJobs(entries);
      const previous = sessionStorage.getItem(activeJobKey);
      setActiveId(entries.find(job => job.id === previous)?.id ?? entries.find(job => job.readyAt > time)?.id ?? null);
    }).catch(() => {
      if (current) setStorageMessage('当前浏览器无法保存任务历史。');
    }).finally(() => { if (current) setRestoring(false); });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!hasPending) return;
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [hasPending]);

  async function persist(job: ImagePptxJob) {
    try {
      await saveImagePptxJob(job);
    } catch {
      setStorageMessage('此任务仅保留在当前页面，可在完成后下载。');
    }
  }

  async function startJob(source: File | 'sample') {
    if (uploading.current || restoring) return;
    uploading.current = true;
    setPreparing(true);
    setError('');
    try {
      const { file, presentation } = source === 'sample'
        ? await loadPipelineSample()
        : { file: source, presentation: await createImagePptx(source) };
      const startedAt = Date.now();
      const job = { id: crypto.randomUUID(), image: file, presentation, startedAt, readyAt: startedAt + waitTime };
      await persist(job);
      setJobs(current => [job, ...current]);
      selectJob(job.id);
      setNow(Date.now());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '图片读取失败，请重新选择 PNG 或 JPG 图片。');
    } finally {
      setPreparing(false);
      uploading.current = false;
    }
  }

  function acceptFiles(files: FileList | null) {
    if (!files?.length) return;
    if (files.length > 1) {
      setError('请每次选择一张 PNG 或 JPG 图片。');
      return;
    }
    void startJob(files[0]);
  }

  function skipWait(job: ImagePptxJob) {
    const readyAt = Date.now();
    const finished = { ...job, readyAt };
    setNow(readyAt);
    setJobs(current => current.map(item => item.id === job.id ? finished : item));
    void persist(finished);
  }

  function saveEdits(id: string, edits: SlideObject[]) {
    setJobs(current => current.map(job => job.id === id ? { ...job, edits } : job));
    void saveImagePptxEdits(id, edits).catch(() => {
      setStorageMessage('未能保存编辑，当前页面仍可导出修改后的 PPTX。');
    });
  }

  function openFromHistory(id: string) {
    selectJob(id);
    toolPanel.current?.scrollIntoView({ block: 'start' });
  }

  async function removeJob(id: string) {
    try {
      await removeImagePptxJob(id);
    } catch {
      setStorageMessage('未能更新浏览器内保存的任务历史。');
    }
    setJobs(current => current.filter(job => job.id !== id));
    if (activeId === id) selectJob(null);
  }

  const remaining = active ? Math.max(0, Math.ceil((active.readyAt - now) / 1000)) : 0;
  const timer = Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
  const disabled = restoring || preparing;

  return (
    <div className="relative min-h-screen min-w-0 flex-1 overflow-hidden rounded-tl-[18px] bg-white text-[#22262c]">
      <header className="flex h-[72px] items-center border-b border-[#edf0f3] bg-white px-5 lg:px-8">
        <h1><button type="button" onClick={onBackToTools} aria-label="返回工具中心" className="inline-flex items-center gap-3 text-sm font-semibold transition hover:text-[#0d78ff]">
          <ArrowLeft className="h-5 w-5 text-[#728196]" /> 图片转 PPTX
        </button></h1>
      </header>
      <main className="mx-auto max-w-[1500px] px-3 pb-16 pt-7 sm:px-6 lg:px-8">
        <ol aria-label="转换步骤" className="mx-auto mb-7 grid max-w-[680px] grid-cols-3 rounded-full bg-[#f1f3f7] p-1.5">
          {['上传图片', '生成 PPTX', '结果预览'].map((label, index) => (
            <li key={label} aria-current={index === activeStep ? 'step' : undefined} className={'flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full py-2.5 text-xs font-medium max-[380px]:gap-0.5 max-[380px]:text-[11px] sm:gap-2 sm:text-sm ' + (index === activeStep ? 'bg-white text-[#22262c] shadow-[0_3px_12px_rgba(42,55,73,0.08)]' : index < activeStep ? 'text-[#5c7893]' : 'text-[#748193]')}>
              <span className={'grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs max-[380px]:size-4 max-[380px]:text-[10px] ' + (index === activeStep ? 'bg-[#22262c] text-white' : index < activeStep ? 'bg-[#e5f0fa]' : 'bg-white')}>
                {index < activeStep ? <Check size={14} /> : index + 1}
              </span>{label}
            </li>
          ))}
        </ol>

        <section ref={toolPanel} aria-label="图片转换" className="overflow-hidden rounded-[18px] border border-[#dde3e9] bg-white shadow-[0_8px_24px_rgba(61,92,126,0.06)]">
          {!active ? (
            <div className="grid gap-4 p-3 sm:gap-5 sm:p-5 lg:grid-cols-2">
              <div onDragOver={event => { event.preventDefault(); if (!disabled) setDragging(true); }}
                onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
                onDrop={event => { event.preventDefault(); setDragging(false); if (!disabled) acceptFiles(event.dataTransfer.files); }}
                className={'flex min-h-[300px] flex-col items-center justify-center rounded-[14px] border border-dashed px-4 py-8 text-center transition-colors lg:min-h-[520px] ' + (dragging ? 'border-[#0d78ff] bg-[#f2f8ff]' : 'border-[#9ccaff] bg-[#fbfdff]')}>
                <span className="grid h-12 w-12 place-items-center rounded-full border border-[#e0e6ed] bg-white text-[#0d78ff] shadow-[0_4px_12px_rgba(61,92,126,0.08)]"><Upload size={20} /></span>
                <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em]">拖拽图片到此处</h2>
                <p className="mt-2 text-sm text-[#657689]">PNG 或 JPG · 转换约需 10 分钟</p>
                <button type="button" onClick={() => input.current?.click()} disabled={disabled} className={primaryButton + ' mt-6 w-full max-w-[260px]'}>
                  {preparing ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
                  {preparing ? '正在读取图片' : '上传图片'}
                </button>
                <input ref={input} aria-label="选择 PNG 或 JPG 图片" type="file" accept=".png,.jpg,.jpeg,image/png,image/jpeg" className="hidden" onChange={event => {
                  acceptFiles(event.currentTarget.files);
                  event.currentTarget.value = '';
                }} />
                <button type="button" onClick={() => void startJob('sample')} disabled={disabled} className="mt-2 rounded px-4 py-2 text-xs font-medium text-[#5c7086] transition hover:text-[#0d78ff] disabled:opacity-50">体验示例</button>
                {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
              </div>
              <DemoPanel />
            </div>
          ) : (
            <>
              <div className="flex min-h-16 min-w-0 items-center gap-3 border-b border-[#e8edf2] px-5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#f1f6fb] text-[#557b9c]"><FileImage size={18} /></span>
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{active.image.name}</p><p className="text-xs text-[#728094]">{fileSize(active.image.size)}</p></div>
              </div>
              {waiting ? <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
                <SlidePreview key={active.id} file={active.image} />
                <div className="flex flex-col justify-center border-t border-[#e8edf2] p-6 lg:border-l lg:border-t-0">
                  <span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#edf4fb] text-[#557596]"><Clock3 size={20} /></span>
                  <h2 aria-live="polite" className="mt-4 text-lg font-semibold">正在生成 PPTX</h2>
                  <div className="mb-2 mt-6 flex items-center justify-between gap-2 text-sm text-[#657689]"><span>预计剩余时间</span><span role="timer" className="font-medium tabular-nums text-[#34424e]">{timer}</span></div>
                  <progress aria-label="模拟转换进度" max={waitTime} value={Math.max(0, Math.min(waitTime, now - active.startedAt))} className="h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-[#edf1f5] [&::-webkit-progress-value]:bg-[#6f91b1] [&::-moz-progress-bar]:bg-[#6f91b1]" />
                  <button type="button" onClick={() => skipWait(active)} className={secondaryButton + ' mt-8'}><FastForward size={15} /> 跳过等待</button>
                </div>
              </div> : <ResultWorkspace key={active.id} job={active} paid={isDownloadPaid(active.id)}
                payForDownload={payForDownload} onEdit={objects => saveEdits(active.id, objects)}
                onRestart={() => { setError(''); selectJob(null); }} />}
            </>
          )}
        </section>

        <section aria-label="任务历史" className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-[-0.02em]">任务历史</h2>
            {jobs.length > 0 && <span className="text-xs text-[#728094]">{jobs.length} 条记录</span>}
          </div>
          <div className="overflow-hidden rounded-[14px] border border-[#dfe4ea]">
            {jobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-[#728094]">{restoring ? '正在读取记录…' : '暂无转换记录'}</p>
            ) : (
              <ul className="divide-y divide-[#edf0f3]">
                {jobs.map(job => {
                  const pending = job.readyAt > now;
                  const name = getImagePptxFilename(job.image.name);
                  return <li key={job.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:flex-nowrap sm:px-5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#f1f6fb] text-[#557b9c]"><Presentation size={17} /></span>
                    <div className="min-w-0 flex-1">
                      <button type="button" onClick={() => openFromHistory(job.id)} title={name} className="block max-w-full truncate text-left text-sm font-medium hover:text-[#0d78ff]">{name}</button>
                      <time className="text-xs text-[#728094]" dateTime={new Date(job.startedAt).toISOString()}>{new Date(job.startedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
                    </div>
                    <span className={'rounded-full px-2.5 py-1 text-xs ' + (pending ? 'bg-[#edf4fb] text-[#557596]' : 'bg-[#e9f8f1] text-[#27815a]')}>{pending ? '生成中' : '已完成'}</span>
                    <button type="button" aria-label={(pending ? '查看 ' : '预览 ') + name} onClick={() => openFromHistory(job.id)} className="rounded-[9px] border border-[#dfe4ea] px-3 py-1.5 text-xs text-[#3f4954] hover:bg-[#f7f9fb]">{pending ? '查看' : '预览'}</button>
                    <button type="button" aria-label={'删除 ' + name} onClick={() => void removeJob(job.id)} className="rounded-lg p-1.5 text-[#708094] hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                  </li>;
                })}
              </ul>
            )}
          </div>
          {storageMessage && <p role="status" className="mt-2 text-xs text-[#728094]">{storageMessage}</p>}
        </section>
      </main>
    </div>
  );
}
