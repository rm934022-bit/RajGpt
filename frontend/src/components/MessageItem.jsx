import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from './CodeBlock';
import { CopyIcon, CheckIcon, OpenAIIcon } from './Icons';

export default function MessageItem({ message, isStreaming = false }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      padding: '10px 0'
    }}>
      <div style={{
        maxWidth: isUser ? '75%' : '100%',
        width: isUser ? 'auto' : '100%',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start'
      }}>
        {!isUser && (
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#10a37f',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
            fontSize: '13px',
            fontWeight: 700
          }}>
            R
          </div>
        )}

        <div style={{
          flex: 1,
          backgroundColor: isUser ? '#2f2f2f' : 'transparent',
          color: '#ececec',
          padding: isUser ? '10px 16px' : '2px 0',
          borderRadius: isUser ? '18px' : '0',
          fontSize: '15px',
          lineHeight: '1.65',
          wordBreak: 'break-word'
        }}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    if (!inline && (match || codeText.includes('\n'))) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : ''}
                          value={codeText}
                        />
                      );
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>

              {isStreaming && <span className="streaming-cursor" />}

              {message.content && !isStreaming && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '10px'
                }}>
                  <button
                    onClick={handleCopy}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'none',
                      border: 'none',
                      color: copied ? '#10a37f' : '#71717a',
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      transition: 'color 100ms'
                    }}
                    title="Copy response"
                  >
                    {copied ? <CheckIcon size={13} color="#10a37f" /> : <CopyIcon size={13} color="#71717a" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SkeletonMessage() {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      gap: '12px',
      padding: '12px 0',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        backgroundColor: '#10a37f',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '13px',
        fontWeight: 700
      }}>
        R
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div className="skeleton-box" style={{ width: '55%', height: '12px' }}></div>
        <div className="skeleton-box" style={{ width: '80%', height: '12px' }}></div>
        <div className="skeleton-box" style={{ width: '35%', height: '12px' }}></div>
      </div>
    </div>
  );
}
