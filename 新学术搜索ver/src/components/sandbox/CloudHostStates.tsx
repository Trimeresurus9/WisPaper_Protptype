import React, { useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { EnvironmentPopover } from './EnvironmentPopover';
import { applyRetention, createEnvironment, type Environment } from './environment';
import './cloud-host-states.css';

const previewAt = Date.UTC(2026, 10, 10, 8);
const minute = 60000;
const base: Environment = {
  ...createEnvironment(previewAt),
  createdAt: previewAt - 15 * minute,
  runMs: 8 * minute,
};
const scenarios: { id: string; title: string; note: string; environment: Environment }[] = [
  { id: 'running', title: '运行中', note: '任务执行期间保持运行；右侧显示所选回收策略。', environment: { ...base, executingSince: previewAt } },
  { id: 'sleeping', title: '已休眠', note: '保留文件、依赖和配置。发送指令后自动唤醒并执行。', environment: { ...base, status: 'sleeping', sleepAt: previewAt - 3 * minute } },
  { id: 'expiring', title: '即将回收', note: '不足一分钟时以琥珀色提醒，仍可延长保留时间。', environment: { ...base, status: 'sleeping', createdAt: previewAt - 25 * minute, sleepAt: previewAt - 9.5 * minute } },
  { id: 'permanent', title: '永久保留', note: '云主机仍会休眠，但不会自动回收。', environment: { ...base, status: 'sleeping', sleepAt: previewAt - 3 * minute, retention: null } },
  { id: 'waking', title: '唤醒中', note: '收到新指令后恢复云主机；就绪后自动执行原指令。', environment: { ...base, status: 'waking', sleepAt: previewAt - 3 * minute } },
  { id: 'creating', title: '创建中', note: '正在创建新云主机；准备期间暂不可修改回收时间。', environment: { ...base, status: 'creating', createdAt: previewAt, runMs: 0 } },
  { id: 'recycled', title: '已回收', note: '隐藏回收时间选项。发送新指令后自动创建云主机。', environment: { ...base, status: 'recycled', createdAt: previewAt - 25 * minute, sleepAt: previewAt - 12 * minute, endedAt: previewAt - 2 * minute } },
];

export function CloudHostStates() {
  const [environments, setEnvironments] = useState(() => scenarios.map(item => item.environment));
  const [revision, setRevision] = useState(0);
  return <main className="ch-states">
    <header className="ch-header">
      <div><a href="/app/agent"><ArrowLeft size={14} />返回 Agent</a><div className="ch-eyebrow">WisPaper / 组件预览</div><h1>云主机状态</h1><p>查看不同状态下的信息与操作。点击回收时间可切换保留策略。</p></div>
      <button className="ch-reset" onClick={() => { setEnvironments(scenarios.map(item => item.environment)); setRevision(value => value + 1); }}><RotateCcw size={14} />重置 Mock</button>
    </header>
    <div className="ch-grid" key={revision}>
      {scenarios.map((scenario, index) => <section className="ch-scenario" key={scenario.id} aria-label={`${scenario.title}示例`}>
        <div className="ch-caption"><span>{String(index + 1).padStart(2, '0')}</span><h2>{scenario.title}</h2>
          <EnvironmentPopover environment={environments[index]} previewAt={previewAt} onRetention={value => setEnvironments(items => items.map((item, i) => i === index ? applyRetention(item, value, previewAt) : item))} demoEnabled={false} onDemo={() => {}} />
        </div>
        <EnvironmentPopover inline environment={environments[index]} previewAt={previewAt} onRetention={value => setEnvironments(items => items.map((item, i) => i === index ? applyRetention(item, value, previewAt) : item))} demoEnabled={false} onDemo={() => {}} />
        <p className="ch-note">{scenario.note}</p>
      </section>)}
    </div>
    <footer className="ch-footer">Mock 数据 · 时间固定，便于对照 · 卡片右上角可体验工作台入口浮层</footer>
  </main>;
}
