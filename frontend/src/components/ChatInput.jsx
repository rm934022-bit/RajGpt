import React, { useRef, useEffect } from 'react';
import { SendIcon, StopIcon } from './Icons';

export default function ChatInput({
  input,
  setInput,
  onSend,
  onStop,
  isGenerating,
  disabled = false
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 180) + 'px';
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && input.trim()) {
        onSend();
      }
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div style={{
      width: '100%',
      maxWidth: '740px',
      margin: '0 auto',
      padding: '0 16px 16px',
      position: 'relative'
    }}>
      <div style={{
        position: 'relative',
        backgroundColor: '#2f2f2f',
        borderRadius: '24px',
        border: '1px solid #3c3c3c',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '8px 10px 8px 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message RAJGPT..."
          rows={1}
          disabled={disabled}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#ececec',
            fontSize: '15px',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            maxHeight: '180px',
            paddingRight: '8px',
            paddingTop: '3px',
            paddingBottom: '3px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        />

        {isGenerating ? (
          <button
            onClick={onStop}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#ececec',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 100ms'
            }}
            title="Stop generating"
          >
            <StopIcon size={12} color="#171717" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={!canSend}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: canSend ? '#ececec' : '#38383e',
              border: 'none',
              cursor: canSend ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 100ms'
            }}
            title="Send message"
          >
            <SendIcon size={16} color={canSend ? '#171717' : '#6b6b75'} />
          </button>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        fontSize: '11px',
        color: '#71717a',
        marginTop: '8px'
      }}>
        RAJGPT can make mistakes. Verify important info.
      </div>
    </div>
  );
}
