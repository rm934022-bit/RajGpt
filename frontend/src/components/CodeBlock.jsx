import React, { useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import { CopyIcon, CheckIcon } from './Icons';

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const getHighlightedCode = () => {
    if (language && hljs.getLanguage(language)) {
      try {
        return hljs.highlight(value, { language }).value;
      } catch (err) {
        // Fallback
      }
    }
    return hljs.highlightAuto(value).value;
  };

  const displayLang = language || 'code';

  return (
    <div style={{
      margin: '14px 0',
      borderRadius: '8px',
      overflow: 'hidden',
      border: '1px solid #2e2f33',
      backgroundColor: '#111113'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 14px',
        backgroundColor: '#1e1f23',
        borderBottom: '1px solid #2a2b2f',
        fontSize: '12px',
        color: '#a1a1aa',
        fontFamily: 'ui-monospace, monospace'
      }}>
        <span style={{ textTransform: 'lowercase' }}>{displayLang}</span>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: copied ? '#10a37f' : '#a1a1aa',
            cursor: 'pointer',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '4px'
          }}
          title="Copy code to clipboard"
        >
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <div style={{ padding: '14px 16px', overflowX: 'auto' }}>
        <pre style={{ margin: 0, background: 'transparent', padding: 0 }}>
          <code
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              fontSize: '13.5px',
              lineHeight: 1.55,
              background: 'transparent',
              padding: 0,
              border: 'none'
            }}
            dangerouslySetInnerHTML={{ __html: getHighlightedCode() }}
          />
        </pre>
      </div>
    </div>
  );
}
