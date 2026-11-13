import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const { outputFiles } = await build({
  stdin: { contents: `export * from './src/components/home-task-config'; export * from './src/components/home-agent-cases'; export * from './src/components/home-search-cases';`, resolveDir: root },
  bundle: true, format: 'esm', platform: 'node', write: false,
  outdir: '/tmp/wispaper-home-case-test', loader: { '.png': 'file' },
});
const code = outputFiles.find(file => file.path.endsWith('.js')).text;
const { homeAgentCases, homeSearchCases, emptyHomeSession, readHomeSession, resolveHomeTask, buildHomeAgentPrompt, agentCaseMarkdown } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
let saved = null;
globalThis.sessionStorage = { getItem: () => saved };

test('explicit task wins over conflicting keywords; free text selects a task', () => {
  assert.equal(resolveHomeTask('RAG 文献综述', 'search'), 'search');
  for (const [query, task] of [['找图神经网络论文', 'search'], ['研究方向', 'ideas'], ['文献综述', 'review'], ['论文评审', 'peer-review'], ['组会 PPT', 'slides']]) {
    assert.equal(resolveHomeTask(query, null), task);
  }
});
test('older stored drafts keep query and answers and default to completed results', () => {
  saved = JSON.stringify({ version: 1, draft: '我的研究问题', query: 'RAG 评测', task: 'review', selected: 'review', answers: ['计算机科学', '准备开题报告'], signedIn: true, caseId: homeAgentCases[0].id });
  const session = readHomeSession();
  assert.equal(session.caseView, 'result');
  assert.equal(session.signedIn, true);
  assert.equal(session.draft, '我的研究问题');
  assert.deepEqual(session.ownDrafts, {});
  const prompt = buildHomeAgentPrompt(session);
  for (const content of ['RAG 评测', '计算机科学', '准备开题报告']) assert.ok(prompt.includes(content));
});
test('task drafts restore independently and invalid saved state recovers', () => {
  const state = { ...emptyHomeSession(), ownDrafts: { ideas: { query: '长期记忆', detail: '设计可行实验' }, slides: { query: 'Transformer', detail: '15–20 分钟' } } };
  saved = JSON.stringify(state);
  assert.deepEqual(readHomeSession().ownDrafts, state.ownDrafts);
  saved = '{invalid';
  assert.deepEqual(readHomeSession(), emptyHomeSession());
  saved = JSON.stringify({ version: 1, task: 'missing', caseId: 'missing', answers: [7, '计算机科学'], caseStep: -10 });
  assert.equal(readHomeSession().caseId, null);
  assert.equal(readHomeSession().task, 'search');
  assert.equal(readHomeSession().caseStep, 0);
  assert.deepEqual(readHomeSession().answers, ['计算机科学']);
});
test('four Agent tasks each offer three complete, downloadable cases', () => {
  assert.equal(homeAgentCases.length, 12);
  assert.equal(new Set(homeAgentCases.map(item => item.id)).size, 12);
  for (const task of ['ideas', 'review', 'peer-review', 'slides']) assert.equal(homeAgentCases.filter(item => item.task === task).length, 3);
  for (const item of homeAgentCases) {
    assert.ok(item.result.length >= 3);
    assert.equal(item.plan.length, 3);
    assert.ok(item.sources.length >= 3);
    assert.ok(agentCaseMarkdown(item).includes(item.resultTitle));
    if (item.task === 'slides') assert.equal(item.slides.length, 6);
  }
});
test('three distinct search previews carry their own papers and both relevance levels', () => {
  assert.equal(homeSearchCases.length, 3);
  assert.equal(new Set(homeSearchCases.map(item => item.prompt)).size, 3);
  assert.equal(new Set(homeSearchCases.map(item => item.image)).size, 3);
  for (const item of homeSearchCases) {
    assert.equal(item.papers.length, 4);
    assert.ok(item.keywords.length >= 3);
    assert.deepEqual([...new Set(item.papers.map(paper => paper.relevance))].sort(), ['Partial', 'Perfect']);
    for (const paper of item.papers) {
      assert.equal(paper.isSearchExample, true);
      assert.ok(paper.relevanceReason);
      assert.equal(paper.pdfUrl, `https://arxiv.org/pdf/${paper.arxivId}`);
    }
  }
});
