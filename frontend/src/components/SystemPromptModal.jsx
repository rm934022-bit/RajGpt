import React, { useState, useEffect } from 'react';
import { CloseIcon, SlidersIcon } from './Icons';

export default function SystemPromptModal({
  isOpen,
  onClose,
  initialPrompt = '',
  onSave
}) {
  const [prompt, setPrompt] = useState(initialPrompt);

  useEffect(() => {
    setPrompt(initialPrompt || '');
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(prompt.trim());
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#212121',
        border: '1px solid #333333',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #2e2e2e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersIcon className="w-4 h-4 text-[#10a37f]" />
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#ececec' }}>Custom Instructions</h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: '4px' }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.5' }}>
            What would you like RAJGPT to know about you to provide better responses?
          </p>

          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. You are a senior engineer who writes concise, production-ready code. Always explain architectural trade-offs."
            rows={5}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: '#171717',
              border: '1px solid #383838',
              borderRadius: '8px',
              color: '#ececec',
              fontSize: '13.5px',
              lineHeight: '1.5',
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              onClick={() => { setPrompt(''); onSave(''); onClose(); }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #383838',
                backgroundColor: 'transparent',
                color: '#8e8e93',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#10a37f',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Save Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
