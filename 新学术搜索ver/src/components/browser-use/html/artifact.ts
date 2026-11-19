import sampleHtml from './model-evaluation.html?raw';

export interface HtmlArtifact {
  name: string;
  html: string;
}

export const htmlExamplePrompt = '生成一份交互式 HTML 实验报告，对比模型在不同训练轮次的准确率和 F1 分数。';

export function makeHtmlArtifact(task: string, skill?: string): HtmlArtifact | undefined {
  const fenced = task.match(/```html?\s*\n([\s\S]*?)```/i);
  const source = fenced?.[1] || (/^\s*<(?:!doctype\s+html|html\b)/i.test(task) ? task : undefined);
  if (source) {
    const title = source.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1].trim();
    const name = (title || '交互报告').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').slice(0, 80);
    return { name: name + '.html', html: source };
  }
  if (skill === 'HTML 交互报告' || /\bhtml\b|交互(?:式)?(?:实验)?(?:报告|图表)|可视化网页/i.test(task)) {
    return { name: '模型性能对比.html', html: sampleHtml };
  }
}
