import { useRef, useState } from 'react';
import { nextMonth, nextYear, useBilling, type PlanId } from '../contexts/BillingContext';
import type { PricingPaymentMethodId } from '../utils/pricingPaymentMethods';
import { PaymentMethodSelector } from './PricingAccount';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './ui/dialog';

export type PricingQuote = { plan: PlanId; name: string; storage: number; cycle: 'monthly' | 'annual'; amount: number };

export function PricingCheckout({ quote, language, method, onMethodChange, onClose, returnFocus }: {
  quote: PricingQuote; language: 'zh' | 'en'; method: PricingPaymentMethodId;
  onMethodChange: (method: PricingPaymentMethodId) => void;
  onClose: () => void; returnFocus: () => void;
}) {
  const { setSubscription, outcome } = useBilling();
  const [result, setResult] = useState<'success' | 'failed' | null>(null);
  const locked = useRef(false);
  const zh = language === 'zh';
  const complete = () => {
    if (locked.current) return;
    locked.current = true;
    if (outcome === 'payment-failed') {
      setResult('failed');
      return;
    }
    setSubscription({ plan: quote.plan, storageGb: quote.storage, renewalPeriod: quote.cycle,
      end: quote.cycle === 'annual' ? nextYear(new Date()) : nextMonth(new Date()),
      renewal: false, failure: false, firstUsed: true, paymentMethod: method });
    setResult('success');
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="pricing-checkout" onCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }}>
      <DialogTitle>{result === 'success' ? zh ? '会员已开通' : 'Membership activated' : zh ? '确认订单' : 'Confirm your plan'}</DialogTitle>
      <DialogDescription>{zh ? '本地交互演示，不会真实扣款。' : 'Local preview. No payment will be charged.'}</DialogDescription>
      <dl className="pricing-checkout-details">
        <div><dt>{zh ? '套餐' : 'Plan'}</dt><dd>{quote.name} · {quote.cycle === 'annual' ? zh ? '年付' : 'Annual' : zh ? '月付' : 'Monthly'}</dd></div>
        <div><dt>{zh ? '高速存储' : 'High-speed storage'}</dt><dd>{quote.storage} GB</dd></div>
      </dl>
      {!result && <PaymentMethodSelector language={language} value={method} onChange={onMethodChange} />}
      {result === 'success' ? <p role="status" className="pricing-checkout-message">{zh ? '套餐与到期时间已更新到会员信息卡片。' : 'Your plan and expiration date are now shown in Membership.'}</p> : <>
        <p className="pricing-checkout-total"><span>{zh ? '本次合计' : 'Total today'}</span><strong>{zh ? '¥' : '$'}{quote.amount.toLocaleString(zh ? 'zh-CN' : 'en-US', { maximumFractionDigits: 2 })}</strong></p>
        {result === 'failed' && <p role="alert" className="pricing-checkout-message error">{zh ? '模拟支付未完成，会员权益未变更。' : 'Simulated payment failed. Your membership is unchanged.'}</p>}
      </>}
      <button className="pricing-checkout-submit" type="button" onClick={result ? onClose : complete}>
        {result === 'success' ? zh ? '查看会员信息' : 'View membership' : result === 'failed' ? zh ? '返回套餐' : 'Back to plans' : zh ? '模拟完成购买' : 'Simulate purchase'}
      </button>
    </DialogContent>
  </Dialog>;
}
