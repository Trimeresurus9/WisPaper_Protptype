import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import { TOP_UP_CREDITS, useBilling } from '../contexts/BillingContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getCreditTopUpOffer } from '../utils/creditTopUpPricing';
import './recharge-modal.css';

interface RechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'zh' | 'en';
  onViewPlans?: () => void;
  quantity?: number;
}

export function RechargeModal({ isOpen, onClose, language: controlledLanguage, onViewPlans, quantity = 1 }: RechargeModalProps) {
  const { market, subscription } = useBilling();
  const { language: contextLanguage } = useLanguage();
  const language = controlledLanguage ?? contextLanguage;
  const isZh = language === 'zh';
  const offer = getCreditTopUpOffer(market, subscription, language);
  const packs = Math.min(99, Math.max(1, Math.floor(quantity)));
  const currency = market === 'domestic' || isZh ? '¥' : '$';
  const amount = `${currency}${(offer.amount * packs).toFixed(2)}`;
  const [completed, setCompleted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setCompleted(false);
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [isOpen, subscription.plan, subscription.end]);

  if (!isOpen) return null;

  return createPortal(
    <div className="credit-recharge-overlay" onClick={onClose}>
      <div ref={dialogRef} className="credit-recharge-dialog" role="dialog" aria-modal="true"
        aria-label={isZh ? '积分充值' : 'Top up credits'} tabIndex={-1}
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
          if (event.key !== 'Tab') return;
          const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
          const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first?.focus(); }
        }}>
        <div className="credit-recharge-header">
          <h2>{isZh ? '积分充值' : 'Top up credits'}</h2>
          <button type="button" className="credit-recharge-close" aria-label={isZh ? '关闭充值弹窗' : 'Close top-up dialog'} onClick={onClose}><X size={18} aria-hidden="true" /></button>
        </div>
        {!offer.isMember ? <p className="credit-recharge-restricted">{isZh ? '充值包仅限 Plus 及以上会员购买' : 'Credit packs are available with Plus or above.'}</p> : completed ? <div className="credit-recharge-success" role="status"><Check size={24} aria-hidden="true" /><p>{isZh ? '充值演示已完成' : 'Top-up demo complete'}</p></div> : <>
          <p className="credit-recharge-credits"><strong>{(TOP_UP_CREDITS * packs).toLocaleString()}</strong><span>{isZh ? '积分' : 'credits'}</span></p>
          <p className="credit-recharge-validity">{isZh ? `${packs} 包 · 一次性购买 · 1 年有效` : `${packs} ${packs === 1 ? 'pack' : 'packs'} · One-time purchase · Valid for 1 year`}</p>
          <div className="credit-recharge-total"><span>{offer.label}</span><strong>{amount}</strong></div>
        </>}
        <button type="button" className="credit-recharge-submit" onClick={!offer.isMember ? onViewPlans ?? onClose : completed ? onClose : () => setCompleted(true)}>
          {!offer.isMember ? (isZh ? '查看会员套餐' : 'View membership plans') : completed ? (isZh ? '完成' : 'Done') : `${isZh ? '模拟充值' : 'Simulate top-up'} ${amount}`}
        </button>
        {offer.isMember && <p className="credit-recharge-note">{isZh ? '本地演示，不会实际扣款或入账' : 'Local demo. No payment or account credit is applied.'}</p>}
      </div>
    </div>, document.body,
  );
}
