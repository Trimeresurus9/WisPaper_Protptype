import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  FileText,
  Info,
  LockKeyhole,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

type AdminTab = 'overview' | 'members' | 'permissions' | 'contract';

type MemberRule = {
  id: string;
  email: string;
  tag: string;
  used: number | null;
  limit: number;
  storage: number;
};

const initialMembers: MemberRule[] = [
  { id: 'default', email: '所有未单独配置的成员', tag: '默认规则', used: null, limit: 100000, storage: 20 },
  { id: 'WP-8F21-6A90', email: 'zwei@fudan.edu.cn', tag: '重点课题', used: 312560, limit: 400000, storage: 80 },
  { id: 'WP-19DC-42B7', email: 'lina@fudan.edu.cn', tag: '教师', used: 201230, limit: 300000, storage: 50 },
  { id: 'WP-A773-21C4', email: 'virtual-0382@id.wispaper.cn', tag: '需关注', used: 168940, limit: 180000, storage: 30 },
];

const featureRows = [
  { id: 'deep-search', name: 'Deep Search', description: '深度检索与研究路径探索', entitled: true },
  { id: 'survey', name: 'Survey', description: '生成结构化领域综述', entitled: true },
  { id: 'academic-agent', name: 'Academic Agent', description: '执行高成本的复杂研究任务', entitled: true },
  { id: 'api', name: 'API 与 Webhook', description: '连接机构内部研究工作流', entitled: false },
];

const number = (value: number) => new Intl.NumberFormat('zh-CN').format(value);

function MetricCard({ label, value, note, warning = false }: { label: string; value: string; note: string; warning?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#e6eaf0] bg-white p-5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${warning ? 'text-[#c07520]' : 'text-gray-950'}`}>{value}</div>
      <p className="mt-1 text-xs text-gray-400">{note}</p>
    </div>
  );
}

function OverviewTab() {
  const featureUsage = [
    { name: 'Academic Agent', credits: 684300, percent: 42 },
    { name: 'Survey', credits: 492840, percent: 30 },
    { name: 'Deep Search', credits: 465660, percent: 28 },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <MetricCard label="合同 Credits" value="2,000,000" note="本合同周期总额度" />
        <MetricCard label="已使用" value="1,642,800" note="本周期使用率 82%" warning />
        <MetricCard label="剩余额度" value="357,200" note="预计可用 6 天" />
        <MetricCard label="合同到期" value="2027-08-31" note="当前合同生效中" />
      </div>

      <section className="rounded-2xl border border-[#e6eaf0] bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">本周期 Credits 使用</h2>
            <p className="mt-1 text-xs text-gray-500">数据来自 Wisland，由 WisOP 配置的合同额度决定。</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">已使用 82%</span>
        </div>
        <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-[#edf2f8]">
          <div className="h-full w-[82%] rounded-full bg-[#378ef2]" />
        </div>
        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>已使用 1,642,800</span>
          <span>剩余 357,200</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-[#e6eaf0] bg-white p-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <h2 className="text-base font-semibold text-gray-950">付费功能消耗分布</h2>
          </div>
          <div className="mt-5 space-y-5">
            {featureUsage.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-500">{number(item.credits)} Credits</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#edf2f8]"><div className="h-full rounded-full bg-[#75aaf0]" style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#e6eaf0] bg-white p-6">
          <h2 className="text-base font-semibold text-gray-950">机构使用概况</h2>
          <dl className="mt-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-4"><dt className="text-sm text-gray-500">活跃成员</dt><dd className="font-semibold text-gray-900">86</dd></div>
            <div className="flex items-center justify-between py-4"><dt className="text-sm text-gray-500">功能调用</dt><dd className="font-semibold text-gray-900">35,647</dd></div>
            <div className="flex items-center justify-between py-4"><dt className="text-sm text-gray-500">人均消耗</dt><dd className="font-semibold text-gray-900">19,102</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function MemberEditor({ member, onClose, onSave }: { member: MemberRule; onClose: () => void; onSave: (member: MemberRule) => void }) {
  const [limit, setLimit] = useState(member.limit);
  const [storage, setStorage] = useState(member.storage);
  const [tag, setTag] = useState(member.tag);
  const minimum = member.used ?? 0;
  const invalidResources = !Number.isFinite(limit) || limit < minimum || !Number.isFinite(storage) || storage < 10;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-gray-950/30 p-5" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-medium text-blue-600">{member.id === 'default' ? '默认规则' : member.id}</p><h3 className="mt-1 text-lg font-semibold">配置成员资源</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        {member.id !== 'default' && <label className="mt-6 block text-sm font-medium text-gray-700">成员标签<input value={tag} onChange={(event) => setTag(event.target.value)} maxLength={20} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>}
        <label className="mt-5 block text-sm font-medium text-gray-700">月度 Credits 上限<input type="number" min={minimum} step={10000} value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /><span className="mt-1 block text-xs font-normal text-gray-400">不得低于本周期已使用的 {number(minimum)} Credits</span></label>
        <label className="mt-5 block text-sm font-medium text-gray-700">个人存储上限（GB）<input type="number" min={10} step={10} value={storage} onChange={(event) => setStorage(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <div className="mt-7 flex justify-end gap-2"><button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600">取消</button><button disabled={invalidResources} onClick={() => { if (!invalidResources) onSave({ ...member, limit, storage, tag: tag.trim() }); }} className="rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">保存配置</button></div>
      </div>
    </div>
  );
}

function MembersTab() {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<MemberRule | null>(null);
  const filtered = useMemo(() => members.filter((member) => `${member.id}${member.email}${member.tag}`.toLowerCase().includes(query.toLowerCase())), [members, query]);

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-[#e6eaf0] bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-semibold text-gray-950">成员资源配置</h2><p className="mt-1 text-xs text-gray-500">仅展示默认规则和单独配置过的成员，不作为完整成员目录。</p></div>
          <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 lg:w-80"><Search className="h-4 w-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 UID、邮箱或标签" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3">UID / 规则</th><th className="px-5 py-3">邮箱</th><th className="px-5 py-3">标签</th><th className="px-5 py-3">本周期使用</th><th className="px-5 py-3">月度额度</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-gray-100">{filtered.map((member) => <tr key={member.id} className={member.id === 'default' ? 'bg-[#f6f9ff]' : 'hover:bg-[#fafcff]'}><td className="px-5 py-4 font-medium text-gray-900">{member.id === 'default' ? '默认成员规则' : member.id}</td><td className="px-5 py-4 text-gray-500">{member.email}</td><td className="px-5 py-4"><span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{member.tag || '未添加'}</span></td><td className="px-5 py-4 text-gray-600 tabular-nums">{member.used === null ? '—' : number(member.used)}</td><td className="px-5 py-4 text-gray-600 tabular-nums">{number(member.limit)}</td><td className="px-5 py-4 text-right"><button onClick={() => setEditing(member)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-blue-600 transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">配置<ChevronRight className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
      {editing && <MemberEditor member={editing} onClose={() => setEditing(null)} onSave={(next) => { setMembers((items) => items.map((item) => item.id === next.id ? next : item)); setEditing(null); }} />}
    </>
  );
}

function PermissionsTab() {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#e6eaf0] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e9edf2] px-6 py-6">
        <div><h2 className="text-base font-semibold text-gray-950">机构功能访问</h2><p className="mt-1.5 max-w-2xl text-xs leading-5 text-gray-500">由合同权益与机构配置共同决定，对全体成员生效。此处展示当前状态，不支持直接修改。</p></div>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f2f5f9] px-2.5 py-1.5 text-xs font-medium text-gray-600"><LockKeyhole className="h-3.5 w-3.5" />只读</span>
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_144px_144px] gap-4 border-b border-[#e9edf2] bg-[#fafbfd] px-6 py-3 text-xs font-medium text-gray-500 sm:grid"><span>功能</span><span>合同权益</span><span>当前访问状态</span></div>
      <div className="divide-y divide-[#edf0f4]">{featureRows.map((feature) => <div key={feature.id} className="grid gap-3 px-6 py-5 sm:grid-cols-[minmax(0,1fr)_144px_144px] sm:items-center sm:gap-4"><div className="min-w-0"><h3 className="text-sm font-medium text-gray-900">{feature.name}</h3><p className="mt-1 text-xs text-gray-500">{feature.description}</p></div><span className={`text-xs ${feature.entitled ? 'text-gray-600' : 'text-gray-400'}`}>{feature.entitled ? '已包含' : '未开通'}</span><span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ${feature.entitled ? 'bg-[#eaf4ff] text-[#1769c2]' : 'bg-[#f2f4f6] text-gray-500'}`}>{feature.entitled ? <Check className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}{feature.entitled ? '可使用' : '不可使用'}</span></div>)}</div>
      <p className="flex items-center gap-2 border-t border-[#e9edf2] px-6 py-4 text-xs text-gray-500"><Info className="h-4 w-4 shrink-0" />如需调整功能权益，请联系 WisPaper 客户成功团队。</p>
    </section>
  );
}

function ContractTab() {
  const rows = [
    ['机构名称', '复旦大学'], ['机构 ID', 'ORG-FDU-2026-0018'], ['合同周期', '2026-09-01 至 2027-08-31'], ['合同席位', '不限'], ['月度 Credits', '2,000,000 · 每月重置，不结转'], ['Voucher 余额', '86,400'], ['高速存储', '3 TB'], ['功能权益', 'Deep Search、Survey、Academic Agent'],
  ];
  return <section className="rounded-2xl border border-[#e6eaf0] bg-white p-6"><div className="flex items-center gap-3 border-b border-gray-100 pb-5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><div><h2 className="font-semibold text-gray-950">合同生效中</h2><p className="mt-1 text-xs text-gray-500">2027-08-31 到期</p></div></div><dl className="divide-y divide-gray-100">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[150px_1fr] gap-6 py-4 text-sm"><dt className="text-gray-500">{label}</dt><dd className="font-medium text-gray-900">{value}</dd></div>)}</dl><div className="mt-5 flex gap-2 rounded-lg bg-[#f5f8fc] p-4 text-xs leading-5 text-gray-500"><Info className="mt-0.5 h-4 w-4 shrink-0" />合同、Credits 总额和登录接入由公司超管在 WisOP 中配置；如需调整，请联系 WisPaper 客户成功团队。</div></section>;
}

export function InstitutionManagement() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const tabs = [
    { id: 'overview' as const, label: '机构概览', icon: BarChart3 },
    { id: 'members' as const, label: '成员资源配置', icon: Users },
    { id: 'permissions' as const, label: '功能权限', icon: ShieldCheck },
    { id: 'contract' as const, label: '机构与合同', icon: FileText },
  ];

  return (
    <main className="min-h-screen flex-1 bg-white">
      <header className="border-b border-[#e9edf2] bg-white px-5 py-6 md:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs text-gray-500"><Building2 className="h-4 w-4" />机构管理员 · Mock 登录</div><h1 className="mt-1.5 text-[25px] font-semibold tracking-[-0.03em] text-gray-950">复旦大学 · 机构管理</h1></div>
          <div className="flex w-fit items-center gap-2 rounded-lg bg-[#eef8f3] px-3 py-2 text-xs font-medium text-[#268361]"><Check className="h-4 w-4" />已识别机构管理员账号</div>
        </div>
      </header>
      <div className="mx-auto max-w-[1320px] px-5 pb-12 pt-2 md:px-8">
        <nav aria-label="机构管理模块" className="mb-7 flex gap-7 overflow-x-auto border-b border-[#e9edf2]">
          {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" aria-current={tab === item.id ? 'page' : undefined} onClick={() => setTab(item.id)} className={`flex min-w-max items-center gap-2 border-b-2 px-1 py-4 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${tab === item.id ? 'border-blue-500 font-semibold text-[#1769c2]' : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-900'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}
        </nav>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'members' && <MembersTab />}
        {tab === 'permissions' && <PermissionsTab />}
        {tab === 'contract' && <ContractTab />}
      </div>
    </main>
  );
}
