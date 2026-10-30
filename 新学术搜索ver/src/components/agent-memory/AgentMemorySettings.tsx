import React, { useEffect, useState } from 'react';
import { Pencil, SlidersHorizontal, RotateCcw, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { personalScope, projectScope, readSettings, saveDocument, taskScope } from './store';
import { useLanguage } from '../../contexts/LanguageContext';
import './agent-memory.css';

export function AgentMemorySettings({ scope = personalScope }: { scope?: string; projectName?: string }) {
  const { t } = useLanguage();
  const copy = (key: string) => t(`agentPreferences.${key}`);
  const [saved, setSaved] = useState(() => readSettings(scope));
  const [draft, setDraft] = useState(saved.document);
  const [baseRevision, setBaseRevision] = useState(saved.revision);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const [discard, setDiscard] = useState(false);
  const project = scope.startsWith('project:');
  const task = scope.startsWith('task-file:');
  const dirty = editing && draft !== saved.document;
  const conflict = editing && baseRevision !== saved.revision;
  useEffect(() => {
    const refresh = () => setSaved(readSettings(scope));
    window.addEventListener('agent-context-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => { window.removeEventListener('agent-context-changed', refresh); window.removeEventListener('storage', refresh); };
  }, [scope]);
  const startEditing = () => { setDraft(saved.document); setBaseRevision(saved.revision); setEditing(true); setNotice(''); };
  const save = () => {
    try { setSaved(saveDocument(scope, draft, '你', baseRevision)); setEditing(false); setNotice('saved'); }
    catch { setNotice(readSettings(scope).revision !== baseRevision ? 'conflict' : 'saveError'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([saved.document], {type:'text/markdown;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'Agent.md'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <div className="am-settings am-file-settings" onClick={e => e.stopPropagation()} data-dirty={dirty ? 'true' : 'false'}>
    <div className="am-file-heading"><h2>Agent.md</h2><div className="am-file-heading-actions">{!editing && <><button aria-label={copy('downloadFile')} title={copy('download')} disabled={!saved.document} onClick={download}><Download size={16}/></button><button className="am-file-edit" onClick={startEditing}><Pencil size={14}/>{copy('edit')}</button></>}</div></div>
    <p className="am-file-description">{copy(project ? 'projectIntro' : task ? 'taskIntro' : 'personalIntro')}</p>
    <div className="am-file-shell">
      {editing ? <textarea aria-label={copy('content')} className="am-file-editor" rows={13} value={draft} onChange={e => setDraft(e.target.value)} spellCheck={false} autoFocus placeholder={copy('example')}/> : saved.document ? <pre className="am-file-content">{saved.document}</pre> : <div className="am-file-empty"><span>{copy('example')}</span></div>}
    </div>
    {editing && <div className="am-actions"><button className="am-button" onClick={() => dirty ? setDiscard(true) : setEditing(false)}>{copy('cancel')}</button><button className="am-button am-primary" disabled={!dirty || conflict} onClick={save}>{copy('save')}</button></div>}
    {conflict && <div className="am-note">{copy('conflict')}<button className="am-link" onClick={startEditing}><RotateCcw size={13}/>{copy('reload')}</button></div>}
    {notice && <p className="am-feedback" role="status">{copy(notice)}</p>}
    <Dialog open={discard} onOpenChange={setDiscard}><DialogContent className="am-dialog"><DialogTitle>{copy('discardTitle')}</DialogTitle><DialogDescription>{copy('discardDescription')}</DialogDescription><div className="am-actions"><button className="am-button" onClick={() => setDiscard(false)}>{copy('keepEditing')}</button><button className="am-button" onClick={() => {setDiscard(false);setEditing(false);}}>{copy('discard')}</button></div></DialogContent></Dialog>
  </div>;
}

export function AgentSettingsLauncher({ projectId, projectName, taskId }: {projectId?: string;projectName?: string;taskId?:string}) {
  const { t } = useLanguage();
  const copy = (key: string) => t(`agentPreferences.${key}`);
  const [open, setOpen] = useState(false);
  const [discard, setDiscard] = useState(false);
  const scope = taskId ? taskScope(taskId) : projectId ? projectScope(projectId) : personalScope;
  const close = () => {
    if (document.querySelector('.am-settings-dialog .am-file-settings[data-dirty="true"]')) {setDiscard(true);return;}
    setOpen(false);
  };
  return <><button className="am-launcher" onClick={() => setOpen(true)}><SlidersHorizontal size={15}/>{copy('title')}</button><Dialog open={open} onOpenChange={value => value ? setOpen(true) : close()}><DialogContent className="am-dialog am-settings-dialog"><DialogTitle className="sr-only">{copy('title')}</DialogTitle><DialogDescription className="sr-only">{copy('dialogDescription')}</DialogDescription><AgentMemorySettings key={scope} scope={scope} projectName={projectName}/></DialogContent></Dialog><Dialog open={discard} onOpenChange={setDiscard}><DialogContent className="am-dialog"><DialogTitle>{copy('discardTitle')}</DialogTitle><DialogDescription>{copy('discardDescription')}</DialogDescription><div className="am-actions"><button className="am-button" onClick={() => setDiscard(false)}>{copy('keepEditing')}</button><button className="am-button" onClick={() => {setDiscard(false);setOpen(false);}}>{copy('discard')}</button></div></DialogContent></Dialog></>;
}
