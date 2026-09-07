import { PricingStyles } from './PricingStyles';
import React from 'react';
import { Check, ChevronDown, HelpCircle, Minus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useBilling } from '../contexts/BillingContext';
import { DomesticBilling } from './DomesticBilling';

type BillingCycle = 'monthly' | 'annual';
type LocalizedText = { zh: string; en: string };
type LocalizedPrice = { zh: number; en: number };
type ComparisonValue = boolean | string | LocalizedText;
type StoragePlanKey = 'pro' | 'maxX2' | 'maxX5';
type MaxTier = 'x2' | 'x5';

const ANNUAL_STORAGE_DISCOUNT = 0.85;
const STORAGE_OPTIONS: Record<StoragePlanKey, number[]> = {
  pro: [50, 75, 100],
  maxX2: [100, 150, 200, 250],
  maxX5: [250, 500, 750, 1000],
};

const formatStorage = (storageGb: number) => {
  if (storageGb < 1000) return `${storageGb} GB`;
  const storageTb = storageGb / 1000;
  return `${Number.isInteger(storageTb) ? storageTb : Number(storageTb.toFixed(1))} TB`;
};

const getExtraStoragePrice = (
  storageGb: number,
  baseStorageGb: number,
  language: 'zh' | 'en',
) => (Math.max(storageGb - baseStorageGb, 0) / 10) * (language === 'zh' ? 6 : 1);

const formatCurrency = (amount: number, language: 'zh' | 'en') => {
  const formattedAmount = amount.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
    maximumFractionDigits: 2,
  });
  return language === 'zh' ? `¥${formattedAmount}` : `$${formattedAmount}`;
};

const formatPlanPrice = (
  price: LocalizedPrice,
  language: 'zh' | 'en',
  storageGb?: number,
  baseStorageGb?: number,
  storageDiscount = 1,
  roundUp = false,
) => {
  const total = price[language] + (
    storageGb !== undefined && baseStorageGb !== undefined
      ? getExtraStoragePrice(storageGb, baseStorageGb, language) * storageDiscount
      : 0
  );

  return formatCurrency(roundUp ? Math.ceil(total) : total, language);
};

const formatAnnualTotal = (
  price: LocalizedPrice,
  language: 'zh' | 'en',
  storageGb?: number,
  baseStorageGb?: number,
) => {
  const total = price[language] + (
    storageGb !== undefined && baseStorageGb !== undefined
      ? getExtraStoragePrice(storageGb, baseStorageGb, language) * 12 * ANNUAL_STORAGE_DISCOUNT
      : 0
  );

  return formatCurrency(Math.ceil(total), language);
};

const formatAnnualBilling = (total: string, language: 'zh' | 'en') =>
  language === 'zh' ? `年付总计 ${total}` : `${total} billed yearly`;

const formatStoragePrice = (
  storageGb: number,
  baseStorageGb: number,
  language: 'zh' | 'en',
) => {
  const extraStorageGb = Math.max(storageGb - baseStorageGb, 0);

  if (extraStorageGb === 0) {
    return language === 'zh' ? '基础存储' : 'Base storage';
  }

  const price = getExtraStoragePrice(storageGb, baseStorageGb, language);
  return language === 'zh'
    ? `+${formatCurrency(price, language)} / 月`
    : `+${formatCurrency(price, language)} / mo`;
};

const copy = (text: LocalizedText, language: 'zh' | 'en') => text[language];

const miniPack = {
  price: { zh: 14, en: 1.99 },
  credits: '10,000',
};

const planPrices = {
  free: {
    monthly: { zh: 0, en: 0 },
    annual: { zh: 0, en: 0 },
    annualTotal: { zh: 0, en: 0 },
  },
  plus: {
    monthly: { zh: 35, en: 5 },
    annual: { zh: 30, en: 4.2 },
    annualTotal: { zh: 360, en: 50 },
  },
  pro: {
    monthly: { zh: 150, en: 20 },
    annual: { zh: 105, en: 15 },
    annualTotal: { zh: 1260, en: 180 },
  },
};

const maxPlans = {
  x2: {
    price: { zh: 300, en: 40 },
    annualPrice: { zh: 225, en: 30 },
    annualTotal: { zh: 2700, en: 360 },
    monthly: '400,000',
    passive: '1,000',
    projectStorage: '100GB',
  },
  x5: {
    price: { zh: 750, en: 100 },
    annualPrice: { zh: 565, en: 75 },
    annualTotal: { zh: 6780, en: 900 },
    monthly: '1,000,000',
    passive: '2,500',
    projectStorage: '250GB',
  },
};

const comparisonRows = [
  { label: { zh: '快速搜索', en: 'Quick Search' }, free: true, plus: true, pro: true, maxX2: true, maxX5: true },
  { label: { zh: '深度搜索', en: 'Deep Search' }, free: true, plus: true, pro: true, maxX2: true, maxX5: true },
  { label: { zh: '问答', en: 'QA' }, free: true, plus: true, pro: true, maxX2: true, maxX5: true },
  { label: { zh: '信息流', en: 'Feeds' }, free: true, plus: true, pro: true, maxX2: true, maxX5: true },
  { label: { zh: '调研综述', en: 'Survey' }, free: false, plus: false, pro: true, maxX2: true, maxX5: true },
  { label: { zh: 'Agent', en: 'Agent' }, free: false, plus: true, pro: true, maxX2: true, maxX5: true },
  { label: { zh: 'AI 索引', en: 'AI Index' }, free: '50K', plus: { zh: '全部', en: 'All' }, pro: { zh: '全部', en: 'All' }, maxX2: { zh: '全部', en: 'All' }, maxX5: { zh: '全部', en: 'All' } },
  { label: { zh: '基础高速存储', en: 'Base high-speed storage' }, free: '1GB', plus: '10GB', pro: '50GB', maxX2: '100GB', maxX5: '250GB' },
  { label: { zh: '额外充值折扣', en: 'Top-up discount' }, free: false, plus: { zh: '8.8 折', en: '12% off' }, pro: { zh: '5 折', en: '50% off' }, maxX2: { zh: '5 折', en: '50% off' }, maxX5: { zh: '5 折', en: '50% off' } },
];

function InfoLabel({ label, tooltip, dark = false, language }: { label: string; tooltip: string; dark?: boolean; language: 'zh' | 'en' }) {
  return (
    <span className="uber-info-label">
      <span>{label}</span>
      <span className="uber-tooltip-wrap">
        <button type="button" className={`uber-tooltip-icon ${dark ? 'dark' : ''}`} aria-label={language === 'zh' ? `${label}说明` : `${label} details`}>
          <HelpCircle className="h-4 w-4" />
        </button>
        <span className="uber-tooltip-content" role="tooltip">
          {tooltip}
        </span>
      </span>
    </span>
  );
}

function Availability({ value, language }: { value: ComparisonValue; language: 'zh' | 'en' }) {
  if (value === true) {
    return (
      <span className="uber-check" aria-label={language === 'zh' ? '包含' : 'Included'}>
        <Check className="h-4 w-4" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="uber-minus" aria-label={language === 'zh' ? '不包含' : 'Not included'}>
        <Minus className="h-4 w-4" />
      </span>
    );
  }

  return <span className="uber-table-value">{typeof value === 'string' ? value : copy(value, language)}</span>;
}

function PlanStorageSelector({
  planKey,
  baseStorageGb,
  value,
  isOpen,
  dark = false,
  language,
  onToggle,
  onChange,
}: {
  planKey: StoragePlanKey;
  baseStorageGb: number;
  value: number;
  isOpen: boolean;
  dark?: boolean;
  language: 'zh' | 'en';
  onToggle: () => void;
  onChange: (value: number) => void;
}) {
  const label = language === 'zh' ? '高速存储' : 'High-speed storage';
  const storageOptions = STORAGE_OPTIONS[planKey];

  return (
    <div className={`plan-storage-selector ${dark ? 'dark' : ''}`}>
      <button
        type="button"
        className="plan-storage-trigger"
        aria-expanded={isOpen}
        aria-label={`${label} ${formatStorage(value)}`}
        onClick={onToggle}
      >
        <span className="plan-storage-trigger-copy">
          <strong>{label} {formatStorage(value)}</strong>
        </span>
        <ChevronDown className={`h-4 w-4 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {isOpen ? (
        <div className="plan-storage-options" role="radiogroup" aria-label={label}>
          {storageOptions.map((storageGb) => (
            <button
              key={storageGb}
              type="button"
              role="radio"
              aria-checked={value === storageGb}
              className={`plan-storage-option ${value === storageGb ? 'selected' : ''}`}
              onClick={() => onChange(storageGb)}
            >
              <span className="plan-storage-option-capacity">{formatStorage(storageGb)}</span>
              <span className="plan-storage-option-meta">
                <small>{formatStoragePrice(storageGb, baseStorageGb, language)}</small>
                {value === storageGb ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface PricingPageProps {
  onOpenRecharge?: () => void;
  language?: 'zh' | 'en';
}

export function PricingPage({ onOpenRecharge, language: controlledLanguage }: PricingPageProps) {
  const { market } = useBilling();
  if (market === 'domestic') return <DomesticBilling />;
  return <InternationalPricingPage onOpenRecharge={onOpenRecharge} language={controlledLanguage} />;
}

function InternationalPricingPage({ onOpenRecharge, language: controlledLanguage }: PricingPageProps) {
  const { language: contextLanguage } = useLanguage();
  const language = controlledLanguage ?? contextLanguage;
  const [billingCycle, setBillingCycle] = React.useState<BillingCycle>('monthly');
  const [maxTier, setMaxTier] = React.useState<MaxTier>('x2');
  const [openStoragePlan, setOpenStoragePlan] = React.useState<StoragePlanKey | null>(null);
  const [planStorage, setPlanStorage] = React.useState<Record<StoragePlanKey, number>>({
    pro: 50,
    maxX2: 100,
    maxX5: 250,
  });
  const isAnnual = billingCycle === 'annual';
  const text = (localized: LocalizedText) => copy(localized, language);
  const activeMaxPlan = maxPlans[maxTier];
  const activeMaxStorageKey: StoragePlanKey = maxTier === 'x2' ? 'maxX2' : 'maxX5';
  const activeMaxBaseStorage = maxTier === 'x2' ? 100 : 250;
  const activeMaxStorage = planStorage[activeMaxStorageKey];
  const activeMaxName = maxTier === 'x2' ? 'Max x2' : 'Max x5';

  return (
    <div className="uber-pricing-page">
      <PricingStyles />

      <main className="page">
        <section id="plans" aria-label={text({ zh: '定价套餐', en: 'Pricing plans' })}>
          <div className="section-head">
            <h2>{text({ zh: '定价与套餐', en: 'Pricing & Plans' })}</h2>
            <div className="section-controls">
              <div className="billing-toggle" role="group" aria-label={text({ zh: '计费周期', en: 'Billing cycle' })}>
                <button
                  type="button"
                  className={billingCycle === 'monthly' ? 'active' : ''}
                  onClick={() => setBillingCycle('monthly')}
                >
                  {text({ zh: '月付', en: 'Monthly' })}
                </button>
                <button
                  type="button"
                  className={billingCycle === 'annual' ? 'active' : ''}
                  onClick={() => setBillingCycle('annual')}
                >
                  {text({ zh: '年付', en: 'Annual' })}
                  <span className="billing-discount">-15%</span>
                </button>
              </div>
            </div>
          </div>

          <div className="pricing-grid">
            <article className="plan plus">
              <div className="plan-title-row">
                <h3>Plus</h3>
                <span className="plan-tag">{text({ zh: '最受欢迎', en: 'Most popular' })}</span>
              </div>
              <p className="plan-subtitle">{text({ zh: '适合每周稳定检索和轻量问答', en: 'For steady weekly search and lightweight QA' })}</p>
              <div className="price-action">
                <p className="price"><strong>{formatPlanPrice(isAnnual ? planPrices.plus.annual : planPrices.plus.monthly, language)}</strong><span>{text({ zh: '/ 月', en: '/ month' })}</span></p>
                {isAnnual ? <p className="muted">{formatAnnualBilling(formatAnnualTotal(planPrices.plus.annualTotal, language), language)}</p> : null}
                <a className="plan-cta secondary" href="#">{text({ zh: '订阅 Plus', en: 'Subscribe to Plus' })}</a>
              </div>
              <div className="info-list">
                <div className="info-row">
                  <InfoLabel label={text({ zh: '每月积分', en: 'Monthly credits' })} tooltip={text({ zh: '按订阅周期发放，到期后未使用余额将清零。', en: 'Issued per billing cycle. Unused balance expires when the cycle ends.' })} language={language} />
                  <strong>10,000</strong>
                </div>
                <div className="info-row">
                  <InfoLabel label={text({ zh: '基础高速存储', en: 'Base high-speed storage' })} tooltip={text({ zh: '新上传文件默认进入高速存储，保留满 6 个月后自动转入归档存储。', en: 'New uploads enter high-speed storage and move to archive storage after six months.' })} language={language} />
                  <strong>10 GB</strong>
                </div>
              </div>
            </article>

            <article className="plan featured">
              <div className="plan-title-row">
                <h3>Pro</h3>
                <span className="plan-tag">{text({ zh: '最具性价比', en: 'Best value' })}</span>
              </div>
              <p className="plan-subtitle">{text({ zh: '最适合日常深度研究和 Agent 任务', en: 'Best for daily deep research and Agent tasks' })}</p>
              <div className="price-action">
                <p className="price"><strong>{formatPlanPrice(isAnnual ? planPrices.pro.annual : planPrices.pro.monthly, language, planStorage.pro, 50, isAnnual ? ANNUAL_STORAGE_DISCOUNT : 1, isAnnual)}</strong><span>{text({ zh: '/ 月', en: '/ month' })}</span></p>
                {isAnnual ? <p className="muted">{formatAnnualBilling(formatAnnualTotal(planPrices.pro.annualTotal, language, planStorage.pro, 50), language)}</p> : null}
                <a className="plan-cta secondary" href="#">{text({ zh: '订阅 Pro', en: 'Subscribe to Pro' })}</a>
                <PlanStorageSelector
                  planKey="pro"
                  baseStorageGb={50}
                  value={planStorage.pro}
                  isOpen={openStoragePlan === 'pro'}
                  dark
                  language={language}
                  onToggle={() => setOpenStoragePlan((current) => current === 'pro' ? null : 'pro')}
                  onChange={(value) => {
                    setPlanStorage((current) => ({ ...current, pro: value }));
                    setOpenStoragePlan(null);
                  }}
                />
              </div>
              <div className="info-list">
                <div className="info-row">
                  <InfoLabel label={text({ zh: '每月积分', en: 'Monthly credits' })} tooltip={text({ zh: '按订阅周期发放，到期后未使用余额将清零。', en: 'Issued per billing cycle. Unused balance expires when the cycle ends.' })} dark language={language} />
                  <strong>200,000</strong>
                </div>
                <div className="info-row">
                  <InfoLabel label={text({ zh: '基础高速存储', en: 'Base high-speed storage' })} tooltip={text({ zh: '用于 Reader、QA、Survey 和 Agent 快速调用，文件保留满 6 个月后自动归档。', en: 'Used for fast access by Reader, QA, Survey, and Agent. Files archive after six months.' })} dark language={language} />
                  <strong>50 GB</strong>
                </div>
              </div>
            </article>

            <article className="plan max">
              <div className="plan-title-row">
                <h3>Max</h3>
                <div className="max-tier-switch" role="tablist" aria-label={text({ zh: 'Max 规格', en: 'Max tier' })}>
                  {(['x2', 'x5'] as MaxTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      role="tab"
                      aria-selected={maxTier === tier}
                      className={maxTier === tier ? 'active' : ''}
                      onClick={() => {
                        setMaxTier(tier);
                        setOpenStoragePlan(null);
                      }}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>
              <p className="plan-subtitle">{text({ zh: '高频 Agent 使用、多项目协作和高存储需求', en: 'For frequent Agent usage, multi-project collaboration, and high storage needs' })}</p>
              <div className="price-action">
                <p className="price"><strong>{formatPlanPrice(isAnnual ? activeMaxPlan.annualPrice : activeMaxPlan.price, language, activeMaxStorage, activeMaxBaseStorage, isAnnual ? ANNUAL_STORAGE_DISCOUNT : 1, isAnnual)}</strong><span>{text({ zh: '/ 月', en: '/ month' })}</span></p>
                {isAnnual ? <p className="muted">{formatAnnualBilling(formatAnnualTotal(activeMaxPlan.annualTotal, language, activeMaxStorage, activeMaxBaseStorage), language)}</p> : null}
                <a className="plan-cta" href="#">{text({ zh: `订阅 ${activeMaxName}`, en: `Subscribe to ${activeMaxName}` })}</a>
                <PlanStorageSelector
                  planKey={activeMaxStorageKey}
                  baseStorageGb={activeMaxBaseStorage}
                  value={activeMaxStorage}
                  isOpen={openStoragePlan === activeMaxStorageKey}
                  language={language}
                  onToggle={() => setOpenStoragePlan((current) => current === activeMaxStorageKey ? null : activeMaxStorageKey)}
                  onChange={(value) => {
                    setPlanStorage((current) => ({ ...current, [activeMaxStorageKey]: value }));
                    setOpenStoragePlan(null);
                  }}
                />
              </div>
              <div className="info-list">
                <div className="info-row">
                  <InfoLabel label={text({ zh: '每月积分', en: 'Monthly credits' })} tooltip={text({ zh: '按订阅周期发放，到期后未使用余额将清零。', en: 'Issued per billing cycle. Unused balance expires when the cycle ends.' })} language={language} />
                  <strong>{activeMaxPlan.monthly}</strong>
                </div>
                <div className="info-row">
                  <InfoLabel
                    label={text({ zh: '基础高速存储', en: 'Base high-speed storage' })}
                    tooltip={text({
                      zh: `${activeMaxName} 包含 ${formatStorage(activeMaxBaseStorage)} 基础高速存储，归档存储用于长期保存低频文件。`,
                      en: `${activeMaxName} includes ${formatStorage(activeMaxBaseStorage)} of base high-speed storage. Archive storage keeps lower-frequency files long term.`,
                    })}
                    language={language}
                  />
                  <strong>{formatStorage(activeMaxBaseStorage)}</strong>
                </div>
              </div>
            </article>
          </div>

          <section className="subscription-management" aria-labelledby="subscription-management-title">
            <div className="subscription-management-head">
              <h3 id="subscription-management-title">{text({ zh: '会员信息', en: 'Membership' })}</h3>
              <span>{text({ zh: '当前订阅由 Stripe 管理', en: 'Current subscription is managed by Stripe' })}</span>
            </div>
            <div className="subscription-management-grid">
              <div className="subscription-management-item">
                <span className="subscription-label">{text({ zh: '当前会员', en: 'Current membership' })}</span>
                <span className="subscription-value">Pro · {text({ zh: '月付', en: 'Monthly' })}</span>
                <span className="subscription-note">{text({ zh: '2026 年 7 月 10 日到期', en: 'Expires Jul 10, 2026' })}</span>
              </div>
              <div className="subscription-management-item">
                <span className="subscription-label">{text({ zh: '连续订阅', en: 'Auto-renew' })}</span>
                <div className="renew-switch active" role="status" aria-label={text({ zh: '连续订阅已开启', en: 'Auto-renew is on' })}>
                  <span className="renew-track" aria-hidden="true" />
                  <span className="subscription-value">{text({ zh: '已开启', en: 'On' })}</span>
                </div>
                <span className="subscription-note">{text({ zh: '下个周期自动续费', en: 'Renews next billing cycle' })}</span>
              </div>
              <div className="subscription-management-item">
                <span className="subscription-label">{text({ zh: '支付方式', en: 'Payment method' })}</span>
                <div className="locked-payment">
                  <span className="card-brand">VISA</span>
                  <span className="subscription-value">Visa ···· 4242</span>
                </div>
                <span className="subscription-note">{text({ zh: '订阅期间不可更改', en: 'Locked while subscribed' })}</span>
              </div>
              <div className="subscription-management-item">
                <span className="subscription-label">{text({ zh: '订阅管理', en: 'Subscription actions' })}</span>
                <button type="button" className="cancel-subscription-button">
                  {text({ zh: '取消订阅', en: 'Cancel subscription' })}
                </button>
                <span className="subscription-note">{text({ zh: '取消后可更换支付方式', en: 'Change payment after canceling' })}</span>
              </div>
            </div>
          </section>

          <section className="recharge-products-section" aria-label={text({ zh: '充值包商品', en: 'Credit pack products' })}>
            <div className="recharge-products-grid">
              <article className="plan mini-pack">
              <div className="plan-title-row">
                <h3>Mini Pack</h3>
              </div>
              <p className="plan-subtitle">{text({ zh: '按需补充积分，适合临时高峰任务', en: 'Add credits on demand for temporary workload spikes' })}</p>
              <div className="price-action">
                <p className="price"><strong>{formatPlanPrice(miniPack.price, language)}</strong><span>{text({ zh: '一次性', en: 'one-time' })}</span></p>
                <p className="muted">{miniPack.credits} Credits</p>
                <a
                  className="plan-cta"
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    onOpenRecharge?.();
                  }}
                >
                  {text({ zh: '立即充值', en: 'Recharge now' })}
                </a>
              </div>
              <div className="info-list">
                <div className="info-row">
                  <span className="uber-info-label">{text({ zh: '包含积分', en: 'Credits included' })}</span>
                  <strong>{miniPack.credits}</strong>
                </div>
                <div className="info-row">
                  <span className="uber-info-label">{text({ zh: '购买类型', en: 'Purchase type' })}</span>
                  <strong>{text({ zh: '一次性购买', en: 'One-time purchase' })}</strong>
                </div>
                <div className="info-row">
                  <span className="uber-info-label">{text({ zh: '有效期', en: 'Validity' })}</span>
                  <strong>{text({ zh: '一年有效', en: 'Valid for one year' })}</strong>
                </div>
              </div>
              </article>
            </div>
          </section>

        </section>

        <section className="redeem-section" aria-label={text({ zh: '兑换会员码', en: 'Redeem membership code' })}>
          <h2>{text({ zh: '兑换会员码', en: 'Redeem membership code' })}</h2>
          <p className="redeem-note">
            {text({ zh: '不限量功能仅供个人正常使用。自动脚本或异常高频调用可能触发临时限制。', en: 'Unmetered features are designed for individual human use. Automated scripts or excessive volume may trigger temporary limits.' })}
          </p>
          <div className="redeem-ticket">
            <input className="redeem-input" value="WISP2025" readOnly aria-label={text({ zh: '会员码', en: 'Membership code' })} />
            <button type="button" className="redeem-button">{text({ zh: '立即兑换', en: 'Redeem Now' })}</button>
          </div>
        </section>

        <section className="compare" aria-labelledby="compare-title">
          <div className="section-head">
            <h2 id="compare-title">{text({ zh: '套餐对比', en: 'Compare plans' })}</h2>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>{text({ zh: '订阅计划', en: 'Subscription plan' })}</th>
                  <th>Free</th>
                  <th>Plus<a className="table-plan-action" href="#">{text({ zh: '升级 ↗', en: 'Upgrade ↗' })}</a></th>
                  <th>Pro<a className="table-plan-action" href="#">{text({ zh: '升级 ↗', en: 'Upgrade ↗' })}</a></th>
                  <th>Max x2<a className="table-plan-action" href="#">{text({ zh: '升级 ↗', en: 'Upgrade ↗' })}</a></th>
                  <th>Max x5<a className="table-plan-action" href="#">{text({ zh: '升级 ↗', en: 'Upgrade ↗' })}</a></th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label.en}>
                    <td>{text(row.label)}</td>
                    <td><Availability value={row.free} language={language} /></td>
                    <td><Availability value={row.plus} language={language} /></td>
                    <td><Availability value={row.pro} language={language} /></td>
                    <td><Availability value={row.maxX2} language={language} /></td>
                    <td><Availability value={row.maxX5} language={language} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="faq" aria-labelledby="faq-title">
          <h2 id="faq-title">{text({ zh: '定价常见问题', en: 'Pricing FAQ' })}</h2>
          <div className="faq-list">
            <div className="faq-row">
              <h3>{text({ zh: '积分如何消耗？', en: 'How are credits consumed?' })}</h3>
              <p>{text({ zh: '积分用于 Search、Survey、QA、Feeds 和 Agent 等任务，不同任务会根据复杂度消耗不同积分。', en: 'Credits are used for Search, Survey, QA, Feeds, Agent, and related tasks. Each task consumes credits based on complexity.' })}</p>
            </div>
            <div className="faq-row">
              <h3>{text({ zh: '高速存储和归档存储有什么区别？', en: 'What is the difference between high-speed and archive storage?' })}</h3>
              <p>{text({ zh: '高速存储用于近期活跃文件，可被 Reader、QA、Survey 和 Agent 快速调用；归档存储用于长期保存低频文件，恢复到高速存储后才能用于高频任务。', en: 'High-speed storage keeps active files ready for Reader, QA, Survey, and Agent. Archive storage keeps lower-frequency files long term and requires restoration before high-frequency tasks.' })}</p>
            </div>
            <div className="faq-row">
              <h3>{text({ zh: '文件什么时候会自动归档？', en: 'When are files archived automatically?' })}</h3>
              <p>{text({ zh: '文件进入高速存储满 6 个月后会自动迁移至归档存储并释放额度；恢复文件后，6 个月保留期将重新计算。', en: 'Files move to archive storage after six months in high-speed storage, releasing capacity. Restoring a file restarts the six-month period.' })}</p>
            </div>
            <div className="faq-row">
              <h3>{text({ zh: '高速存储规格如何计费和调整？', en: 'How is the high-speed storage tier billed and changed?' })}</h3>
              <p>{text({ zh: '存储规格与会员套餐使用相同支付方式，并随会员统一续期。升级容量立即生效；降低容量将在下个计费周期生效。', en: 'The storage tier uses the membership payment method and renews with the plan. Upgrades take effect immediately; reductions take effect next cycle.' })}</p>
            </div>
            <div className="faq-row">
              <h3>{text({ zh: '充值包和套餐积分有什么区别？', en: 'How are top-up packs different from plan credits?' })}</h3>
              <p>{text({ zh: '套餐积分按周期发放，充值包用于按需补充 Credits；付费套餐可享对应充值折扣。', en: 'Plan credits are issued by billing cycle. Top-up packs add Credits on demand, and paid plans receive their corresponding top-up discounts.' })}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
