// Shared by domestic and international pricing layouts.
export function PricingStyles() {
  return (<style>{`
        .uber-pricing-page {
          --primary: #23282f;
          --on-primary: #ffffff;
          --ink: #23282f;
          --body: #636c76;
          --mute: #999999;
          --accent: #0079ff;
          --accent-hover: #1b87ff;
          --accent-soft: rgba(0, 121, 255, 0.1);
          --accent-soft-strong: rgba(0, 121, 255, 0.12);
          --accent-deep: #111fa4;
          --canvas: #ffffff;
          --canvas-soft: #f1f2f3;
          --canvas-softer: #f3f9ff;
          --line: #e5e7eb;
          --line-blue: #e6ecf4;
          --surface-pressed: #e0e0e0;
          --black-elevated: rgba(35, 40, 47, 0.9);
          min-height: 100%;
          margin: -8px auto 0;
          overflow: hidden;
          background: transparent;
          color: var(--ink);
          border-radius: 0;
          font-family: UberMoveText, system-ui, "Helvetica Neue", Arial, sans-serif;
        }

        .uber-pricing-page * { box-sizing: border-box; }

        .uber-pricing-page .page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 48px 0 96px;
        }

        .uber-pricing-page .section-head {
          position: relative;
          display: flex;
          min-height: 108px;
          align-items: flex-start;
          justify-content: center;
          margin: 0 0 40px;
        }

        .uber-pricing-page .section-head h2 {
          margin: 0;
          color: var(--ink);
          font-size: 40px;
          line-height: 56px;
          font-weight: 700;
          letter-spacing: 0;
          text-align: center;
        }

        .uber-pricing-page .section-controls {
          position: absolute;
          left: 0;
          right: 0;
          top: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .uber-pricing-page .billing-toggle {
          display: inline-flex;
          width: 228px;
          height: 36px;
          gap: 2px;
          padding: 2px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 999px;
          pointer-events: auto;
        }

        .uber-pricing-page .billing-toggle button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 1;
          min-height: 32px;
          border: 0;
          border-radius: 999px;
          padding: 5px 10px;
          background: transparent;
          color: var(--ink);
          font-size: 16px;
          line-height: 22px;
          font-weight: 500;
          cursor: pointer;
        }

        .uber-pricing-page .billing-toggle button.active {
          background: var(--canvas);
          color: #1b223c;
          box-shadow: none;
        }

        .uber-pricing-page .billing-discount {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 20px;
          margin-left: 8px;
          border-radius: 999px;
          padding: 2px 6px;
          background: linear-gradient(107deg, #4da1ff 0%, #0079ff 100%);
          color: #fff;
          font-size: 14px;
          line-height: 14px;
          font-weight: 700;
        }

        .uber-pricing-page .renew-switch {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          min-height: 20px;
          border: 0;
          background: transparent;
          color: #6e7989;
          padding: 0;
          font-size: 14px;
          line-height: 20px;
          font-weight: 500;
          cursor: default;
        }

        .uber-pricing-page .renew-track {
          position: relative;
          display: inline-flex;
          width: 28px;
          height: 16px;
          border-radius: 999px;
          background: rgba(110, 121, 137, 0.35);
          transition: background 0.16s ease;
        }

        .uber-pricing-page .renew-track::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: var(--canvas);
          transition: transform 0.16s ease;
        }

        .uber-pricing-page .renew-switch.active .renew-track {
          background: var(--accent);
        }

        .uber-pricing-page .renew-switch.active .renew-track::after {
          transform: translateX(12px);
        }

        .uber-pricing-page .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: flex-start;
          gap: 24px;
          padding: 0;
          margin: 0;
        }

        .uber-pricing-page .plan {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          min-height: 424px;
          border-radius: 12px;
          padding: 20px;
          background: var(--canvas);
          color: var(--ink);
          border: 1px solid var(--line);
        }

        .uber-pricing-page .plan.free {
          background: var(--canvas);
        }

        .uber-pricing-page .plan.plus {
          background: var(--canvas);
          border-color: var(--line);
        }

        .uber-pricing-page .plan.featured {
          background: var(--primary);
          color: var(--on-primary);
          border-color: var(--primary);
          box-shadow: rgba(35, 40, 47, 0.3) 0 18px 40px;
        }

        .uber-pricing-page .plan.max {
          background: var(--canvas);
          border-color: var(--line);
        }

        .uber-pricing-page .plan.max-x5 {
          background: var(--canvas);
          border-color: var(--line);
        }

        .uber-pricing-page .max-tier-switch {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
          padding: 3px;
          border-radius: 999px;
          background: var(--canvas-soft);
        }

        .uber-pricing-page .max-tier-switch button {
          min-width: 42px;
          min-height: 26px;
          border: 0;
          border-radius: 999px;
          padding: 3px 10px;
          background: transparent;
          color: var(--body);
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
        }

        .uber-pricing-page .max-tier-switch button:hover {
          color: var(--ink);
        }

        .uber-pricing-page .max-tier-switch button.active {
          background: var(--canvas);
          color: var(--ink);
          box-shadow: rgba(35, 40, 47, 0.1) 0 2px 8px;
        }

        .uber-pricing-page .max-tier-switch button:focus-visible,
        .uber-pricing-page .cancel-subscription-button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        .uber-pricing-page .subscription-management {
          margin-top: 32px;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--canvas);
        }

        .uber-pricing-page .subscription-management-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 18px 20px;
          border-bottom: 1px solid var(--line);
        }

        .uber-pricing-page .subscription-management-head h3 {
          margin: 0;
          font-size: 16px;
          line-height: 22px;
          font-weight: 700;
        }

        .uber-pricing-page .subscription-management-head span {
          color: var(--body);
          font-size: 12px;
        }

        .uber-pricing-page .subscription-management-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.9fr 1.2fr 0.85fr;
        }

        .uber-pricing-page .subscription-management-item {
          min-width: 0;
          min-height: 104px;
          padding: 18px 20px;
          border-right: 1px solid var(--line);
        }

        .uber-pricing-page .subscription-management-item:last-child { border-right: 0; }

        .uber-pricing-page .subscription-label {
          display: block;
          margin-bottom: 10px;
          color: var(--body);
          font-size: 11px;
          line-height: 16px;
          font-weight: 500;
        }

        .uber-pricing-page .subscription-value {
          display: block;
          color: var(--ink);
          font-size: 14px;
          line-height: 20px;
          font-weight: 700;
        }

        .uber-pricing-page .subscription-note {
          display: block;
          margin-top: 4px;
          color: var(--mute);
          font-size: 10px;
          line-height: 15px;
        }

        .uber-pricing-page .locked-payment {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .uber-pricing-page .card-brand {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 28px;
          border-radius: 6px;
          background: var(--canvas-softer);
          color: var(--accent-deep);
          font-size: 10px;
          font-style: italic;
          font-weight: 900;
        }

        .uber-pricing-page .cancel-subscription-button {
          min-height: 36px;
          border: 1px solid #f0c7c7;
          border-radius: 8px;
          padding: 7px 12px;
          background: #fff;
          color: #b42318;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.16s ease, border-color 0.16s ease;
        }

        .uber-pricing-page .cancel-subscription-button:hover {
          border-color: #e9a8a8;
          background: #fff7f7;
        }

        .uber-pricing-page .recharge-products-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 1px solid var(--line);
        }

        .uber-pricing-page .recharge-products-grid {
          display: grid;
          grid-template-columns: minmax(280px, 360px);
          gap: 24px;
        }

        .uber-pricing-page .plan.mini-pack h3,
        .uber-pricing-page .plan.mini-pack .price strong {
          color: var(--accent);
        }

        .uber-pricing-page .plan.mini-pack .plan-cta {
          background: var(--accent);
        }

        .uber-pricing-page .plan.mini-pack .plan-cta:hover {
          background: var(--accent-hover);
        }

        .uber-pricing-page .plan.mini-pack .price span {
          padding-bottom: 16px;
          font-size: 12px;
        }

        .uber-pricing-page .plan-tag {
          display: inline-flex;
          width: fit-content;
          align-items: center;
          justify-content: center;
          min-height: 20px;
          margin: 0;
          border-radius: 16px;
          padding: 2px 6px;
          background: #f4f7fa;
          color: var(--ink);
          font-size: 12px;
          line-height: 12px;
          font-weight: 500;
        }

        .uber-pricing-page .plan.featured .plan-tag {
          background: var(--on-primary);
          color: var(--ink);
        }

        .uber-pricing-page .plan.max .plan-tag {
          background: var(--line-blue);
        }

        .uber-pricing-page .plan.plus .plan-tag,
        .uber-pricing-page .plan.max-x5 .plan-tag {
          background: rgba(0, 121, 255, 0.1);
          color: var(--accent);
        }

        .uber-pricing-page .plan h3 {
          margin: 0;
          font-size: 20px;
          line-height: 28px;
          font-weight: 700;
        }

        .uber-pricing-page .plan-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 28px;
        }

        .uber-pricing-page .plan-subtitle {
          min-height: 20px;
          margin: 4px 0 24px;
          color: var(--body);
          font-size: 14px;
          line-height: 20px;
          white-space: nowrap;
        }

        .uber-pricing-page .plan.featured .plan-subtitle,
        .uber-pricing-page .plan.featured .muted,
        .uber-pricing-page .plan.featured .uber-info-label {
          color: rgba(255, 255, 255, 0.72);
        }

        .uber-pricing-page .info-list {
          display: grid;
          gap: 16px;
          margin: 20px 0 0;
        }

        .uber-pricing-page .info-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 20px;
          padding: 0;
          border-bottom: 0;
          font-size: 14px;
          line-height: 20px;
        }

        .uber-pricing-page .info-row:last-child { border-bottom: 0; }
        .uber-pricing-page .plan.featured .info-row { border-bottom-color: rgba(255, 255, 255, 0.16); }
        .uber-pricing-page .info-row strong {
          text-align: right;
          font-weight: 500;
        }

        .uber-pricing-page .uber-info-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--ink);
          font-weight: 500;
        }

        .uber-pricing-page .plan.featured .uber-info-label,
        .uber-pricing-page .plan.featured .info-row strong {
          color: #fff;
        }

        .uber-pricing-page .uber-tooltip-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
        }

        .uber-pricing-page .uber-tooltip-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 12px;
          height: 12px;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--body);
          cursor: help;
        }

        .uber-pricing-page .uber-tooltip-icon.dark {
          color: rgba(255, 255, 255, 0.72);
        }

        .uber-pricing-page .uber-tooltip-content {
          position: absolute;
          left: 0;
          bottom: calc(100% + 8px);
          z-index: 20;
          width: 220px;
          opacity: 0;
          pointer-events: none;
          transform: translateY(4px);
          border-radius: 8px;
          background: var(--black-elevated);
          color: var(--on-primary);
          padding: 10px 12px;
          box-shadow: rgba(0, 0, 0, 0.16) 0px 4px 16px 0px;
          font-size: 12px;
          line-height: 20px;
          transition: opacity 0.16s ease, transform 0.16s ease;
        }

        .uber-pricing-page .uber-tooltip-wrap:hover .uber-tooltip-content,
        .uber-pricing-page .uber-tooltip-icon:focus-visible + .uber-tooltip-content {
          opacity: 1;
          transform: translateY(0);
        }

        .uber-pricing-page .price-action {
          margin-top: 0;
          padding-top: 0;
          border-top: 0;
        }

        .uber-pricing-page .plan.featured .price-action {
          border-top-color: rgba(255, 255, 255, 0.18);
        }

        .uber-pricing-page .price {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin: 0;
        }

        .uber-pricing-page .price strong {
          font-size: 40px;
          line-height: 56px;
          font-weight: 700;
        }

        .uber-pricing-page .price span {
          padding-bottom: 13px;
          color: var(--body);
          font-size: 14px;
          line-height: 20px;
        }

        .uber-pricing-page .plan.featured .price span {
          color: rgba(255, 255, 255, 0.72);
        }

        .uber-pricing-page .muted {
          margin: 0;
          color: var(--body);
          font-size: 14px;
          line-height: 20px;
        }

        .uber-pricing-page .plan-cta,
        .uber-pricing-page .pill-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          background: var(--primary);
          color: var(--on-primary);
          font-size: 16px;
          line-height: 20px;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.16s ease, transform 0.16s ease;
        }

        .uber-pricing-page .plan-cta {
          width: 100%;
          margin: 20px 0 0;
        }

        .uber-pricing-page .plan-storage-selector {
          position: relative;
          margin-top: 10px;
        }

        .uber-pricing-page .plan-storage-trigger {
          display: flex;
          width: 100%;
          min-height: 42px;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--canvas-soft);
          color: var(--ink);
          padding: 9px 12px;
          font-size: 13px;
          line-height: 18px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.16s ease, background 0.16s ease;
        }

        .uber-pricing-page .plan-storage-trigger:hover {
          border-color: rgba(0, 121, 255, 0.34);
          background: var(--accent-soft);
        }

        .uber-pricing-page .plan-storage-trigger:focus-visible,
        .uber-pricing-page .plan-storage-option:focus-visible {
          outline: 3px solid rgba(0, 121, 255, 0.22);
          outline-offset: 2px;
        }

        .uber-pricing-page .plan-storage-trigger svg {
          flex: 0 0 auto;
          transition: transform 0.16s ease;
        }

        .uber-pricing-page .plan-storage-trigger-copy {
          display: grid;
          min-width: 0;
          gap: 2px;
        }

        .uber-pricing-page .plan-storage-trigger-copy strong {
          font-size: 13px;
          line-height: 18px;
          font-weight: 600;
        }

        .uber-pricing-page .plan-storage-trigger-copy small,
        .uber-pricing-page .plan-storage-option-meta small {
          color: var(--body);
          font-size: 11px;
          line-height: 15px;
          font-weight: 500;
        }

        .uber-pricing-page .plan-storage-options {
          display: grid;
          max-height: 248px;
          margin-top: 8px;
          overflow-y: auto;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: var(--canvas);
          padding: 6px;
          box-shadow: rgba(35, 40, 47, 0.12) 0 16px 34px;
        }

        .uber-pricing-page .plan-storage-option {
          display: flex;
          width: 100%;
          min-height: 38px;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: var(--ink);
          padding: 8px 10px;
          font-size: 13px;
          line-height: 18px;
          text-align: left;
          cursor: pointer;
          transition: background 0.14s ease, color 0.14s ease;
        }

        .uber-pricing-page .plan-storage-option:hover,
        .uber-pricing-page .plan-storage-option.selected {
          background: var(--canvas-soft);
        }

        .uber-pricing-page .plan-storage-option.selected {
          color: var(--accent-deep);
          font-weight: 600;
        }

        .uber-pricing-page .plan-storage-option-capacity {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }

        .uber-pricing-page .plan-storage-option-meta {
          display: inline-flex;
          min-width: 92px;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          text-align: right;
          white-space: nowrap;
        }

        .uber-pricing-page .plan-storage-selector.dark .plan-storage-trigger {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .uber-pricing-page .plan-storage-selector.dark .plan-storage-trigger:hover {
          border-color: rgba(255, 255, 255, 0.38);
          background: rgba(255, 255, 255, 0.16);
        }

        .uber-pricing-page .plan-storage-selector.dark .plan-storage-options {
          border-color: rgba(255, 255, 255, 0.18);
          background: #30363e;
        }

        .uber-pricing-page .plan-storage-selector.dark .plan-storage-option {
          color: rgba(255, 255, 255, 0.84);
        }

        .uber-pricing-page .plan-storage-selector.dark .plan-storage-trigger-copy small,
        .uber-pricing-page .plan-storage-selector.dark .plan-storage-option-meta small {
          color: rgba(255, 255, 255, 0.66);
        }

        .uber-pricing-page .plan-storage-selector.dark .plan-storage-option:hover,
        .uber-pricing-page .plan-storage-selector.dark .plan-storage-option.selected {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .uber-pricing-page .plan-cta:hover,
        .uber-pricing-page .pill-button:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .uber-pricing-page .plan-cta.secondary,
        .uber-pricing-page .pill-button.secondary {
          background: var(--primary);
          color: var(--on-primary);
        }

        .uber-pricing-page .pill-button.secondary {
          background: var(--line-blue);
        }

        .uber-pricing-page .plan.plus .plan-cta.secondary {
          background: var(--primary);
          color: var(--on-primary);
        }

        .uber-pricing-page .plan.featured .plan-cta.secondary {
          background: var(--canvas);
          color: var(--ink);
        }

        .uber-pricing-page .plan-cta.secondary:hover,
        .uber-pricing-page .pill-button.secondary:hover {
          background: #343a43;
        }

        .uber-pricing-page .plan.plus .plan-cta.secondary:hover {
          background: var(--accent-hover);
        }

        .uber-pricing-page .plan.featured .plan-cta.secondary:hover {
          background: #f1f2f3;
        }

        .uber-pricing-page .storage-pricing-section {
          margin-top: 56px;
        }

        .uber-pricing-page .storage-explainer,
        .uber-pricing-page .storage-calculator {
          border-radius: 16px;
          padding: 28px;
        }

        .uber-pricing-page .storage-explainer {
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.8);
        }

        .uber-pricing-page .storage-eyebrow {
          margin: 0;
          color: var(--accent);
          font-size: 11px;
          line-height: 16px;
          font-weight: 700;
          letter-spacing: 0.12em;
        }

        .uber-pricing-page .storage-explainer h3,
        .uber-pricing-page .storage-calculator h3 {
          margin: 8px 0 0;
          font-size: 24px;
          line-height: 30px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .uber-pricing-page .storage-intro {
          max-width: 580px;
          margin: 10px 0 0;
          color: var(--body);
          font-size: 13px;
          line-height: 20px;
        }

        .uber-pricing-page .storage-tiers {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 24px;
        }

        .uber-pricing-page .storage-tier {
          border-radius: 12px;
          background: var(--canvas-soft);
          padding: 16px;
        }

        .uber-pricing-page .storage-tier strong {
          display: block;
          font-size: 14px;
          line-height: 20px;
        }

        .uber-pricing-page .storage-tier p {
          margin: 6px 0 0;
          color: var(--body);
          font-size: 12px;
          line-height: 18px;
        }

        .uber-pricing-page .storage-rule {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          margin-top: 18px;
          border-top: 1px solid var(--line);
          padding-top: 16px;
          color: var(--body);
          font-size: 12px;
          line-height: 18px;
        }

        .uber-pricing-page .storage-rule-index {
          display: inline-flex;
          width: 22px;
          height: 22px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          background: var(--primary);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
        }

        .uber-pricing-page .storage-calculator {
          background: var(--primary);
          color: #fff;
          box-shadow: rgba(35, 40, 47, 0.24) 0 28px 56px -36px;
        }

        .uber-pricing-page .storage-calculator .storage-eyebrow {
          color: #8fc5ff;
        }

        .uber-pricing-page .storage-calculator-subtitle {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.64);
          font-size: 12px;
          line-height: 18px;
        }

        .uber-pricing-page .storage-slider-values {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-top: 28px;
        }

        .uber-pricing-page .storage-slider-values strong {
          font-size: 36px;
          line-height: 40px;
          letter-spacing: -0.04em;
        }

        .uber-pricing-page .storage-slider-values span {
          padding-bottom: 4px;
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
        }

        .uber-pricing-page .storage-range {
          width: 100%;
          margin-top: 20px;
          accent-color: #fff;
          cursor: pointer;
        }

        .uber-pricing-page .storage-range-scale {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          color: rgba(255, 255, 255, 0.46);
          font-size: 10px;
        }

        .uber-pricing-page .storage-credit-total {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 18px;
        }

        .uber-pricing-page .storage-credit-total span {
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
        }

        .uber-pricing-page .storage-credit-total strong {
          font-size: 20px;
          line-height: 26px;
          font-variant-numeric: tabular-nums;
        }

        .uber-pricing-page .storage-calculator-note {
          margin: 14px 0 0;
          color: rgba(255, 255, 255, 0.48);
          font-size: 10px;
          line-height: 16px;
        }

        .uber-pricing-page .storage-purchase-button {
          width: 100%;
          min-height: 42px;
          margin-top: 18px;
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: var(--ink);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.16s ease, background 0.16s ease;
        }

        .uber-pricing-page .storage-purchase-button:hover {
          background: #f1f2f3;
          transform: translateY(-1px);
        }

        .uber-pricing-page .compare {
          margin-top: 120px;
        }

        .uber-pricing-page .compare > .section-head {
          min-height: auto;
          margin-bottom: 40px;
        }

        .uber-pricing-page .table-shell {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.78);
          border: 1px solid var(--line);
          border-radius: 12px;
        }

        .uber-pricing-page table {
          width: 100%;
          min-width: 1040px;
          border-collapse: collapse;
          font-size: 12px;
          line-height: 20px;
        }

        .uber-pricing-page th,
        .uber-pricing-page td {
          padding: 14px 18px;
          border-bottom: 0;
          text-align: center;
        }

        .uber-pricing-page th:first-child,
        .uber-pricing-page td:first-child {
          width: 16%;
          text-align: left;
          font-weight: 500;
        }

        .uber-pricing-page th {
          background: transparent;
          font-size: 12px;
          line-height: 16px;
          font-weight: 500;
        }

        .uber-pricing-page .table-plan-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 28px;
          margin: 8px auto 0;
          border-radius: 999px;
          padding: 6px 14px;
          background: var(--primary);
          color: #fff;
          font-size: 12px;
          line-height: 14px;
          text-decoration: none;
          white-space: nowrap;
        }

        .uber-pricing-page .uber-check,
        .uber-pricing-page .uber-minus {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 999px;
        }

        .uber-pricing-page .uber-check {
          background: transparent;
          color: var(--ink);
        }

        .uber-pricing-page .uber-minus {
          background: transparent;
          color: #cfd6df;
        }

        .uber-pricing-page .uber-table-value {
          font-weight: 500;
        }

        .uber-pricing-page .dark-band {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
          margin-top: 56px;
          border-radius: 16px;
          background: var(--primary);
          color: var(--on-primary);
          padding: 32px;
        }

        .uber-pricing-page .dark-band h2 {
          margin: 0;
          font-size: 32px;
          line-height: 40px;
          font-weight: 700;
        }

        .uber-pricing-page .dark-band p {
          max-width: 620px;
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.72);
          font-size: 16px;
          line-height: 24px;
        }

        .uber-pricing-page .dark-band .pill-button {
          background: var(--canvas);
          color: var(--ink);
        }

        .uber-pricing-page .dark-band .pill-button:hover {
          background: var(--line-blue);
        }

        .uber-pricing-page .recharge {
          margin-top: 112px;
        }

        .uber-pricing-page .recharge h2,
        .uber-pricing-page .redeem-section h2 {
          margin: 0 0 40px;
          color: var(--ink);
          font-size: 36px;
          line-height: 44px;
          font-weight: 700;
          text-align: center;
        }

        .uber-pricing-page .recharge-card {
          display: grid;
          grid-template-columns: 1.1fr 1fr 1fr;
          gap: 32px;
          align-items: stretch;
          border: 1px solid var(--line);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.78);
          padding: 20px;
        }

        .uber-pricing-page .recharge-intro h3,
        .uber-pricing-page .recharge-pack h3 {
          margin: 0;
          color: var(--ink);
          font-size: 16px;
          line-height: 22px;
          font-weight: 500;
        }

        .uber-pricing-page .recharge-intro p,
        .uber-pricing-page .recharge-pack p {
          margin: 8px 0 0;
          color: var(--body);
          font-size: 12px;
          line-height: 18px;
        }

        .uber-pricing-page .recharge-tip {
          margin-top: 32px;
          max-width: 260px;
        }

        .uber-pricing-page .recharge-pack {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .uber-pricing-page .recharge-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .uber-pricing-page .recharge-price {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          color: var(--ink);
        }

        .uber-pricing-page .recharge-price strong {
          font-size: 36px;
          line-height: 44px;
          font-weight: 700;
        }

        .uber-pricing-page .recharge-price span {
          padding-bottom: 7px;
          color: var(--body);
          font-size: 14px;
          line-height: 18px;
        }

        .uber-pricing-page .quantity-stepper {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #6e7989;
          font-size: 12px;
        }

        .uber-pricing-page .quantity-stepper button {
          width: 18px;
          height: 18px;
          border: 0;
          border-radius: 4px;
          background: #edf3f8;
          color: #6e7989;
          cursor: pointer;
        }

        .uber-pricing-page .mini-payments {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          min-height: 28px;
          border-radius: 6px;
          background: #f4f7fa;
          padding: 6px 10px;
          transform: scale(0.8);
          transform-origin: left center;
        }

        .uber-pricing-page .recharge-button {
          min-height: 32px;
          border: 1px solid var(--primary);
          border-radius: 999px;
          background: #fff;
          color: var(--ink);
          font-size: 14px;
          cursor: pointer;
        }

        .uber-pricing-page .redeem-section {
          margin-top: 120px;
          text-align: center;
        }

        .uber-pricing-page .redeem-note {
          max-width: 620px;
          margin: -24px auto 32px;
          color: var(--body);
          font-size: 12px;
          line-height: 18px;
        }

        .uber-pricing-page .redeem-ticket {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 24px;
          align-items: center;
          width: 500px;
          max-width: 100%;
          margin: 0 auto;
          border-radius: 16px;
          background: #fff;
          padding: 28px 32px;
          box-shadow: rgba(35, 40, 47, 0.18) 0 22px 42px -22px;
        }

        .uber-pricing-page .redeem-input {
          height: 56px;
          border: 1px solid var(--line);
          border-radius: 8px;
          color: #b7bdc6;
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0;
        }

        .uber-pricing-page .redeem-button {
          min-height: 56px;
          border: 0;
          border-radius: 8px;
          background: var(--primary);
          color: #fff;
          padding: 0 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .uber-pricing-page .faq {
          margin-top: 120px;
          display: block;
        }

        .uber-pricing-page .faq h2 {
          margin: 0 0 56px;
          font-size: 36px;
          line-height: 44px;
          font-weight: 700;
          text-align: center;
        }

        .uber-pricing-page .faq-list {
          border-top: 1px solid var(--line);
        }

        .uber-pricing-page .faq-row {
          padding: 16px 0;
          border-bottom: 1px solid var(--line);
        }

        .uber-pricing-page .faq-row h3 {
          margin: 0 0 8px;
          font-size: 16px;
          line-height: 20px;
          font-weight: 500;
        }

        .uber-pricing-page .faq-row p {
          margin: 0;
          color: var(--body);
          font-size: 14px;
          line-height: 20px;
        }

        @media (max-width: 1120px) {
          .uber-pricing-page .page { padding-left: 24px; padding-right: 24px; }
          .uber-pricing-page .pricing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 720px) {
          .uber-pricing-page .page {
            padding: 24px 16px 56px;
          }

          .uber-pricing-page .section-head {
            min-height: 196px;
          }

          .uber-pricing-page .section-head h2 {
            font-size: 32px;
            line-height: 40px;
          }

          .uber-pricing-page .section-controls {
            top: 104px;
          }

          .uber-pricing-page .billing-toggle {
            width: min(100%, 228px);
          }

          .uber-pricing-page .recharge-card,
          .uber-pricing-page .storage-pricing-section,
          .uber-pricing-page .pricing-grid,
          .uber-pricing-page .recharge-products-grid {
            grid-template-columns: 1fr;
          }

          .uber-pricing-page .subscription-management-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .uber-pricing-page .subscription-management-grid {
            grid-template-columns: 1fr;
          }

          .uber-pricing-page .subscription-management-item {
            border-right: 0;
            border-bottom: 1px solid var(--line);
          }

          .uber-pricing-page .subscription-management-item:last-child { border-bottom: 0; }

          .uber-pricing-page .redeem-ticket {
            grid-template-columns: 1fr;
          }

        }
      `}</style>);
}
