import React, { useState, useRef, useEffect } from 'react';
import {
  SidebarIcon,
  ChevronDownIcon,
  NewChatIcon,
  ExportIcon,
  SlidersIcon,
  CheckIcon,
  GearIcon
} from './Icons';

export default function Header({
  sidebarOpen,
  onToggleSidebar,
  currentModel,
  onSelectModel,
  models = [],
  activeConversation,
  onNewChat,
  onOpenSystemPrompt,
  onOpenSettings,
  systemPrompt,
  currentUser = null,
  onOpenLogin
}) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setModelDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentModelObj = models.find(m => m.id === currentModel) || {
    id: currentModel,
    name: currentModel === 'gemini-3-flash-preview' ? 'Gemini 3 Flash' : (currentModel || 'Gemini 3 Flash'),
    badge: 'Recommended'
  };

  const handleExport = () => {
    if (!activeConversation) return;
    window.open(`/api/conversations/${activeConversation.id}/export`, '_blank');
  };

  return (
    <header style={{
      height: '52px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid #2e2e2e',
      backgroundColor: '#212121',
      flexShrink: 0,
      position: 'relative',
      zIndex: 20
    }}>
      {/* Left side: Toggle & Model Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            color: '#b4b4b4',
            cursor: 'pointer',
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: 'none',
            transition: 'background-color 100ms'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2f2f2f'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <SidebarIcon size={18} />
        </button>

        {/* RAJGPT Brand & Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            fontSize: '16px',
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: '#ececec',
            paddingRight: '4px'
          }}>
            RAJGPT
          </span>

          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              style={{
                backgroundColor: '#2a2a2a',
                border: '1px solid #383838',
                color: '#b4b4b4',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 500,
                fontSize: '12.5px',
                whiteSpace: 'nowrap',
                outline: 'none',
                transition: 'all 100ms'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#333333';
                e.currentTarget.style.color = '#ececec';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#2a2a2a';
                e.currentTarget.style.color = '#b4b4b4';
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>{currentModelObj.name}</span>
              <ChevronDownIcon size={12} color="#8e8e93" />
            </button>

          {modelDropdownOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              width: '280px',
              backgroundColor: '#262626',
              border: '1px solid #383838',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
              zIndex: 50
            }}>
              <div style={{
                padding: '6px 10px 4px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#8e8e93',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Model
              </div>
              {models.map(m => {
                const isSelected = m.id === currentModel;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setModelDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: isSelected ? '#333333' : 'transparent',
                      border: 'none',
                      color: '#ececec',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      marginBottom: '2px',
                      transition: 'background-color 100ms'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#2e2e2e'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{m.name}</span>
                      {isSelected && <CheckIcon size={14} color="#10a37f" />}
                    </div>
                    <span style={{ fontSize: '12px', color: '#8e8e93', lineHeight: '1.3' }}>
                      {m.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* Right side controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Custom instructions button */}
        <button
          onClick={onOpenSystemPrompt}
          style={{
            background: systemPrompt ? '#23382c' : 'none',
            border: systemPrompt ? '1px solid #10a37f' : '1px solid transparent',
            color: systemPrompt ? '#10a37f' : '#b4b4b4',
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            transition: 'background-color 100ms'
          }}
          onMouseEnter={e => { if (!systemPrompt) e.currentTarget.style.backgroundColor = '#2f2f2f'; }}
          onMouseLeave={e => { if (!systemPrompt) e.currentTarget.style.backgroundColor = 'transparent'; }}
          title="Custom system prompt"
        >
          <SlidersIcon size={15} color={systemPrompt ? '#10a37f' : '#b4b4b4'} />
          <span style={{ fontSize: '13px' }}>Instructions</span>
        </button>

        {/* Export chat button */}
        {activeConversation && activeConversation.messages && activeConversation.messages.length > 0 && (
          <button
            onClick={handleExport}
            style={{
              background: 'none',
              border: 'none',
              color: '#b4b4b4',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 100ms'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2f2f2f'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Export conversation to Markdown"
          >
            <ExportIcon size={16} />
          </button>
        )}

        {/* Settings button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            style={{
              background: 'none',
              border: 'none',
              color: '#b4b4b4',
              cursor: 'pointer',
              width: '34px',
              height: '34px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 100ms'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2f2f2f'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Settings"
          >
            <GearIcon size={16} />
          </button>
        )}

        {/* New chat icon */}
        <button
          onClick={onNewChat}
          style={{
            background: 'none',
            border: 'none',
            color: '#b4b4b4',
            cursor: 'pointer',
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 100ms'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2f2f2f'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          title="New chat"
        >
          <NewChatIcon size={18} />
        </button>

        {!currentUser && onOpenLogin && (
          <button
            onClick={onOpenLogin}
            style={{
              backgroundColor: '#10a37f',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              padding: '6px 12px',
              cursor: 'pointer',
              marginLeft: '4px',
              transition: 'opacity 100ms'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Log in
          </button>
        )}
      </div>
    </header>
  );
}
