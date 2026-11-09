import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, BookOpen, Check, ChevronDown, FileText, History, MessageCircle, Paperclip, Plus, Sparkles, X } from 'lucide-react';
import type { OnboardingController, OnboardingPage, SavedGuide } from '../onboarding/useOnboarding';
import { id, mockAnswer, readStore, sourceLabels, STORAGE_KEY, type AgentContext, type ContextRef, type FileRef, type SearchContext, type Session, type Source } from './model';
import { OnboardingGuideCard } from './OnboardingGuideCard';
import './ask-ai.css';

type Scenario = 'normal' | 'error' | 'unavailable';
type Props = { children: React.ReactNode; view: string; agentTaskActive: boolean; search: SearchContext; onboarding: OnboardingController; onResume: (guide: SavedGuide) => void; onSearch: (query: string) => void; onAgent: (query: string) => void };
function useController(props: Props) {
  const [store, setStore] = useState(readStore);
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState(false);
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [library, setLibrary] = useState<{ selected: FileRef[]; available: FileRef[] }>({ selected: [], available: [] });
  const [agent, setAgent] = useState<AgentContext | null>(null);
  const [guideNotice, setGuideNotice] = useState<{ page: OnboardingPage; text: string } | null>(null);
  const [unreadPage, setUnreadPage] = useState<OnboardingPage | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const isSearch = props.view === 'list';
  const isAgent = props.view === 'academic-agent';
  const isLibrary = props.view === 'library';
  const guidePage = props.onboarding.available ? props.onboarding.page : null;
  const currentGuides = props.onboarding.state.savedGuides.filter(guide => guide.page === guidePage);
  const notice = currentGuides.length && guideNotice?.page === guidePage ? guideNotice.text : '';
  const unread = guidePage !== null && unreadPage === guidePage;
  const clearGuideNotice = useCallback(() => { setGuideNotice(null); setUnreadPage(null); }, []);
  const scope = isSearch ? `search:${props.search.id}` : isAgent ? `agent:${props.agentTaskActive && agent ? agent.id : 'start'}` : isLibrary ? 'library' : 'global';
  const defaultSource: Source = isSearch ? 'search_session' : isAgent ? 'agent_status' : 'product_help';
  const sources: Source[] = isSearch ? ['search_session', 'product_help'] : isAgent ? ['agent_status', 'product_help'] : isLibrary ? ['product_help', 'selected_files', 'library', 'web'] : ['product_help', 'library', 'web'];
  const session = store.sessions.find(s => s.id === store.active[scope]);
  const contextFor = (source: Source): ContextRef => source === 'search_session' ? { search: props.search } : source === 'agent_status' ? { agent: props.agentTaskActive ? agent || undefined : undefined } : source === 'selected_files' ? { files: library.selected } : {};
  const makeSession = (): Session => ({ id: id(), scope, title: '新对话', createdAt: Date.now(), updatedAt: Date.now(), source: defaultSource, context: contextFor(defaultSource), messages: [], draft: '' });
  useEffect(() => {
    setHistory(false);
    setStore(s => {
      if (s.sessions.some(item => item.id === s.active[scope])) return s;
      const next = makeSession();
      return { sessions: [...s.sessions, next], active: { ...s.active, [scope]: next.id } };
    });
  }, [scope]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch {} }, [store]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);
  useEffect(() => { if (!guideNotice) return; const timer = setTimeout(() => setGuideNotice(null), 4500); return () => clearTimeout(timer); }, [guideNotice]);
  const latestGuide = props.onboarding.state.savedGuides[0];
  const seenGuide = useRef(latestGuide?.savedAt || 0);
  useEffect(() => {
    if (latestGuide && latestGuide.savedAt > seenGuide.current) { setUnreadPage(latestGuide.page); setGuideNotice({ page: latestGuide.page, text: '引导已收进 Ask AI' }); }
    seenGuide.current = latestGuide?.savedAt || 0;
  }, [latestGuide]);
  useEffect(() => { if (props.onboarding.active) setOpen(false); }, [props.onboarding.active, props.onboarding.animationVersion]);
  const patch = (changes: Partial<Session>, sessionId = session?.id) => setStore(s => ({ ...s, sessions: s.sessions.map(item => item.id === sessionId ? { ...item, ...changes, updatedAt: Date.now() } : item) }));
  const newChat = () => {
    if (session && !session.messages.length) { patch({ draft: '', source: defaultSource, context: contextFor(defaultSource) }); setHistory(false); return; }
    const next = makeSession();
    setStore(s => ({ sessions: [...s.sessions, next], active: { ...s.active, [scope]: next.id } }));
    setHistory(false);
  };
  const openChat = (source?: Source) => { if (props.onboarding.active) props.onboarding.dismiss(); setOpen(true); setHistory(false); clearGuideNotice(); if (source) patch({ source, context: contextFor(source) }); };
  const restore = (item: Session) => { setStore(s => ({ ...s, active: { ...s.active, [scope]: item.id } })); setHistory(false); };
  const changeSource = (source: Source) => patch({ source, context: { ...contextFor(source), attachments: session?.context.attachments } });
  const selectedUnavailable = session?.source === 'selected_files' && !!session.context.files?.some(file => !library.available.some(item => item.id === file.id));
  const unavailable = scenario === 'unavailable' && session?.source !== 'product_help' || selectedUnavailable;
  const emptyFiles = session?.source === 'selected_files' && !session.context.files?.length && !session.context.attachments?.length;
  const runAnswer = (sessionId: string, messageId: string, question: string, source: Source, context: ContextRef) => {
    const response = mockAnswer(question, source, context);
    const fail = scenario === 'error';
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setStore(s => ({ ...s, sessions: s.sessions.map(item => item.id === sessionId ? { ...item, updatedAt: Date.now(), messages: item.messages.map(m => m.id === messageId ? { ...m, ...response, status: fail ? 'failed' : 'done' } : m) } : item) }));
    }, 850);
    timers.current.add(timer);
  };
  const send = (text = session?.draft || '') => {
    const question = text.trim();
    if (!session || !question || session.messages.some(m => m.status === 'pending') || unavailable || emptyFiles) return;
    const source = session.source;
    const context = source === 'agent_status' || source === 'search_session' ? contextFor(source) : session.context;
    const answerId = id();
    patch({ title: session.messages.length ? session.title : question, draft: '', context, messages: [...session.messages, { id: id(), role: 'user', text: question, source, context }, { id: answerId, role: 'assistant', text: '', source, context, status: 'pending' }] });
    runAnswer(session.id, answerId, question, source, context);
  };
  const retry = (messageId: string) => {
    if (!session) return;
    const index = session.messages.findIndex(m => m.id === messageId), message = session.messages[index];
    if (!message || index < 1) return;
    patch({ messages: session.messages.map(m => m.id === messageId ? { ...m, status: 'pending' } : m) });
    runAnswer(session.id, messageId, session.messages[index - 1].text, message.source, message.context);
  };
  const publishLibrary = useCallback((value: { selected: FileRef[]; available: FileRef[] }) => setLibrary(value), []);
  const publishAgent = useCallback((value: AgentContext | null) => setAgent(value), []);
  return { ...props, store, session, scope, open, setOpen, history, setHistory, scenario, setScenario, sources, isSearch, isAgent, isLibrary, openChat, newChat, restore, changeSource, patch, send, retry, unavailable, emptyFiles, library, publishLibrary, publishAgent, currentGuides, guidePage, notice, unread, clearGuideNotice };
}
const Context = createContext<ReturnType<typeof useController> | null>(null);
export const useAskAI = () => { const value = useContext(Context); if (!value) throw new Error('AskAIProvider is required'); return value; };
export function AskAIProvider(props: Props) {
  const controller = useController(props);
  return <Context.Provider value={controller}>{props.children}<AskAIOverlay /></Context.Provider>;
}
export function AskAIPanel({ onClose }: { onClose?: () => void }) {
  const c = useAskAI();
  const { session } = c;
  const input = useRef<HTMLTextAreaElement>(null);
  const messages = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus({ preventScroll: true }); }, [session?.id, c.history]);
  useEffect(() => { if (messages.current) messages.current.scrollTop = session?.messages.length ? messages.current.scrollHeight : 0; }, [session?.messages, c.history]);
  if (!session) return null;
  const pending = session.messages.some(m => m.status === 'pending');
  const suggestions = c.isAgent ? ['当前任务进行到哪一步？', '如何选择 Skill？'] : c.isSearch ? ['概括这次搜索的结果', '基于这些结果生成 Survey'] : c.isLibrary ? ['如何批量整理文献？', '如何选择文献提问？'] : ['如何开始文献搜索？', 'Agent 可以帮我做什么？'];
  return <section className="wp-ai-panel" aria-label="Ask AI 对话" onKeyDown={e => { if (e.key === 'Escape' && onClose) { e.stopPropagation(); onClose(); } }}>
    <header className="wp-ai-header"><span className="wp-ai-mark"><Sparkles size={18} /></span><div><h2>Ask AI</h2><p>{c.isAgent ? '了解任务进度与状态' : c.isSearch ? '基于当前搜索继续提问' : '产品问答与使用引导'}</p></div>{onClose && <button className="wp-ai-icon" aria-label="关闭 Ask AI" onClick={onClose}><X size={18} /></button>}</header>
    <nav className="wp-ai-toolbar" aria-label="Ask AI 会话操作"><button onClick={c.newChat}><Plus size={14} />新对话</button><button aria-pressed={c.history} onClick={() => c.setHistory(!c.history)}><History size={14} />历史对话</button><span>演示</span></nav>
    {c.history ? <div className="wp-ai-scroll"><button className="wp-ai-back" onClick={() => c.setHistory(false)}><ArrowLeft size={14} />返回对话</button><h3>历史对话</h3>{c.store.sessions.filter(s => s.scope === c.scope && s.messages.some(m => m.role === 'user')).sort((a, b) => b.updatedAt - a.updatedAt).map(item => <button key={item.id} className="wp-ai-history-item" onClick={() => c.restore(item)}><strong>{item.title}</strong><span>{sourceLabels[item.source]} · {new Date(item.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span><ArrowRight size={15} /></button>)}{!c.store.sessions.some(s => s.scope === c.scope && s.messages.length) && <p className="wp-ai-empty">开始提问后，对话会保存在这里。</p>}</div> : <>
      <div ref={messages} className="wp-ai-scroll" aria-live="polite">
        {!session.messages.length && <div className={`wp-ai-welcome ${c.currentGuides.length ? 'has-guides' : ''}`}><h3>有什么可以帮你？</h3><p>{c.isAgent ? '随时了解进度，不打断研究任务。' : '从一个问题开始，继续当前的研究。'}</p>{!c.currentGuides.length && <div className="wp-ai-suggestions">{suggestions.map(q => <button key={q} onClick={() => { c.patch({ draft: q }); input.current?.focus(); }}>{q}<ArrowRight size={13} /></button>)}</div>}</div>}
        {!!c.currentGuides.length && <details className="wp-ai-guides" open={!session.messages.length}><summary className="wp-ai-section-label">继续了解<span>{c.currentGuides.length} 个已收起的引导</span></summary>{c.currentGuides.map(guide => <OnboardingGuideCard key={guide.id} guide={guide} onResume={() => { c.setOpen(false); c.onResume(guide); }} />)}</details>}
        {session.messages.map(message => <div key={message.id} className={`wp-ai-message is-${message.role}`}>
          {message.role === 'assistant' && <div className="wp-ai-byline"><Sparkles size={13} />Ask AI<span>{sourceLabels[message.source]}</span></div>}
          {message.status === 'pending' ? <p className="wp-ai-pending" role="status">正在整理回答<span>···</span></p> : message.status === 'failed' ? <div className="wp-ai-failure"><p>暂时未能生成回答，问题已保留。</p><button disabled={pending} onClick={() => c.retry(message.id)}>重试</button></div> : <><p>{message.text}</p>{message.action && <button className="wp-ai-action" onClick={() => message.action === 'search' ? c.onSearch(session.messages[session.messages.indexOf(message) - 1].text) : c.onAgent(session.messages[session.messages.indexOf(message) - 1].text)}>{message.action === 'search' ? '继续搜索' : '交给 Agent'}<ArrowRight size={14} /></button>}</>}
        </div>)}
      </div>
      <footer className="wp-ai-composer">
        {(c.unavailable || c.emptyFiles) && <p className="wp-ai-context-warning" role="status">{c.unavailable ? '原上下文已不可用，请更换来源。' : '请先选择文献或添加附件。'}</p>}
        {session.source === 'selected_files' && !!session.context.files?.length && <div className="wp-ai-files">{session.context.files.map(file => <span key={file.id} title={file.title}><FileText size={12} />{file.title}</span>)}{JSON.stringify(session.context.files) !== JSON.stringify(c.library.selected) && <button onClick={() => c.changeSource('selected_files')}>使用当前选择</button>}</div>}
        {!!session.context.attachments?.length && <div className="wp-ai-files">{session.context.attachments.map(name => <span key={name}><Paperclip size={12} />{name}<button aria-label={`移除附件 ${name}`} onClick={() => c.patch({ context: { ...session.context, attachments: session.context.attachments?.filter(item => item !== name) } })}><X size={12} /></button></span>)}</div>}
        <div className="wp-ai-input-box"><textarea ref={input} aria-label="向 Ask AI 提问" value={session.draft} placeholder="向 Ask AI 提问…" onChange={e => c.patch({ draft: e.target.value })} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); c.send(); } }} /><div className="wp-ai-input-bottom"><label className="wp-ai-source"><BookOpen size={13} /><select aria-label="Ask AI 知识来源" value={session.source} onChange={e => c.changeSource(e.target.value as Source)}>{c.sources.map(source => <option key={source} value={source}>{sourceLabels[source]}</option>)}</select><ChevronDown size={12} /></label>{c.isLibrary && <><input ref={fileInput} type="file" multiple hidden onChange={e => { const names = [...(e.target.files || [])].map(file => file.name); c.patch({ context: { ...session.context, attachments: [...new Set([...(session.context.attachments || []), ...names])] } }); e.target.value = ''; }} /><button className="wp-ai-icon" aria-label="添加 Ask AI 附件" onClick={() => fileInput.current?.click()}><Paperclip size={15} /></button></>}<button className="wp-ai-send" aria-label="发送 Ask AI 问题" disabled={!session.draft.trim() || pending || c.unavailable || c.emptyFiles} onClick={() => c.send()}><ArrowUp size={17} /></button></div></div>
        <small className="wp-ai-disclaimer">示例回答 · 仅保存在当前浏览器</small>
      </footer>
    </>}
  </section>;
}
function AskAIOverlay() {
  const c = useAskAI();
  const launcher = useRef<HTMLButtonElement>(null);
  const embedded = c.isSearch || c.isAgent && c.agentTaskActive;
  const close = () => { c.setOpen(false); requestAnimationFrame(() => launcher.current?.focus()); };
  useEffect(() => { document.body.classList.toggle('wp-ai-chat-open', c.open && !embedded); return () => document.body.classList.remove('wp-ai-chat-open'); }, [c.open, embedded]);
  useEffect(() => { if (c.open) { c.clearGuideNotice(); window.dispatchEvent(new Event('wispaper:ask-ai-open')); } }, [c.open, c.guidePage, c.clearGuideNotice]);
  if (embedded) return null;
  return <div className="wp-ai-overlay" data-ask-ai-overlay>
    {c.notice && !c.open && <button className="wp-ai-toast" onClick={() => c.openChat()}><Check size={14} />{c.notice}<ArrowRight size={13} /></button>}
    {c.open ? <div className="wp-ai-drawer" role="dialog" aria-label="Ask AI 悬浮聊天"><AskAIPanel onClose={close} /></div> : <button ref={launcher} className="wp-ai-launcher" aria-label="打开 Ask AI" aria-expanded={false} onClick={() => c.openChat()}><MessageCircle size={19} /><span>Ask AI</span>{!!c.currentGuides.length && <span className={`wp-ai-badge ${c.unread ? 'is-new' : ''}`}>{c.currentGuides.length}</span>}</button>}
  </div>;
}
export function AskAIMockControls() {
  const c = useAskAI();
  return <label className="wp-ai-mock-control">Ask AI Mock<select aria-label="Ask AI Mock 状态" value={c.scenario} onChange={e => c.setScenario(e.target.value as Scenario)}><option value="normal">正常回答</option><option value="error">回答失败</option><option value="unavailable">上下文失效</option></select></label>;
}
