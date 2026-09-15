import React from "react";
import { BookOpen, Clock3, Code2, Cpu, FileText, FolderOpen, FolderPlus, Globe2, Image, LayoutGrid, Library, Lightbulb, MessageSquare, MoreHorizontal, Network, PanelRight, Scan, Search, Sparkles, Text, UserRound, WandSparkles } from "lucide-react";
import wisPaperLogo from '../../assets/3ce02a66a6df7d8cd1f86de17846e94de4e9df61.png';

export type WorkbenchView = "common" | "files" | "browser" | "search" | "plan" | "code" | "review" | "capture" | "gpu";
export const workbenchTools = [
  {id:"common", label:"常用功能", icon:LayoutGrid}, {id:"files", label:"文件浏览", icon:FolderOpen},
  {id:"browser", label:"网页执行", icon:Globe2}, {id:"search", label:"文献搜索", icon:Search},
  {id:"plan", label:"研究计划", icon:FileText}, {id:"code", label:"代码工作台", icon:Code2},
  {id:"review", label:"论文评审", icon:MessageSquare}, {id:"capture", label:"截图与选区", icon:Scan}, {id:"gpu", label:"GPU 环境", icon:Cpu}
] as const;
const functions = [
  {title:"灵感发现", lines:["通过苏格拉底式对话", "逐步明确方向并形成研究计划"], icon:Lightbulb},
  {title:"论文复现", lines:["自动完成论文复现：信息收集、计划生成、GPU 分配、代码执行"], icon:Code2},
  {title:"文献综述", lines:["自动生成学术文献综述", "支持自定义篇幅与文献范围"], icon:Code2},
  {title:"配置GPU", lines:["一键申请 GPU 服务器", "支持多种型号选择"], icon:Cpu},
  {title:"论文主图", lines:["基于论文核心思想", "生成符合期刊规范的高质量主图"], icon:Image},
  {title:"论文评审", lines:["模拟同行评审", "拓展创新点与可行方案"], icon:MessageSquare},
  {title:"Idea 升华", lines:["优化研究想法", "拓展创新点与可行方案"], icon:WandSparkles},
  {title:"LaTeX 写作", lines:["从科研数据到顶会论文", "一站式直达 Camera-Ready"], icon:Text},
  {title:"顺藤摸瓜", lines:["依托引文网络，全面收集相关文献"], icon:Network},
  {title:"Library 管理", lines:["选择同步、导入或检索等操作"], icon:Library},
  {title:"PPT 创作", lines:["基于真实材料生成可编辑 PPT", "支持数据核验与独立评审"], icon:FileText},
];
export function AgentTaskNavigation({onBack,onNavigate}: {onBack:()=>void;onNavigate?:(view:string)=>void}) {
  const nav = [{label:"搜索", view:"scholar-search",icon:Search},{label:"知识库",view:"my-library",icon:Library},{label:"Agent",view:"academic-agent",icon:Sparkles},{label:"项目",view:"research-projects",icon:FolderPlus},{label:"更多工具",view:"tools",icon:MoreHorizontal}];
  return <nav className="aw-left-rail" aria-label="客户端导航"><button className="aw-brand" onClick={onBack} aria-label="返回 Agent 启动页"><img src={wisPaperLogo} alt="WisPaper"/></button><div className="aw-nav-items">{nav.map(({label,view,icon:Icon})=><button key={view} className={view === "academic-agent" ? "active" : ""} title={label} aria-label={label} onClick={()=>view === "academic-agent" ? onBack() : onNavigate?.(view)}><Icon size={21}/></button>)}<button title="新建 Agent 对话" aria-label="新建 Agent 对话" onClick={onBack}><Clock3 size={20}/></button></div><div className="aw-nav-bottom"><Globe2 size={19}/><span className="aw-avatar"><UserRound size={27}/><small>Pro</small></span></div></nav>;
}
export function CommonFunctions({onSelect,onBrowser}: {onSelect:(title:string)=>void;onBrowser:()=>void}) {
  return <div className="aw-function-grid">{functions.map(({title,lines,icon:Icon})=><button key={title} onClick={()=>onSelect(title)}><Icon className="aw-function-icon" strokeWidth={1.8}/><span><strong>{title}</strong><small>{lines.map((line,i)=><React.Fragment key={line}>{i>0 && <br/>}{line}</React.Fragment>)}</small></span></button>)}<button className="aw-browser-card" onClick={onBrowser}><Globe2 className="aw-function-icon" strokeWidth={1.8}/><span><strong>网页执行 <em>新</em></strong><small>在客户端标签页中执行<br/>工作台跟踪进度与页面预览</small></span></button></div>;
}
export function AuxiliaryWorkbench({view,savedProject,onSelect}: {view:WorkbenchView;savedProject:string;onSelect:(title:string)=>void}) {
  if(view === "files") return <div className="aw-files"><label><Search size={15}/><input placeholder="搜索文件名" aria-label="搜索文件名" onChange={e=>{const rows=e.currentTarget.closest('.aw-files')?.querySelectorAll<HTMLElement>('[data-file]'); rows?.forEach(row=>row.hidden=!row.textContent?.toLowerCase().includes(e.target.value.toLowerCase()));}}/></label><div className="aw-file-columns"><span>名称</span><span>来源</span></div><details open><summary><FolderOpen size={16}/>WorkDir</summary><div data-file><FileText size={16}/>研究计划.md<small>当前任务</small></div>{savedProject && <div data-file><FileText size={16}/>Attention Is All You Need<small>{savedProject}</small></div>}</details><details><summary><FolderOpen size={16}/>Files</summary><p>暂无上传材料</p></details><p className="aw-muted">网页研究中确认保存的材料会出现在此处。</p></div>;
  const title=workbenchTools.find(t=>t.id===view)?.label || "研究工具";
  return <div className="aw-tool-detail"><span><BookOpen size={26}/></span><h3>{title}</h3><p>结合当前对话与研究材料，继续推进这项任务。</p><button onClick={()=>onSelect(title)}>在当前对话中使用</button></div>;
}
