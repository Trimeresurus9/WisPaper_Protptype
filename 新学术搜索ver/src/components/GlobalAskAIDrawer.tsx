import React from 'react';
import { ArrowUp, ChevronDown, FileText, History, Plus, Sparkles, X } from 'lucide-react';
import { usePrototypeAuth } from '../lib/usePrototypeAuth';
import { useGlobalAskAIHistory } from '../lib/useGlobalAskAIHistory';

type Message = { role: 'user' | 'assistant'; text: string };
type Session = { id: string; title: string; time: string; source: string; messages: Message[] };

export function GlobalAskAIDrawer({ page }: { page: string }) {
  const { isAuthenticated, setAuthenticated } = usePrototypeAuth();
  const { sessions: globalSessions, latestForScene, upsertSession } = useGlobalAskAIHistory(page);
  const historyInitialized = React.useRef(false);
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [source, setSource] = React.useState('Product Help');
  const [sourceOpen, setSourceOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([{ role: 'assistant', text: '你好，我可以回答 WisPaper 产品功能和使用方法。' }]);
  const [sessionId, setSessionId] = React.useState(() => `${page}-${Date.now()}`);
  const [sessions, setSessions] = React.useState<Session[]>([
    { id: 'global-guide', title: '这个页面可以做什么？', time: '今天 11:08', source: 'Product Help', messages: [{ role: 'user', text: '这个页面可以做什么？' }, { role: 'assistant', text: '我可以根据当前页面介绍相关功能，并告诉你下一步如何操作。' }] },
  ]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setSource('Product Help');
      setSourceOpen(false);
      setHistoryOpen(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    if (!isAuthenticated || historyInitialized.current) return;
    historyInitialized.current = true;
    if (latestForScene) {
      setSessionId(latestForScene.id);
      setSource(latestForScene.source);
      setMessages(latestForScene.messages as Message[]);
    }
  }, [isAuthenticated, latestForScene]);

  React.useEffect(() => {
    if (!isAuthenticated) { historyInitialized.current = false; return; }
    const firstQuestion = messages.find((message) => message.role === 'user')?.text;
    if (!firstQuestion) return;
    upsertSession({ id: sessionId, scene: page, pageLabel: page, title: firstQuestion, source, messages });
  }, [isAuthenticated, messages, page, sessionId, source, upsertSession]);

  const send = () => {
    if (!isAuthenticated) return;
    const question = input.trim();
    if (!question) return;
    const answer = source === 'Product Help'
      ? `我会基于 WisPaper Product Help 回答。当前页面为“${page}”，你可以继续询问该页面的功能、入口和操作步骤。`
      : `我会结合“${source}”与当前页面上下文回答。`;
    setMessages((items) => [...items, { role: 'user', text: question }, { role: 'assistant', text: answer }]);
    setInput('');
  };

  const startNew = () => {
    if (!isAuthenticated) return;
    setSessionId(`${page}-${Date.now()}`);
    setMessages([{ role: 'assistant', text: `已开启新对话。当前知识来源为“${source}”。` }]);
    setInput('');
    setHistoryOpen(false);
  };

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-[45] flex h-14 items-center gap-2 rounded-full bg-[#1b87ff] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_-14px_rgba(27,135,255,.8)] transition hover:-translate-y-0.5 hover:bg-blue-600"><Sparkles className="h-4 w-4" />Ask AI</button>;

  return <aside className="fixed bottom-5 right-5 z-[46] flex h-[min(680px,calc(100vh-40px))] w-[min(410px,calc(100vw-40px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_90px_-24px_rgba(15,23,42,.45)]">
    <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><Sparkles className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-slate-950">Ask AI</p><p className="text-[11px] text-slate-400">产品问答与使用引导</p></div></div><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button></header>
    {isAuthenticated && <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2"><button type="button" onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"><Plus className="h-3.5 w-3.5" />新对话</button><button type="button" onClick={() => setHistoryOpen((value) => !value)} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium ${historyOpen ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}><History className="h-4 w-4" />历史对话</button></div>}
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-5">{!isAuthenticated ? <div className="flex h-full items-center justify-center"><div className="max-w-xs text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Sparkles className="h-5 w-5" /></span><h3 className="mt-4 text-base font-semibold text-slate-900">登录后使用 Ask AI</h3><p className="mt-2 text-sm leading-6 text-slate-500">登录后可以基于当前页面、学术搜索和个人知识库提问，并在所有页面查看统一的对话历史。</p><button type="button" onClick={() => setAuthenticated(true)} className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">登录 / 注册</button></div></div> : historyOpen ? <div><p className="mb-2 text-[11px] text-slate-400">{globalSessions.length} 个全局历史对话</p><div className="divide-y divide-slate-200">{globalSessions.map((session) => <button key={session.id} type="button" onClick={() => { setSessionId(session.id); setMessages(session.messages as Message[]); setSource(session.source); setHistoryOpen(false); }} className="w-full py-3 text-left"><span className="block truncate text-sm font-medium text-slate-800">{session.title}</span><span className="mt-1 block text-[10px] text-slate-400">{session.pageLabel} · {session.source} · {session.time}</span></button>)}</div></div> : messages.map((message, index) => <div key={`${message.role}-${index}`} className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${message.role === 'user' ? 'ml-auto bg-[#1b87ff] text-white' : 'border border-slate-200 bg-white text-slate-700 shadow-sm'}`}>{message.text}</div>)}</div>
    <footer className="border-t border-slate-100 bg-white p-3">
      {isAuthenticated && <div className="rounded-2xl border border-slate-200 p-2 shadow-sm"><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} rows={2} placeholder="询问产品功能或使用方法…" className="w-full resize-none px-2 py-1 text-sm leading-6 outline-none placeholder:text-slate-400" /><div className="flex items-center justify-between"><div className="relative"><button type="button" onClick={() => setSourceOpen((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100"><FileText className="h-3.5 w-3.5" />{source}<ChevronDown className="h-3 w-3" /></button>{sourceOpen && <div className="absolute bottom-10 left-0 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{['Product Help', '当前页面', '我的知识库', 'Web 资源'].map((item) => <button key={item} type="button" onClick={() => { setSource(item); setSourceOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-xs ${source === item ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>{item}</button>)}</div>}</div><button type="button" onClick={send} disabled={!input.trim()} className="grid h-8 w-8 place-items-center rounded-xl bg-[#1b87ff] text-white disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button></div></div>}
    </footer>
  </aside>;
}
