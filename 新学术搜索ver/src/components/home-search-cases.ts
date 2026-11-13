import type { Paper } from '../types';
import ragPreview from '../assets/search-cases/rag-search.png';
import visionPreview from '../assets/search-cases/vision-search.png';
import graphPreview from '../assets/search-cases/graph-search.png';

export interface HomeSearchCase {
  id: string;
  title: string;
  caption: string;
  keywords: string[];
  description: string;
  prompt: string;
  image: string;
  papers: Paper[];
}

// Bibliographic titles and first-submission years checked against the linked arXiv records.
// Relevance is an authored example for this prompt, not a live retrieval score.
function examplePaper(arxivId: string, title: string, authors: string[], publishedDate: string, relevance: 'Perfect' | 'Partial', abstract: string, relevanceReason: string): Paper {
  return { id: `search-example-${arxivId}`, title, authors, publishedDate, year: Number(publishedDate.slice(0,4)), venue: 'arXiv', abstract, relevance, relevanceReason, isSearchExample: true, citations: 0, categories: ['Machine Learning'], arxivId, pdfUrl: `https://arxiv.org/pdf/${arxivId}`, isOpenAccess: true, type: 'paper' };
}

export const homeSearchCases: HomeSearchCase[] = [
  {
    id: 'rag', title: '检索增强生成', caption: '查找 RAG 的生成方法与检索基础', keywords: ['RAG', '知识密集型任务', '信息检索'],
    description: '从生成方法出发，找到直接相关的论文和必要的检索基础。',
    prompt: '查找将外部文档检索与文本生成结合的代表性论文，重点关注知识密集型问答。区分直接研究生成方法的论文，以及侧重检索或预训练的相关工作。',
    image: ragPreview,
    papers: [
      examplePaper('2005.11401', 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', ['Patrick Lewis', 'Ethan Perez', 'Aleksandra Piktus'], '2020-05-22', 'Perfect', '将外部文档检索与语言生成结合，用于知识密集型自然语言处理任务。', '直接研究检索与生成的结合，匹配本次搜索的核心问题。'),
      examplePaper('2305.06983', 'Active Retrieval Augmented Generation', ['Zhengbao Jiang', 'Frank F. Xu', 'Luyu Gao'], '2023-05-11', 'Perfect', '在文本生成过程中主动检索所需信息，为生成内容补充外部依据。', '直接讨论生成过程中的检索策略，符合生成方法的搜索范围。'),
      examplePaper('2002.08909', 'REALM: Retrieval-Augmented Language Model Pre-Training', ['Kelvin Guu', 'Kenton Lee', 'Zora Tung'], '2020-02-10', 'Partial', '在语言模型预训练中引入知识检索，支持知识密集型任务。', '与检索增强相关，但主要聚焦预训练，作为背景工作纳入。'),
      examplePaper('2004.04906', 'Dense Passage Retrieval for Open-Domain Question Answering', ['Vladimir Karpukhin', 'Barlas Oğuz', 'Sewon Min'], '2020-04-10', 'Partial', '通过稠密向量表示检索相关段落，为开放域问答提供候选材料。', '提供检索基础，未直接研究检索与文本生成的联合方法。'),
    ],
  },
  {
    id: 'vision', title: '视觉语言模型', caption: '寻找能看图、理解并生成回答的模型', keywords: ['多模态', '视觉问答', '生成式模型'],
    description: '沿着图像理解与语言生成的结合，梳理多模态模型的代表性工作。',
    prompt: '寻找面向视觉问答、能够根据图像生成文本回答的视觉语言模型论文。优先关注生成式模型和视觉指令微调，同时保留图文表征学习作为背景参考。',
    image: visionPreview,
    papers: [
      examplePaper('2204.14198', 'Flamingo: a Visual Language Model for Few-Shot Learning', ['Jean-Baptiste Alayrac', 'Jeff Donahue', 'Pauline Luc'], '2022-04-29', 'Perfect', '连接视觉输入与语言模型，研究少样本条件下的视觉语言任务。', '生成式视觉语言模型，覆盖本次关注的视觉问答方向。'),
      examplePaper('2301.12597', 'BLIP-2: Bootstrapping Language-Image Pre-training with Frozen Image Encoders and Large Language Models', ['Junnan Li', 'Dongxu Li', 'Silvio Savarese', 'Steven Hoi'], '2023-01-30', 'Perfect', '连接冻结的图像编码器与大语言模型，建立视觉和语言之间的桥接。', '直接研究图像到语言模型的连接方式，与生成式视觉问答匹配。'),
      examplePaper('2304.08485', 'Visual Instruction Tuning', ['Haotian Liu', 'Chunyuan Li', 'Qingyang Wu', 'Yong Jae Lee'], '2023-04-17', 'Perfect', '通过视觉指令微调支持多模态对话与指令跟随。', '直接对应视觉指令微调与文本回答生成。'),
      examplePaper('2103.00020', 'Learning Transferable Visual Models From Natural Language Supervision', ['Alec Radford', 'Jong Wook Kim', 'Chris Hallacy'], '2021-02-26', 'Partial', '从自然语言监督中学习图像与文本的对齐表示。', '侧重图文表征学习，并非直接生成回答的模型，作为背景参考。'),
    ],
  },
  {
    id: 'graph', title: '图神经网络', caption: '比较节点分类中的卷积、聚合与注意力', keywords: ['GNN', '节点分类', '邻域聚合'],
    description: '围绕节点分类，对比图卷积、邻域聚合和图注意力的不同思路。',
    prompt: '查找用于节点分类的代表性图神经网络方法，比较图卷积、邻域聚合与注意力机制，并补充关于模型表达能力的理论工作作为参考。',
    image: graphPreview,
    papers: [
      examplePaper('1609.02907', 'Semi-Supervised Classification with Graph Convolutional Networks', ['Thomas N. Kipf', 'Max Welling'], '2016-09-09', 'Perfect', '将图卷积用于半监督节点分类，结合图结构与节点特征。', '直接对应节点分类与图卷积方法。'),
      examplePaper('1706.02216', 'Inductive Representation Learning on Large Graphs', ['William L. Hamilton', 'Rex Ying', 'Jure Leskovec'], '2017-06-07', 'Perfect', '通过采样和聚合邻域特征，学习可用于新节点的表示。', '直接对应邻域聚合与归纳式节点表征。'),
      examplePaper('1710.10903', 'Graph Attention Networks', ['Petar Veličković', 'Guillem Cucurull', 'Arantxa Casanova'], '2017-10-30', 'Perfect', '使用注意力为邻居分配权重，从图结构数据中学习节点表示。', '直接对应本次搜索中的图注意力机制。'),
      examplePaper('1810.00826', 'How Powerful are Graph Neural Networks?', ['Keyulu Xu', 'Weihua Hu', 'Jure Leskovec', 'Stefanie Jegelka'], '2018-10-01', 'Partial', '分析图神经网络的表达能力及其理论局限。', '偏重表达能力理论，作为方法比较的补充背景。'),
    ],
  },
];
