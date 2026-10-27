import React, { useState, useRef, useEffect } from 'react';
import {
  NewChatIcon,
  SearchIcon,
  SidebarIcon,
  TrashIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
  GearIcon,
  ShieldIcon,
  FileTextIcon,
  UserIcon,
  LogOutIcon
} from './Icons';

export default function Sidebar({
  isOpen,
  onToggle,
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenTerms,
  onOpenPrivacy,
  onClearAll,
  isLoading = false,
  currentUser = null,
  onOpenLogin,
  onLogout
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (convId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(convId, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (convId, e) => {
    e.stopPropagation();
    onDeleteConversation(convId);
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by date
  const groups = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: []
  };

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  filteredConversations.forEach(c => {
    const updated = new Date(c.updated_at || c.created_at);
    const diffDays = Math.floor((now - updated) / oneDay);
    if (diffDays === 0) groups.today.push(c);
    else if (diffDays === 1) groups.yesterday.push(c);
    else if (diffDays <= 7) groups.previous7Days.push(c);
    else groups.older.push(c);
  });

  const renderGroup = (title, items) => {
    if (items.length === 0) return null;
    return (
      <div key={title} style={{ marginBottom: '14px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#71717a',
          padding: '4px 8px 6px',
          textTransform: 'uppercase',
          letterSpacing: '0.4px'
        }}>
          {title}
        </div>
        {items.map(conv => {
          const isActive = conv.id === activeConversationId;
          const isEditing = conv.id === editingId;

          return (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '34px',
                padding: '0 8px',
                borderRadius: '6px',
                fontSize: '13px',
                color: isActive ? '#ececec' : '#b4b4b4',
                backgroundColor: isActive ? '#212121' : 'transparent',
                cursor: 'pointer',
                marginBottom: '1px',
                transition: 'background-color 100ms'
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = '#202020';
                const actions = e.currentTarget.querySelector('.item-actions');
                if (actions) actions.style.display = 'flex';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                const actions = e.currentTarget.querySelector('.item-actions');
                if (actions && !isEditing) actions.style.display = 'none';
              }}
            >
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '4px' }} onClick={e => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveRename(conv.id, e);
                      if (e.key === 'Escape') handleCancelRename(e);
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      backgroundColor: '#171717',
                      border: '1px solid #3f3f46',
                      borderRadius: '4px',
                      color: '#ececec',
                      padding: '2px 6px',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={e => handleSaveRename(conv.id, e)}
                    style={{ background: 'none', border: 'none', color: '#10a37f', cursor: 'pointer', padding: '2px' }}
                    title="Save"
                  >
                    <CheckIcon size={14} color="#10a37f" />
                  </button>
                  <button
                    onClick={handleCancelRename}
                    style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px' }}
                    title="Cancel"
                  >
                    <CloseIcon size={14} color="#71717a" />
                  </button>
                </div>
              ) : (
                <>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    paddingRight: '6px',
                    fontWeight: isActive ? 500 : 400
                  }}>
                    {conv.title || 'Untitled conversation'}
                  </span>
                  <div
                    className="item-actions"
                    style={{
                      display: isActive ? 'flex' : 'none',
                      alignItems: 'center',
                      gap: '3px',
                      flexShrink: 0
                    }}
                  >
                    <button
                      onClick={e => handleStartRename(conv, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8e8e93',
                        cursor: 'pointer',
                        padding: '3px',
                        borderRadius: '3px'
                      }}
                      title="Rename"
                    >
                      <EditIcon size={13} color="#8e8e93" />
                    </button>
                    <button
                      onClick={e => handleDelete(conv.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#8e8e93',
                        cursor: 'pointer',
                        padding: '3px',
                        borderRadius: '3px'
                      }}
                      title="Delete chat"
                    >
                      <TrashIcon size={13} color="#8e8e93" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside style={{
      width: isOpen ? '260px' : '0px',
      minWidth: isOpen ? '260px' : '0px',
      maxWidth: isOpen ? '260px' : '0px',
      height: '100%',
      backgroundColor: '#171717',
      borderRight: isOpen ? '1px solid #282828' : 'none',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 180ms ease, min-width 180ms ease',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 30
    }}>
      {/* Top Header / New Chat */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <button
            onClick={onNewChat}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '36px',
              padding: '0 12px',
              backgroundColor: 'transparent',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#ececec',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
              transition: 'background-color 100ms'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#212121'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <NewChatIcon size={16} />
            <span>New chat</span>
          </button>

          <button
            onClick={onToggle}
            style={{
              background: 'none',
              border: 'none',
              color: '#8e8e93',
              cursor: 'pointer',
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 100ms'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#212121'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Close sidebar"
          >
            <SidebarIcon size={18} />
          </button>
        </div>

        {/* Search Conversation History */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#202020',
          borderRadius: '6px',
          height: '32px',
          padding: '0 10px',
          border: '1px solid #2a2a2a'
        }}>
          <SearchIcon size={14} color="#71717a" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ececec',
              fontSize: '12.5px',
              outline: 'none',
              width: '100%',
              padding: 0
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 0 }}
            >
              <CloseIcon size={12} color="#71717a" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations Scroll Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '6px 10px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', paddingLeft: '6px', paddingRight: '6px' }}>
            <div className="skeleton-box" style={{ width: '45%', height: '10px', marginBottom: '4px' }}></div>
            <div className="skeleton-box" style={{ width: '100%', height: '24px', borderRadius: '4px' }}></div>
            <div className="skeleton-box" style={{ width: '90%', height: '24px', borderRadius: '4px' }}></div>
            <div className="skeleton-box" style={{ width: '75%', height: '24px', borderRadius: '4px' }}></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div style={{
            color: '#71717a',
            fontSize: '12.5px',
            textAlign: 'center',
            marginTop: '32px',
            padding: '0 12px'
          }}>
            {searchTerm ? 'No matching chats' : 'No chats yet'}
          </div>
        ) : (
          <>
            {renderGroup('Today', groups.today)}
            {renderGroup('Yesterday', groups.yesterday)}
            {renderGroup('Previous 7 Days', groups.previous7Days)}
            {renderGroup('Older', groups.older)}
          </>
        )}
      </div>

      {/* User Profile & Footer Menu */}
      <div ref={userMenuRef} style={{
        padding: '8px 10px',
        borderTop: '1px solid #282828',
        position: 'relative'
      }}>
        {userMenuOpen && (
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '10px',
            right: '10px',
            backgroundColor: '#232323',
            border: '1px solid #333333',
            borderRadius: '8px',
            padding: '6px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            zIndex: 60
          }}>
            <button
              onClick={() => { setUserMenuOpen(false); onOpenSettings(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                color: '#ececec',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c2c2c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <GearIcon size={15} color="#a1a1aa" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => { setUserMenuOpen(false); onOpenTerms(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                color: '#ececec',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c2c2c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FileTextIcon size={15} color="#a1a1aa" />
              <span>Terms of Service</span>
            </button>

            <button
              onClick={() => { setUserMenuOpen(false); onOpenPrivacy(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                color: '#ececec',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c2c2c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <ShieldIcon size={15} color="#a1a1aa" />
              <span>Privacy Policy</span>
            </button>

            <div style={{ height: '1px', backgroundColor: '#333333', margin: '4px 0' }} />

            {currentUser ? (
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#b4b4b4',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c2c2c'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOutIcon size={15} color="#b4b4b4" />
                <span>Log out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  onOpenLogin();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#10a37f',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c2c2c'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <UserIcon size={15} color="#10a37f" />
                <span>Log in / Sign up</span>
              </button>
            )}

            <button
              onClick={() => {
                setUserMenuOpen(false);
                if (window.confirm('Are you sure you want to clear all conversation history?')) {
                  onClearAll();
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '7px 10px',
                borderRadius: '6px',
                background: 'none',
                border: 'none',
                color: '#ef4444',
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2c2c2c'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <TrashIcon size={15} color="#ef4444" />
              <span>Clear all chats</span>
            </button>
          </div>
        )}

        {currentUser ? (
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              width: '100%',
              height: '42px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '0 8px',
              borderRadius: '6px',
              backgroundColor: userMenuOpen ? '#212121' : 'transparent',
              border: 'none',
              color: '#ececec',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background-color 100ms'
            }}
            onMouseEnter={e => { if (!userMenuOpen) e.currentTarget.style.backgroundColor = '#202020'; }}
            onMouseLeave={e => { if (!userMenuOpen) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <div style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#10a37f',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '12.5px',
              fontWeight: 700
            }}>
              {(currentUser.name || currentUser.email || 'U')[0].toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600 }}>
                {currentUser.name}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11px', color: '#8e8e93' }}>
                {currentUser.email || currentUser.phone || 'Signed in'}
              </span>
            </div>
            <GearIcon size={15} color="#71717a" />
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            style={{
              width: '100%',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0 12px',
              borderRadius: '8px',
              backgroundColor: '#262626',
              border: '1px solid #383838',
              color: '#ececec',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 100ms'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#2f2f2f';
              e.currentTarget.style.borderColor = '#4a4a4a';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#262626';
              e.currentTarget.style.borderColor = '#383838';
            }}
          >
            <UserIcon size={15} color="#10a37f" />
            <span>Log in / Sign up</span>
          </button>
        )}
      </div>
    </aside>
  );
}
