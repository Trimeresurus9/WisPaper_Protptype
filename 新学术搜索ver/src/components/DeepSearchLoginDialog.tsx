import { useEffect, useRef } from 'react';
import { LockKeyhole, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LogtoMockForm } from './LogtoMockForm';

export function DeepSearchLoginDialog({ query, onClose, onComplete }: { query: string; onClose: () => void; onComplete: () => void }) {
  const { language } = useLanguage();
  const isZh = language === 'zh';
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [onClose]);

  return <div className="fixed inset-0 z-[1700] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="deep-search-login-title" className="my-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
      <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#3ea3ff]/12 text-[#2485df]"><LockKeyhole className="h-5 w-5" /></span><button ref={closeRef} type="button" aria-label={isZh ? '关闭登录窗口' : 'Close sign-in dialog'} onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></div>
      <h2 id="deep-search-login-title" className="mt-5 text-xl font-semibold text-slate-950">{isZh ? '登录后使用深度搜索' : 'Sign in to use Deep Search'}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{isZh ? '已保留当前搜索问题。登录后会自动继续深度搜索。' : 'Your search question is saved. Deep Search will continue after sign-in.'}</p>
      {query.trim() && <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">{query}</div>}
      <LogtoMockForm isZh={isZh} onComplete={onComplete} />
    </section>
  </div>;
}
