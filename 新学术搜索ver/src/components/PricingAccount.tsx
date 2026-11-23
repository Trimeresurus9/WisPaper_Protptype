import { useId } from 'react';
import { Check } from 'lucide-react';
import type { Subscription } from '../contexts/BillingContext';
import { paymentMethodLabel, pricingPaymentMethods, type PricingPaymentMethodId } from '../utils/pricingPaymentMethods';
import './pricing-account.css';

export function PaymentMethodSelector({ value, onChange, language }: {
  value: PricingPaymentMethodId;
  onChange: (value: PricingPaymentMethodId) => void;
  language: 'zh' | 'en';
}) {
  const name = useId();
  return <fieldset className="pricing-payment-selector">
    <legend>{language === 'zh' ? '支付方式' : 'Payment method'}</legend>
    <div className="pricing-payment-options">
      {pricingPaymentMethods.map(method => <label className="pricing-payment-option" key={method.id}>
        <input type="radio" name={name} value={method.id} checked={value === method.id}
          aria-label={paymentMethodLabel(method.id, language)} onChange={() => onChange(method.id)} />
        <span className="pricing-payment-content">
          <span className={`pricing-provider ${method.provider === 'Stripe' ? 'stripe' : ''}`}>{method.provider}</span>
          {method.wallets && <span className="pricing-wallets">+ {language === 'zh' ? '微信 / 支付宝' : 'WeChat Pay / Alipay'}</span>}
          <Check className="pricing-payment-check" size={14} aria-hidden="true" />
        </span>
      </label>)}
    </div>
  </fieldset>;
}

export function MembershipSummary({ subscription, language }: { subscription: Subscription; language: 'zh' | 'en' }) {
  if (!subscription.end) return null;
  const end = new Date(subscription.end);
  if (Number.isNaN(end.getTime())) return null;
  const expired = end.getTime() <= Date.now();
  const names = { plus: 'Plus', pro: 'Pro', max: 'Max x2', max5: 'Max x5' };
  const cycle = subscription.renewalPeriod === 'annual'
    ? language === 'zh' ? '年付' : 'Annual'
    : language === 'zh' ? '月付' : 'Monthly';
  const expiry = language === 'zh'
    ? `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`
    : end.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return <section className="pricing-membership-summary" aria-label={language === 'zh' ? '会员信息' : 'Membership'}>
    <div className="pricing-membership-heading">
      <h2>{language === 'zh' ? '会员信息' : 'Membership'}</h2>
      {(expired || subscription.failure) && <span role="status">{expired ? language === 'zh' ? '已到期' : 'Expired' : language === 'zh' ? '续费失败' : 'Renewal failed'}</span>}
    </div>
    <dl>
      <div><dt>{language === 'zh' ? '当前套餐' : 'Current plan'}</dt><dd>{expired ? 'Free' : `${names[subscription.plan]} · ${cycle}`}</dd></div>
      <div><dt>{language === 'zh' ? '到期时间' : 'Expiration date'}</dt><dd><time dateTime={subscription.end}>{expiry}</time></dd></div>
    </dl>
  </section>;
}
