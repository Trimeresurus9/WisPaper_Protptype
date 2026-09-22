import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  CreditCard,
  Settings,
  ChevronDown,
  ChevronRight,
  Crown,
  FileText,
  AlertTriangle,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Download,
  HardDrive,
  Copy,
  Check,
  Plus,
  MoreVertical,
  WalletCards,
} from 'lucide-react';
import { isValidEmail } from '../utils/email';
import { StorageManagementSection } from './StorageManagementSection';
import { domesticPlans, useBilling } from '../contexts/BillingContext';
import { DomesticAccountBilling } from './DomesticAccountBilling';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing?: (source?: 'upgrade' | 'general') => void;
}

type TabType = 'basic' | 'membership' | 'storage' | 'payment' | 'account';

const creditPackages = [
  { id: 'pack-0618', purchasedAt: '2026 年 6 月 18 日', expiresAt: '2026 年 8 月 18 日', total: 5000, used: 1200 },
  { id: 'pack-0602', purchasedAt: '2026 年 6 月 2 日', expiresAt: '2026 年 8 月 2 日', total: 3000, used: 1800 },
  { id: 'pack-0524', purchasedAt: '2026 年 5 月 24 日', expiresAt: '2026 年 7 月 24 日', total: 2000, used: 1200 },
];

type VoucherFeatureId = 'deep-search' | 'scholar-qa' | 'survey' | 'feeds' | 'table-extraction' | 'blog-generation' | 'agent';

type VoucherTargetKey =
  | 'deep_search'
  | 'scholar_qa'
  | 'survey'
  | 'feed_verify'
  | 'paper_column_extractor'
  | 'summary-v2'
  | 'plan_generation'
  | 'agent_token_cost'
  | 'cpu_cost'
  | 'gpu_cost';

const voucherFeatureOrder: VoucherFeatureId[] = [
  'deep-search',
  'scholar-qa',
  'survey',
  'feeds',
  'table-extraction',
  'blog-generation',
  'agent',
];

const voucherFeatureMeta: Record<VoucherFeatureId, { label: string; className: string }> = {
  'deep-search': { label: '深度搜索', className: 'bg-orange-100 text-orange-700' },
  'scholar-qa': { label: '学术问答', className: 'bg-blue-100 text-blue-700' },
  survey: { label: 'AI Survey', className: 'bg-violet-100 text-violet-700' },
  feeds: { label: 'AI Feeds', className: 'bg-emerald-100 text-emerald-700' },
  'table-extraction': { label: '表格抽取', className: 'bg-cyan-100 text-cyan-700' },
  'blog-generation': { label: 'Blog 生成', className: 'bg-pink-100 text-pink-700' },
  agent: { label: 'Agent', className: 'bg-teal-100 text-teal-700' },
};

const voucherTargetMap: Partial<Record<VoucherTargetKey, VoucherFeatureId>> = {
  deep_search: 'deep-search',
  scholar_qa: 'scholar-qa',
  survey: 'survey',
  feed_verify: 'feeds',
  paper_column_extractor: 'table-extraction',
  'summary-v2': 'blog-generation',
  agent_token_cost: 'agent',
  cpu_cost: 'agent',
  gpu_cost: 'agent',
};

const normalizeVoucherFeatures = (targets: VoucherTargetKey[]) => {
  const normalized = new Set<VoucherFeatureId>();
  targets.forEach((target) => {
    const feature = voucherTargetMap[target];
    if (feature) normalized.add(feature);
  });
  return voucherFeatureOrder.filter((feature) => normalized.has(feature));
};

const voucherCredits: Array<{
  id: string;
  name: string;
  issuedAt: string;
  expiresAt: string;
  targets: VoucherTargetKey[];
  total: number;
  used: number;
}> = [
  {
    id: 'voucher-research-0625',
    name: '研究执行奖励',
    issuedAt: '2026 年 6 月 25 日',
    expiresAt: '2026 年 9 月 25 日',
    targets: ['deep_search', 'scholar_qa', 'agent_token_cost', 'cpu_cost', 'gpu_cost'],
    total: 3000,
    used: 900,
  },
  {
    id: 'voucher-content-0612',
    name: '内容处理体验券',
    issuedAt: '2026 年 6 月 12 日',
    expiresAt: '2026 年 9 月 12 日',
    targets: ['survey', 'feed_verify', 'summary-v2', 'plan_generation'],
    total: 2500,
    used: 700,
  },
  {
    id: 'voucher-data-0601',
    name: '数据抽取补偿',
    issuedAt: '2026 年 6 月 1 日',
    expiresAt: '2026 年 9 月 1 日',
    targets: ['deep_search', 'paper_column_extractor'],
    total: 2000,
    used: 500,
  },
];

function VoucherFeatureTag({ feature }: { feature: VoucherFeatureId }) {
  const meta = voucherFeatureMeta[feature];
  return <span className={`inline-flex rounded-md px-2 py-1 text-[9px] font-semibold ${meta.className}`}>{meta.label}</span>;
}

export function SettingsModal({ isOpen, onClose, onOpenPricing }: SettingsModalProps) {
  const { market, subscription } = useBilling();
  const domesticActive = Boolean(subscription.end && new Date(subscription.end).getTime() > Date.now());
  const [activeTab, setActiveTab] = useState<TabType>('membership');
  const [openIdCopied, setOpenIdCopied] = useState(false);
  const openId = 'tyqx1tdh3nwg';
  const navigationItems = [
    { id: 'membership' as const, label: '会员与 Credits', icon: Crown },
    { id: 'basic' as const, label: '个人资料', icon: User },
    { id: 'storage' as const, label: '存储空间', icon: HardDrive },
    { id: 'payment' as const, label: '订单与账单', icon: CreditCard },
    { id: 'account' as const, label: '设置', icon: Settings },
  ];
  const activePage = navigationItems.find((item) => item.id === activeTab) ?? navigationItems[0];

  useEffect(() => {
    if (isOpen) setActiveTab('membership');
  }, [isOpen]);

  const copyOpenId = async () => {
    try {
      await navigator.clipboard.writeText(openId);
      setOpenIdCopied(true);
      window.setTimeout(() => setOpenIdCopied(false), 1600);
    } catch {
      setOpenIdCopied(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="grid h-[min(88vh,860px)] w-full max-w-5xl grid-cols-[15.5rem_minmax(0,1fr)] overflow-hidden rounded-2xl bg-white shadow-[0_28px_90px_-32px_rgba(15,23,42,0.48)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-account-title"
      >
        {/* Left Sidebar */}
        <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-slate-50/80 p-4">
          {/* User Profile */}
          <div className="mb-5 rounded-xl bg-white p-3 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/80">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900">
                <span className="text-sm font-semibold text-white">张</span>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">张涛</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="truncate text-[11px] text-slate-500">Open ID: {openId}</span>
                  <button
                    type="button"
                    onClick={copyOpenId}
                    className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={openIdCopied ? 'Open ID 已复制' : '复制 Open ID'}
                    title={openIdCopied ? '已复制' : '复制 Open ID'}
                  >
                    {openIdCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <span className="sr-only" aria-live="polite">{openIdCopied ? 'Open ID 已复制' : ''}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
              <span className="text-[11px] text-slate-500">个人账户</span>
              <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">{market === 'domestic' ? domesticActive ? `${domesticPlans.find((plan) => plan.id === subscription.plan)!.name} ${subscription.renewalPeriod === 'annual' ? '年付版' : '月度版'}` : 'Free' : 'Pro 月度版'}</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-1" aria-label="我的账户">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.99] ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-[0_12px_24px_-18px_rgba(15,23,42,0.8)]'
                      : 'text-slate-600 hover:bg-white hover:text-slate-950'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'}`} />
                  <span className="min-w-0 text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Area */}
        <section className="flex min-h-0 min-w-0 flex-col">
          {/* Header */}
          <header className="flex items-start justify-between border-b border-slate-200 px-8 py-5">
            <div>
              <h2 id="my-account-title" className="text-xl font-semibold tracking-[-0.02em] text-slate-950">{activePage.label}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-300"
              aria-label="关闭我的账户"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Content */}
          <main className="min-h-0 flex-1 overflow-y-auto bg-white">
            {activeTab === 'basic' && <BasicInformation />}
            {activeTab === 'membership' && <RegionalMembership onOpenPricing={onOpenPricing} />}
            {activeTab === 'storage' && (market === 'domestic' ? <DomesticAccountBilling storageOnly onOpenPricing={onOpenPricing} /> : <div className="p-8"><div className="mx-auto max-w-3xl"><StorageManagementSection onOpenPricing={onOpenPricing} /></div></div>)}
            {activeTab === 'payment' && <RegionalOrders onOpenPricing={onOpenPricing} />}
            {activeTab === 'account' && <AccountSettings onFinish={onClose} />}
          </main>
        </section>
      </div>
    </div>
  );
}

// Basic Information Tab
function RegionalMembership({ onOpenPricing }: { onOpenPricing?: (source?: 'upgrade' | 'general') => void }) {
  const { market } = useBilling();
  return market === 'domestic' ? <DomesticAccountBilling onOpenPricing={onOpenPricing} /> : <MembershipPayment onOpenPricing={onOpenPricing} />;
}

function RegionalOrders({ onOpenPricing }: { onOpenPricing?: (source?: 'upgrade' | 'general') => void }) {
  const { market } = useBilling();
  return market === 'domestic' ? <DomesticAccountBilling ordersOnly onOpenPricing={onOpenPricing} /> : <PaymentTab />;
}

function BasicInformation() {
  const [name, setName] = useState('张伟');
  const [email, setEmail] = useState('zhangwei@example.com');
  const [organization, setOrganization] = useState('清华大学');
  const [researchField, setResearchField] = useState('人工智能、机器学习');
  const [emailError, setEmailError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!isValidEmail(email)) {
      setEmailError('请输入有效的邮箱地址');
      setSaved(false);
      return;
    }

    setEmailError('');
    setSaved(true);
    console.log('Saving profile', { name, email: email.trim(), organization, researchField });
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <section className="grid grid-cols-[10rem_minmax(0,1fr)] gap-8">
          <div>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-900 text-2xl font-semibold text-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.9)]">
              张
            </div>
            <button className="mt-3 text-xs font-medium text-slate-600 transition-colors hover:text-slate-950">
              更换头像
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-5">
            {/* Name */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">电子邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                const nextEmail = event.target.value;
                setEmail(nextEmail);
                if (!nextEmail.trim() || isValidEmail(nextEmail)) {
                  setEmailError('');
                }
                setSaved(false);
              }}
              onBlur={() => {
                if (email.trim() && !isValidEmail(email)) {
                  setEmailError('请输入有效的邮箱地址');
                }
              }}
              className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                emailError ? 'border-red-300 focus:ring-red-100' : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200'
              }`}
            />
            {emailError ? <p className="mt-2 text-xs text-red-500">{emailError}</p> : null}
          </div>

          {/* Organization */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">所属机构</label>
            <input
              type="text"
              value={organization}
              onChange={(event) => {
                setOrganization(event.target.value);
                setSaved(false);
              }}
              placeholder="输入您的机构名称"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          {/* Research Field */}
          <div>
            <label className="mb-2 block text-xs font-medium text-slate-700">研究领域</label>
            <input
              type="text"
              value={researchField}
              onChange={(event) => {
                setResearchField(event.target.value);
                setSaved(false);
              }}
              placeholder="输入您的研究领域"
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
          <div>
            {saved && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                个人资料已保存
              </p>
            )}
          </div>
            <button
              onClick={handleSave}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              保存更改
            </button>
        </div>
      </div>
    </div>
  );
}

// Membership & Payment Tab
function MembershipPayment({ onOpenPricing }: { onOpenPricing?: () => void }) {
  const [showCreditPackages, setShowCreditPackages] = useState(false);
  const [showVoucherCredits, setShowVoucherCredits] = useState(false);
  const voucherFeatures = normalizeVoucherFeatures(voucherCredits.flatMap((voucher) => voucher.targets));
  const voucherTotal = voucherCredits.reduce((sum, voucher) => sum + voucher.total, 0);
  const voucherUsed = voucherCredits.reduce((sum, voucher) => sum + voucher.used, 0);
  const voucherRemaining = voucherTotal - voucherUsed;
  const voucherUsedPercentage = voucherTotal > 0 ? (voucherUsed / voucherTotal) * 100 : 0;
  const coversAllFeatures = voucherFeatures.length === voucherFeatureOrder.length;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        {/* Current Plan */}
        <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-[0_24px_50px_-30px_rgba(15,23,42,0.8)]">
          <div className="grid grid-cols-[1fr_auto] gap-8 p-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium tracking-[0.14em] text-slate-400">当前套餐</span>
                <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-[10px] font-medium text-emerald-300">生效中</span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Pro 月度版</h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-5 text-slate-400">
                <span>月付 · 2026 年 7 月 10 日到期</span>
                <span>自动续费中</span>
                <span>Stripe</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenPricing}
              className="self-center rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-slate-950 transition-all hover:bg-slate-100 active:scale-[0.98]"
            >
              升级
            </button>
          </div>
          <div className="border-t border-white/10 px-6 py-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">会员 Credits</p>
                  <span className="rounded-md bg-white/10 px-2 py-1 text-[9px] font-semibold text-slate-300">月度额度</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-white tabular-nums">76,600 剩余</p>
            </div>
            <div
              className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-label="Pro 会员 Credits 已使用额度"
              aria-valuemin={0}
              aria-valuemax={200000}
              aria-valuenow={123400}
            >
              <div className="h-full w-[61.7%] rounded-full bg-white" />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>将在 2026 年 7 月 10 日重置</span>
              <span>38.3% 可用</span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[10px] text-slate-500">
              <span>已领取 Voucher</span>
              <span className="tabular-nums text-slate-400">{voucherCredits.length} 笔 · {voucherRemaining.toLocaleString()} Credits</span>
            </div>
          </div>
        </section>

        <section className="mt-5 space-y-3">
          <article className="overflow-hidden rounded-xl border border-blue-100 bg-blue-50/50">
              <div className="flex items-start gap-3 p-4">
                <button
                  type="button"
                  onClick={() => setShowCreditPackages((current) => !current)}
                  className="group flex min-w-0 flex-1 items-start justify-between gap-4 text-left"
                  aria-expanded={showCreditPackages}
                  aria-controls="credit-package-details"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-900">充值包 Credits</h4>
                      <span className="rounded-md bg-blue-100 px-2 py-1 text-[9px] font-semibold text-blue-700">{creditPackages.length} 笔</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-950 tabular-nums">5,800</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-700 ${showCreditPackages ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <button
                  type="button"
                  onClick={onOpenPricing}
                  className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                >
                  购买充值包
                </button>
              </div>

              <div className="px-4 pb-4">
                <div className="h-2 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label="充值包 Credits 池已使用额度" aria-valuemin={0} aria-valuemax={10000} aria-valuenow={4200}>
                  <div className="h-full w-[42%] rounded-full bg-blue-600" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="tabular-nums">已使用 4,200 / 10,000</span>
                  <span>{showCreditPackages ? '收起购买明细' : '展开查看每笔余额'}</span>
                </div>
              </div>

              {showCreditPackages && (
                <div id="credit-package-details" className="border-t border-blue-100 bg-white">
                  {creditPackages.map((creditPackage, index) => {
                    const remaining = creditPackage.total - creditPackage.used;
                    const usedPercentage = (creditPackage.used / creditPackage.total) * 100;

                    return (
                      <div
                        key={creditPackage.id}
                        className={`px-4 py-3.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-semibold text-slate-900">购买于 {creditPackage.purchasedAt}</p>
                            <p className="mt-1 text-[9px] text-slate-400">有效期至 {creditPackage.expiresAt}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-semibold text-blue-700 tabular-nums">{remaining.toLocaleString()} 剩余</p>
                            <p className="mt-0.5 text-[9px] text-slate-400">共 {creditPackage.total.toLocaleString()} Credits</p>
                          </div>
                        </div>
                        <div
                          className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
                          role="progressbar"
                          aria-label={`${creditPackage.purchasedAt}购买的充值包已使用额度`}
                          aria-valuemin={0}
                          aria-valuemax={creditPackage.total}
                          aria-valuenow={creditPackage.used}
                        >
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${usedPercentage}%` }} />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                          <span className="tabular-nums">已使用 {creditPackage.used.toLocaleString()}</span>
                          <span className="tabular-nums">{remaining.toLocaleString()} / {creditPackage.total.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </article>

          <article className="overflow-hidden rounded-xl border border-violet-100 bg-violet-50/50">
            <button
              type="button"
              onClick={() => setShowVoucherCredits((current) => !current)}
              className="group flex w-full items-start justify-between gap-4 p-4 text-left"
              aria-expanded={showVoucherCredits}
              aria-controls="voucher-credit-details"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900">Voucher Credits</h4>
                  {coversAllFeatures ? (
                    <span className="inline-flex rounded-md bg-slate-900 px-2 py-1 text-[9px] font-semibold text-white">全功能</span>
                  ) : (
                    <>
                      <span className="hidden items-center gap-1.5 sm:inline-flex">
                        {voucherFeatures.slice(0, 2).map((feature) => <VoucherFeatureTag key={feature} feature={feature} />)}
                        {voucherFeatures.length > 2 && (
                          <span
                            className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600"
                            title={voucherFeatures.slice(2).map((feature) => voucherFeatureMeta[feature].label).join('、')}
                          >
                            +{voucherFeatures.length - 2}
                          </span>
                        )}
                      </span>
                      <span className="inline-flex items-center gap-1.5 sm:hidden">
                        {voucherFeatures.slice(0, 1).map((feature) => <VoucherFeatureTag key={feature} feature={feature} />)}
                        {voucherFeatures.length > 1 && (
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">+{voucherFeatures.length - 1}</span>
                        )}
                      </span>
                    </>
                  )}
                  <span className="rounded-md bg-violet-100 px-2 py-1 text-[9px] font-semibold text-violet-700">{voucherCredits.length} 笔</span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold text-slate-950 tabular-nums">{voucherRemaining.toLocaleString()}</p>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:text-slate-700 ${showVoucherCredits ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <div className="px-4 pb-4">
              <div
                className="h-2 overflow-hidden rounded-full bg-violet-100"
                role="progressbar"
                aria-label="Voucher Credits 池已使用额度"
                aria-valuemin={0}
                aria-valuemax={voucherTotal}
                aria-valuenow={voucherUsed}
              >
                <div className="h-full rounded-full bg-violet-600" style={{ width: `${voucherUsedPercentage}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span className="tabular-nums">已使用 {voucherUsed.toLocaleString()} / {voucherTotal.toLocaleString()}</span>
                <span>{showVoucherCredits ? '收起发放明细' : '展开查看每笔余额'}</span>
              </div>
            </div>

            {showVoucherCredits && (
              <div id="voucher-credit-details" className="border-t border-violet-100 bg-white">
                {voucherCredits.map((voucher, index) => {
                  const remaining = voucher.total - voucher.used;
                  const usedPercentage = (voucher.used / voucher.total) * 100;
                  const features = normalizeVoucherFeatures(voucher.targets);
                  const featureLabels = features.map((feature) => voucherFeatureMeta[feature].label);

                  return (
                    <div
                      key={voucher.id}
                      className={`px-4 py-3.5 ${index > 0 ? 'border-t border-slate-100' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-semibold text-slate-900">{voucher.name}</p>
                            {features.map((feature) => <VoucherFeatureTag key={feature} feature={feature} />)}
                          </div>
                          <p className="mt-1 text-[9px] text-slate-400">发放于 {voucher.issuedAt} · 有效期至 {voucher.expiresAt}</p>
                          <p className="mt-0.5 text-[9px] text-slate-400">仅限 {featureLabels.join('、')} 使用</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-violet-700 tabular-nums">{remaining.toLocaleString()} 剩余</p>
                          <p className="mt-0.5 text-[9px] text-slate-400">共 {voucher.total.toLocaleString()} Credits</p>
                        </div>
                      </div>
                      <div
                        className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${featureLabels.join('、')} Voucher Credits 已使用额度`}
                        aria-valuemin={0}
                        aria-valuemax={voucher.total}
                        aria-valuenow={voucher.used}
                      >
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${usedPercentage}%` }} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400">
                        <span className="tabular-nums">已使用 {voucher.used.toLocaleString()}</span>
                        <span className="tabular-nums">{remaining.toLocaleString()} / {voucher.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </section>

      </div>
    </div>
  );
}

// Payment Tab
function PaymentTab() {
  const [market, setMarket] = useState<'global' | 'cn'>('global');
  const [visibleCount, setVisibleCount] = useState(4);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [openPaymentMenu, setOpenPaymentMenu] = useState<string | null>(null);

  const globalOrders = [
    { id: 'g1', date: '2026年6月10日', type: 'Pro 月度', method: 'Stripe', account: 'Visa ···· 4242', amount: '-', action: '前往账单' },
    { id: 'g2', date: '2026年5月10日', type: 'Pro 月度', method: 'Stripe', account: 'Visa ···· 4242', amount: '-', action: '前往账单' },
    { id: 'g3', date: '2026年4月18日', type: '充值包 Credits', method: 'Airwallex', account: 'Mastercard ···· 8821', amount: '-', action: '下载' },
    { id: 'g4', date: '2026年4月10日', type: 'Pro 月度', method: 'Stripe', account: 'Visa ···· 4242', amount: '-', action: '前往账单' },
    { id: 'g5', date: '2026年3月12日', type: '充值包 Credits', method: 'Airwallex', account: 'Mastercard ···· 8821', amount: '-', action: '下载' },
  ];
  const cnOrders = [
    { id: 'c1', date: '2026年6月10日', type: 'Pro 月度', account: '银联 ···· 6288', amount: '-', action: '申请发票' },
    { id: 'c2', date: '2026年5月10日', type: 'Pro 月度', account: '银联 ···· 6288', amount: '-', action: '下载发票' },
    { id: 'c3', date: '2026年4月18日', type: '充值包 Credits', account: '银联 ···· 0916', amount: '-', action: '申请发票' },
  ];

  const orderHistory = market === 'global' ? globalOrders : cnOrders;
  const visibleOrders = orderHistory.slice(0, visibleCount);
  const hasMore = visibleCount < orderHistory.length;

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <section aria-labelledby="payment-methods-title">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 id="payment-methods-title" className="text-sm font-semibold text-slate-950">支付方式</h3>
            <button
              type="button"
              onClick={() => setShowAddPayment(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              新增支付方式
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <article className="relative flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.38)]">
              <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-xs font-black italic tracking-tight text-blue-900">
                VISA
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-slate-950">Visa ···· 4242</p>
                  <span className="rounded-md bg-blue-50 px-2 py-1 text-[9px] font-semibold text-blue-700">默认</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">有效期至 10/28</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPaymentMenu((current) => current === 'visa' ? null : 'visa')}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="管理 Visa 支付方式"
                aria-expanded={openPaymentMenu === 'visa'}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {openPaymentMenu === 'visa' && (
                <div className="absolute right-3 top-[68px] z-10 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                  <button type="button" className="w-full rounded-md px-3 py-2 text-left text-[11px] text-slate-700 hover:bg-slate-50">编辑支付方式</button>
                  <button type="button" className="w-full rounded-md px-3 py-2 text-left text-[11px] text-red-600 hover:bg-red-50">移除</button>
                </div>
              )}
            </article>

            <article className="relative flex min-h-[92px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_14px_36px_-30px_rgba(15,23,42,0.38)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1677ff] text-lg font-bold text-white">
                支
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-950">支付宝</p>
                <p className="mt-1 text-[10px] text-slate-500">已授权账户</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenPaymentMenu((current) => current === 'alipay' ? null : 'alipay')}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="管理支付宝支付方式"
                aria-expanded={openPaymentMenu === 'alipay'}
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {openPaymentMenu === 'alipay' && (
                <div className="absolute right-3 top-[68px] z-10 w-32 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                  <button type="button" className="w-full rounded-md px-3 py-2 text-left text-[11px] text-blue-700 hover:bg-blue-50">设为默认</button>
                  <button type="button" className="w-full rounded-md px-3 py-2 text-left text-[11px] text-red-600 hover:bg-red-50">解除授权</button>
                </div>
              )}
            </article>
          </div>
        </section>

        <div className="my-6 border-t border-slate-200" />

        <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="订单地区">
          {([
            ['global', '海外订单'],
            ['cn', '国内订单'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={market === id}
              onClick={() => { setMarket(id); setVisibleCount(4); }}
              className={`rounded-md px-4 py-2 text-xs font-semibold transition ${market === id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="mt-6">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">订单记录</h3>
            </div>
            <p className="text-[11px] text-slate-400">共 {orderHistory.length} 笔</p>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            {/* Table Header */}
            <div className={`grid ${market === 'global' ? 'grid-cols-[0.9fr_1.1fr_0.72fr_1fr_3.4rem_3rem_4.7rem]' : 'grid-cols-[0.9fr_1.15fr_1fr_3.4rem_3rem_5.5rem]'} gap-2.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5`}>
              <span className="text-[11px] font-medium text-slate-500">日期</span>
              <span className="text-[11px] font-medium text-slate-500">订单类型</span>
              {market === 'global' && <span className="text-[11px] font-medium text-slate-500">支付渠道</span>}
              <span className="text-[11px] font-medium text-slate-500">支付账户</span>
              <span className="text-[11px] font-medium text-slate-500">状态</span>
              <span className="text-right text-[11px] font-medium text-slate-500">金额</span>
              <span className="text-right text-[11px] font-medium text-slate-500">{market === 'global' ? '账单' : '发票'}</span>
            </div>

            {/* Table Rows */}
            {visibleOrders.map((order, index) => (
              <div
                key={order.id}
                className={`grid ${market === 'global' ? 'grid-cols-[0.9fr_1.1fr_0.72fr_1fr_3.4rem_3rem_4.7rem]' : 'grid-cols-[0.9fr_1.15fr_1fr_3.4rem_3rem_5.5rem]'} items-center gap-2.5 px-4 py-3.5 transition-colors hover:bg-slate-50/70 ${
                  index !== visibleOrders.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <span className="text-xs text-slate-600">{order.date}</span>
                <span className="text-sm font-medium text-slate-900">{order.type}</span>
                {market === 'global' && <span className="text-xs text-slate-600">{'method' in order ? order.method : ''}</span>}
                <span className="whitespace-nowrap text-[11px] text-slate-600 tabular-nums">{order.account}</span>
                <span className="text-xs text-emerald-600">已支付</span>
                <span className="text-right text-sm font-medium text-slate-950 tabular-nums">{order.amount}</span>
                <button
                  type="button"
                  onClick={() => console.info(market === 'global' ? 'Open billing statement' : 'Open invoice management', { orderId: order.id })}
                  className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  aria-label={`${order.action} ${order.date} ${order.type}`}
                >
                  {market === 'global' && order.action === '下载' ? <Download className="h-3.5 w-3.5" /> : market === 'global' ? <ExternalLink className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                  <span>{order.action}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="mt-3 text-xs font-medium text-slate-600 transition-colors hover:text-slate-950"
            >
              加载更多
            </button>
          )}
        </section>

        {showAddPayment && (
          <div className="fixed inset-0 z-[10020] flex items-center justify-center bg-slate-950/45 p-4" onClick={() => setShowAddPayment(false)}>
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="add-payment-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="add-payment-title" className="text-base font-semibold text-slate-950">新增支付方式</h3>
                  <p className="mt-1 text-xs text-slate-500">选择要绑定的支付方式</p>
                </div>
                <button type="button" onClick={() => setShowAddPayment(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="关闭">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button type="button" className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50">
                  <WalletCards className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-900">信用卡 / 借记卡</span>
                </button>
                <button type="button" className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/50">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1677ff] text-xs font-bold text-white">支</span>
                  <span className="text-xs font-semibold text-slate-900">支付宝</span>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

type DeletionScenario = 'ready' | 'institution' | 'pending-order';
type DeletionStep = 'closed' | 'confirm' | 'blocked' | 'institution' | 'deleting' | 'success';

const deletionConsequences = [
  '账户注销后，您将无法登录或恢复该账户；',
  '您的个人数据将会永久删除且无法恢复，但法律要求或允许的部分数据可能保留更长时间；',
  '您创建的所有分享链接将立即失效；',
  '未使用的会员权益、额度及 Voucher 将作废；',
  '您的自动续费订阅将自动取消。',
];

// Account Settings Tab
function AccountSettings({ onFinish }: { onFinish: () => void }) {
  const [scenario] = useState<DeletionScenario>('ready');
  const [deletionStep, setDeletionStep] = useState<DeletionStep>('closed');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationState, setVerificationState] = useState<'idle' | 'sent' | 'valid' | 'invalid'>('idle');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const resetVerification = () => {
    setVerificationCode('');
    setVerificationState('idle');
    setCountdown(0);
  };

  const closeDeletionFlow = () => {
    if (deletionStep === 'deleting') return;
    setDeletionStep('closed');
    resetVerification();
  };

  const startDeletionFlow = () => {
    console.info('[analytics] account_deletion_entry_clicked', { scenario });
    resetVerification();

    if (scenario === 'institution') {
      console.info('[analytics] account_deletion_institution_blocked');
      setDeletionStep('institution');
      return;
    }

    if (scenario === 'pending-order') {
      console.info('[analytics] account_deletion_condition_blocked', { reason: 'pending_order' });
      setDeletionStep('blocked');
      return;
    }

    console.info('[analytics] account_deletion_confirm_viewed');
    setDeletionStep('confirm');
  };

  const sendVerificationCode = () => {
    if (countdown > 0) return;
    setVerificationState('sent');
    setVerificationCode('');
    setCountdown(60);
    console.info('[analytics] account_deletion_code_sent', { channel: 'email', result: 'success' });
  };

  const updateVerificationCode = (value: string) => {
    const nextCode = value.replace(/\D/g, '').slice(0, 6);
    setVerificationCode(nextCode);

    if (nextCode.length < 6) {
      setVerificationState(countdown > 0 ? 'sent' : 'idle');
      return;
    }

    if (nextCode === '123456') {
      setVerificationState('valid');
      console.info('[analytics] account_deletion_code_verified', { result: 'success' });
    } else {
      setVerificationState('invalid');
      console.info('[analytics] account_deletion_code_verified', { result: 'invalid_code' });
    }
  };

  const confirmDeletion = () => {
    if (verificationState !== 'valid' || deletionStep !== 'confirm') return;
    setDeletionStep('deleting');
    console.info('[analytics] account_deletion_submitted');

    window.setTimeout(() => {
      setDeletionStep('success');
      console.info('[analytics] account_deletion_completed', { result: 'success' });
    }, 900);
  };

  const closePasswordDialog = () => {
    setShowPasswordDialog(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const savePassword = () => {
    if (newPassword.length < 8) {
      setPasswordError('新密码至少需要 8 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }
    console.info('Password updated');
    closePasswordDialog();
  };

  return (
    <div className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="space-y-5">
          {/* Change Password */}
          <button
            type="button"
            onClick={() => setShowPasswordDialog(true)}
            className="group flex w-full items-center justify-between gap-5 rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-slate-300 hover:bg-slate-50/70 active:scale-[0.995] focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <ShieldCheck className="h-4 w-4 text-slate-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-950">更改密码</h3>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <span className="font-mono text-sm tracking-[0.18em] text-slate-500">******</span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700" />
            </div>
          </button>

          {/* Danger Zone */}
          <section className="rounded-xl border border-red-200 bg-red-50/30 p-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-red-700">注销账户</h3>
                  <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                    注销后账户无法恢复，个人数据与历史分享内容将按规则处理；自动续费将在注销成功后取消。
                  </p>
                </div>
              </div>
              <button
                onClick={startDeletionFlow}
                data-testid="account-deletion-trigger"
                className="shrink-0 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-600 hover:text-white active:scale-[0.98]"
              >
                注销账户
              </button>
            </div>
          </section>
        </div>
      </div>

      {showPasswordDialog && (
        <div
          className="fixed inset-0 z-[10010] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]"
          onClick={closePasswordDialog}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_-30px_rgba(15,23,42,0.55)]"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 id="change-password-title" className="text-lg font-semibold tracking-[-0.02em] text-slate-950">更改密码</h3>
              </div>
              <button
                type="button"
                onClick={closePasswordDialog}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭更改密码"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">当前密码</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setPasswordError('');
                  }}
                  placeholder="输入当前密码"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">新密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setPasswordError('');
                  }}
                  placeholder="至少 8 位"
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-700">确认新密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError('');
                  }}
                  placeholder="再次输入新密码"
                  autoComplete="new-password"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:ring-2 ${
                    passwordError
                      ? 'border-red-300 focus:ring-red-100'
                      : 'border-slate-300 focus:border-slate-500 focus:ring-slate-200'
                  }`}
                />
                {passwordError && <p className="mt-2 text-xs text-red-600">{passwordError}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={closePasswordDialog}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={savePassword}
                disabled={!currentPassword || !newPassword || !confirmPassword}
                className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                保存新密码
              </button>
            </div>
          </div>
        </div>
      )}

      {deletionStep !== 'closed' && (
        <div
          className="fixed inset-0 z-[10020] flex items-center justify-center bg-gray-950/55 p-4 backdrop-blur-[2px]"
          onClick={closeDeletionFlow}
        >
          <div
            className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-deletion-title"
          >
            {deletionStep === 'institution' && (
              <div className="p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h3 id="account-deletion-title" className="text-xl font-semibold text-gray-950">
                  无法自主注销
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  机构账户请联系机构管理员注销。管理员会协助确认账户归属与数据处理方式。
                </p>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeDeletionFlow}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            )}

            {deletionStep === 'blocked' && (
              <div className="p-7">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-amber-50">
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
                <h3 id="account-deletion-title" className="text-xl font-semibold text-gray-950">
                  暂时无法注销账户
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  账户中有 1 笔退款正在处理中。请等待退款完成后再试，账户与订阅状态不会受到影响。
                </p>
                <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">退款单 RF20260728001</p>
                      <p className="mt-1 text-xs text-gray-500">预计 1–3 个工作日内完成</p>
                    </div>
                    <button className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                      查看订单
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={closeDeletionFlow}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-black"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            )}

            {deletionStep === 'confirm' && (
              <>
                <div className="flex items-start justify-between border-b border-gray-100 px-7 py-6">
                  <div className="pr-6">
                    <h3 id="account-deletion-title" className="text-xl font-semibold text-gray-950">
                      确认注销账户
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-500">此操作不可撤销，请确认以下事项。</p>
                  </div>
                  <button
                    onClick={closeDeletionFlow}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="关闭"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[66vh] overflow-y-auto px-7 py-6">
                  <div className="rounded-xl border border-red-100 bg-red-50/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      注销后果
                    </div>
                    <ul className="mt-3 space-y-2.5">
                      {deletionConsequences.map((item) => (
                        <li key={item} className="flex gap-2.5 text-xs leading-5 text-gray-700">
                          <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-red-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-gray-700" />
                      <h4 className="text-sm font-semibold text-gray-900">验证身份</h4>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      为确保是您本人操作，验证码将发送至注册邮箱。
                    </p>

                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="flex-1 text-sm text-gray-700">z***@gmail.com</span>
                      <button
                        onClick={sendVerificationCode}
                        disabled={countdown > 0}
                        className="text-xs font-medium text-blue-600 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {countdown > 0 ? `${countdown}s 后重新发送` : verificationState === 'idle' ? '发送验证码' : '重新发送'}
                      </button>
                    </div>

                    <div className="mt-3">
                      <input
                        value={verificationCode}
                        onChange={(event) => updateVerificationCode(event.target.value)}
                        disabled={verificationState === 'idle'}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="请输入 6 位验证码"
                        aria-label="验证码"
                        className={`w-full rounded-lg border px-4 py-3 text-sm tracking-[0.22em] outline-none transition ${
                          verificationState === 'invalid'
                            ? 'border-red-300 focus:ring-2 focus:ring-red-100'
                            : verificationState === 'valid'
                              ? 'border-emerald-300 focus:ring-2 focus:ring-emerald-100'
                              : 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                        } disabled:cursor-not-allowed disabled:bg-gray-50`}
                      />
                      <div className="mt-2 min-h-5">
                        {verificationState === 'idle' && (
                          <p className="text-xs text-gray-400">请先发送验证码</p>
                        )}
                        {verificationState === 'sent' && (
                          <p className="text-xs text-gray-500">验证码已发送。原型验证码：123456</p>
                        )}
                        {verificationState === 'invalid' && (
                          <p className="text-xs text-red-600">验证码错误或已过期，请检查后重试或重新获取。</p>
                        )}
                        {verificationState === 'valid' && (
                          <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            身份验证已通过
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-7 py-4">
                  <button
                    onClick={() => {
                      console.info('[analytics] account_deletion_cancelled');
                      closeDeletionFlow();
                    }}
                    className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={confirmDeletion}
                    disabled={verificationState !== 'valid'}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    注销账户
                  </button>
                </div>
              </>
            )}

            {deletionStep === 'deleting' && (
              <div className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-800" />
                <h3 id="account-deletion-title" className="mt-5 text-lg font-semibold text-gray-950">
                  正在注销账户
                </h3>
                <p className="mt-2 text-sm text-gray-500">请不要关闭页面或重复提交。</p>
              </div>
            )}

            {deletionStep === 'success' && (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <h3 id="account-deletion-title" className="mt-5 text-xl font-semibold text-gray-950">
                  账户已注销
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-600">
                  当前及其他设备的登录会话已失效，自动续费订阅已取消，历史分享链接已停止访问。
                </p>
                <button
                  onClick={onFinish}
                  className="mt-6 w-full rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white hover:bg-black"
                >
                  完成
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
