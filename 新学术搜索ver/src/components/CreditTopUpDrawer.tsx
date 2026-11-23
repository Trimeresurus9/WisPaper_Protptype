import { useState } from 'react';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { TOP_UP_CREDITS, useBilling } from '../contexts/BillingContext';
import { getCreditTopUpOffer } from '../utils/creditTopUpPricing';
import { RechargeModal } from './RechargeModal';

type Props = {
  language: 'zh' | 'en';
};

export function CreditTopUpDrawer({ language }: Props) {
  const { market, subscription } = useBilling();
  const offer = getCreditTopUpOffer(market, subscription, language);
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const isZh = language === 'zh';
  const currency = market === 'domestic' || isZh ? '¥' : '$';
  const amount = `${currency}${(offer.amount * quantity).toFixed(2)}`;
  if (!offer.isMember) return null;
  return <>
    <details className="credit-top-up-drawer">
      <summary>{isZh ? '购买更多积分' : 'Buy more credits'}<ChevronDown size={16} aria-hidden="true" /></summary>
      <section className="credit-top-up-content" aria-label={isZh ? '积分充值包' : 'Credit pack'}>
        <p className="credit-pack-allowance"><strong>{TOP_UP_CREDITS.toLocaleString()}</strong><span>{isZh ? '积分 / 包' : 'credits / pack'}</span></p>
        <p className="credit-pack-unit-price">{offer.displayAmount}{isZh ? ' / 包' : ' / pack'}</p>
        <dl className="credit-pack-details">
          <div><dt>{isZh ? '购买类型' : 'Purchase type'}</dt><dd>{isZh ? '一次性购买' : 'One-time'}</dd></div>
          <div><dt>{isZh ? '有效期' : 'Validity'}</dt><dd>{isZh ? '1 年' : '1 year'}</dd></div>
        </dl>
        <div className="credit-pack-quantity-row">
          <span>{isZh ? '数量' : 'Quantity'}</span>
          <div className="credit-pack-quantity" role="group" aria-label={isZh ? '充值包数量' : 'Number of credit packs'}>
            <button type="button" disabled={quantity === 1} aria-label={isZh ? '减少充值包' : 'Remove one pack'} onClick={() => setQuantity(value => Math.max(1, value - 1))}><Minus size={14} aria-hidden="true" /></button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" disabled={quantity === 99} aria-label={isZh ? '增加充值包' : 'Add one pack'} onClick={() => setQuantity(value => Math.min(99, value + 1))}><Plus size={14} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="credit-pack-total" aria-live="polite">
          <span>{(TOP_UP_CREDITS * quantity).toLocaleString()} {isZh ? '积分' : 'credits'}</span><strong>{amount}</strong>
        </div>
        <button type="button" className="credit-pack-submit" onClick={() => setIsOpen(true)}>{isZh ? '立即充值' : 'Top up now'}</button>
      </section>
    </details>
    <RechargeModal isOpen={isOpen} language={language} quantity={quantity} onClose={() => setIsOpen(false)} />
  </>;
}
