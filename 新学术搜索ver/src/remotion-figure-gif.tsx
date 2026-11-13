import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { FigureExplodeDemo } from './components/figure-to-pptx/FigureExplodeDemo';
import { FigureToExcelDemo } from './components/figure-to-pptx/FigureToExcelDemo';

function FigureGifCanvas() {
  return (
    <div
      style={{
        width: 525,
        height: 480,
        overflow: 'hidden',
        background: '#eef6fd',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 117.5,
          width: 900,
          height: 420,
          transform: 'scale(0.5833333333)',
          transformOrigin: 'top left',
        }}
      >
        <FigureExplodeDemo />
      </div>
    </div>
  );
}

function FigureExcelGifCanvas() {
  return (
    <div
      style={{
        width: 900,
        height: 420,
        overflow: 'hidden',
        background: '#eef6fd',
        position: 'relative',
      }}
    >
      <FigureToExcelDemo />
    </div>
  );
}

function FigureGifRoot() {
  return (
    <>
      <Composition
        id="FigureToPptxGif"
        component={FigureGifCanvas}
        durationInFrames={180}
        fps={30}
        width={525}
        height={480}
      />
      <Composition
        id="FigureToExcelGif"
        component={FigureExcelGifCanvas}
        durationInFrames={180}
        fps={30}
        width={900}
        height={420}
      />
    </>
  );
}

registerRoot(FigureGifRoot);
