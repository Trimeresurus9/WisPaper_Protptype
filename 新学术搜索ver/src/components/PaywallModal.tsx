import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { PricingPage } from './PricingPage';
import { DomesticBilling } from './DomesticBilling';
import { useBilling } from '../contexts/BillingContext';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  upgradeOnly?: boolean;
}

export function PaywallModal({ isOpen, onClose, upgradeOnly = false }: PaywallModalProps) {
  const { market } = useBilling();
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={market === 'domestic' ? '快速购买会员' : 'Pricing'}
        className={`relative w-full overflow-hidden rounded-2xl bg-white shadow-[0_32px_100px_-28px_rgba(15,23,42,0.7)] ${market === 'domestic' ? 'max-h-[90vh] max-w-[620px]' : 'h-[min(92vh,940px)] max-w-[1280px]'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-500 shadow-sm backdrop-blur transition hover:bg-slate-100 hover:text-slate-950"
          aria-label={market === 'domestic' ? '关闭购买弹窗' : '关闭 Pricing'}
        >
          <X className="h-5 w-5" />
        </button>
        <div className={market === 'domestic' ? 'max-h-[90vh] overflow-y-auto px-6 pb-7 pt-7 sm:px-8' : 'h-full overflow-y-auto px-8 pb-8 pt-3 sm:px-10'}>
          {market === 'domestic' ? <DomesticBilling purchaseOnly upgradeOnly={upgradeOnly} onFinished={onClose} /> : <PricingPage upgradeOnly={upgradeOnly} />}
        </div>
      </section>
    </div>
  );
}
