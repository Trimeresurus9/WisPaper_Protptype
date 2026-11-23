const allModels = 'Fast / Lite / Pro';

const comparisonOrder: Record<string, number> = {
  '可用模型': 0, '快速搜索': 1, '深度搜索': 2, 'Ask AI': 3, '优先体验新功能': 100,
};
export const comparisonRowOrder = (label: string) => comparisonOrder[label] ?? 4;

export const modelAccess = {
  label: { zh: '可用模型', en: 'Available models' },
  free: 'Fast', plus: 'Fast / Lite', pro: allModels, maxX2: allModels, maxX5: allModels,
};

const everyone = { free: true, plus: true, pro: true, maxX2: true, maxX5: true };
const paid = { ...everyone, free: false };
export type MembershipTier = keyof typeof everyone;
type ResearchBenefit = Record<MembershipTier, boolean> & {
  label: { zh: string; en: string };
  exclusive?: boolean;
  supplementary?: boolean;
  limits?: Partial<Record<MembershipTier, number>>;
};

export const researchBenefits: ResearchBenefit[] = [
  { label: { zh: '深度搜索', en: 'Deep search' }, ...everyone },
  { label: { zh: '灵感发现', en: 'Idea discovery' }, ...paid },
  { label: { zh: '文献综述', en: 'Literature review' }, ...everyone, limits: { free: 10, plus: 30, pro: 100 } },
  { label: { zh: '论文评审', en: 'Peer review' }, ...paid },
  { label: { zh: 'PPT 创作', en: 'Slide creation' }, ...everyone },
  { label: { zh: '论文复现', en: 'Paper reproduction' }, exclusive: true, ...paid, plus: false },
  { label: { zh: '优先体验新功能', en: 'Early access to new features' }, supplementary: true, ...paid, plus: false, pro: false },
];

const comparisonValue = (feature: ResearchBenefit, plan: MembershipTier) => {
  const limit = feature.limits?.[plan];
  return limit ? { zh: `最多 ${limit} 篇`, en: `Up to ${limit} papers` } : feature[plan];
};

export const researchComparisonRows = researchBenefits.map(feature => ({
  label: feature.label,
  free: comparisonValue(feature, 'free'), plus: comparisonValue(feature, 'plus'),
  pro: comparisonValue(feature, 'pro'), maxX2: comparisonValue(feature, 'maxX2'), maxX5: comparisonValue(feature, 'maxX5'),
}));

export const commonToolComparisonRows = [
  { zh: '快速搜索', en: 'Quick search' },
  { zh: 'Ask AI', en: 'Ask AI' },
  { zh: '论文主图', en: 'Paper figure' },
  { zh: 'Idea 升华', en: 'Idea refinement' },
  { zh: 'LaTeX 写作', en: 'LaTeX writing' },
  { zh: '顺藤摸瓜', en: 'Citation exploration' },
  { zh: '引用核查', en: 'Citation check' },
  { zh: '国自然申请', en: 'NSFC proposal' },
  { zh: '论文图片格式转换', en: 'Paper image format conversion' },
].map(label => ({ label, ...everyone }));
