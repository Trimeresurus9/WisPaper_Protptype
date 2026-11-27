import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { DemoPointer } from '../figure-to-pptx/DemoPointer';
import { PptxDemoWindow, pptxDemoSlide } from '../figure-to-pptx/PptxDemoWindow';
import { PipelineFigure, PipelineSelection } from './PipelineFigure';

export const imageToPptxDemoFrames = 180;
export const imageToPptxPosterFrame = 159;

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const smooth = { ...clamp, easing: Easing.bezier(.22, 1, .36, 1) };
const source = { left: 74, top: 143, width: pptxDemoSlide.width, height: pptxDemoSlide.height };
const paper: React.CSSProperties = {
  position: 'absolute', width: 326, height: 234, borderRadius: 14,
  border: '1px solid rgba(201,216,229,.9)', background: 'rgba(255,255,255,.96)',
};

// Keep the original and the slide on identical integer-pixel, 16:9 drawing surfaces.
const artwork: React.CSSProperties = { position: 'absolute', left: 6, top: 4, width: 272, height: 153, transform: 'translateZ(0)' };

function ImageCard({ focus, imageOpacity }: { focus: number; imageOpacity: number }) {
  return (
    <>
      <div style={{ ...paper, left: 64, top: 85, rotate: '2.2deg', background: '#f5f8fb', boxShadow: '0 12px 34px rgba(61,92,126,.06)' }} />
      <div style={{ ...paper, left: 53, top: 92, boxShadow: '0 22px 54px rgba(61,92,126,.11)' }}>
        <span style={{ position: 'absolute', top: 15, left: 0, width: 4, height: 22, background: '#85a6c2', borderRadius: '0 3px 3px 0' }} />
        <ImageIcon size={20} strokeWidth={1.7} color="#7f9eb6" style={{ position: 'absolute', left: 19, top: 16 }} />
        <span style={{ position: 'absolute', left: 48, top: 19, width: 70, height: 5, borderRadius: 4, background: '#d8e1e9' }} />
        <span style={{ position: 'absolute', left: 48, top: 29, width: 44, height: 4, borderRadius: 4, background: '#edf1f5' }} />
      </div>
      <div style={{ position: 'absolute', ...source, outline: '1px solid #e0e6eb', background: 'white' }}>
        <div style={{ ...artwork, opacity: imageOpacity }}><PipelineFigure /></div>
      </div>
      <div style={{ position: 'absolute', left: source.left - 4, top: source.top - 4, width: source.width + 8, height: source.height + 8, border: '2px solid #5f8fbd', borderRadius: 6, boxShadow: '0 0 0 4px rgba(95,143,189,.07)', opacity: focus }} />
    </>
  );
}

export function ImageToPptxDemo() {
  const frame = useCurrentFrame();
  const focus = interpolate(frame, [10, 23, 46, 54], [0, 1, 1, 0], smooth);
  const transfer = interpolate(frame, [48, 100], [0, 1], smooth);
  const lift = Math.sin(Math.PI * transfer);
  const editor = interpolate(frame, [35, 98, 168, 179], [.68, 1, 1, .68], smooth);
  const result = interpolate(frame, [95, 101, 166, 177], [0, 1, 1, 0], smooth);
  const selected = interpolate(frame, [118, 127, 146, 153], [0, 1, 1, 0], smooth);
  const imageOpacity = interpolate(frame, [46, 56, 94, 108], [1, .24, .24, 1], smooth);
  const pointerX = interpolate(frame, [4, 20, 44, 95, 119, 146, 157], [68, 100, 275, 726, 728, 728, 822], smooth);
  const pointerY = interpolate(frame, [4, 20, 44, 95, 119, 146, 157], [105, 157, 239, 254, 205, 205, 304], smooth);

  return (
    <AbsoluteFill aria-hidden="true" style={{ overflow: 'hidden', background: '#eef6fd' }}>
      <ImageCard focus={focus} imageOpacity={imageOpacity} />
      <PptxDemoWindow opacity={editor} thumbnail={<div style={{ height: '100%', opacity: result }}><PipelineFigure /></div>}>
        <div style={{ ...artwork, opacity: result }}><PipelineFigure /></div>
        <div style={{ ...artwork, willChange: 'opacity', opacity: selected }}><PipelineSelection /></div>
      </PptxDemoWindow>

      {frame >= 48 && frame < 101 && (
        <div style={{
          position: 'absolute', ...source, pointerEvents: 'none',
          transform: `translate(${(pptxDemoSlide.left - source.left) * transfer}px, ${(pptxDemoSlide.top - source.top) * transfer - 31 * lift}px) rotate(${-2.2 * lift}deg) scale(${1 + .035 * lift})`,
          filter: `drop-shadow(0 ${8 * lift}px ${9 * lift}px rgba(61,92,126,${.18 * lift}))`,
        }}>
          <div style={artwork}><PipelineFigure transparent /></div>
        </div>
      )}
      <DemoPointer left={pointerX} top={pointerY} opacity={interpolate(frame, [2, 8, 147, 158], [0, 1, 1, 0], clamp)} />
    </AbsoluteFill>
  );
}
