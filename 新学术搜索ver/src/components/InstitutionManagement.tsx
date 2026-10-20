import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Info,
  Search,
  Settings2,
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
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <span className="text-xs text-gray-500">{label}</span>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${warning ? 'text-amber-600' : 'text-gray-950'}`}>{value}</div>
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

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950">本周期 Credits 使用</h2>
            <p className="mt-1 text-xs text-gray-500">数据来自 Wisland，由 WisOP 配置的合同额度决定。</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">已使用 82%</span>
        </div>
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-[82%] rounded-full bg-violet-600" />
        </div>
        <div className="mt-3 flex justify-between text-xs text-gray-500">
          <span>已使用 1,642,800</span>
          <span>剩余 357,200</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
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
                <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
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
          <div><p className="text-xs font-medium text-violet-600">{member.id === 'default' ? '默认规则' : member.id}</p><h3 className="mt-1 text-lg font-semibold">配置成员资源</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        {member.id !== 'default' && <label className="mt-6 block text-sm font-medium text-gray-700">成员标签<input value={tag} onChange={(event) => setTag(event.target.value)} maxLength={20} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-violet-500" /></label>}
        <label className="mt-5 block text-sm font-medium text-gray-700">月度 Credits 上限<input type="number" min={minimum} step={10000} value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-violet-500" /><span className="mt-1 block text-xs font-normal text-gray-400">不得低于本周期已使用的 {number(minimum)} Credits</span></label>
        <label className="mt-5 block text-sm font-medium text-gray-700">个人存储上限（GB）<input type="number" min={10} step={10} value={storage} onChange={(event) => setStorage(Number(event.target.value))} className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 outline-none focus:border-violet-500" /></label>
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
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="font-semibold text-gray-950">成员资源配置</h2><p className="mt-1 text-xs text-gray-500">仅展示默认规则和单独配置过的成员，不作为完整成员目录。</p></div>
          <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 lg:w-80"><Search className="h-4 w-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索 UID、邮箱或标签" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500"><tr><th className="px-5 py-3">UID / 规则</th><th className="px-5 py-3">邮箱</th><th className="px-5 py-3">标签</th><th className="px-5 py-3">本周期使用</th><th className="px-5 py-3">月度额度</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-gray-100">{filtered.map((member) => <tr key={member.id} className={member.id === 'default' ? 'bg-violet-50/40' : ''}><td className="px-5 py-4 font-medium text-gray-900">{member.id === 'default' ? '默认成员规则' : member.id}</td><td className="px-5 py-4 text-gray-500">{member.email}</td><td className="px-5 py-4"><span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{member.tag || '未添加'}</span></td><td className="px-5 py-4 text-gray-600">{member.used === null ? '—' : number(member.used)}</td><td className="px-5 py-4 text-gray-600">{number(member.limit)}</td><td className="px-5 py-4 text-right"><button onClick={() => setEditing(member)} className="inline-flex items-center gap-1 text-sm font-medium text-violet-600">配置<ChevronRight className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
      {editing && <MemberEditor member={editing} onClose={() => setEditing(null)} onSave={(next) => { setMembers((items) => items.map((item) => item.id === next.id ? next : item)); setEditing(null); }} />}
    </>
  );
}

function PermissionsTab() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ 'deep-search': true, survey: true, 'academic-agent': true, api: false });
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="m-5 flex gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 text-violet-600" /><div><h2 className="text-sm font-semibold text-violet-950">合同权限优先</h2><p className="mt-1 text-xs leading-5 text-violet-700">可停用合同已包含的功能，但不能启用 WisOP 未分配给本机构的能力。设置对全部机构成员生效。</p></div></div>
      <div className="divide-y divide-gray-100">{featureRows.map((feature) => <div key={feature.id} className="flex items-center gap-4 px-6 py-5"><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-gray-900">{feature.name}</h3><p className="mt-1 text-xs text-gray-500">{feature.description}</p></div><span className={`text-xs ${feature.entitled ? 'text-emerald-600' : 'text-gray-400'}`}>{feature.entitled ? '合同包含' : '合同未开通'}</span><button disabled={!feature.entitled} onClick={() => setEnabled((state) => ({ ...state, [feature.id]: !state[feature.id] }))} className={`relative h-6 w-11 rounded-full transition ${enabled[feature.id] && feature.entitled ? 'bg-violet-600' : 'bg-gray-200'} disabled:cursor-not-allowed disabled:opacity-50`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${enabled[feature.id] && feature.entitled ? 'left-6' : 'left-1'}`} /></button></div>)}</div>
    </section>
  );
}

function ContractTab() {
  const rows = [
    ['机构名称', '复旦大学'], ['机构 ID', 'ORG-FDU-2026-0018'], ['合同周期', '2026-09-01 至 2027-08-31'], ['合同席位', '不限'], ['月度 Credits', '2,000,000 · 每月重置，不结转'], ['Voucher 余额', '86,400'], ['高速存储', '3 TB'], ['功能权益', 'Deep Search、Survey、Academic Agent'],
  ];
  return <section className="rounded-xl border border-gray-200 bg-white p-6"><div className="flex items-center gap-3 border-b border-gray-100 pb-5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><div><h2 className="font-semibold text-gray-950">合同生效中</h2><p className="mt-1 text-xs text-gray-500">2027-08-31 到期</p></div></div><dl className="divide-y divide-gray-100">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[150px_1fr] gap-6 py-4 text-sm"><dt className="text-gray-500">{label}</dt><dd className="font-medium text-gray-900">{value}</dd></div>)}</dl><div className="mt-5 flex gap-2 rounded-lg bg-gray-50 p-4 text-xs leading-5 text-gray-500"><Info className="mt-0.5 h-4 w-4 shrink-0" />合同、Credits 总额和登录接入由公司超管在 WisOP 中配置；如需调整，请联系 WisPaper 客户成功团队。</div></section>;
}

export function InstitutionManagement() {
  const [tab, setTab] = useState<AdminTab>('overview');
  const tabs = [
    { id: 'overview' as const, label: '机构概览', icon: BarChart3 },
    { id: 'members' as const, label: '成员资源配置', icon: Users },
    { id: 'permissions' as const, label: '功能权限', icon: Settings2 },
    { id: 'contract' as const, label: '机构与合同', icon: FileText },
  ];

  return (
    <main className="min-h-screen flex-1 bg-[#f7f7f9]">
      <header className="border-b border-gray-200 bg-white px-8 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex items-center gap-2 text-xs text-gray-500"><CircleDollarSign className="h-4 w-4" />机构管理员 · Mock 登录</div><h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-950">复旦大学 · 机构管理</h1></div>
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"><Check className="h-4 w-4" />已识别机构管理员账号</div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-8 py-6">
        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5">
          {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-w-max items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition ${tab === item.id ? 'bg-gray-950 font-medium text-white' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}><Icon className="h-4 w-4" />{item.label}</button>; })}
        </nav>
        {tab === 'overview' && <OverviewTab />}
        {tab === 'members' && <MembersTab />}
        {tab === 'permissions' && <PermissionsTab />}
        {tab === 'contract' && <ContractTab />}
      </div>
    </main>
  );
}
