import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AgentMemorySettings } from './AgentMemorySettings';
import { contextSnapshot, readLocal, readSettings, saveDocument, taskScope, writeLocal } from './store';
import { useLanguage } from '../../contexts/LanguageContext';
import './agent-memory.css';

type TaskRecord = { snapshot: ReturnType<typeof contextSnapshot>; correction: string; updated: string; goal: string; progress: string; latest: string };
export function useTaskMemory(goal: string, progress: string, latest: string, projectId?: string) {
  const [id] = useState(() => new URLSearchParams(window.location.search).get('taskId') || crypto.randomUUID());
  const [record, setRecord] = useState<TaskRecord>(() => readLocal(`task:${id}`, {snapshot:contextSnapshot(projectId, id),correction:'',updated:new Date().toISOString(),goal,progress,latest}));
  const [error, setError] = useState('');
  useEffect(() => {
    if (record.correction && !readSettings(taskScope(id)).document) {
      try { saveDocument(taskScope(id), `# Agent.md\n\n${record.correction}`, '已有任务笔记'); }
      catch { setError('任务笔记暂未保存，请重试。'); }
    }
    const url = new URL(window.location.href);
    url.searchParams.set('taskId', id); url.searchParams.set('workspace', '1'); url.searchParams.set('prompt', goal);
    window.history.replaceState(window.history.state, '', url);
  }, [id, goal]);
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    setRecord(current => ({...current,goal,progress,latest,updated:new Date().toISOString()}));
  }, [goal,progress,latest]);
  useEffect(() => {
    try { writeLocal(`task:${id}`, record); setError(''); } catch { setError('任务笔记暂未保存，请检查浏览器存储空间。'); }
  }, [id,record]);
  return {record,setRecord,error,id};
}

export function TaskMemoryPanel({memory, projectContext}: {memory:ReturnType<typeof useTaskMemory>;projectContext?:{id:string;title:string}}) {
  const { t } = useLanguage();
  const copy = (key: string) => t(`agentPreferences.${key}`);
  const {record,setRecord,error,id} = memory;
  const [revision,setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision(v => v + 1);
    window.addEventListener('agent-context-changed',refresh);
    window.addEventListener('storage',refresh);
    return () => {window.removeEventListener('agent-context-changed',refresh);window.removeEventListener('storage',refresh);};
  }, []);
  const current = contextSnapshot(projectContext?.id, id);
  const stale = JSON.stringify(current.sources) !== JSON.stringify(record.snapshot.sources);
  return <section className="am-task am-task-file" aria-label={copy('taskLabel')} data-revision={revision}>
    <AgentMemorySettings scope={taskScope(id)}/>
    <details className="am-applied-files"><summary>{copy('appliedFiles')}</summary><small>{copy('priority')}</small>
      {record.snapshot.sources.map(source => {
        const legacy = source as typeof source & {instructions?:string;memories?:{text:string}[]};
        const content = source.document ?? [legacy.instructions, ...(legacy.memories || []).map(m => m.text)].filter(Boolean).join('\n\n');
        return <details key={source.name} className="am-task-source"><summary>{copy(source.scope === 'personal' || source.name === '个人' ? 'personal' : source.scope?.startsWith('project:') || source.name === '项目' ? 'project' : 'task')} / Agent.md</summary><pre>{content || copy('noContent')}</pre></details>;
      })}
      {stale && <button className="am-button" onClick={() => setRecord(r => ({...r,snapshot:contextSnapshot(projectContext?.id, id)}))}><RefreshCw size={13}/>{copy('useLatest')}</button>}
    </details>
    {error && <p role="alert">{copy('taskSaveError')}</p>}
  </section>;
}
