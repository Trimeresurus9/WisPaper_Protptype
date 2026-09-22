import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ImagePlus, Send, Trash2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { isValidEmail } from '../utils/email';

interface FeedbackModalProps { isOpen: boolean; onClose: () => void }
const categories = [
  { id: 'technical', zh: '技术支持', en: 'Technical Support' },
  { id: 'bug', zh: '故障反馈', en: 'Bug Support' },
  { id: 'experience', zh: '体验问题', en: 'User Experience Issue' },
  { id: 'suggestion', zh: '投诉与建议', en: 'Complaints & Suggestions' },
  { id: 'other', zh: '其他', en: 'Other' },
] as const;
type ImageAttachment = { id: string; name: string; url: string };

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { language } = useLanguage();
  const zh = language === 'zh';
  const [category, setCategory] = useState<(typeof categories)[number]['id'] | ''>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageAttachment[]>([]);
  useEffect(() => { imagesRef.current = attachments; }, [attachments]);
  useEffect(() => () => { imagesRef.current.forEach((image) => URL.revokeObjectURL(image.url)); }, []);
  if (!isOpen) return null;

  const close = () => {
    attachments.forEach((image) => URL.revokeObjectURL(image.url));
    imagesRef.current = [];
    setCategory(''); setSubject(''); setDescription(''); setEmail('');
    setAttachments([]); setError(''); setTicketId('');
    onClose();
  };
  const addImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    const available = Math.max(0, 3 - attachments.length);
    const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024);
    if (valid.length !== files.length || files.length > available) {
      setError(zh ? '最多上传 3 张图片，每张不超过 10 MB。' : 'Upload up to 3 images, 10 MB each.');
    } else setError('');
    setAttachments((current) => [...current, ...valid.slice(0, available).map((file) => ({
      id: `${Date.now()}-${Math.random()}`, name: file.name, url: URL.createObjectURL(file),
    }))]);
    event.target.value = '';
  };
  const removeImage = (id: string) => {
    setAttachments((current) => {
      const image = current.find((item) => item.id === id);
      if (image) URL.revokeObjectURL(image.url);
      return current.filter((item) => item.id !== id);
    });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!category || !subject.trim() || !description.trim()) {
      setError(zh ? '请选择问题类型，并填写标题与详细描述。' : 'Choose a type and complete the subject and description.');
      return;
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      setError(zh ? '请输入有效的联系邮箱。' : 'Enter a valid contact email.');
      return;
    }
    setError('');
    setTicketId(`MOCK-FB-${Date.now().toString().slice(-8)}`);
  };
  return <div className="fixed inset-0 z-[12000] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <div role="dialog" aria-modal="true" aria-label={zh ? '反馈工单' : 'Feedback ticket'} className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onKeyDown={(event) => { if (event.key === 'Escape') close(); }}>
      <header className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div><h2 className="text-lg font-semibold text-slate-950">{zh ? '反馈工单' : 'Feedback ticket'}</h2><p className="mt-1 text-xs text-slate-500">{zh ? '告诉我们遇到的问题或想法' : 'Tell us about the issue or your idea'}</p></div>
        <button type="button" onClick={close} aria-label={zh ? '关闭反馈工单' : 'Close feedback ticket'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
      </header>
      {ticketId ? <div className="space-y-3 px-6 py-12 text-center"><CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" /><h3 className="text-lg font-semibold text-slate-950">{zh ? '工单已在原型中创建' : 'Ticket created in the prototype'}</h3><p className="text-sm text-slate-600">{ticketId}</p><p className="text-xs text-slate-500">{zh ? '这是演示结果，尚未发送至客服系统。' : 'This is a demo result; nothing was sent to support.'}</p><button type="button" onClick={close} className="mt-5 rounded-lg bg-slate-950 px-5 py-2.5 text-sm text-white">{zh ? '完成' : 'Done'}</button></div> :
        <form onSubmit={submit} className="min-h-0 overflow-y-auto">
          <div className="space-y-5 px-6 py-5">
            <fieldset><legend className="mb-2 text-sm font-semibold text-slate-900">{zh ? '问题类型' : 'Issue type'} <span className="text-red-500">*</span></legend><div className="grid gap-2 sm:grid-cols-2">{categories.map((item) => <label key={item.id} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-3 text-sm transition ${category === item.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-700 hover:border-blue-300'}`}><input type="radio" name="feedback-category" value={item.id} checked={category === item.id} onChange={() => { setCategory(item.id); setError(''); }} className="accent-blue-600" /><span>{zh ? item.zh : item.en}</span></label>)}</div></fieldset>
            <label className="block text-sm font-semibold text-slate-900">{zh ? '标题' : 'Subject'} <span className="text-red-500">*</span><input value={subject} onChange={(event) => { setSubject(event.target.value); setError(''); }} maxLength={100} placeholder={zh ? '一句话概括你的问题' : 'Summarize your issue in one sentence'} className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-blue-400" /></label>
            <label className="block text-sm font-semibold text-slate-900">{zh ? '详细描述' : 'Description'} <span className="text-red-500">*</span><textarea value={description} onChange={(event) => { setDescription(event.target.value); setError(''); }} placeholder={zh ? '发生了什么？你期望的结果是什么？如适用，请写下复现步骤。' : 'What happened? What did you expect? Include steps to reproduce if relevant.'} className="mt-2 h-28 w-full resize-y rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-blue-400" /></label>
            <div><p className="mb-2 text-sm font-semibold text-slate-900">{zh ? '截图' : 'Screenshots'} <span className="font-normal text-slate-400">{zh ? '（可选，最多 3 张）' : '(optional, up to 3)'}</span></p><div className="flex flex-wrap gap-2">{attachments.map((image) => <div key={image.id} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200"><img src={image.url} alt={image.name} className="h-full w-full object-cover" /><button type="button" onClick={() => removeImage(image.id)} aria-label={`${zh ? '移除' : 'Remove'} ${image.name}`} className="absolute right-0 top-0 rounded-bl-md bg-slate-950/75 p-1 text-white"><Trash2 className="h-3.5 w-3.5" /></button></div>)}{attachments.length < 3 && <button type="button" onClick={() => inputRef.current?.click()} aria-label={zh ? '添加截图' : 'Add screenshot'} className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-600"><ImagePlus className="h-5 w-5" /></button>}<input ref={inputRef} type="file" accept="image/*" multiple onChange={addImages} className="hidden" /></div></div>
            <label className="block text-sm font-semibold text-slate-900">{zh ? '联系邮箱' : 'Contact email'} <span className="font-normal text-slate-400">{zh ? '（可选）' : '(optional)'}</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(''); }} placeholder={zh ? '用于接收后续回复' : 'For a follow-up reply'} className="mt-2 w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm font-normal outline-none focus:border-blue-400" /></label>
            {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
            <p className="text-[11px] leading-5 text-slate-400">{zh ? '原型仅演示填写与提交结果，不会真实上传截图或发送工单。' : 'Prototype only: screenshots and tickets are not uploaded or sent.'}</p>
          </div>
          <footer className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={close} className="rounded-lg px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">{zh ? '取消' : 'Cancel'}</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"><Send className="h-4 w-4" />{zh ? '提交工单' : 'Submit ticket'}</button></footer>
        </form>}
    </div>
  </div>;
}
