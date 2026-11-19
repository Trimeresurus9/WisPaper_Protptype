import React from 'react';
import type { HtmlArtifact } from './artifact';

export function HtmlFrame({ file }: { file: HtmlArtifact }) {
  return <iframe className="ha-frame" title={file.name} sandbox="allow-scripts" referrerPolicy="no-referrer" srcDoc={file.html} />;
}
