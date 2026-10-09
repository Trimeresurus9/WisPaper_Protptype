import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, CheckCircle2, ChevronRight, FileImage, ImagePlus, Plus, Send, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { isValidEmail } from '../utils/email';
import { ticketIsUnread, useFeedbackTickets } from '../contexts/FeedbackTicketsContext';

interface LocalAttachment { id: string; name: string; url: string }

const feedbackTypes = [
  { value: 'feature', zh: '功能建议', en: 'Feature request' },
  { value: 'bug', zh: 'Bug 反馈', en: 'Bug report' },
  { value: 'experience', zh: '体验问题', en: 'UX issue' },
  { value: 'other', zh: '其他', en: 'Other' },
];

// BBS/forum style: the dialog opens on the issue list; "New issue" opens a form;
// each issue is a post (title, description, screenshots, contact) with replies
// appended below as comments — no tabs and no chat bubbles.
export function FeedbackModal() {
  const { language } = useLanguage();
  const zh = language === 'zh';
  const { tickets, isOpen, selectedId, closeTickets, selectTicket, markRead, sendReply, createTicket, confirmResolved, simulateReply } = useFeedbackTickets();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [category, setCategory] = useState('feature');
  const [content, setContent] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<LocalAttachment[]>([]);
  const [replySending, setReplySending] = useState(false);
  const [moreInfo, setMoreInfo] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [newMessages, setNewMessages] = useState(false);
  const attachmentUrls = useRef(new Set<string>());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedTicket = tickets.find(ticket => ticket.id === selectedId) ?? null;
  const categoryOption = feedbackTypes.find(item => item.value === category);

  useEffect(() => {
    if (!isOpen) return;
    setView('list');
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [isOpen]);

  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
    attachmentUrls.current.forEach(url => URL.revokeObjectURL(url));
    attachmentUrls.current.clear();
  }, []);

  useEffect(() => {
    setMoreInfo(false);
    setReplyError('');
    setNewMessages(false);
    setReplyAttachments(current => {
      current.forEach(item => { URL.revokeObjectURL(item.url); attachmentUrls.current.delete(item.url); });
      return [];
    });
    if (!selectedTicket) return;
    const frame = requestAnimationFrame(() => {
      const root = threadRef.current;
      if (root) root.scrollTop = 0;
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);

  useEffect(() => {
    const root = threadRef.current;
    if (!isOpen || !selectedTicket || !root) return;
    const observer = new IntersectionObserver(entries => {
      if (!document.hasFocus()) return;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const sequence = Number((entry.target as HTMLElement).dataset.sequence ?? '0');
        if (sequence > 0) markRead(selectedTicket.id, sequence);
      });
    }, { root, threshold: 0.2 });
    root.querySelectorAll('[data-support="true"]').forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [isOpen, selectedTicket?.id, selectedTicket?.messages, markRead]);

  useEffect(() => {
    const root = threadRef.current;
    if (!root || !selectedTicket) return;
    if (root.scrollHeight - root.scrollTop - root.clientHeight < 220) {
      requestAnimationFrame(() => { root.scrollTop = root.scrollHeight; });
    } else setNewMessages(true);
  }, [selectedTicket?.messages.length]);

  const pickImages = (event: React.ChangeEvent<HTMLInputElement>, current: LocalAttachment[], apply: (items: LocalAttachment[]) => void, onError: (message: string) => void) => {
    const selected = Array.from(event.target.files ?? []);
    const remaining = Math.max(0, 3 - current.length);
    const accepted = selected.filter(file => file.type.startsWith('image/')).slice(0, remaining);
    const rejected = selected.length - accepted.length;
    const additions = accepted.map(file => {
      const url = URL.createObjectURL(file);
      attachmentUrls.current.add(url);
      return { id: `${Date.now()}-${Math.random()}`, name: file.name, url };
    });
    apply([...current, ...additions]);
    onError(rejected ? (zh ? '仅支持图片，且最多添加 3 张。' : 'Images only; up to 3 screenshots.') : '');
    event.target.value = '';
  };

  const removeAttachment = (items: LocalAttachment[], id: string, apply: (items: LocalAttachment[]) => void) => {
    const removed = items.find(item => item.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.url);
      attachmentUrls.current.delete(removed.url);
    }
    apply(items.filter(item => item.id !== id));
  };

  const attachmentPicker = (items: LocalAttachment[], apply: (items: LocalAttachment[]) => void, inputRef: React.RefObject<HTMLInputElement | null>, compact = false) => (
    <div className="flex flex-wrap gap-2">
      {items.map(item => <div key={item.id} className={`group relative overflow-hidden rounded-lg border border-gray-200 bg-white ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}>
        <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
        <button type="button" onClick={() => removeAttachment(items, item.id, apply)} aria-label={zh ? `移除截图 ${item.name}` : `Remove ${item.name}`} className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100">×</button>
      </div>)}
      {items.length < 3 && <button type="button" onClick={() => inputRef.current?.click()} aria-label={zh ? '添加截图' : 'Add screenshot'} className={`flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-400 transition hover:border-gray-400 hover:text-gray-600 ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}><ImagePlus className={compact ? 'h-4 w-4' : 'h-5 w-5'} /></button>}
    </div>
  );

  const resetForm = () => {
    attachments.forEach(item => {
      URL.revokeObjectURL(item.url);
      attachmentUrls.current.delete(item.url);
    });
    setCategory('feature');
    setContent('');
    setContactEmail('');
    setEmailError('');
    setAttachments([]);
    setFormError('');
  };

  const submitFeedback = () => {
    if (!categoryOption) {
      setFormError(zh ? '请选择所属分类。' : 'Please select a category.');
      return;
    }
    if (!content.trim()) {
      setFormError(zh ? '请填写反馈内容。' : 'Please describe your feedback.');
      return;
    }
    if (contactEmail.trim() && !isValidEmail(contactEmail.trim())) {
      setEmailError(zh ? '请输入有效的邮箱地址。' : 'Enter a valid email address.');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    window.setTimeout(() => {
      const firstLine = content.trim().split(/\r?\n/)[0];
      const title = `${categoryOption.zh}：${firstLine}`.slice(0, 80);
      const id = createTicket({
        title,
        titleEn: title,
        category: categoryOption.zh,
        categoryEn: categoryOption.en,
        content: content.trim(),
        contact: contactEmail.trim(),
        attachmentNames: attachments.map(item => item.name),
      });
      setIsSubmitting(false);
      resetForm();
      setView('list');
      selectTicket(id);
    }, 450);
  };

  const sendReplyNow = () => {
    if (!selectedTicket || !replyDraft.trim() || replyDraft.length > 5000 || replySending || selectedTicket.status === 'closed') return;
    const id = selectedTicket.id;
    const text = replyDraft.trim();
    const names = replyAttachments.map(item => item.name);
    setReplySending(true);
    setReplyError('');
    replyTimer.current = window.setTimeout(() => {
      sendReply(id, text, names);
      setReplyDraft('');
      setReplyAttachments(current => {
        current.forEach(item => { URL.revokeObjectURL(item.url); attachmentUrls.current.delete(item.url); });
        return [];
      });
      setReplySending(false);
      setMoreInfo(false);
      requestAnimationFrame(() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; });
    }, 550);
  };

  const close = () => {
    if (replySending || isSubmitting) return;
    closeTickets();
  };

  const goBack = () => {
    if (view === 'form') {
      resetForm();
      setView('list');
    } else {
      selectTicket(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    }
    if (event.key === 'Tab' && dialogRef.current) {
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  };

  const sortedTickets = useMemo(() => [...tickets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [tickets]);

  if (!isOpen) return null;

  const headerTitle = view === 'form'
    ? (zh ? '新建问题' : 'New issue')
    : selectedTicket
      ? (zh ? selectedTicket.title : selectedTicket.titleEn)
      : (zh ? '问题反馈' : 'Feedback');

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-3 sm:p-6">
      <button aria-label={zh ? '关闭反馈窗口' : 'Close feedback'} className="absolute inset-0 bg-black/45" onClick={close} />
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="feedback-center-title" tabIndex={-1} onKeyDown={handleKeyDown} className="relative flex h-[min(720px,calc(100vh-24px))] w-[min(680px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl bg-[#f7f8fa] shadow-2xl outline-none">
        <header className="relative flex h-12 shrink-0 items-center justify-center border-b border-gray-200 bg-white px-12">
          {(view === 'form' || selectedTicket) && <button onClick={goBack} aria-label={zh ? '返回问题列表' : 'Back to list'} className="absolute left-3 inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"><ArrowLeft className="h-4 w-4" />{zh ? '返回' : 'Back'}</button>}
          <h2 id="feedback-center-title" className="max-w-[70%] truncate text-base font-semibold text-gray-900">{headerTitle}</h2>
          <button onClick={close} aria-label={zh ? '关闭' : 'Close'} className="absolute right-4 rounded-md p-1.5 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </header>

        {view === 'form' ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
            <div className="mx-auto max-w-[520px] space-y-5">
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-gray-800">{zh ? '反馈类型' : 'Feedback type'}</legend>
                <div className="flex flex-wrap gap-2">
                  {feedbackTypes.map(item => <button key={item.value} type="button" aria-pressed={category === item.value} onClick={() => setCategory(item.value)} className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${category === item.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {zh ? item.zh : item.en}
                  </button>)}
                </div>
              </fieldset>

              <label className="block text-sm font-medium text-gray-800">
                <span className="mb-2 block">{zh ? '详细描述' : 'Description'}</span>
                <textarea value={content} onChange={event => setContent(event.target.value)} placeholder={zh ? '请描述你遇到的问题或建议…' : 'Describe the issue or suggestion…'} className="h-32 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 text-sm font-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400" />
              </label>

              <div>
                <div className="mb-2 text-sm font-medium text-gray-800">{zh ? '截图（可选，最多 3 张）' : 'Screenshots (optional, max 3)'}</div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" multiple onChange={event => pickImages(event, attachments, setAttachments, setFormError)} className="hidden" />
                {attachmentPicker(attachments, setAttachments, fileInputRef)}
              </div>

              <label className="block text-sm font-medium text-gray-800">{zh ? '联系邮箱（可选）' : 'Contact email (optional)'}
                <input type="email" value={contactEmail} onChange={event => { setContactEmail(event.target.value); if (!event.target.value.trim() || isValidEmail(event.target.value.trim())) setEmailError(''); }} placeholder={zh ? '方便我们与您联系' : 'For follow-up, if needed'} className="mt-2 h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3.5 text-sm font-normal text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400" />
                {emailError && <span role="alert" className="mt-1 block text-xs text-red-600">{emailError}</span>}
              </label>

              {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
              <button disabled={isSubmitting || !content.trim() || !!emailError} onClick={submitFeedback} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-45">
                {isSubmitting ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send className="h-4 w-4" />}
                {isSubmitting ? (zh ? '正在提交…' : 'Submitting…') : (zh ? '提交反馈' : 'Submit feedback')}
              </button>
              <p className="text-center text-xs text-gray-400">{zh ? '提交后可在问题列表中查看回复。' : 'Replies appear in the issue list.'}</p>
            </div>
          </div>
        ) : selectedTicket ? (
          <>
            <div ref={threadRef} className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto max-w-[640px] px-4 py-5 sm:px-6">
                <h3 className="text-base font-semibold leading-6 text-gray-900">{zh ? selectedTicket.title : selectedTicket.titleEn}</h3>
                {selectedTicket.messages.map((message, index) => (
                  <article key={message.id} data-support={message.role === 'support'} data-sequence={message.sequence} className="border-b border-gray-200 py-4 last:border-b-0">
                    {message.role === 'support' && message.sequence > selectedTicket.readThrough && <div className="mb-2 flex items-center gap-3 text-[10px] text-blue-600"><span className="h-px flex-1 bg-blue-100" />{zh ? '新回复' : 'New reply'}<span className="h-px flex-1 bg-blue-100" /></div>}
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{message.role === 'support' ? (zh ? 'WisPaper 支持团队' : 'WisPaper Support') : message.role === 'system' ? (zh ? '系统' : 'System') : (zh ? '我' : 'You')}</span>
                      <time className="text-[11px] text-gray-400">{message.time}</time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">{zh ? message.text : message.textEn}</p>
                    {!!message.attachmentNames?.length && <div className="mt-2 flex flex-wrap gap-1.5">
                      {message.attachmentNames.map(name => <span key={name} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800"><FileImage className="h-3.5 w-3.5" />{name}</span>)}
                    </div>}
                    {index === 0 && (selectedTicket.contact || !!selectedTicket.attachmentNames?.length) && <div className="mt-2 space-y-2 text-sm text-gray-800">
                      {selectedTicket.contact && <p>{zh ? '联系邮箱' : 'Contact email'}：{selectedTicket.contact}</p>}
                      {!!selectedTicket.attachmentNames?.length && <div className="flex flex-wrap gap-1.5">
                        {selectedTicket.attachmentNames.map(name => <span key={name} className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-800"><FileImage className="h-3.5 w-3.5" />{name}</span>)}
                      </div>}
                    </div>}
                  </article>
                ))}
                {newMessages && <button onClick={() => { if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight; setNewMessages(false); }} className="sticky bottom-1 mx-auto block rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-700">{zh ? '有新回复，点击查看' : 'New reply · View'}</button>}
              </div>
            </div>
            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
              {selectedTicket.status === 'closed' ? <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-800"><CheckCircle2 className="h-4 w-4" />{zh ? '问题已确认解决，历史回复仍可查看。' : 'Confirmed resolved. Previous replies remain available.'}</div> : selectedTicket.status === 'resolved' && !moreInfo ? <div><p className="mb-3 text-sm text-gray-900">{zh ? '问题是否已解决？' : 'Is the issue resolved?'}</p><div className="flex flex-wrap gap-2"><button onClick={() => confirmResolved(selectedTicket.id)} className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"><CheckCircle2 className="h-3.5 w-3.5" />{zh ? '确认解决' : 'Confirm resolved'}</button><button onClick={() => setMoreInfo(true)} className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50">{zh ? '仍有问题' : 'Still an issue'}</button></div></div> : <>
                <textarea value={replyDraft} maxLength={5000} disabled={replySending} onChange={event => setReplyDraft(event.target.value)} placeholder={zh ? '追加补充信息，客服会在此回复…' : 'Add details; support replies here…'} className="h-20 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-gray-400" />
                <input ref={replyFileInputRef} type="file" accept="image/jpeg,image/png" multiple onChange={event => pickImages(event, replyAttachments, setReplyAttachments, setReplyError)} className="hidden" />
                <div className="mt-2 flex items-start justify-between gap-3">
                  <div>{attachmentPicker(replyAttachments, setReplyAttachments, replyFileInputRef, true)}</div>
                  <div className="flex shrink-0 gap-2"><button disabled={replySending || !replyDraft.trim()} onClick={sendReplyNow} className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"><Send className="h-3.5 w-3.5" />{replySending ? (zh ? '发送中…' : 'Sending…') : (zh ? '发送' : 'Send')}</button><button disabled={replySending} onClick={() => simulateReply(selectedTicket.id)} className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50 disabled:opacity-40">{zh ? '模拟客服回复' : 'Simulate support reply'}</button></div>
                </div>
                {replyError && <p role="alert" className="mt-2 text-xs text-red-600">{replyError}</p>}
              </>}
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[560px] px-4 py-4 sm:px-6">
              <button onClick={() => setView('form')} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"><Plus className="h-4 w-4" />{zh ? '新建问题' : 'New issue'}</button>
              <div className="mt-4 space-y-2">
                {sortedTickets.map(ticket => {
                  const last = ticket.messages.at(-1)!;
                  const unread = ticketIsUnread(ticket);
                  return <button key={ticket.id} onClick={() => { selectTicket(ticket.id); setNewMessages(false); }} className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-gray-300">
                    <div className="flex items-center gap-2">
                      {unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" aria-label={zh ? '有新回复' : 'New reply'} />}
                      <span className={`line-clamp-1 flex-1 text-sm ${unread ? 'font-semibold' : 'font-medium'} text-gray-900`}>{zh ? ticket.title : ticket.titleEn}</span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-800">{zh ? last.text : last.textEn}</p>
                  </button>;
                })}
                {!sortedTickets.length && <div className="rounded-lg border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-gray-900">{zh ? '暂无反馈记录，点击上方按钮提交第一个问题。' : 'No feedback yet. Use the button above to submit the first issue.'}</div>}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}
