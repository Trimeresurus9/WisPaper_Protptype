export type MemoryItem = { id: string; text: string; source: string; updated: string };
export type MemorySettings = { document: string; revision: number; updated: string; author: string };
export const personalScope = 'personal';
export const projectScope = (id: string | number) => `project:${id}`;
export const taskScope = (id: string) => `task-file:${id}`;
const prefix = 'wispaper-agent-context-v1:';
export function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(prefix + key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
export function writeLocal(key: string, value: unknown) {
  localStorage.setItem(prefix + key, JSON.stringify(value));
  window.dispatchEvent(new Event('agent-context-changed'));
}
export function readSettings(scope: string): MemorySettings {
  const value = readLocal<Partial<MemorySettings> & { instructions?: string; memories?: MemoryItem[] }>(scope, {});
  // Read existing prototype data without dropping users' earlier settings.
  const legacy = [
    value.instructions?.trim() ? `## 工作要求\n${value.instructions.trim()}` : '',
    Array.isArray(value.memories) && value.memories.length ? `## 研究背景\n${value.memories.map(m => `- ${m.text}`).join('\n')}` : '',
  ].filter(Boolean).join('\n\n');
  return { document: typeof value.document === 'string' ? value.document : legacy, revision: value.revision || 0, updated: value.updated || '', author: value.author || (legacy ? '已有设置' : '') };
}
export function saveDocument(scope: string, document: string, author = '你', expectedRevision?: number) {
  const current = readSettings(scope);
  if (expectedRevision !== undefined && expectedRevision !== current.revision) throw new Error('文件已有更新。请重新载入后再编辑。');
  const next = { document, revision: current.revision + 1, updated: new Date().toISOString(), author };
  writeLocal(scope, next);
  return next;
}
export function appendDocument(scope: string, text: string, author = 'Agent') {
  const current = readSettings(scope);
  const line = text.trim();
  if (!line) return current;
  const addition = `- ${line}`;
  if (current.document.split('\n').includes(addition)) return current;
  return saveDocument(scope, current.document.trim() ? `${current.document.trim()}\n\n${addition}` : `# Agent.md\n\n${addition}`, author, current.revision);
}
export function contextSnapshot(projectId?: string, taskId?: string) {
  const sources = [
    { name: '个人', scope: personalScope },
    ...(projectId ? [{ name: '项目', scope: projectScope(projectId) }] : []),
    ...(taskId ? [{ name: '当前任务', scope: taskScope(taskId) }] : []),
  ].map(source => ({ ...source, ...readSettings(source.scope) }));
  return { captured: new Date().toISOString(), priority: '当前任务 > 项目 > 个人', sources };
}
// Local interaction demo only: explicit requests are saved; no real model is connected.
export function handleMemoryRequest(input: string, projectId: string | undefined, taskId: string) {
  const asksRead = /记了什么|记了啥|记住了什么|查看.*(?:记忆|偏好|AGENTS?\.md)|(?:展示|看看|给我看).*?(?:记忆|偏好|AGENTS?\.md)/i.test(input);
  const asksWrite = /记住|记下来|保存到.*(?:记忆|偏好|AGENTS?\.md)|写入.*(?:记忆|偏好|AGENTS?\.md)/i.test(input);
  if (!asksRead && !asksWrite) return null;
  const personal = /全局|个人/.test(input);
  const task = /当前任务|本次任务|这个任务/.test(input);
  const scope = personal ? personalScope : task ? taskScope(taskId) : projectId ? projectScope(projectId) : personalScope;
  const name = personal ? '个人' : task ? '当前任务' : projectId ? '项目' : '个人';
  if (asksRead) return `${name} Agent.md\n\n${readSettings(scope).document || '暂无内容。'}`;
  const content = input.replace(/^.*?(?:记住|记下来|保存到[^：:，,。\n]*(?:记忆|偏好|AGENTS?\.md)|写入[^：:，,。\n]*(?:记忆|偏好|AGENTS?\.md))[：:，,\s]*/i, '').trim();
  if (!content || content === input) return '请告诉我需要保存的内容，例如：“帮我记住：所有结论都需要附论文来源。”';
  try { appendDocument(scope, content); return `已写入${name} Agent.md。你可以在 Agent偏好中查看或编辑。`; }
  catch { return '暂未保存，请检查浏览器存储空间后重试。'; }
}
