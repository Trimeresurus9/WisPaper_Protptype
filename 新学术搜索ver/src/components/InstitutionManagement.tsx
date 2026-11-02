import React, { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog@1.1.6';
import './institution-management.css';
import {
  BarChart3,
  ChevronRight,
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
      <span className="text-xs text-[#6e7989]">{label}</span>
      <div className={`mt-2 text-[22px] font-semibold tracking-tight ${warning ? 'text-amber-600' : 'text-[#23282f]'}`}>{value}</div>
      <p className="mt-1 text-xs text-[#6e7989]">{note}</p>
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
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="合同 Credits" value="2,000,000" note="本合同周期总额度" />
        <MetricCard label="已使用" value="1,642,800" note="本周期使用率 82%" warning />
        <MetricCard label="剩余额度" value="357,200" note="预计可用 6 天" />
        <MetricCard label="合同到期" value="2027-08-31" note="当前合同生效中" />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-medium text-[#23282f]">本周期 Credits 使用</h2>
            <p className="mt-1 text-xs text-[#6e7989]">查看机构在当前合同周期内的额度使用情况。</p>
          </div>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">已使用 82%</span>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-[82%] rounded-full bg-[#0079ff]" />
        </div>
        <div className="mt-3 flex justify-between text-xs text-[#6e7989]">
          <span>已使用 1,642,800</span>
          <span>剩余 357,200</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#6e7989]" />
            <h2 className="text-sm font-medium text-[#23282f]">付费功能消耗分布</h2>
          </div>
          <div className="mt-5 space-y-5">
            {featureUsage.map((item) => (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-[#6e7989]">{number(item.credits)} Credits</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#0079ff]" style={{ width: `${item.percent}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-medium text-[#23282f]">机构使用概况</h2>
          <dl className="mt-4 divide-y divide-gray-100">
            <div className="flex items-center justify-between py-4"><dt className="text-sm text-[#6e7989]">活跃成员</dt><dd className="font-semibold text-gray-900">86</dd></div>
            <div className="flex items-center justify-between py-4"><dt className="text-sm text-[#6e7989]">功能调用</dt><dd className="font-semibold text-gray-900">35,647</dd></div>
            <div className="flex items-center justify-between py-4"><dt className="text-sm text-[#6e7989]">人均消耗</dt><dd className="font-semibold text-gray-900">19,102</dd></div>
          </dl>
        </section>
      </div>
    </div>
  );
}

function MemberEditor({ member, onClose, onSave }: { member: MemberRule; onClose: () => void; onSave: (member: MemberRule) => void }) {
  const [limit, setLimit] = useState(String(member.limit));
  const [storage, setStorage] = useState(String(member.storage));
  const [tag, setTag] = useState(member.tag);
  const [trigger] = useState(() => document.activeElement as HTMLElement | null);
  const minimum = member.used ?? 0;
  const validLimit = limit.trim() !== '' && Number.isFinite(Number(limit)) && Number(limit) >= minimum;
  const validStorage = storage.trim() !== '' && Number.isFinite(Number(storage)) && Number(storage) >= 10;

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="institution-dialog-overlay" />
        <Dialog.Content className="institution-member-dialog" onCloseAutoFocus={(event) => { event.preventDefault(); trigger?.focus(); }}>
          <div className="institution-dialog-heading">
            <div>
              <Dialog.Title>配置成员资源</Dialog.Title>
              <Dialog.Description>{member.id === 'default' ? '默认规则 · 适用于未单独配置的成员' : `${member.id} · ${member.email}`}</Dialog.Description>
            </div>
            <Dialog.Close className="institution-icon-button" aria-label="关闭成员配置"><X size={18} /></Dialog.Close>
          </div>
          <form noValidate onSubmit={(event) => {
            event.preventDefault();
            if (validLimit && validStorage) onSave({ ...member, limit: Number(limit), storage: Number(storage), tag: tag.trim() });
          }}>
            {member.id !== 'default' && <label className="institution-field">成员标签<input value={tag} onChange={(event) => setTag(event.target.value)} maxLength={20} placeholder="添加标签，最多 20 个字" /></label>}
            <label className="institution-field">月度 Credits 上限
              <input type="number" min={minimum} step="any" value={limit} onChange={(event) => setLimit(event.target.value)} aria-invalid={!validLimit} aria-describedby="institution-limit-hint" />
              <span id="institution-limit-hint" className={!validLimit ? 'institution-field-error' : ''}>不得低于本周期已使用的 {number(minimum)} Credits</span>
            </label>
            <label className="institution-field">个人存储上限（GB）
              <input type="number" min={10} step="any" value={storage} onChange={(event) => setStorage(event.target.value)} aria-invalid={!validStorage} aria-describedby="institution-storage-hint" />
              <span id="institution-storage-hint" className={!validStorage ? 'institution-field-error' : ''}>至少 10 GB</span>
            </label>
            <div className="institution-dialog-footer">
              <Dialog.Close asChild><button type="button" className="institution-button">取消</button></Dialog.Close>
              <button type="submit" className="institution-button institution-button-primary" disabled={!validLimit || !validStorage}>保存配置</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function MembersTab() {
  const [members, setMembers] = useState(initialMembers);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<MemberRule | null>(null);
  const filtered = useMemo(() => members.filter((member) => `${member.id}${member.email}${member.tag}`.toLowerCase().includes(query.trim().toLowerCase())), [members, query]);

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-sm font-medium text-[#23282f]">成员资源配置</h2><p className="mt-1 text-xs text-[#6e7989]">仅展示默认规则和单独配置过的成员，不作为完整成员目录。</p></div>
          <label className="institution-search flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 px-3 lg:w-80"><Search className="h-4 w-4 text-[#6e7989]" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="搜索成员" placeholder="搜索 UID、邮箱或标签" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>
        <div className="institution-table-scroll overflow-x-auto" role="region" aria-label="成员资源配置表，可横向滚动" tabIndex={0}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-[#f7fafd] text-xs font-medium text-[#6e7989]"><tr><th className="px-5 py-3">UID / 规则</th><th className="px-5 py-3">邮箱</th><th className="px-5 py-3">标签</th><th className="px-5 py-3">本周期使用</th><th className="px-5 py-3">月度额度</th><th className="px-5 py-3"><span className="sr-only">操作</span></th></tr></thead>
            <tbody className="divide-y divide-gray-100">{filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#6e7989]"><Search className="mx-auto mb-3 h-5 w-5" /><p>没有匹配的成员规则</p><p className="mt-1 text-xs">试试其他 UID、邮箱或标签。</p><button onClick={() => setQuery('')} className="mt-3 text-sm text-[#0064d6]">清空搜索</button></td></tr>}{filtered.map((member) => <tr key={member.id} className={member.id === 'default' ? 'bg-[#f7fafd]' : ''}><td className="px-5 py-3 font-medium text-gray-900">{member.id === 'default' ? '默认成员规则' : member.id}</td><td className="px-5 py-3 text-[#6e7989]">{member.email}</td><td className="px-5 py-3"><span className="inline-block max-w-36 break-words rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">{member.tag || '未添加'}</span></td><td className="px-5 py-3 text-gray-600">{member.used === null ? '—' : number(member.used)}</td><td className="px-5 py-3 text-gray-600">{number(member.limit)}</td><td className="px-5 py-3 text-right"><button onClick={() => setEditing(member)} className="inline-flex items-center gap-1 text-sm font-medium text-[#0064d6]">配置<ChevronRight className="h-4 w-4" /></button></td></tr>)}</tbody>
          </table>
        </div>
      </section>
      {editing && <MemberEditor member={editing} onClose={() => setEditing(null)} onSave={(next) => { setMembers((items) => items.map((item) => item.id === next.id ? next : item)); setEditing(null); }} />}
    </>
  );
}

function PermissionsTab() {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="m-5 flex gap-3 rounded-lg border border-gray-200 bg-[#f7fafd] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0064d6]" />
        <div>
          <h2 className="text-sm font-semibold text-[#23282f]">机构功能权益</h2>
          <p className="mt-1 text-xs leading-5 text-[#6e7989]">功能权益由机构合同确定，仅供查看。如需调整，请联系 WisPaper 客户成功团队。</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {featureRows.map((feature) => (
          <div key={feature.id} className="flex items-center gap-4 px-5 py-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900">{feature.name}</h3>
              <p className="mt-1 text-xs text-[#6e7989]">{feature.description}</p>
            </div>
            <span className={`shrink-0 text-xs ${feature.entitled ? 'text-emerald-600' : 'text-[#6e7989]'}`}>
              {feature.entitled ? '合同包含' : '合同未开通'}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ContractTab() {
  const rows = [
    ['机构名称', '复旦大学'], ['机构 ID', 'ORG-FDU-2026-0018'], ['合同周期', '2026-09-01 至 2027-08-31'], ['合同席位', '不限'], ['月度 Credits', '2,000,000 · 每月重置，不结转'], ['Voucher 余额', '86,400'], ['高速存储', '3 TB'], ['功能权益', 'Deep Search、Survey、Academic Agent'],
  ];
  return <section className="rounded-xl border border-gray-200 bg-white p-5"><div className="flex items-center gap-3 border-b border-gray-100 pb-5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><div><h2 className="text-sm font-medium text-[#23282f]">合同生效中</h2><p className="mt-1 text-xs text-[#6e7989]">2027-08-31 到期</p></div></div><dl className="divide-y divide-gray-100">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[110px_1fr] gap-4 py-4 text-sm"><dt className="text-[#6e7989]">{label}</dt><dd className="break-words text-gray-900">{value}</dd></div>)}</dl><div className="mt-5 flex gap-2 rounded-lg bg-gray-50 p-4 text-xs leading-5 text-[#6e7989]"><Info className="mt-0.5 h-4 w-4 shrink-0" />合同、Credits 总额和登录接入信息仅供查看。如需调整，请联系 WisPaper 客户成功团队。</div></section>;
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
    <main className="institution-admin">
      <header className="institution-header">
        <div className="institution-title"><h1>机构管理</h1><span className="institution-header-divider" /><span>复旦大学</span></div>
        <span className="institution-role"><ShieldCheck size={14} />机构管理员</span>
      </header>
      <div className="institution-content">
        <nav className="institution-tabs" aria-label="机构管理分区">
          {tabs.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setTab(item.id)} aria-pressed={tab === item.id} aria-controls={`institution-${item.id}`}><Icon size={16} />{item.label}</button>; })}
        </nav>
        <div id="institution-overview" hidden={tab !== 'overview'}><OverviewTab /></div>
        <div id="institution-members" hidden={tab !== 'members'}><MembersTab /></div>
        <div id="institution-permissions" hidden={tab !== 'permissions'}><PermissionsTab /></div>
        <div id="institution-contract" hidden={tab !== 'contract'}><ContractTab /></div>
      </div>
    </main>
  );
}
