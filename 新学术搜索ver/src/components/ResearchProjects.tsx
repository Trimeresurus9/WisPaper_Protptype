import React, { useEffect, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Bot,
  CalendarDays,
  ChevronRight,
  Copy,
  File,
  FileText,
  Folder,
  FolderKanban,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { StorageUsagePanel } from "./StorageUsagePanel";
import { ResearchTree } from "./ResearchTree";

type ProjectSection = "tree" | "files" | "papers" | "surveys" | "agents";
type ProjectFilter = "active" | "archived" | "trash";
type ProjectPermission = "read" | "write";
type Collaborator = { id: string; name: string; email: string; permission: ProjectPermission; owner?: boolean };

type Project = {
  id: number;
  title: string;
  description: string;
  updated: string;
  members: number;
  files: number;
  accent: string;
  status: ProjectFilter;
  canvasTemplate?: string;
};

const seedProjects: Project[] = [
  {
    id: 1,
    title: "长上下文模型位置偏差研究",
    description: "比较证据位置与上下文长度对多文档问答准确率的影响",
    updated: "今天 14:32",
    members: 3,
    files: 18,
    accent: "from-violet-500 to-indigo-600",
    status: "active",
    canvasTemplate: "demo",
  },
  {
    id: 2,
    title: "RAG Evaluation",
    description: "建立面向专业知识库的 RAG 评测集与指标体系",
    updated: "昨天 18:06",
    members: 2,
    files: 26,
    accent: "from-cyan-500 to-blue-600",
    status: "active",
  },
  {
    id: 3,
    title: "Multimodal Agents",
    description: "多模态任务规划与工具调用能力研究",
    updated: "7 月 24 日",
    members: 5,
    files: 34,
    accent: "from-amber-400 to-orange-600",
    status: "active",
  },
  {
    id: 4,
    title: "Old Survey",
    description: "2025 年度语言模型综述资料",
    updated: "2025 年 12 月",
    members: 1,
    files: 12,
    accent: "from-slate-400 to-slate-600",
    status: "archived",
  },
];

const projectTabs: { id: ProjectSection; label: string; icon: React.ElementType }[] = [
  { id: "tree", label: "科研画布", icon: FolderKanban },
  { id: "files", label: "文件", icon: Folder },
  { id: "papers", label: "论文", icon: FileText },
  { id: "surveys", label: "调研", icon: Search },
  { id: "agents", label: "Agents", icon: Bot },
];

export function ResearchProjects({ onOpenAgent }: { onOpenAgent: () => void }) {
  const [projects, setProjects] = useState(seedProjects);
  const [filter, setFilter] = useState<ProjectFilter>("active");
  const initialProjectId = typeof window !== "undefined" ? window.location.pathname.match(/^\/app\/projects\/(\d+)$/)?.[1] : undefined;
  const [selected, setSelected] = useState<Project | null>(() => seedProjects.find((project) => String(project.id) === initialProjectId) ?? null);
  const [section, setSection] = useState<ProjectSection>("tree");
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [canvasCreationMode, setCanvasCreationMode] = useState<"blank" | "template">("blank");
  const [selectedTemplate, setSelectedTemplate] = useState("ai-algorithm");
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [invitePermission, setInvitePermission] = useState<ProjectPermission>("write");
  const [inviteTarget, setInviteTarget] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [inviteIdentity, setInviteIdentity] = useState<"wispaper" | "qiewen">(() => {
    try { return window.localStorage.getItem("wispaper-mock-invite-identity") === "qiewen" ? "qiewen" : "wispaper"; } catch { return "wispaper"; }
  });
  const [collaborators, setCollaborators] = useState<Record<number, Collaborator[]>>({
    1: [
      { id: "owner", name: "博一新生林沐", email: "lin.mu@wispaper.ai", permission: "write", owner: true },
      { id: "zhou", name: "博三学长周启", email: "zhou.qi@example.com", permission: "write" },
      { id: "chen", name: "导师陈教授", email: "prof.chen@example.com", permission: "read" },
    ],
  });

  const projectCollaborators = selected ? collaborators[selected.id] ?? [
    { id: "owner", name: "你", email: "you@wispaper.ai", permission: "write", owner: true },
  ] : [];

  useEffect(() => {
    const handleInviteIdentity = (event: Event) => {
      const identity = (event as CustomEvent<{ identity?: "wispaper" | "qiewen" }>).detail?.identity;
      if (identity) { setInviteIdentity(identity); setInviteTarget(""); }
    };
    window.addEventListener("wispaper:mock-invite-identity", handleInviteIdentity);
    return () => window.removeEventListener("wispaper:mock-invite-identity", handleInviteIdentity);
  }, []);

  useEffect(() => {
    const handleFullResearchUsecase = (event: Event) => {
      const delayMs = (event as CustomEvent<{ delayMs?: number }>).detail?.delayMs ?? 1200;
      const project: Project = {
        id: Date.now(), title: "长上下文模型位置偏差研究", description: "博一新生直接启动 Agent 推进的完整科研案例",
        updated: "刚刚", members: 1, files: 0, accent: "from-violet-500 to-blue-600", status: "active", canvasTemplate: "blank",
      };
      setProjects((items) => [project, ...items]);
      setSelected(project);
      setSection("tree");
      setFilter("active");
      window.history.pushState({ view: "research-projects", projectId: project.id }, "", `/app/projects/${project.id}`);
      window.setTimeout(() => window.dispatchEvent(new CustomEvent("wispaper:mock-run-full-research-usecase", { detail: { delayMs } })), 350);
    };
    window.addEventListener("wispaper:mock-full-research-usecase", handleFullResearchUsecase);
    return () => window.removeEventListener("wispaper:mock-full-research-usecase", handleFullResearchUsecase);
  }, []);

  const inviteCollaborator = () => {
    if (!selected || !inviteTarget.trim()) return;
    const contact = inviteTarget.trim();
    const collaborator: Collaborator = {
      id: `member-${Date.now()}`,
      name: inviteIdentity === "wispaper" ? contact.split("@")[0] : `切问用户 ${contact.slice(-4)}`,
      email: contact,
      permission: invitePermission,
    };
    setCollaborators((current) => ({ ...current, [selected.id]: [...projectCollaborators, collaborator] }));
    setProjects((items) => items.map((project) => project.id === selected.id ? { ...project, members: projectCollaborators.length + 1 } : project));
    setSelected((project) => project ? { ...project, members: projectCollaborators.length + 1 } : project);
    setInviteTarget("");
  };

  const updateCollaboratorPermission = (memberId: string, permission: ProjectPermission) => {
    if (!selected) return;
    setCollaborators((current) => ({ ...current, [selected.id]: projectCollaborators.map((member) => member.id === memberId ? { ...member, permission } : member) }));
  };

  const createProject = () => {
    if (!newTitle.trim()) return;
    const project: Project = {
      id: Date.now(),
      title: newTitle.trim(),
      description: "一个新的研究项目",
      updated: "刚刚",
      members: 1,
      files: 0,
      accent: "from-emerald-400 to-teal-600",
      status: "active",
      canvasTemplate: canvasCreationMode === "blank" ? "blank" : selectedTemplate,
    };
    setProjects((items) => [project, ...items]);
    setSelected(project);
    setShowCreate(false);
    setNewTitle("");
    setFilter("active");
    window.history.pushState({ view: "research-projects", projectId: project.id }, "", `/app/projects/${project.id}`);
  };

  if (selected) {
    return (
      <div className="flex h-screen min-w-0 flex-1 flex-col bg-white">
        <header className="border-b border-slate-200 px-6 py-2.5">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => { setSelected(null); window.history.pushState({ view: "research-projects" }, "", "/app/projects"); }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="返回项目列表"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${selected.accent} text-white`}>
                <FolderKanban className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold">{selected.title}</h1>
                <p className="truncate text-xs text-slate-500">{selected.description}</p>
              </div>
            </div>
            <nav className="flex h-12 min-w-0 flex-1 items-stretch gap-1" aria-label="项目工作区">
              {projectTabs.map((tab) => {
                const Icon = tab.icon;
                return <button key={tab.id} onClick={() => setSection(tab.id)} className={`relative flex items-center gap-2 px-3 text-sm transition ${section === tab.id ? "font-medium text-slate-950" : "text-slate-500 hover:text-slate-800"}`}><Icon className="h-4 w-4" />{tab.label}{section === tab.id && <span className="absolute inset-x-2 -bottom-2.5 h-0.5 rounded-full bg-slate-950" />}</button>;
              })}
            </nav>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCollaboration(true)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50">
                <Users className="mr-2 inline h-4 w-4" />协作
              </button>
              <button
                onClick={onOpenAgent}
                className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                <Sparkles className="mr-2 inline h-4 w-4" />运行 Agent
              </button>
              <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="更多">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        <main className={`min-h-0 flex-1 overflow-y-auto bg-[#f7f8fa] ${section === "tree" ? "p-3" : "p-7"}`}>
          <div className={`mx-auto ${section === "tree" ? "h-full w-full max-w-none" : "max-w-6xl"}`}>
            {section === "tree" && <ResearchTree projectId={selected.id} projectTitle={selected.title} initialTemplate={selected.canvasTemplate} />}
            {section !== "tree" && <StorageUsagePanel className="mb-6" />}
            {section === "files" && (
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="font-semibold">项目文件</h2>
                    <p className="mt-1 text-xs text-slate-500">Agent 产物、上传资料和实验代码集中保存在这里</p>
                  </div>
                  <button className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white">
                    <Plus className="mr-1.5 inline h-4 w-4" />上传
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_160px_150px_44px] border-b border-slate-100 px-5 py-3 text-xs font-medium text-slate-500">
                  <span>名称</span><span>修改时间</span><span>大小</span><span />
                </div>
                {[
                  ["文献与笔记", "今天 14:20", "6 个文件", "folder"],
                  ["实验代码", "昨天 22:14", "12 个文件", "folder"],
                  ["memory-agent-survey.md", "今天 14:32", "48 KB", "file"],
                  ["evidence-table.csv", "今天 13:57", "126 KB", "file"],
                ].map(([name, time, size, type]) => (
                  <button key={name} className="grid w-full grid-cols-[1fr_160px_150px_44px] items-center border-b border-slate-100 px-5 py-4 text-left text-sm last:border-0 hover:bg-slate-50">
                    <span className="flex items-center gap-3 font-medium">
                      {type === "folder" ? <Folder className="h-5 w-5 fill-blue-50 text-blue-600" /> : <File className="h-5 w-5 text-slate-400" />}
                      {name}
                    </span>
                    <span className="text-slate-500">{time}</span>
                    <span className="text-slate-500">{size}</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
            {section === "papers" && (
              <div>
                <div className="mb-5 flex items-center justify-between">
                  <div><h2 className="text-xl font-semibold">收藏论文</h2><p className="mt-1 text-sm text-slate-500">项目相关的核心文献与阅读状态</p></div>
                  <button className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-medium text-white"><Plus className="mr-1.5 inline h-4 w-4" />添加论文</button>
                </div>
                <div className="space-y-3">
                  {[
                    ["MemoryBank: Enhancing Large Language Models with Long-Term Memory", "Zhong et al. · AAAI 2024", "已精读"],
                    ["Generative Agents: Interactive Simulacra of Human Behavior", "Park et al. · UIST 2023", "有笔记"],
                    ["MemGPT: Towards LLMs as Operating Systems", "Packer et al. · 2024", "待读"],
                  ].map(([title, meta, status]) => (
                    <div key={title} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
                      <div><h3 className="font-medium">{title}</h3><p className="mt-2 text-sm text-slate-500">{meta}</p></div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {section === "surveys" && (
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["长期记忆机制研究综述", "Agent 已分析 42 篇论文，形成 5 类方法框架", "今天更新"],
                  ["评测基准与数据集", "整理 12 个常用 benchmark 及其适用范围", "昨天更新"],
                ].map(([title, description, date]) => (
                  <button key={title} className="rounded-2xl border border-slate-200 bg-white p-5 text-left hover:shadow-md">
                    <Search className="h-6 w-6 text-violet-600" />
                    <h3 className="mt-8 font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
                    <p className="mt-5 text-xs text-slate-400">{date}</p>
                  </button>
                ))}
              </div>
            )}
            {section === "agents" && (
              <div>
                <div className="mb-5"><h2 className="text-xl font-semibold">项目 Agents</h2><p className="mt-1 text-sm text-slate-500">查看项目中正在执行或已经完成的研究任务</p></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ["文献调研 Agent", "正在交叉验证研究空白", "运行中"],
                    ["论文解析 Agent", "已解析 8 篇核心论文", "已完成"],
                    ["实验复现 Agent", "等待 GPU 环境", "等待中"],
                  ].map(([title, description, status], index) => (
                    <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${index === 0 ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}><Bot className="h-5 w-5" /></span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{status}</span>
                      </div>
                      <h3 className="mt-7 font-semibold">{title}</h3>
                      <p className="mt-2 text-sm text-slate-500">{description}</p>
                      <button onClick={onOpenAgent} className="mt-5 text-sm font-medium text-violet-700">查看任务 <ChevronRight className="inline h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
        {showCollaboration && <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/40 p-6" onMouseDown={() => setShowCollaboration(false)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div><h2 className="text-lg font-semibold">Project 协作</h2><p className="mt-1 text-sm text-slate-500">邀请成员共同访问「{selected.title}」</p></div>
              <button onClick={() => setShowCollaboration(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="关闭协作设置"><X className="h-5 w-5" /></button>
            </header>
            <div className="space-y-6 p-6">
              <section>
                <div className="flex items-center justify-between"><label className="text-sm font-medium text-slate-800">邀请用户</label><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">{inviteIdentity === "wispaper" ? "WisPaper 用户通过邮箱登录" : "切问用户通过手机号登录"}</span></div>
                <div className="mt-2 flex gap-2">
                  <input type={inviteIdentity === "wispaper" ? "email" : "tel"} value={inviteTarget} onChange={(event) => setInviteTarget(event.target.value)} onKeyDown={(event) => event.key === "Enter" && inviteCollaborator()} placeholder={inviteIdentity === "wispaper" ? "输入 WisPaper 邮箱" : "输入切问手机号"} aria-label={inviteIdentity === "wispaper" ? "WisPaper 邮箱" : "切问手机号"} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                  <select value={invitePermission} onChange={(event) => setInvitePermission(event.target.value as ProjectPermission)} aria-label="邀请权限" className="rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"><option value="write">可读写</option><option value="read">只读</option></select>
                  <button onClick={inviteCollaborator} disabled={!inviteTarget.trim()} className="rounded-xl bg-slate-950 px-4 text-sm font-medium text-white disabled:bg-slate-200">邀请</button>
                </div>
                <div className="mt-3 flex items-center gap-2"><div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-400">{window.location.origin}/invite/project/{selected.id}?account={inviteIdentity}&permission={invitePermission}</div><button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/invite/project/${selected.id}?account=${inviteIdentity}&permission=${invitePermission}`); setLinkCopied(true); window.setTimeout(() => setLinkCopied(false), 1800); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700"><Copy className="h-3.5 w-3.5" />{linkCopied ? "已复制" : "复制链接"}</button></div>
              </section>
              <section className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4">
                <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" /><div><p className="text-sm font-medium text-violet-950">用户与其 Agent 使用相同权限</p><p className="mt-1 text-xs leading-5 text-violet-700">只读成员及其 Agent 可查看项目内容；可读写成员及其 Agent 可编辑画布、笔记、文件与项目产物。</p></div></div>
              </section>
              <section>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-medium">项目成员 · {projectCollaborators.length}</h3></div>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {projectCollaborators.map((member) => <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">{member.name.slice(0, 1).toUpperCase()}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{member.name}{member.owner && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">所有者</span>}</p><p className="truncate text-xs text-slate-400">{member.email}</p></div>
                    {member.owner ? <span className="text-xs text-slate-500">可读写</span> : <select value={member.permission} onChange={(event) => updateCollaboratorPermission(member.id, event.target.value as ProjectPermission)} aria-label={`${member.name}的权限`} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none"><option value="write">可读写</option><option value="read">只读</option></select>}
                  </div>)}
                </div>
              </section>
            </div>
          </div>
        </div>}
      </div>
    );
  }

  const visibleProjects = projects.filter((project) => project.status === filter);

  return (
    <div className="flex h-screen min-w-0 flex-1 flex-col bg-[#f7f8fa]">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div>
          <h1 className="text-lg font-semibold">研究项目</h1>
          <p className="text-xs text-slate-500">组织论文、文件、调研与 Agent 任务</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenAgent} className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium hover:bg-slate-50">
            <Bot className="mr-2 inline h-4 w-4" />学术 Agent
          </button>
          <button onClick={() => setShowCreate(true)} className="rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800">
            <Plus className="mr-2 inline h-4 w-4" />新建项目
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex rounded-xl border border-slate-200 bg-white p-1">
              {[
                ["active", "项目", FolderKanban],
                ["archived", "归档", Archive],
                ["trash", "回收站", Trash2],
              ].map(([id, label, Icon]) => (
                <button
                  key={id as string}
                  onClick={() => setFilter(id as ProjectFilter)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${filter === id ? "bg-slate-950 font-medium text-white" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Icon className="h-4 w-4" />{label as string}
                </button>
              ))}
            </div>
            <label className="flex w-64 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500">
              <Search className="h-4 w-4" /><input className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="搜索项目" />
            </label>
          </div>
          <StorageUsagePanel className="mt-5" />
          {visibleProjects.length > 0 ? (
            <div className="mt-6 grid grid-cols-3 gap-5">
              {visibleProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => { setSelected(project); window.history.pushState({ view: "research-projects", projectId: project.id }, "", `/app/projects/${project.id}`); }}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className={`h-2 bg-gradient-to-r ${project.accent}`} />
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${project.accent} text-white`}><FolderKanban className="h-5 w-5" /></span>
                      <MoreHorizontal className="h-5 w-5 text-slate-400" />
                    </div>
                    <h2 className="mt-7 text-lg font-semibold group-hover:text-violet-700">{project.title}</h2>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">{project.description}</p>
                    <div className="mt-6 flex items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span><FileText className="mr-1 inline h-3.5 w-3.5" />{project.files} 文件</span>
                      <span><Users className="mr-1 inline h-3.5 w-3.5" />{project.members} 成员</span>
                      <span className="ml-auto"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{project.updated}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center">
              <Archive className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-4 font-medium">这里还没有内容</p>
              <p className="mt-1 text-sm text-slate-500">项目被归档或删除后会显示在这里。</p>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-6" onMouseDown={() => setShowCreate(false)}>
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 className="text-xl font-semibold">新建研究项目</h2>
            <p className="mt-1 text-sm text-slate-500">项目会集中保存相关资料与 Agent 产物。</p>
            <label className="mt-6 block text-sm font-medium">项目名称</label>
            <input
              autoFocus
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && createProject()}
              placeholder="例如：多模态 Agent 评测"
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
            <p className="mt-6 text-sm font-medium">科研画布</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button onClick={() => setCanvasCreationMode("blank")} className={`rounded-xl border p-4 text-left ${canvasCreationMode === "blank" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
                <span className="font-medium">空白画布</span><span className="mt-1 block text-xs leading-5 text-slate-500">创建项目后从零开始，也可稍后从模板创建</span>
              </button>
              <button onClick={() => setCanvasCreationMode("template")} className={`rounded-xl border p-4 text-left ${canvasCreationMode === "template" ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}>
                <span className="font-medium">从模板创建</span><span className="mt-1 block text-xs leading-5 text-slate-500">使用预置的研究流程与节点结构</span>
              </button>
            </div>
            {canvasCreationMode === "template" && <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["ai-algorithm", "AI 算法实验", "问题 · 基线 · 训练 · 评测"],
                ["clinical-trial", "临床实验", "研究假设 · 入排标准 · 终点"],
                ["literature-review", "系统文献综述", "检索 · 筛选 · 证据综合"],
                ["data-analysis", "统计数据分析", "数据清理 · 模型 · 结果解释"],
                ["large-research", "大型科研项目", "多技术路线 · 并行分支 · 里程碑"],
              ].map(([id, title, description]) => <button key={id} onClick={() => setSelectedTemplate(id)} className={`rounded-xl border px-3 py-3 text-left ${selectedTemplate === id ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 hover:bg-slate-50"}`}><span className="text-sm font-medium">{title}</span><span className={`mt-1 block text-[11px] ${selectedTemplate === id ? "text-slate-300" : "text-slate-400"}`}>{description}</span></button>)}
            </div>}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowCreate(false)} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">取消</button>
              <button onClick={createProject} disabled={!newTitle.trim()} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-200">创建项目</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
