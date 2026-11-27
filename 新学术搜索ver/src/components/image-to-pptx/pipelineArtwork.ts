export type PipelineGlyph =
  | { kind: 'polyline'; points: [number, number][]; color: string; sw: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; radius: number; fill: string };

export type PipelineNode = {
  kind: 'node';
  id: 'input' | 'feature' | 'output';
  x: number;
  y: number;
  w: number;
  h: number;
  radius: number;
  fill: string;
  stroke: string;
  sw: number;
  glyph: PipelineGlyph[];
};

type PipelineConnector = {
  kind: 'connector';
  id: string;
  from: PipelineNode['id'];
  to: PipelineNode['id'];
  color: string;
  sw: number;
};

export type PipelineItem = PipelineNode | PipelineConnector;

// Child coordinates are local to the 200 × 160 node so each glyph travels with its card.
const wave: PipelineGlyph = {
  kind: 'polyline', color: '#477FA9', sw: 8,
  points: [[29, 81], [46, 81], [55, 68], [67, 99], [83, 39], [100, 121],
    [115, 60], [129, 94], [141, 76], [150, 81], [171, 81]],
};

const spectrum: PipelineGlyph[] = [20, 40, 79, 54, 32, 64, 29].map((h, i) => ({
  kind: 'rect', x: 44 + i * 17, y: 119 - h, w: 11, h, radius: 4.5, fill: '#548978',
}));

const probabilities: PipelineGlyph[] = [100, 65, 32].flatMap((w, i) => {
  const y = 48 + i * 26;
  return [
    { kind: 'rect', x: 42, y, w: 116, h: 13, radius: 6.5, fill: '#E7D6C8' },
    { kind: 'rect', x: 42, y, w, h: 13, radius: 6.5, fill: '#AE7957' },
  ];
});

export const pipelineArtwork: PipelineItem[] = [
  { kind: 'connector', id: 'input-to-feature', from: 'input', to: 'feature', color: '#8399A8', sw: 5 },
  { kind: 'connector', id: 'feature-to-output', from: 'feature', to: 'output', color: '#8399A8', sw: 5 },
  { kind: 'node', id: 'input', x: 80, y: 190, w: 200, h: 160, radius: 24, fill: '#EAF3FA', stroke: '#B0CADA', sw: 2, glyph: [wave] },
  { kind: 'node', id: 'feature', x: 380, y: 190, w: 200, h: 160, radius: 24, fill: '#EAF4EF', stroke: '#ACC9BA', sw: 2, glyph: spectrum },
  { kind: 'node', id: 'output', x: 680, y: 190, w: 200, h: 160, radius: 24, fill: '#F8EEE5', stroke: '#D8BEA9', sw: 2, glyph: probabilities },
];
