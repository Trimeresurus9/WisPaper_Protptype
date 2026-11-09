import React, { useEffect, useId, useRef, useState } from 'react';
import { Box, Check, Clock3, Info, LoaderCircle, Moon, Timer, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import { formatDuration, recycleAt, runtime, type Environment, type Retention } from './environment';
import './environment.css';

const options: {value: Retention; label: string; note: string}[] = [
  {value: 10, label: '10 分钟后回收', note: '默认'},
  {value: 20, label: '20 分钟后回收', note: ''},
  {value: 60, label: '1 小时后回收', note: ''},
  {value: null, label: '永久保留', note: ''},
];
const labels = {running: '环境运行中', sleeping: '环境已休眠', recycled: '环境已回收', waking: '正在唤醒环境', creating: '正在创建环境'};
export function EnvironmentPopover({environment: env, onRetention, demoEnabled, onDemo}: {
  environment: Environment; onRetention: (value: Retention) => void;
  demoEnabled: boolean; onDemo: (scenario: string) => void;
}) {
  const [, setNow] = useState(Date.now);
  const now = Date.now();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Retention>(null);
  const [confirm, setConfirm] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const radioName = useId();
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const deadline = recycleAt(env);
  const remaining = deadline === null ? null : Math.max(0, deadline - now);
  const urgent = env.status === 'sleeping' && remaining !== null && remaining <= 60000;
  const preparing = env.status === 'waking' || env.status === 'creating';
  const recycled = env.status === 'recycled';
  const StatusIcon = preparing ? LoaderCircle : env.status === 'sleeping' ? Moon : Box;
  const choose = (value: Retention) => {
    if (env.status === 'sleeping' && env.sleepAt !== null && value !== null && Date.now() >= env.sleepAt + value * 60000) {
      setPending(value); setConfirm(true); return;
    }
    onRetention(value);
  };
  return <div className="sb-environment-control">
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild><button ref={trigger} className={`sb-trigger sb-trigger-${env.status} ${urgent ? 'sb-trigger-urgent' : ''}`} aria-label={`环境信息：${labels[env.status]}`} title={`环境信息 · ${labels[env.status]}`}>
        <StatusIcon size={18} className={preparing ? 'sb-spin' : ''}/><i aria-hidden="true"/>
      </button></Popover.Trigger>
      <Popover.Portal><Popover.Content className="sb-popover" sideOffset={12} collisionPadding={12} align="end" aria-label="环境信息与操作" onOpenAutoFocus={event => { event.preventDefault(); closeButton.current?.focus(); }}>
        <div className="sb-popover-heading"><strong>任务环境</strong>
          <Tooltip.Provider delayDuration={200}><Tooltip.Root>
            <Tooltip.Trigger asChild><button className="sb-info" aria-label="了解环境保留"><Info size={14}/></button></Tooltip.Trigger>
            <Tooltip.Portal><Tooltip.Content className="sb-info-tooltip" side="bottom" align="start" sideOffset={8} collisionPadding={12}>
              <p>保留任务环境中的文件、依赖和配置，方便继续任务。</p>
              <Tooltip.Arrow className="sb-info-arrow"/>
            </Tooltip.Content></Tooltip.Portal>
          </Tooltip.Root></Tooltip.Provider>
          <span>当前任务</span><Popover.Close ref={closeButton} className="sb-close" aria-label="关闭环境信息"><X size={16}/></Popover.Close></div>
        <div className={`sb-state sb-${env.status}`} role="status"><StatusIcon size={15} className={preparing ? 'sb-spin' : ''}/><span>{labels[env.status]}</span></div>
        <div className="sb-metrics">
          <div title="当前任务累计实际执行时间，不含等待和休眠"><span><Clock3 size={13}/>任务运行</span><b>{formatDuration(runtime(env, now))}</b></div>
          <div title="当前环境自创建以来的存续时间，包含运行和休眠"><span><Timer size={13}/>环境已保留</span><b>{formatDuration((env.endedAt ?? now) - env.createdAt)}</b></div>
        </div>
        {!recycled && <>
          <fieldset className="sb-options" disabled={preparing}><legend>休眠后保留时间</legend>{options.map(option => <label key={String(option.value)} className={env.retention === option.value ? 'selected' : ''}>
            <input type="radio" name={radioName} value={String(option.value)} checked={env.retention === option.value} onChange={() => choose(option.value)}/>
            <span className="sb-check">{env.retention === option.value && <Check size={14}/>}</span><span>{option.label}</span>{option.note && <small>{option.note}</small>}
          </label>)}</fieldset>

        </>}
        {demoEnabled && <div className="sb-demo-row"><span>原型演示</span><select className="sb-demo" aria-label="原型环境演示" defaultValue="" disabled={preparing} onChange={e => { onDemo(e.target.value); e.target.value = ''; }}>
          <option value="" disabled>切换环境状态</option><option value="running">运行中</option><option value="sleeping">休眠 · 剩余 7 分钟</option><option value="expiring">即将回收 · 30 秒</option><option value="permanent">休眠 · 永久保留</option><option value="extended">休眠 · 已过 30 分钟</option><option value="recycled">已回收</option>
        </select></div>}
      </Popover.Content></Popover.Portal>
    </Popover.Root>
    <span className="sb-sr-only" role="status">{urgent ? '环境即将回收，可打开环境信息调整保留时间。' : ''}</span>
    <AlertDialog.Root open={confirm} onOpenChange={setConfirm}><AlertDialog.Portal><AlertDialog.Overlay className="sb-dialog-overlay"/><AlertDialog.Content className="sb-dialog" onCloseAutoFocus={e => {e.preventDefault(); trigger.current?.focus();}}>
      <AlertDialog.Title>应用后将立即回收环境</AlertDialog.Title><AlertDialog.Description>当前休眠时间已超过所选保留时长。确认后，当前环境将立即回收。下次发送指令时，将自动创建新环境并执行。</AlertDialog.Description>
      <div><AlertDialog.Cancel>取消</AlertDialog.Cancel><AlertDialog.Action className="sb-confirm" onClick={() => {onRetention(pending); setOpen(false);}}>确认回收环境</AlertDialog.Action></div>
    </AlertDialog.Content></AlertDialog.Portal></AlertDialog.Root>
  </div>;
}
