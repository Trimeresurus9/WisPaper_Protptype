import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronRight, FastForward, FileText, LoaderCircle, Pause, Play, RotateCcw, Search, Sparkles, X } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import "./agent-response.css";

export type ResponseStatus = "running" | "stopped" | "done";
const LINE_MS = 3000;
const THINK_MS = LINE_MS * 6;
const TOOLS_START = THINK_MS + 2000;
const TOOL_MS = 4500;
const ROUND_TWO_START = TOOLS_START + TOOL_MS * 3;
const COMPLETE_MS = ROUND_TWO_START + THINK_MS + 2000;
const STAGE_MARKS = [THINK_MS, TOOLS_START, TOOLS_START + TOOL_MS, TOOLS_START + TOOL_MS * 2, ROUND_TWO_START, ROUND_TWO_START + THINK_MS, COMPLETE_MS];
const rounds = [
  { lines: ["正在读取你的任务描述与上下文…", "正在识别研究对象与预期产出…", "正在整理任务中已提供的条件…", "正在标记需要补充的材料范围…", "正在准备检索关键词与筛选条件…", "正在汇总本轮任务范围…"], summary: "已明确任务范围，将检索资料并核对相关证据。" },
  { lines: ["正在汇总工具返回的示例结果…", "正在按研究问题归类材料…", "正在对照来源与适用条件…", "正在标记待验证的信息与缺口…", "正在组织后续执行步骤…", "正在整理结论与下一步建议…"], summary: "已整理材料与待验证事项，形成下一步研究建议。" },
];
const toolCalls = [
  { name: "文献检索", detail: "按任务关键词查找相关材料", result: "检索结果已返回", icon: Search },
  { name: "读取文献", detail: "提取摘要、方法与来源信息", result: "材料信息已提取", icon: FileText },
  { name: "证据整理", detail: "归类研究方法与待验证事项", result: "示例证据已归类", icon: Sparkles },
];

function ThinkingLine({ round, elapsed, stopped }: { round: number; elapsed: number; stopped: boolean }) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const followRef = useRef(true);
  const complete = elapsed >= THINK_MS;
  const lineIndex = Math.min(5, Math.floor(elapsed / LINE_MS));
  const data = rounds[round];
  useLayoutEffect(() => {
    if (open && followRef.current && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [open, lineIndex]);
  return <Popover.Root open={open} onOpenChange={value => { setOpen(value); followRef.current = true; }}>
    <Popover.Trigger asChild>
      <button className={`ar-thinking ${complete ? "is-summary" : ""}`} aria-label={`第 ${round + 1} 轮${complete ? "摘要" : "思考"}，点击查看过程`}>
        {complete ? <Check size={15}/> : stopped ? <Pause size={15}/> : <LoaderCircle size={15} className="ar-spin"/>}
        <span className="ar-line-window">{complete ? <span className="ar-summary">{data.summary}</span> : <span className="ar-line-track" style={{ transform: `translateY(-${lineIndex * 28}px)` }}>{data.lines.map(line => <span key={line}>{line}</span>)}</span>}</span>
        <ChevronRight size={13} className={open ? "ar-chevron-open" : ""}/>
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="ar-popover" side="bottom" align="start" sideOffset={8} collisionPadding={16} aria-label={`第 ${round + 1} 轮思考过程`}>
        <div className="ar-popover-head"><span><Sparkles size={14}/>思考过程 <small>第 {round + 1} 轮 · {complete ? "已完成" : stopped ? "已暂停" : "进行中"}</small></span><Popover.Close aria-label="关闭思考过程"><X size={15}/></Popover.Close></div>
        <div className="ar-process-scroll" ref={scrollRef} tabIndex={0} aria-label="可滚动的思考过程" onScroll={event => { const el = event.currentTarget; followRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 12; }}>
          {data.lines.slice(0, lineIndex + 1).map((line, index) => <div key={line} className={index === lineIndex && !complete ? "is-current" : ""}><span>{String(index + 1).padStart(2, "0")}</span><span>{line}</span></div>)}
        </div>
        <div className="ar-popover-foot">模拟过程 · 固定 4 行，滚动查看{!complete && !stopped ? " · 自动跟随最新进度" : ""}</div>
        <Popover.Arrow className="ar-popover-arrow"/>
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}

export function AgentResponse({ task, status, onStatusChange, canReplay = true }: { task: string; status: ResponseStatus; onStatusChange: (status: ResponseStatus) => void; canReplay?: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [replay, setReplay] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onStatusChange);
  callbackRef.current = onStatusChange;
  useEffect(() => {
    if (status !== "running" || elapsed >= COMPLETE_MS) return;
    const timer = window.setTimeout(() => setElapsed(value => Math.min(COMPLETE_MS, value + 500)), 500);
    return () => window.clearTimeout(timer);
  }, [elapsed, status]);
  useEffect(() => {
    if (elapsed >= COMPLETE_MS && status !== "done") callbackRef.current("done");
  }, [elapsed, status]);
  const complete = elapsed >= COMPLETE_MS;
  useLayoutEffect(() => {
    const scroller = rootRef.current?.closest(".br-chat-scroll");
    if (!scroller) return;
    let following = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 100;
    const onScroll = () => { following = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 100; };
    const observer = new ResizeObserver(() => { if (following) scroller.scrollTop = scroller.scrollHeight; });
    observer.observe(rootRef.current!);
    scroller.addEventListener("scroll", onScroll);
    return () => { observer.disconnect(); scroller.removeEventListener("scroll", onScroll); };
  }, []);
  return <div className="ar-response" ref={rootRef} data-response-state={complete ? "done" : status}>
    <div className="ar-demo-label">输出过程演示 <span>慢速 · 约 55 秒</span></div>
    <ThinkingLine key={`${replay}-0`} round={0} elapsed={elapsed} stopped={status === "stopped"}/>
    {elapsed >= TOOLS_START && <div className="ar-tools" aria-label="工具调用">{toolCalls.map(({ name, detail, result, icon: Icon }, index) => {
      const start = TOOLS_START + index * TOOL_MS;
      if (elapsed < start) return null;
      const done = elapsed >= start + TOOL_MS;
      return <div key={name} className={`ar-tool ${done ? "is-done" : ""}`}><Icon size={14}/><span><strong>{name}</strong><small>{done ? result : detail}</small></span>{done ? <Check size={13}/> : status === "stopped" ? <Pause size={13}/> : <LoaderCircle size={13} className="ar-spin"/>}</div>;
    })}</div>}
    {elapsed >= ROUND_TWO_START && <ThinkingLine key={`${replay}-1`} round={1} elapsed={elapsed - ROUND_TWO_START} stopped={status === "stopped"}/>}
    {complete && <div className="ar-conclusion"><hr/><h3>结论</h3><p>围绕「{task}」，建议先明确研究范围，再建立证据对照，最后形成可验证的研究方案。</p><ol><li><strong>明确范围：</strong>确定研究对象、材料范围与预期产出。</li><li><strong>建立对照：</strong>按研究问题、方法和结论整理资料，保留来源与适用条件。</li><li><strong>推进验证：</strong>优先核查证据缺口，再细化执行步骤与验收标准。</li></ol><p className="ar-result-note">本轮为输出交互演示，工具结果与结论均为示例。</p></div>}
    <div className="ar-response-controls">
      {!complete ? <>
        <button onClick={() => onStatusChange(status === "stopped" ? "running" : "stopped")}>{status === "stopped" ? <Play size={12}/> : <Pause size={12}/>} {status === "stopped" ? "继续演示" : "暂停演示"}</button>
        <button title="跳到下一阶段" onClick={() => setElapsed(value => STAGE_MARKS.find(mark => mark > value) ?? COMPLETE_MS)}><FastForward size={12}/>快进</button>
      </> : canReplay && <button onClick={() => {setElapsed(0); setReplay(value => value + 1); onStatusChange("running");}}><RotateCcw size={12}/>重新演示</button>}
      <span role="status">{complete ? "回答已完成" : status === "stopped" ? "演示已暂停" : "点击思考行，查看过程"}</span>
    </div>
  </div>;
}
