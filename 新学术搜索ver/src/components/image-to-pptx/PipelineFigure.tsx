import React from 'react';
import { pipelineArtwork, type PipelineNode } from './pipelineArtwork';

interface PipelineFigureProps {
  offsetY?: number;
  selection?: boolean;
  transparent?: boolean;
}

const nodes = pipelineArtwork.filter((item): item is PipelineNode => item.kind === 'node');
const selectionColor = '#5f8fbd';

function SelectionHandles({ w, h }: { w: number; h: number }) {
  const handles = [[-4, -4], [w + 4, -4], [-4, h + 4], [w + 4, h + 4]];
  return (
    <g>
      <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={8} fill="none" stroke={selectionColor} strokeWidth={5} />
      {handles.map(([x, y]) => <rect key={`${x},${y}`} x={x - 10} y={y - 10} width={20} height={20} rx={4} fill={selectionColor} stroke="white" strokeWidth={4} />)}
    </g>
  );
}

export function PipelineSelection() {
  const feature = nodes.find(node => node.id === 'feature')!;
  return (
    <svg aria-hidden="true" width="100%" height="100%" viewBox="0 0 960 540" style={{ display: 'block' }}>
      <g transform={`translate(${feature.x} ${feature.y})`}>
        <SelectionHandles w={feature.w} h={feature.h} />
      </g>
    </svg>
  );
}

export function PipelineFigure({ offsetY = 0, selection = false, transparent = false }: PipelineFigureProps) {
  const nodeY = (node: PipelineNode) => node.y + (node.id === 'feature' ? offsetY : 0);
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 960 540"
      role="img" aria-label="从波形提取频谱，再输出分类概率的流程图" style={{ display: 'block', background: transparent ? 'transparent' : 'white' }}>
      {pipelineArtwork.map(item => {
        if (item.kind === 'connector') {
          const from = nodes.find(node => node.id === item.from)!;
          const to = nodes.find(node => node.id === item.to)!;
          const x1 = from.x + from.w;
          const y1 = nodeY(from) + from.h / 2;
          const dx = to.x - x1;
          const dy = nodeY(to) + to.h / 2 - y1;
          const length = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          return (
            <g key={item.id} transform={`translate(${x1} ${y1}) rotate(${angle})`} fill={item.color}>
              <line x2={length - 13} stroke={item.color} strokeWidth={item.sw} />
              <path transform={`translate(${length} 0)`} d="M0 0 -18 -9 -18 9 Z" />
            </g>
          );
        }
        return (
          <g key={item.id} transform={`translate(${item.x} ${nodeY(item)})`}>
            <rect width={item.w} height={item.h} rx={item.radius} fill={item.fill} stroke={item.stroke} strokeWidth={item.sw} />
            {item.glyph.map((shape, index) => shape.kind === 'rect'
              ? <rect key={index} x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={shape.radius} fill={shape.fill} />
              : <polyline key={index} points={shape.points.map(point => point.join(',')).join(' ')} stroke={shape.color} strokeWidth={shape.sw} strokeLinecap="round" strokeLinejoin="round" fill="none" />)}
            {item.id === 'feature' && selection && <SelectionHandles w={item.w} h={item.h} />}
          </g>
        );
      })}
    </svg>
  );
}
