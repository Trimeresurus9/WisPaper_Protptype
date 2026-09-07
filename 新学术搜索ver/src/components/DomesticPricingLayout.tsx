import type { ReactNode } from 'react';
import { Check, Minus } from 'lucide-react';
import { domesticPlans, domesticStorageOptions, storageFee, type PlanId } from '../contexts/BillingContext';
import { PricingStyles } from './PricingStyles';

type Props = {
  recurring: boolean;
  onPurchaseChange: (recurring: boolean) => void;
  active: boolean;
  firstUsed: boolean;
  currentPlan: PlanId;
  storage: Record<PlanId, number>;
  onStorageChange: (plan: PlanId, gb: number) => void;
  onBuy: (plan: PlanId) => void;
  onHelp: () => void;
  children: ReactNode;
};

const features = [
  { name: '快速搜索', values: [true, true, true, true] },
  { name: '深度搜索', values: [true, true, true, true] },
  { name: '问答', values: [true, true, true, true] },
  { name: '信息流', values: [true, true, true, true] },
  { name: '调研综述', values: [false, false, true, true] },
  { name: 'Agent', values: [false, true, true, true] },
  { name: 'AI 索引', values: ['50K', '全部', '全部', '全部'] },
  { name: '基础高速存储', values: ['1 GB', '10 GB', '50 GB', '100 GB'] },
];

export function DomesticPricingLayout({ recurring, onPurchaseChange, active, firstUsed, currentPlan, storage, onStorageChange, onBuy, onHelp, children }: Props) {
  return <div className="uber-pricing-page">
    <PricingStyles />
    <main className="page">
      <section aria-label="定价套餐">
        <div className="section-head">
          <h2>定价与套餐</h2>
          <div className="section-controls">
            <div className="billing-toggle" role="group" aria-label="购买方式">
              <button type="button" aria-pressed={!recurring} className={!recurring ? 'active' : ''} onClick={() => onPurchaseChange(false)}>单月购买</button>
              <button type="button" aria-pressed={recurring} className={recurring ? 'active' : ''} onClick={() => onPurchaseChange(true)}>连续包月</button>
            </div>
          </div>
        </div>
        <div className="pricing-grid">
          {domesticPlans.map((plan) => <article key={plan.id} className={`plan ${plan.id === 'pro' ? 'featured' : plan.id === 'plus' ? 'plus' : 'max'}`}>
            <div className="plan-title-row"><h3>{plan.name}</h3>{plan.id !== 'max' && <span className="plan-tag">{plan.id === 'pro' ? '最具性价比' : '最受欢迎'}</span>}</div>
            <p className="plan-subtitle">{plan.description}</p>
            <div className="price-action">
              <p className="price"><strong>¥{(recurring ? firstUsed ? plan.recurring : plan.first : plan.single) + storageFee(plan.id, storage[plan.id])}</strong><span>{recurring && !firstUsed ? '首月' : '/ 月'}</span></p>
              <p className="muted">{recurring ? `${firstUsed ? '每月' : '次月起'} ¥${plan.recurring + storageFee(plan.id, storage[plan.id])} · 自动续费，随时可取消` : '一次支付，到期不自动续费'}</p>
              <button type="button" className="plan-cta secondary" disabled={active} style={active ? { opacity: 0.55, cursor: 'not-allowed' } : undefined} onClick={() => onBuy(plan.id)}>{active ? currentPlan === plan.id ? '当前会员' : '已有有效会员' : `${recurring ? '订阅' : '购买'} ${plan.name}`}</button>
              {domesticStorageOptions[plan.id].length > 1 && <label className="mt-3 block text-sm">高速存储
                <select aria-label={`${plan.name} 高速存储`} disabled={active} value={storage[plan.id]} onChange={(e) => onStorageChange(plan.id, Number(e.target.value))} className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900">
                  {domesticStorageOptions[plan.id].map((gb) => <option key={gb} value={gb}>{gb} GB · {storageFee(plan.id, gb) ? `+¥${storageFee(plan.id, gb)}/月` : '基础存储'}</option>)}
                </select>
                <span className="mt-2 block text-xs opacity-70">存储加价 ¥{storageFee(plan.id, storage[plan.id])}/月；{recurring ? `包月优惠 ¥${plan.single - plan.recurring}${!firstUsed ? `，首月再减 ¥${plan.recurring - plan.first}` : ''}，优惠金额不变。` : '不影响会员优惠金额。'}</span>
              </label>}
            </div>
            <div className="info-list">
              <div className="info-row"><span className="uber-info-label">每月积分</span><strong>{plan.credits}</strong></div>
              <div className="info-row"><span className="uber-info-label">高速存储空间</span><strong>{storage[plan.id]} GB</strong></div>
            </div>
          </article>)}
        </div>
        <p className="mt-5 text-center text-xs text-slate-500">国内版 · 支付宝 · 演示价格，不会真实扣款。{recurring ? '首月优惠限首次购买；开通前需单独确认自动续费协议。' : '单月购买与连续包月享有同等级会员权益。'}</p>
      </section>

      <div className="mt-8">{children}</div>

      <section className="recharge-products-section" aria-label="充值包商品">
        <div className="recharge-products-grid"><article className="plan mini-pack">
          <div className="plan-title-row"><h3>Mini Pack</h3></div>
          <p className="plan-subtitle">按需补充积分，适合临时高峰任务</p>
          <div className="price-action"><p className="price"><strong>¥14</strong><span>一次性 · 演示价格</span></p><p className="muted">10,000 Credits</p><button type="button" className="plan-cta" onClick={onHelp}>查看充值说明</button></div>
          <div className="info-list"><div className="info-row"><span>包含积分</span><strong>10,000</strong></div><div className="info-row"><span>购买类型</span><strong>一次性购买</strong></div><div className="info-row"><span>有效期</span><strong>一年有效</strong></div></div>
        </article></div>
      </section>
      <section className="redeem-section" aria-label="兑换会员码">
        <h2>兑换会员码</h2><p className="redeem-note">不限量功能仅供个人正常使用。此处为演示入口，不会兑换真实会员权益。</p>
        <div className="redeem-ticket"><input className="redeem-input" defaultValue="WISP2025" aria-label="会员码" /><button type="button" className="redeem-button" onClick={onHelp}>兑换说明</button></div>
      </section>
      <section className="compare" aria-label="套餐对比">
        <div className="section-head"><h2>套餐对比</h2></div>
        <div className="table-shell"><table><thead><tr><th>订阅计划</th><th>Free</th>{domesticPlans.map((plan) => <th key={plan.id}>{plan.name}<button type="button" className="table-plan-action" disabled={active} onClick={() => onBuy(plan.id)}>{active ? '已开通会员' : '购买 ↗'}</button></th>)}</tr></thead>
          <tbody>{features.map((feature) => <tr key={feature.name}><td>{feature.name}</td>{feature.values.map((value, index) => <td key={index}>{typeof value === 'boolean' ? <span className={value ? 'uber-check' : 'uber-minus'} aria-label={value ? '包含' : '不包含'}>{value ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</span> : value}</td>)}</tr>)}</tbody>
        </table></div>
      </section>
      <section className="faq" aria-label="定价常见问题">
        <h2>定价常见问题</h2><div className="faq-list">
          {[
            ['单月购买与连续包月有什么区别？', '同等级会员权益相同。单月购买只支付一次；连续包月需主动授权，按订单列明的金额及周期通过支付宝续费。'],
            ['如何关闭自动续费？', '可在会员信息或个人中心的会员与订阅中关闭。关闭后，本期权益保留至到期；关闭续费不等于申请退款。'],
            ['扣费前会收到提醒吗？', '原型展示续费前 5 日的提醒预览，包含续费金额、日期及取消入口，不实际发送短信或邮件。'],
            ['积分不足会自动扣费吗？', '不会。积分包需单独购买，不会因积分不足自动充值。月度积分按周期发放，到期未使用余额将失效。'],
            ['选择更多高速存储后，优惠会变化吗？', '不会。超出套餐基础容量的部分按每 10 GB 每月 ¥6 加价，单月、首月和后续续费均增加相同金额，会员优惠金额保持不变。存储随会员统一续期。Plus 保留 10 GB 基础容量。'],
          ].map(([question, answer]) => <div className="faq-row" key={question}><h3>{question}</h3><p>{answer}</p></div>)}
        </div>
      </section>
    </main>
  </div>;
}
