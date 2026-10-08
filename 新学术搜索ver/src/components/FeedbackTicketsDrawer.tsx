import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, CheckCircle2, ChevronRight, Copy, MessageSquare, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ticketIsUnread, TicketStatus, useFeedbackTickets } from '../contexts/FeedbackTicketsContext';

const statuses: Record<TicketStatus, { zh: string; en: string; style: string }> = {
  processing: { zh: '处理中', en: 'In progress', style: 'bg-blue-50 text-blue-700 border-blue-100' },
  'needs-info': { zh: '待补充', en: 'Needs information', style: 'bg-amber-50 text-amber-700 border-amber-100' },
  resolved: { zh: '已提供解决方案', en: 'Solution provided', style: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  closed: { zh: '已关闭', en: 'Closed', style: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export function FeedbackTicketsDrawer() {
  const { language } = useLanguage();
  const zh = language === 'zh';
  const { tickets, unreadCount, isOpen, selectedId, closeTickets, selectTicket, markRead, sendReply, confirmResolved, simulateReply, resetDemo } = useFeedbackTickets();
  const ticket = tickets.find(item => item.id === selectedId);
  const [filter, setFilter] = useState('all');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [copyState, setCopyState] = useState(false);
  const [moreInfo, setMoreInfo] = useState(false);
  const [newMessages, setNewMessages] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousLength = useRef(0);
  const readAtOpen = useRef(0);
  const idRef = useRef<string | null>(null);
  const latestRead = useRef(markRead);
  latestRead.current = markRead;
  const draft = ticket ? drafts[ticket.id] ?? '' : '';

  const askClose = () => {
    if (sending) return;
    if (draft.trim() && !window.confirm(zh ? '暂不发送？输入内容会在当前演示会话中保留。' : 'Leave without sending? Your draft stays in this demo session.')) return;
    closeTickets();
  };

  useEffect(() => () => { if (sendTimer.current) clearTimeout(sendTimer.current); }, []);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [isOpen]);
  useEffect(() => {
    const panel = panelRef.current;
    if (isOpen && panel && !panel.contains(document.activeElement)) panel.focus();
  }, [isOpen, selectedId]);
  useEffect(() => {
    setMoreInfo(false); setError(''); setCopyState(false); setNewMessages(false);
    idRef.current = selectedId;
    readAtOpen.current = ticket?.readThrough ?? 0;
    previousLength.current = ticket?.messages.length ?? 0;
    const frame = requestAnimationFrame(() => {
      const container = scrollRef.current;
      if (!container) return;
      const unread = container.querySelector<HTMLElement>('[data-unread="true"]');
      if (unread) unread.scrollIntoView({ block: 'center' });
      else container.scrollTop = container.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId, isOpen]);

  // Reading the list never clears unread. Only visible support messages in a foreground detail do.
  useEffect(() => {
    const root = scrollRef.current;
    if (!isOpen || !ticket || !root) return;
    const observer = new IntersectionObserver(entries => {
      if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
      entries.forEach(entry => {
        if (entry.isIntersecting) latestRead.current(ticket.id, Number((entry.target as HTMLElement).dataset.sequence));
      });
    }, { root, threshold: 0.2 });
    const observe = () => {
      observer.disconnect();
      root.querySelectorAll('[data-support="true"]').forEach(node => observer.observe(node));
    };
    observe();
    document.addEventListener('visibilitychange', observe);
    window.addEventListener('focus', observe);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', observe); window.removeEventListener('focus', observe); };
  }, [isOpen, ticket?.id, ticket?.messages]);

  useEffect(() => {
    if (!ticket || idRef.current !== ticket.id || ticket.messages.length <= previousLength.current) return;
    previousLength.current = ticket.messages.length;
    const root = scrollRef.current;
    if (!root) return;
    if (root.scrollHeight - root.scrollTop - root.clientHeight < 220) {
      requestAnimationFrame(() => { root.scrollTop = root.scrollHeight; });
    } else setNewMessages(true);
  }, [ticket?.messages.length]);

  const send = () => {
    if (!ticket || !draft.trim() || draft.length > 5000 || sending || ticket.status === 'closed') return;
    const id = ticket.id;
    const text = draft.trim();
    setSending(true); setError('');
    sendTimer.current = setTimeout(() => {
      sendReply(id, text);
      setDrafts(current => ({ ...current, [id]: '' }));
      setSending(false); setMoreInfo(false);
      requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; });
    }, 650);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); askClose(); }
    if (event.key === 'Tab' && panelRef.current) {
      const nodes = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), textarea:not(:disabled), select, [tabindex="0"]')];
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  };

  if (!isOpen) return null;
  const visibleTickets = tickets.filter(item => filter === 'all' || (filter === 'unread' ? ticketIsUnread(item) : item.status === filter));
  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={askClose} />
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="ticket-drawer-title" tabIndex={-1} onKeyDown={handleKeyDown}
        className="relative flex h-full w-full max-w-[680px] flex-col bg-white shadow-2xl outline-none">
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {ticket && <button disabled={sending} onClick={() => selectTicket(null)} aria-label={zh ? '返回我的工单' : 'Back to my tickets'} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40"><ArrowLeft className="h-4 w-4" /></button>}
            <div><h2 id="ticket-drawer-title" className="text-base font-semibold text-gray-900">{ticket ? (zh ? '工单详情' : 'Ticket details') : (zh ? '我的工单' : 'My tickets')}</h2><p className="mt-1 text-xs text-gray-500">{zh ? '查看支持团队的回复，继续跟进你的反馈' : 'Read support replies and follow up on your feedback'}</p></div>
          </div>
          <button onClick={askClose} disabled={sending} aria-label={zh ? '关闭工单' : 'Close tickets'} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-40"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-6 py-2.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Sparkles className="h-3.5 w-3.5" /><span className="font-medium text-gray-700">Mock</span>{zh ? '仅演示，不发送真实工单或邮件' : 'Demo only. No real tickets or emails.'}</span>
          <button disabled={sending} onClick={() => { resetDemo(); setDrafts({}); setFilter('all'); }} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-40"><RotateCcw className="h-3 w-3" />{zh ? '重置演示' : 'Reset demo'}</button>
        </div>
        {!ticket ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {[['all', zh ? '全部' : 'All'], ['unread', zh ? `未读回复 ${unreadCount}` : `Unread ${unreadCount}`], ['needs-info', zh ? '待补充' : 'Needs info'], ['resolved', zh ? '已提供方案' : 'Solution provided'], ['closed', zh ? '已关闭' : 'Closed']].map(([value, label]) => (
                <button key={value} onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs transition-colors ${filter === value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{label}</button>
              ))}
            </div>
            <div className="space-y-3">
              {visibleTickets.map(item => {
                const unread = ticketIsUnread(item); const status = statuses[item.status]; const last = item.messages.at(-1)!;
                return <button key={item.id} onClick={() => selectTicket(item.id)} className="w-full rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-gray-400 hover:bg-gray-50">
                  <div className="flex items-start gap-3"><div className="rounded-lg bg-gray-100 p-2.5 text-gray-600"><MessageSquare className="h-4 w-4" /></div><div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-gray-500">{item.id}</span>{unread && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">{zh ? '有新回复' : 'New reply'}</span>}</div>
                    <h3 className="mt-1.5 text-sm font-semibold text-gray-900">{zh ? item.title : item.titleEn}</h3>
                    <p className="mt-2 truncate text-xs text-gray-500">{zh ? last.text : last.textEn}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-0.5 text-[10px] ${status.style}`}>{zh ? status.zh : status.en}</span><span className="text-[10px] text-gray-400">{last.time}</span></div>
                  </div><ChevronRight className="mt-1 h-4 w-4 shrink-0 text-gray-400" /></div>
                </button>;
              })}
              {!visibleTickets.length && <div className="rounded-xl border border-dashed border-gray-200 py-14 text-center text-sm text-gray-500">{zh ? '暂无该状态的工单' : 'No tickets in this state'}</div>}
            </div>
            <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-4"><p className="text-xs text-gray-500">{zh ? '演示新的客服回复到达后，通知和未读标记如何变化。' : 'Preview a new support reply and its unread notification.'}</p><button onClick={() => simulateReply()} className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-900"><Sparkles className="h-3.5 w-3.5" />{zh ? '模拟收到新回复' : 'Simulate a new reply'}<ArrowUpRight className="h-3 w-3" /></button></div>
          </div>
        ) : (
          <>
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400"><span>{ticket.id}</span><button onClick={async () => { try { await navigator.clipboard.writeText(ticket.id); setCopyState(true); } catch { setError(zh ? '无法复制，请手动选择工单号。' : 'Copy failed. Please select the ticket number.'); } }} aria-label={zh ? '复制工单号' : 'Copy ticket number'}>{copyState ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}</button><span>·</span><span>{zh ? ticket.category : ticket.categoryEn}</span></div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">{zh ? ticket.title : ticket.titleEn}</h3>
              <div className="mt-3 flex items-center justify-between gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs ${statuses[ticket.status].style}`}>{zh ? statuses[ticket.status].zh : statuses[ticket.status].en}</span><span className="text-[11px] text-gray-400">{ticket.createdAt}</span></div>
            </div>
            <div ref={scrollRef} className="relative min-h-0 flex-1 space-y-5 overflow-y-auto bg-gray-50/50 px-6 py-5">
              {ticket.messages.map(message => <div key={message.id} data-support={message.role === 'support'} data-sequence={message.sequence} data-unread={message.role === 'support' && message.sequence > readAtOpen.current} className="space-y-2">
                {message.role === 'support' && message.sequence > readAtOpen.current && <div className="flex items-center gap-3 text-[10px] text-blue-600"><div className="h-px flex-1 bg-blue-100" />{zh ? '新的支持回复' : 'New support reply'}<div className="h-px flex-1 bg-blue-100" /></div>}
                <div className="flex items-center justify-between text-[11px] text-gray-400"><span className={`font-medium ${message.role === 'support' ? 'text-gray-900' : 'text-gray-500'}`}>{message.role === 'support' ? (zh ? 'WisPaper 支持团队' : 'WisPaper Support') : message.role === 'user' ? (zh ? '你' : 'You') : (zh ? '系统' : 'System')}</span><time>{message.time}</time></div>
                <div className={`whitespace-pre-wrap break-words rounded-xl border p-4 text-sm leading-6 ${message.role === 'support' ? 'border-gray-200 bg-white text-gray-800 shadow-sm' : message.role === 'system' ? 'border-transparent bg-gray-100 text-gray-500 text-xs' : 'border-gray-100 bg-gray-100/70 text-gray-600'}`}>{zh ? message.text : message.textEn}</div>
              </div>)}
            </div>
            {newMessages && <button onClick={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; setNewMessages(false); }} className="mx-auto -mt-9 mb-2 z-10 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs shadow">{zh ? '有新回复，点击查看' : 'New reply. Click to view'}</button>}
            <div className="border-t border-gray-200 bg-white px-6 py-4">
              {ticket.status === 'closed' ? <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-500"><CheckCircle2 className="h-4 w-4" />{zh ? '你已确认解决。工单已关闭，历史回复仍可查看。' : 'Confirmed and closed. Previous replies remain available.'}</div> : ticket.status === 'resolved' && !moreInfo ? (
                <div><p className="mb-3 text-sm text-gray-700">{zh ? '支持团队已提供方案，问题是否已解决？' : 'Support has provided a solution. Is the issue resolved?'}</p><div className="flex gap-2"><button onClick={() => confirmResolved(ticket.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs text-white hover:bg-gray-800"><CheckCircle2 className="h-3.5 w-3.5" />{zh ? '确认解决' : 'Confirm resolved'}</button><button onClick={() => { setMoreInfo(true); requestAnimationFrame(() => inputRef.current?.focus()); }} className="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 hover:bg-gray-50">{zh ? '仍有问题' : 'Still an issue'}</button></div></div>
              ) : <div><label htmlFor="ticket-reply" className="mb-2 block text-xs font-medium text-gray-700">{zh ? (ticket.status === 'needs-info' ? '请补充支持团队需要的信息' : '补充信息') : 'Add information'}</label><textarea id="ticket-reply" ref={inputRef} disabled={sending} value={draft} maxLength={5000} onChange={event => setDrafts(current => ({ ...current, [ticket.id]: event.target.value }))} placeholder={zh ? '补充操作步骤、报错信息或仍然存在的问题…' : 'Add steps, error text, or describe the remaining issue…'} className="h-24 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400" /><div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-gray-400">{zh ? '仅演示文字回复，不上传附件' : 'Text demo only. No attachment uploads.'} · {draft.length}/5000</span><button disabled={sending || !draft.trim()} onClick={send} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-4 py-2 text-xs text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-3.5 w-3.5" />{sending ? (zh ? '发送中…' : 'Sending…') : (zh ? '发送补充' : 'Send reply')}</button></div></div>}
              {error && <p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3"><p className="text-[10px] text-gray-400">{zh ? '异步反馈，无需停留等待。刷新后恢复初始演示数据。' : 'Asynchronous demo. Reloading restores the examples.'}</p>{ticket.status !== 'closed' && <button disabled={sending} onClick={() => simulateReply(ticket.id)} className="shrink-0 text-[10px] font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40">{zh ? '模拟客服回复' : 'Simulate reply'}</button>}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
