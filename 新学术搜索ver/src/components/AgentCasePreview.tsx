import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { AgentCase, AgentCaseTask } from './home-agent-cases';
import inspirationImage from '../assets/agent-cases/inspiration-discovery.jpg';
import literatureImage from '../assets/agent-cases/literature-review.jpg';
import './agent-case-preview.css';

const visualCopy: Record<string, { title: string; english: string; labels: string[]; tint: string }> = {
  'ideas-agent-memory': { title: '让 Agent 记得更好', english: 'AGENT MEMORY', labels: ['何时记忆', '如何遗忘', '怎样验证'], tint: 'blue' },
  'ideas-materials': { title: '从材料筛选到新选题', english: 'MATERIAL DISCOVERY', labels: ['候选材料', '实验成本', '筛选策略'], tint: 'sage' },
  'ideas-science-learning': { title: '找到 AI 教育研究切口', english: 'LEARNING WITH AI', labels: ['反馈时机', '学习迁移', '认知负荷'], tint: 'amber' },
  'review-rag': { title: '一张图，理清 RAG 评测', english: 'RAG EVALUATION', labels: ['检索质量', '生成质量', '端到端评测'], tint: 'blue' },
  'review-multimodal': { title: '梳理多模态推理评测', english: 'MULTIMODAL REASONING', labels: ['任务分类', '评测方法', '研究空白'], tint: 'sage' },
  'review-active-learning': { title: '看懂主动学习方法谱系', english: 'ACTIVE LEARNING', labels: ['采样策略', '标注预算', '评价设置'], tint: 'amber' },
  'peer-rag': { title: '为 RAG 论文做一次预审', english: 'RAG · PEER REVIEW', labels: ['贡献边界', '对照实验', '证据完整性'], tint: 'blue' },
  'peer-graph': { title: '检查图学习的实验证据', english: 'GRAPH LEARNING', labels: ['基线设置', '数据划分', '复现细节'], tint: 'sage' },
  'peer-user-study': { title: '打磨用户研究的论证', english: 'USER STUDY', labels: ['研究设计', '统计分析', '结论范围'], tint: 'amber' },
  'slides-transformer': { title: '把 Transformer 讲清楚', english: 'Attention is\nall you need.', labels: ['Attention', 'Add & Norm', 'Feed Forward'], tint: 'blue' },
  'slides-rag': { title: '一份清晰的 RAG 进展汇报', english: 'From retrieval\nto reasoning.', labels: ['Retrieve', 'Augment', 'Generate'], tint: 'sage' },
  'slides-graph': { title: '用图解开启 GNN 组会', english: 'Think in\ngraphs.', labels: ['邻域聚合', '特征更新', '图表征'], tint: 'amber' },
};

export const ownCaseTaskCopy: Record<AgentCaseTask, { action: string; title: string; label: string; placeholder: string; format: string }> = {
  ideas: { action: '探索我的选题', title: '你的下一个研究问题', label: '感兴趣的研究方向', placeholder: '例如：多模态 Agent 的长期记忆，想找一个可做实验的切入点', format: '选题图谱' },
  review: { action: '生成我的综述', title: '换成你的综述主题', label: '综述主题与范围', placeholder: '例如：梳理近三年 RAG 评测方法，重点比较事实性与检索质量', format: '综述框架' },
  'peer-review': { action: '评审我的论文', title: '看看你的论文还能怎样改进', label: '论文摘要、链接或待评审内容', placeholder: '粘贴论文摘要、链接，或需要重点检查的段落…', format: '评审批注' },
  slides: { action: '制作我的 PPT', title: '下一份汇报，讲你的研究', label: '汇报主题、论文链接或材料', placeholder: '例如：围绕我的 RAG 实验进展，准备一份 15 分钟的组会汇报', format: '6 页汇报' },
};

const palette = {
  blue: { bg: '#edf2fa', ink: '#385c95', soft: '#dbe7fa', line: '#aac0df' },
  sage: { bg: '#edf3f0', ink: '#3d6b62', soft: '#d8e9e1', line: '#acc9bd' },
  amber: { bg: '#f7f2e9', ink: '#927243', soft: '#ede0c7', line: '#d5bf99' },
};

/** The same artifact cover is used in the card and the existing file viewer. */
export function CaseArtwork({ item, page = 0, decorative = false }: { item: AgentCase; page?: number; decorative?: boolean }) {
  const meta = visualCopy[item.id];
  const color = palette[meta.tint as keyof typeof palette];
  const isGraph = item.id === 'slides-graph';
  const titles = meta.english.split('\n');
  const svgProps = { viewBox: '0 0 600 360', role: decorative ? undefined : 'img', 'aria-hidden': decorative || undefined, 'aria-label': decorative ? undefined : `${item.title}成果预览${page ? `，第 ${page + 1} 页` : ''}` } as const;
  return <svg {...svgProps} className={`case-artwork case-artwork--${item.task}`}>
    <rect width="600" height="360" fill={color.bg}/>
    {item.task === 'ideas' ? <>
      <image href={inspirationImage} width="600" height="400" opacity=".23"/>
      <path className="case-art-links" d="M300 180C260 100 190 95 130 98M300 180C375 110 440 100 490 100M300 180C310 250 265 276 205 282" fill="none" stroke={color.line} strokeWidth="2"/>
      <g className="case-art-back"><rect x="65" y="67" width="156" height="66" rx="12" fill="white"/><circle cx="89" cy="91" r="5" fill={color.line}/><text x="105" y="99" fill={color.ink} fontSize="18">{meta.labels[0]}</text><path d="M86 115h88" stroke={color.soft} strokeWidth="4" strokeLinecap="round"/></g>
      <g className="case-art-back"><rect x="390" y="69" width="156" height="66" rx="12" fill="white"/><circle cx="413" cy="92" r="5" fill={color.line}/><text x="430" y="100" fill={color.ink} fontSize="18">{meta.labels[1]}</text><path d="M413 116h88" stroke={color.soft} strokeWidth="4" strokeLinecap="round"/></g>
      <g className="case-art-front"><rect x="186" y="146" width="229" height="90" rx="15" fill={color.ink}/><text x="300" y="178" textAnchor="middle" fill="#fff" opacity=".65" fontSize="11" letterSpacing="2">RESEARCH QUESTION</text><text x="300" y="210" textAnchor="middle" fill="white" fontSize="23" fontWeight="600">{item.title.replace(/选题$/, '').replace('研究', '')}</text></g>
      <g className="case-art-note"><rect x="126" y="263" width="175" height="52" rx="10" fill="white"/><text x="151" y="296" fill={color.ink} fontSize="18">↗ {meta.labels[2]}</text></g>
      <text x="28" y="332" fontSize="10" fill={color.ink} opacity=".6" letterSpacing="2">3 DIRECTIONS · ONE NEXT STEP</text>
    </> : item.task === 'review' ? <>
      <image href={literatureImage} x="240" width="360" height="360" opacity=".24" preserveAspectRatio="xMidYMid slice"/>
      <g className="case-art-back" transform="rotate(-9 190 200)"><rect x="48" y="66" width="222" height="276" rx="5" fill="#fff" stroke={color.soft}/><text x="73" y="101" fill={color.ink} fontSize="11" letterSpacing="1">LITERATURE REVIEW</text><path d="M73 124h149M73 136h107" stroke={color.line} strokeWidth="5"/>{[0,1,2,3,4].map(n=><path key={n} d={`M73 ${168+n*18}h144`} stroke="#e7ebef" strokeWidth="4"/>)}<rect x="73" y="274" width="144" height="37" fill={color.bg}/></g>
      <g className="case-art-front" transform="rotate(5 380 190)"><rect x="234" y="36" width="285" height="282" rx="7" fill="white" stroke={color.soft}/><rect x="257" y="58" width="37" height="6" rx="3" fill={color.ink}/><text x="257" y="97" fill="#344253" fontSize="22" fontWeight="600">方法对照与研究框架</text><text x="257" y="120" fill={color.ink} fontSize="10" letterSpacing="1">{meta.english}</text>{meta.labels.map((label,i)=><g key={label}><rect x="257" y={144+i*46} width="237" height="36" rx="4" fill={i===1?color.bg:'#f6f8fa'}/><text x="270" y={167+i*46} fill="#637083" fontSize="13">{label}</text><circle cx="434" cy={161+i*46} r="5" fill={color.line}/><path d={`M453 ${161+i*46}h23`} stroke={color.soft} strokeWidth="5" strokeLinecap="round"/></g>)}</g>
      <g className="case-art-note"><rect x="345" y="282" width="210" height="43" rx="8" fill={color.ink}/><text x="364" y="309" fill="white" fontSize="14">问题 → 方法 → 研究空白</text></g>
    </> : item.task === 'peer-review' ? <>
      <g className="case-art-back" transform="rotate(-4 240 190)"><rect x="77" y="33" width="310" height="328" rx="6" fill="white" stroke={color.soft}/><text x="103" y="70" fill={color.ink} fontSize="10" letterSpacing="1.4">{meta.english}</text><text x="103" y="103" fill="#344253" fontSize="22" fontWeight="600">Research manuscript</text><text x="103" y="132" fill="#8c97a3" fontSize="12">Abstract & methodology</text>{[0,1,2,3,4,5,6,7].map(n=><path key={n} d={`M103 ${158+n*22}h${n%3===1?193:253}`} stroke="#e8ebef" strokeWidth="5"/>)}<path d="M104 180h194" stroke="#e5be70" strokeWidth="15" opacity=".4"/><path d="M104 246h225" stroke={color.line} strokeWidth="15" opacity=".5"/></g>
      <g className="case-art-front"><path d="M327 176h42v-26h32M327 241h43v35h31" fill="none" stroke={color.line} strokeWidth="1.5"/>{meta.labels.slice(0,2).map((label,i)=><g key={label}><rect x="370" y={115+i*111} width="188" height="88" rx="10" fill="white" stroke={color.line}/><circle cx="393" cy={139+i*111} r="10" fill={color.soft}/><text x="393" y={144+i*111} textAnchor="middle" fill={color.ink} fontSize="12">{i+1}</text><text x="413" y={145+i*111} fill={color.ink} fontSize="16">{label}</text><path d={`M390 ${168+i*111}h145M390 ${181+i*111}h99`} stroke="#e6eaf0" strokeWidth="4"/></g>)}</g>
    </> : <>
      <rect x="0" y="0" width="600" height="360" fill={page ? '#fff' : color.bg}/>
      <text x="35" y="39" fontSize="10" letterSpacing="2" fill={color.ink}>WISPAPER / RESEARCH SEMINAR</text>
      <path d="M35 57h530" stroke={color.line} strokeWidth="1"/>
      {page === 0 ? <>{titles.map((line,i)=><text key={line} x="35" y={137+i*43} fill="#2c3c50" fontSize={isGraph?42:35} fontWeight="600" letterSpacing="-1.4">{line}</text>)}<text x="36" y="243" fill={color.ink} fontSize="14">{item.topic}</text></> : <><text x="35" y="102" fill="#2c3c50" fontSize="24" fontWeight="600">{item.slides?.[page]?.title}</text>{(item.slides?.[page]?.points || []).slice(0,3).map((point,i)=><g key={point}><circle cx="40" cy={151+i*48} r="3" fill={color.ink}/><text x="53" y={156+i*48} fill="#5d6c7d" fontSize="13">{point.length>22?point.slice(0,22)+'…':point}</text></g>)}</>}
      <g className="case-art-diagram" transform={page?'translate(26 0)':''}>
        {isGraph ? <><g stroke={color.line} strokeWidth="2">{[[400,112,488,160],[400,112,374,207],[488,160,374,207],[488,160,508,249],[374,207,438,277],[438,277,508,249],[488,160,438,277]].map(([x1,y1,x2,y2],i)=><line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>)}</g>{[[400,112],[488,160],[374,207],[508,249],[438,277]].map(([cx,cy],i)=><g key={i}><circle cx={cx} cy={cy} r={i===1?28:19} fill={i===1?color.ink:color.soft}/><circle cx={cx} cy={cy} r="5" fill={i===1?'#fff':color.ink}/></g>)}</> : <>{meta.labels.map((label,i)=><g key={label}>{i>0&&<path d={`M449 ${100+(i-1)*70}v26m-4-5 4 5 4-5`} fill="none" stroke={color.line} strokeWidth="2"/>}<rect x={365+i*7} y={64+i*70} width="170" height="46" rx="8" fill={i===1?color.ink:color.soft}/><text x={450+i*7} y={93+i*70} textAnchor="middle" fill={i===1?'white':color.ink} fontSize="15">{label}</text></g>)}<path d="M354 220h-14V88h14" stroke={color.line} fill="none" strokeWidth="2"/></>}
      </g>
      <path d="M35 312h530" stroke={color.line} strokeWidth="1"/><text x="35" y="337" fill={color.ink} fontSize="10">组会汇报 · 案例预览</text><text x="563" y="337" textAnchor="end" fill={color.ink} fontSize="11">{String(page+1).padStart(2,'0')} / 06</text>
    </>}
  </svg>;
}

export function AgentCaseCard({ item, index, onOpen }: { item: AgentCase; index: number; onOpen: () => void }) {
  const meta = visualCopy[item.id];
  return <button className={`wh-visual-case is-${meta.tint}`} style={{ '--case-order': index } as React.CSSProperties} aria-label={`体验案例：${item.title}`} onClick={onOpen}>
    <span className="wh-case-visual">
      <span className="wh-case-art"><CaseArtwork item={item} decorative /></span>
      {item.task === 'slides' && <span className="wh-case-art wh-case-art-next"><CaseArtwork item={item} page={1} decorative /></span>}
      <span className="wh-case-preview-action">查看成果<ArrowUpRight size={14}/></span>
    </span>
    <span className="wh-case-caption"><span><strong>{meta.title}</strong><small>{ownCaseTaskCopy[item.task].format}</small></span><span className="wh-case-open"><ArrowUpRight size={18}/></span></span>
  </button>;
}
