import React, { useEffect, useRef, useState } from 'react';
import { Box, Check, ChevronDown, Info, LoaderCircle, Moon, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDuration, recycleAt, runtime, type Environment, type Retention } from './environment';
import './environment.css';

const options: {value: Retention; label: string; note: string}[] = [
  {value: 10, label: '10min 后回收', note: '默认'},
  {value: 20, label: '20min 后回收', note: ''},
  {value: 60, label: '1h 后回收', note: ''},
  {value: null, label: '永久保留', note: ''},
];
const labels = {running: '云主机运行中', sleeping: '云主机已休眠', recycled: '云主机已回收', waking: '正在唤醒云主机', creating: '正在创建云主机'};
export function EnvironmentPopover({environment: env, onRetention, demoEnabled, onDemo, inline = false, previewAt}: {
  environment: Environment; onRetention: (value: Retention) => void;
  demoEnabled: boolean; onDemo: (scenario: string) => void;
  inline?: boolean; previewAt?: number;
}) {
  const [, setNow] = useState(Date.now);
  const now = previewAt ?? Date.now();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Retention>(null);
  const [confirm, setConfirm] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => { if (previewAt !== undefined) return; const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [previewAt]);
  const deadline = recycleAt(env);
  const remaining = deadline === null ? null : Math.max(0, deadline - now);
  const urgent = env.status === 'sleeping' && remaining !== null && remaining <= 60000;
  const preparing = env.status === 'waking' || env.status === 'creating';
  const recycled = env.status === 'recycled';
  const StatusIcon = preparing ? LoaderCircle : env.status === 'sleeping' ? Moon : Box;
  const policyLabel = env.retention === null ? '永久保留'
    : env.status === 'sleeping' && remaining !== null
      ? `${remaining < 60000 ? '<1min' : `${Math.ceil(remaining / 60000)}min`} 后回收`
      : `${env.retention === 60 ? '1h' : `${env.retention}min`} 后回收`;
  const choose = (value: Retention) => {
    if (env.status === 'sleeping' && env.sleepAt !== null && value !== null && now >= env.sleepAt + value * 60000) {
      setPending(value); setConfirm(true); return;
    }
    onRetention(value);
  };
  const content = <>
        <div className="sb-popover-heading"><strong>任务云主机</strong>
          <Tooltip.Provider delayDuration={200}><Tooltip.Root>
            <Tooltip.Trigger asChild><button className="sb-info" aria-label="了解云主机保留"><Info size={14}/></button></Tooltip.Trigger>
            <Tooltip.Portal><Tooltip.Content className="sb-info-tooltip" side="bottom" align="start" sideOffset={8} collisionPadding={12}>
              <p>保留任务云主机中的文件、依赖和配置，方便继续任务。</p>
              <Tooltip.Arrow className="sb-info-arrow"/>
            </Tooltip.Content></Tooltip.Portal>
          </Tooltip.Root></Tooltip.Provider>
          <span>当前任务</span>{!inline && <Popover.Close ref={closeButton} className="sb-close" aria-label="关闭云主机信息"><X size={16}/></Popover.Close>}</div>
        <div className="sb-status-row">
          <div className={`sb-state sb-${env.status}`} role="status"><StatusIcon size={15} className={preparing ? 'sb-spin' : ''}/><span>{labels[env.status]}</span></div>
          {!recycled && <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild><button className={`sb-retention ${urgent ? 'sb-retention-urgent' : ''}`} disabled={preparing} aria-label={`选择回收时间：${policyLabel}`} title="保留时长从进入休眠时起算">{policyLabel}<ChevronDown size={13}/></button></DropdownMenu.Trigger>
            <DropdownMenu.Portal><DropdownMenu.Content className="sb-retention-menu" sideOffset={7} align="end" collisionPadding={12}>
              <DropdownMenu.Label className="sb-menu-heading">休眠后保留时间</DropdownMenu.Label>
              <DropdownMenu.RadioGroup value={String(env.retention)} onValueChange={value => choose(value === 'null' ? null : Number(value) as Retention)}>
                {options.map(option => <DropdownMenu.RadioItem key={String(option.value)} value={String(option.value)} className="sb-retention-option">
                  <span className="sb-check"><DropdownMenu.ItemIndicator><Check size={14}/></DropdownMenu.ItemIndicator></span><span>{option.label}</span>{option.note && <small>{option.note}</small>}
                </DropdownMenu.RadioItem>)}
              </DropdownMenu.RadioGroup>
            </DropdownMenu.Content></DropdownMenu.Portal>
          </DropdownMenu.Root>}
        </div>
        <div className="sb-metrics">
          <span title="当前任务累计实际执行时间，不含等待和休眠">运行 <b>{formatDuration(runtime(env, now))}</b></span>
          <i aria-hidden="true">·</i>
          <span title="当前云主机自创建以来的存续时间，包含运行和休眠">已保留 <b>{formatDuration((env.endedAt ?? now) - env.createdAt)}</b></span>
        </div>
        {demoEnabled && <div className="sb-demo-row"><a href="/mock/cloud-host-states" className="sb-demo-link">查看全部状态</a><select className="sb-demo" aria-label="原型云主机演示" defaultValue="" disabled={preparing} onChange={e => { onDemo(e.target.value); e.target.value = ''; }}>
          <option value="" disabled>切换云主机状态</option><option value="running">运行中</option><option value="sleeping">休眠 · 剩余 7min</option><option value="expiring">即将回收 · 不足 1min</option><option value="permanent">休眠 · 永久保留</option><option value="extended">休眠 · 已过 30min</option><option value="recycled">已回收</option>
        </select></div>}
  </>;
  return <div className="sb-environment-control">
    {inline ? <section className="sb-popover sb-inline" aria-label="云主机信息与操作">{content}</section> : <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild><button ref={trigger} className={`sb-trigger sb-trigger-${env.status} ${urgent ? 'sb-trigger-urgent' : ''}`} aria-label={`云主机信息：${labels[env.status]}`} title={`云主机信息 · ${labels[env.status]}`}>
        <StatusIcon size={18} className={preparing ? 'sb-spin' : ''}/><i aria-hidden="true"/>
      </button></Popover.Trigger>
      <Popover.Portal><Popover.Content className="sb-popover" sideOffset={12} collisionPadding={12} align="end" aria-label="云主机信息与操作" onOpenAutoFocus={event => { event.preventDefault(); closeButton.current?.focus(); }}>
        {content}
      </Popover.Content></Popover.Portal>
    </Popover.Root>}
    <span className="sb-sr-only" role="status">{urgent ? '云主机即将回收，可打开云主机信息调整保留时间。' : ''}</span>
    <AlertDialog.Root open={confirm} onOpenChange={setConfirm}><AlertDialog.Portal><AlertDialog.Overlay className="sb-dialog-overlay"/><AlertDialog.Content className="sb-dialog" onCloseAutoFocus={e => {if (!inline) { e.preventDefault(); trigger.current?.focus(); }}}>
      <AlertDialog.Title>应用后将立即回收云主机</AlertDialog.Title><AlertDialog.Description>当前休眠时间已超过所选保留时长。确认后，当前云主机将立即回收。下次发送指令时，将自动创建新云主机并执行。</AlertDialog.Description>
      <div><AlertDialog.Cancel>取消</AlertDialog.Cancel><AlertDialog.Action className="sb-confirm" onClick={() => {onRetention(pending); setOpen(false);}}>确认回收云主机</AlertDialog.Action></div>
    </AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
