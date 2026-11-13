import React, { useRef } from 'react';
import { Box, ChevronDown, GraduationCap, Sparkles, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import './task-credits.css';

export function TaskCreditsPopover({ executionCredits, retentionCredits, onPreviewRetention, note }: {
  note?: string;
  executionCredits: number;
  retentionCredits: number;
  onPreviewRetention?: (value: number) => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const total = executionCredits + retentionCredits;
  const format = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return <div className="tc-control"><Popover.Root>
    <Popover.Trigger asChild><button className="tc-trigger" aria-label={`Credits 消耗明细：${format(total)} Credits`}>
      <GraduationCap size={17}/><span>{format(total)}</span><ChevronDown size={12}/>
    </button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="tc-popover" align="end" sideOffset={12} collisionPadding={12} aria-label="Credits 消耗明细" onOpenAutoFocus={event => { event.preventDefault(); closeButton.current?.focus(); }}>
      <div className="tc-heading"><strong>Credits 消耗</strong><Popover.Close ref={closeButton} className="tc-close" aria-label="关闭 Credits 消耗明细"><X size={16}/></Popover.Close></div>
      <div className="tc-total"><span>本任务累计</span><div><strong>{format(total)}</strong><span>Credits</span></div></div>
      <dl className="tc-items">
        <div className="tc-item"><dt><Sparkles size={15}/><span>任务执行<small>模型与工具调用</small></span></dt><dd>{format(executionCredits)}<span>Credits</span></dd></div>
        <div className="tc-item"><dt><Box size={15}/><span>云主机保留<small>保留文件、依赖和配置</small></span></dt><dd>{format(retentionCredits)}<span>Credits</span></dd></div>
      </dl>
      <p className="tc-note">{note || "云主机保留会消耗 Credits，回收后保留已产生的消耗记录。"}</p>
      {onPreviewRetention && <div className="tc-preview"><span>Mock 数据</span><select aria-label="云主机保留消耗示例" value={retentionCredits} onChange={event => onPreviewRetention(Number(event.target.value))}><option value={12}>已有消耗 · 12 Credits</option><option value={0}>暂无消耗 · 0 Credits</option></select></div>}
    </Popover.Content></Popover.Portal>
  </Popover.Root></div>;
}
