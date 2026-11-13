import React, { useState } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Clock3, Code2, Cpu, Download, FileText, FolderOpen, FolderPlus, Globe2, Image, LayoutGrid, Library, Lightbulb, MessageSquare, MoreHorizontal, Network, PanelRight, Scan, Search, Sparkles, Text, UserRound, WandSparkles } from "lucide-react";
import { CaseArtwork } from "../AgentCasePreview";
import type { AgentCase } from "../home-agent-cases";
import { Brain } from "lucide-react";
import wisPaperLogo from '../../assets/3ce02a66a6df7d8cd1f86de17846e94de4e9df61.png';

export type WorkbenchView = "ask-ai" | "memory" | "common" | "files" | "browser" | "search" | "plan" | "code" | "review" | "capture" | "gpu";
export const workbenchTools = [
  {id:"ask-ai", label:"Ask AI", icon:Sparkles},
  {id:"memory", label:"Agent偏好", icon:Brain},
  {id:"common", label:"常用功能", icon:LayoutGrid}, {id:"files", label:"文件浏览", icon:FolderOpen},
  {id:"browser", label:"网页执行", icon:Globe2}, {id:"search", label:"文献搜索", icon:Search},
  {id:"plan", label:"研究计划", icon:FileText}, {id:"code", label:"代码工作台", icon:Code2},
  {id:"review", label:"论文评审", icon:MessageSquare}, {id:"capture", label:"截图与选区", icon:Scan}, {id:"gpu", label:"GPU 环境", icon:Cpu}
] as const;
const functions = [
  {title:"Ask AI", lines:["了解当前任务进度", "随时提问，不打断研究"], icon:Sparkles},
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
export function AgentTaskNavigation({onBack,onNavigate,guest=false}: {onBack:()=>void;onNavigate?:(view:string)=>void;guest?:boolean}) {
  const nav = [{label:"搜索", view:"scholar-search",icon:Search},{label:"知识库",view:"my-library",icon:Library},{label:"Agent",view:"academic-agent",icon:Sparkles},{label:"项目",view:"research-projects",icon:FolderPlus},{label:"更多工具",view:"tools",icon:MoreHorizontal}];
  return <nav className="aw-left-rail" aria-label="客户端导航"><button className="aw-brand" onClick={onBack} aria-label="返回 Agent 启动页"><img src={wisPaperLogo} alt="WisPaper"/></button><div className="aw-nav-items">{nav.map(({label,view,icon:Icon})=><button key={view} className={view === "academic-agent" ? "active" : ""} title={label} aria-label={label} onClick={()=>view === "academic-agent" ? onBack() : onNavigate?.(view)}><Icon size={21}/></button>)}<button title="新建 Agent 对话" aria-label="新建 Agent 对话" onClick={onBack}><Clock3 size={20}/></button></div><div className="aw-nav-bottom"><Globe2 size={19}/><span className="aw-avatar"><UserRound size={27}/><small>{guest ? "游客" : "Pro"}</small></span></div></nav>;
}
export function CommonFunctions({onSelect,onBrowser}: {onSelect:(title:string)=>void;onBrowser:()=>void}) {
  return <div className="aw-function-grid">{functions.map(({title,lines,icon:Icon})=><button key={title} onClick={()=>onSelect(title)}><Icon className="aw-function-icon" strokeWidth={1.8}/><span><strong>{title}</strong><small>{lines.map((line,i)=><React.Fragment key={line}>{i>0 && <br/>}{line}</React.Fragment>)}</small></span></button>)}<button className="aw-browser-card" onClick={onBrowser}><Globe2 className="aw-function-icon" strokeWidth={1.8}/><span><strong>网页执行 <em>新</em></strong><small>Agent 对话右侧实时跟踪<br/>随时接管当前浏览器页面</small></span></button></div>;
}
export interface WorkbenchDocument {
  id: string;
  name: string;
  title: string;
  intro: string;
  sections: { title: string; body: string; points?: string[] }[];
  paged?: boolean;
  markdown?: string;
  caseItem?: AgentCase;
}

function DocumentPreview({document,onClose}: {document:WorkbenchDocument;onClose:()=>void}) {
  const [page,setPage] = useState(0);
  const sections = document.paged ? document.sections.slice(page,page+1) : document.sections;
  const download = () => {
    const body = document.markdown || [`# ${document.title}`,document.intro,...document.sections.map(section=>`## ${section.title}\n\n${section.body}\n\n${section.points?.map(point=>`- ${point}`).join('\n') || ''}`)].join('\n\n');
    const url = URL.createObjectURL(new Blob([body],{type:'text/markdown;charset=utf-8'}));
    const link = window.document.createElement('a');
    link.href=url; link.download=document.name; link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <div className={`aw-files aw-document-preview ${document.caseItem ? 'aw-case-document' : ''}`}>
    <div className="aw-document-toolbar"><button className="br-icon" onClick={onClose} aria-label="返回文件列表"><ArrowLeft size={16}/></button><span>{document.name}</span><button className="br-icon" onClick={download} aria-label="下载当前文件"><Download size={16}/></button></div>
    {document.caseItem && <div className={`aw-case-artifact ${document.paged ? 'is-slides' : ''}`}><CaseArtwork item={document.caseItem} page={page}/></div>}
    {document.paged && <div className="aw-slide-pagination"><div className="aw-slide-dots" role="group" aria-label="选择幻灯片">{document.sections.map((section,index) => <button key={section.title} aria-label={`第 ${index+1} 页：${section.title}`} aria-pressed={page===index} onClick={()=>setPage(index)}>{String(index+1).padStart(2,'0')}</button>)}</div><div className="br-controls aw-document-pages"><button onClick={()=>setPage(value=>value-1)} disabled={page===0} aria-label="上一页幻灯片"><ChevronLeft size={14}/></button><span aria-live="polite">{page+1} / {document.sections.length}</span><button onClick={()=>setPage(value=>value+1)} disabled={page===document.sections.length-1} aria-label="下一页幻灯片"><ChevronRight size={14}/></button></div></div>}
    <article className="ar-response ar-conclusion">{!document.paged && <><h3>{document.title}</h3><p>{document.intro}</p></>}{document.paged && <span className="aw-speaker-label">逐页讲稿 · 第 {page+1} 页</span>}{sections.map(section=><section key={section.title}><h3>{section.title}</h3><p>{section.body}</p>{section.points && <ol>{section.points.map(point=><li key={point}>{point}</li>)}</ol>}</section>)}{document.paged && <p className="ar-result-note">此为预置汇报案例，可逐页浏览；下载内容为 Markdown 讲稿。</p>}</article>
  </div>;
}

function WorkbenchFiles({documents,activeDocument,onOpenDocument}: {documents:WorkbenchDocument[];activeDocument?:string;onOpenDocument:(id:string|undefined)=>void}) {
  const [search,setSearch]=useState('');
  const document=documents.find(item=>item.id===activeDocument);
  if(document) return <DocumentPreview key={document.id} document={document} onClose={()=>onOpenDocument(undefined)}/>;
  const visible=documents.filter(item=>item.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="aw-files"><label><Search size={15}/><input placeholder="搜索文件名" aria-label="搜索文件名" value={search} onChange={event=>setSearch(event.target.value)}/></label><div className="aw-file-columns"><span>名称</span><span>来源</span></div><details open><summary><FolderOpen size={16}/>WorkDir</summary>{visible.map(item=><button className="aw-file-button" data-file key={item.id} onClick={()=>onOpenDocument(item.id)}><FileText size={16}/><span>{item.name}</span><small>当前任务</small></button>)}</details>{!visible.length && <p className="aw-muted">没有匹配的文件</p>}</div>;
}

export function AuxiliaryWorkbench({view,savedProject,onSelect,documents,activeDocument,onOpenDocument}: {view:WorkbenchView;savedProject:string;onSelect:(title:string)=>void;documents?:WorkbenchDocument[];activeDocument?:string;onOpenDocument?:(id:string|undefined)=>void}) {
  if(documents && onOpenDocument && ["files","plan"].includes(view)) return <WorkbenchFiles documents={documents} activeDocument={activeDocument} onOpenDocument={onOpenDocument}/>;
  if(view === "files") return <div className="aw-files"><label><Search size={15}/><input placeholder="搜索文件名" aria-label="搜索文件名" onChange={e=>{const rows=e.currentTarget.closest('.aw-files')?.querySelectorAll<HTMLElement>('[data-file]'); rows?.forEach(row=>row.hidden=!row.textContent?.toLowerCase().includes(e.target.value.toLowerCase()));}}/></label><div className="aw-file-columns"><span>名称</span><span>来源</span></div><details open><summary><FolderOpen size={16}/>WorkDir</summary><div data-file><FileText size={16}/>研究计划.md<small>当前任务</small></div>{savedProject && <div data-file><FileText size={16}/>Attention Is All You Need<small>{savedProject}</small></div>}</details><details><summary><FolderOpen size={16}/>Files</summary><p>暂无上传材料</p></details><p className="aw-muted">网页研究中确认保存的材料会出现在此处。</p></div>;
  const title=workbenchTools.find(t=>t.id===view)?.label || "研究工具";
  return <div className="aw-tool-detail"><span><BookOpen size={26}/></span><h3>{title}</h3><p>结合当前对话与研究材料，继续推进这项任务。</p><button onClick={()=>onSelect(title)}>在当前对话中使用</button></div>;
}
