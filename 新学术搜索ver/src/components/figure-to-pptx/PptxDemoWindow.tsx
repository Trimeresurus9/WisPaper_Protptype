import React from 'react';

const windowFrame = { left: 500, top: 70, width: 370, height: 280 };
const slideFrame = { left: 68, top: 50, width: 286, height: 164 };
const border = 1;

// Composition coordinates inside both the window border and the slide border.
export const pptxDemoSlide = {
  left: windowFrame.left + border + slideFrame.left + border,
  top: windowFrame.top + border + slideFrame.top + border,
  width: slideFrame.width - 2 * border,
  height: slideFrame.height - 2 * border,
};

interface PptxDemoWindowProps {
  opacity: number;
  thumbnail?: React.ReactNode;
  children?: React.ReactNode;
}

export function PptxDemoWindow({ opacity, thumbnail, children }: PptxDemoWindowProps) {
  return (
    <div style={{
      position: 'absolute', ...windowFrame, borderRadius: 18,
      background: 'rgba(249,250,252,0.9)', border: '1px solid rgba(201,216,229,0.88)',
      boxShadow: '0 22px 54px rgba(61,92,126,0.09)', opacity,
    }}>
      <div style={{ position: 'absolute', inset: '0 0 auto', height: 34, borderBottom: '1px solid #e8edf1', background: 'rgba(255,255,255,0.86)', borderRadius: '18px 18px 0 0' }}>
        <span style={{ position: 'absolute', left: 14, top: 10, width: 14, height: 14, borderRadius: 4, background: '#d9735d' }} />
        <div style={{ position: 'absolute', left: 40, top: 14, display: 'flex', gap: 8 }}>
          {[18, 24, 16, 22].map((width, index) => <span key={index} style={{ width, height: 5, borderRadius: 99, background: index === 0 ? '#d8e0e7' : '#e8edf1' }} />)}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: 34, bottom: 0, width: 54, borderRight: '1px solid #e6ebef', background: 'rgba(244,246,248,0.86)', borderRadius: '0 0 0 18px' }}>
        {thumbnail != null ? (
          <div style={{ position: 'absolute', left: 8, top: 16, width: 38, height: 23, overflow: 'hidden', borderRadius: 4, background: 'white', border: '1.5px solid #d9735d', boxShadow: '0 2px 6px rgba(61,92,126,0.05)' }}>
            {thumbnail}
          </div>
        ) : [50, 112, 174].map((top, index) => (
          <span key={top} style={{ position: 'absolute', left: 10, top: top - 34, width: 34, height: 22, borderRadius: 4, background: 'white', border: index === 0 ? '1.5px solid #d9735d' : '1px solid #dfe6eb', boxShadow: '0 2px 6px rgba(61,92,126,0.05)' }}>
            <i style={{ position: 'absolute', left: 5, top: 5, width: 19, height: 3, borderRadius: 99, background: '#e5ebef' }} />
            <i style={{ position: 'absolute', left: 5, top: 11, width: 12, height: 3, borderRadius: 99, background: '#edf1f4' }} />
          </span>
        ))}
      </div>
      <div style={{ position: 'absolute', ...slideFrame, overflow: 'hidden', borderRadius: 5, background: 'white', border: '1px solid #e0e6eb', boxShadow: '0 8px 22px rgba(61,92,126,0.08)' }}>
        {children}
      </div>
      <div style={{ position: 'absolute', left: 68, right: 16, bottom: 17, height: 6, borderRadius: 99, background: '#eef1f4' }}>
        <span style={{ display: 'block', width: '46%', height: '100%', borderRadius: 99, background: '#d7dee5' }} />
      </div>
    </div>
  );
}
