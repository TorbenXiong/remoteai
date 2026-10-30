import { Check, Copy } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import './mermaidDiagram.css';

const COPY_FEEDBACK_MS = 2000;

function configureMermaid(mermaid: typeof import('mermaid').default) {
  const dark = document.documentElement.dataset.theme === 'dark';
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
      primaryColor: dark ? '#25352e' : '#eff7f3',
      primaryTextColor: dark ? '#edf5f0' : '#17251f',
      primaryBorderColor: dark ? '#55b99b' : '#328575',
      lineColor: dark ? '#a4b6ad' : '#718079',
      secondaryColor: dark ? '#2c3932' : '#f5f8f6',
      tertiaryColor: dark ? '#1b211e' : '#ffffff',
      edgeLabelBackground: dark ? '#1b211e' : '#ffffff',
    },
    flowchart: { htmlLabels: false, useMaxWidth: false, curve: 'basis' },
  });
}

async function renderMermaid(source: string, id: string) {
  const { default: mermaid } = await import('mermaid');
  configureMermaid(mermaid);
  return mermaid.render(id, source);
}

export function MermaidDiagram({ source, previewLabel, sourceLabel, copyLabel }: {
  source: string; previewLabel: string; sourceLabel: string; copyLabel: string;
}) {
  const generatedId = useId().replace(/:/g, '');
  const [svg, setSvg] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setSvg('');
    setRenderFailed(false);
    void renderMermaid(source, `mermaid-${generatedId}`).then(result => {
      if (active) setSvg(result.svg);
    }).catch(() => {
      if (active) setRenderFailed(true);
    });
    return () => { active = false; };
  }, [generatedId, source]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
    } catch {
      // The source view remains available for manual copying.
    }
  };

  const diagramVisible = !showSource && !renderFailed && Boolean(svg);
  return <section className="chat-mermaid-diagram">
    <header className="chat-mermaid-toolbar">
      <div className="chat-mermaid-modes" role="group" aria-label={previewLabel}>
        <button type="button" aria-pressed={diagramVisible} onClick={() => setShowSource(false)}>{previewLabel}</button>
        <button type="button" aria-pressed={!diagramVisible} onClick={() => setShowSource(true)}>{sourceLabel}</button>
      </div>
      <button type="button" className="chat-mermaid-copy" aria-label={copied ? sourceLabel : copyLabel}
        onClick={() => void copy()}>
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </header>
    {diagramVisible ? <div className="chat-mermaid-canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      : <pre className="chat-mermaid-source"><code>{source}</code></pre>}
  </section>;
}
