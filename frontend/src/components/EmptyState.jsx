import React from 'react';
import { OpenAIIcon } from './Icons';

const SUGGESTIONS = [
  {
    title: 'Analyze Python code',
    subtitle: 'Find potential edge-case bugs and optimize performance'
  },
  {
    title: 'Design distributed system',
    subtitle: 'Architect a resilient caching and message queue pattern'
  },
  {
    title: 'Draft technical RFC',
    subtitle: 'Outline background, design trade-offs, and rollout plan'
  },
  {
    title: 'Explain database indexing',
    subtitle: 'How B-Tree indexes work compared to hash and GiST indexes'
  }
];

export default function EmptyState({ onSelectSuggestion }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
      maxWidth: '720px',
      margin: '0 auto',
      width: '100%'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        backgroundColor: '#10a37f',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        fontSize: '22px',
        fontWeight: 700,
        letterSpacing: '-0.5px'
      }}>
        R
      </div>

      <h1 style={{
        fontSize: '26px',
        fontWeight: 600,
        color: '#ececec',
        marginBottom: '28px',
        textAlign: 'center',
        letterSpacing: '-0.3px'
      }}>
        What can I help with today?
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px',
        width: '100%'
      }}>
        {SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSuggestion(`${item.title}: ${item.subtitle}`)}
            style={{
              textAlign: 'left',
              padding: '12px 14px',
              backgroundColor: '#262626',
              border: '1px solid #333333',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              outline: 'none',
              transition: 'background-color 100ms, border-color 100ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#2d2d2d';
              e.currentTarget.style.borderColor = '#444444';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#262626';
              e.currentTarget.style.borderColor = '#333333';
            }}
          >
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#ececec' }}>
              {item.title}
            </span>
            <span style={{ fontSize: '12px', color: '#8e8e93', lineHeight: '1.35' }}>
              {item.subtitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
