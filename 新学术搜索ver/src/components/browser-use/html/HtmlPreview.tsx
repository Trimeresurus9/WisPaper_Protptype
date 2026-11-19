import React, { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowLeft, Braces, Check, ChevronRight, Code2, Copy, Download, ExternalLink, FileCode2, Link2, Monitor, RotateCcw, X } from 'lucide-react';
import type { HtmlArtifact } from './artifact';
import { HtmlFrame } from './HtmlFrame';
import { makeShareUrl } from './share';
import './html-preview.css';

function downloadHtml(file: HtmlArtifact) {
  const url = URL.createObjectURL(new Blob([file.html], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ShareHtml({ file }: { file: HtmlArtifact }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState<'ready' | 'copied' | 'manual'>('ready');
  const field = useRef<HTMLInputElement>(null);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  useEffect(() => {
    if (!open) return;
    let current = true;
    setUrl('');
    setError('');
    setCopyState('ready');
    makeShareUrl(file).then(link => { if (current) setUrl(link); }, reason => {
      if (current) setError(reason instanceof Error ? reason.message : '链接生成失败，请重新打开分享窗口。');
    });
    return () => { current = false; };
  }, [file, open]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState('copied');
    } catch {
      field.current?.focus();
      field.current?.select();
      setCopyState('manual');
    }
  }
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger className="ha-share"><Link2 size={15}/>分享</Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="ha-overlay"/>
      <Dialog.Content className="ha-dialog">
        <Dialog.Close aria-label="关闭分享窗口" className="ha-icon ha-close"><X size={18}/></Dialog.Close>
        <Dialog.Title>分享 HTML 报告</Dialog.Title>
        <Dialog.Description>链接包含这份 HTML 的当前版本。收件人可以直接操作图表。</Dialog.Description>
        <div className="ha-share-file"><FileCode2 size={20}/>{file.name}</div>
        <label htmlFor="ha-link">预览链接</label>
        <div className="ha-copy-row">
          <input id="ha-link" ref={field} readOnly value={url} placeholder={error ? '无法生成链接' : '正在生成链接…'} onFocus={e => e.target.select()}/>
          <button className="ha-share" disabled={!url} onClick={copy}>{copyState === 'copied' ? <Check size={14}/> : <Copy size={14}/>}{copyState === 'copied' ? '已复制' : '复制链接'}</button>
        </div>
        <div role="status" className="ha-message">{error || (copyState === 'manual' ? '链接已选中，请手动复制。' : copyState === 'copied' ? '预览链接已复制。' : '')}</div>
        {local && <p className="ha-local-note">当前地址仅限本机访问。跨设备演示可发送 HTML 文件，或从已部署的站点复制链接。</p>}
        <div className="ha-dialog-footer"><button onClick={() => downloadHtml(file)}><Download size={14}/>下载 HTML</button>{url && <a href={url} target="_blank" rel="noopener noreferrer">打开分享页<ExternalLink size={13}/></a>}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}

export function HtmlResult({ file, onOpen }: { file: HtmlArtifact; onOpen: () => void }) {
  return <div className="ha-result">
    <p>HTML 文件已生成。打开预览即可运行页面中的 JavaScript。</p>
    <button className="ha-result-card" onClick={onOpen}>
      <span className="ha-file-icon"><FileCode2 size={23}/></span>
      <span><strong>{file.name}</strong><small>HTML · 交互式预览</small></span>
      <span className="ha-open-label">打开预览<ChevronRight size={15}/></span>
    </button>
  </div>;
}

export function HtmlPreview({ file, onClose }: { file: HtmlArtifact; onClose: () => void }) {
  const [mode, setMode] = useState<'preview' | 'source'>('preview');
  const [run, setRun] = useState(0);
  return <section className="ha-preview" aria-label="HTML 文件预览">
    <header className="ha-filebar">
      <button className="ha-icon" aria-label="返回文件列表" onClick={onClose}><ArrowLeft size={16}/></button>
      <FileCode2 size={17} className="ha-file-type"/>
      <strong title={file.name}>{file.name}</strong>
      <ShareHtml file={file}/>
    </header>
    <div className="ha-controls">
      <div role="group" aria-label="显示模式" className="ha-segments">
        <button aria-pressed={mode === 'preview'} onClick={() => setMode('preview')}><Monitor size={14}/>预览</button>
        <button aria-pressed={mode === 'source'} onClick={() => setMode('source')}><Code2 size={14}/>源码</button>
      </div>
      <button className="ha-restart" onClick={() => { setRun(n => n + 1); setMode('preview'); }}><RotateCcw size={13}/>重新运行</button>
    </div>
    <div className="ha-stage" hidden={mode !== 'preview'}><HtmlFrame key={run} file={file}/></div>
    {mode === 'source' && <pre className="ha-source" tabIndex={0} aria-label="HTML 源码"><code>{file.html}</code></pre>}
    <footer className="ha-runtime"><Braces size={13}/>JavaScript 已启用<span>浏览器本地运行</span></footer>
  </section>;
}
