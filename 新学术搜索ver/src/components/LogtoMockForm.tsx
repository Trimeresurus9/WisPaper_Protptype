import { useState } from 'react';

export function LogtoMockForm({ isZh, onComplete }: { isZh: boolean; onComplete: () => void }) {
  const [email, setEmail] = useState('demo@wispaper.com');
  const [password, setPassword] = useState('Demo@123456');
  return <form autoComplete="off" onSubmit={(event) => { event.preventDefault(); if (email.trim() && password) onComplete(); }} className="mt-4 space-y-3">
    <div className="space-y-2">
      {[
        { name: 'Google', mark: 'G', markClass: 'font-bold text-[#4285f4]' },
        { name: 'Apple', mark: 'A', markClass: 'font-semibold text-slate-950' },
        { name: isZh ? '机构账号' : 'Institution', mark: isZh ? '校' : 'I', markClass: 'font-semibold text-[#2485df]' },
      ].map((provider) => <button key={provider.name} type="button" onClick={onComplete} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:border-[#3ea3ff] hover:bg-[#3ea3ff]/5"><span aria-hidden="true" className={`w-5 text-center text-base ${provider.markClass}`}>{provider.mark}</span>{isZh ? `使用 ${provider.name} 登录` : `Continue with ${provider.name}`}</button>)}
    </div>
    <div className="flex items-center gap-3 py-1 text-[11px] text-slate-400"><span className="h-px flex-1 bg-slate-200" />{isZh ? '或使用邮箱' : 'or use email'}<span className="h-px flex-1 bg-slate-200" /></div>
    <label className="block text-xs font-medium text-slate-600">{isZh ? '邮箱' : 'Email'}<input type="email" autoComplete="off" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#3ea3ff]" /></label>
    <label className="block text-xs font-medium text-slate-600">{isZh ? '密码' : 'Password'}<input type="password" autoComplete="off" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isZh ? '输入密码' : 'Enter password'} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#3ea3ff]" /></label>
    <button type="submit" className="w-full rounded-xl bg-[#3ea3ff] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2485df]">{isZh ? '登录并继续' : 'Sign in and continue'}</button>
    <p className="text-center text-[11px] text-slate-400">{isZh ? '原型演示 · 已预填模拟账号，其他登录方式也可直接体验' : 'Prototype demo · mock credentials are prefilled; other options work too'}</p>
  </form>;
}
