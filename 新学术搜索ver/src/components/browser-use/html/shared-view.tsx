import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileCode2 } from 'lucide-react';
import logo from '../../../assets/3ce02a66a6df7d8cd1f86de17846e94de4e9df61.png';
import { HtmlFrame } from './HtmlFrame';
import type { HtmlArtifact } from './artifact';
import { readShare } from './share';
import './html-preview.css';

function SharedReport() {
  const [hash, setHash] = useState(location.hash);
  const [file, setFile] = useState<HtmlArtifact>();
  const [error, setError] = useState('');
  useEffect(() => {
    const update = () => setHash(location.hash);
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  useEffect(() => {
    let current = true;
    setFile(undefined);
    setError('');
    document.title = 'HTML 报告预览 · WisPaper';
    readShare(hash).then(report => {
      if (current) {
        setFile(report);
        document.title = report.name + ' · WisPaper';
      }
    }, reason => { if (current) setError(reason.message); });
    return () => { current = false; };
  }, [hash]);
  return <main className="ha-shared">
    <header><img src={logo} alt=""/><b>WisPaper</b><i/><strong>{file?.name || 'HTML 报告预览'}</strong><span>分享预览</span></header>
    {file ? <HtmlFrame file={file}/> : <div className="ha-empty" role="status"><FileCode2 size={30}/><h1>{error ? '无法打开这份报告' : '正在打开报告…'}</h1>{error && <p>{error}</p>}</div>}
  </main>;
}
createRoot(document.getElementById('root')!).render(<SharedReport/>);
