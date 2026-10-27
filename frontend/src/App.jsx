import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MessageItem, { SkeletonMessage } from './components/MessageItem';
import ChatInput from './components/ChatInput';
import EmptyState from './components/EmptyState';
import SettingsModal from './components/SettingsModal';
import { TermsOfServiceModal, PrivacyPolicyModal } from './components/LegalPages';
import SystemPromptModal from './components/SystemPromptModal';
import LoginPage from './components/LoginPage';
import {
  fetchModels,
  fetchSettings,
  fetchConversations,
  fetchConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  clearAllConversations
} from './api';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [models, setModels] = useState([]);
  const [currentModel, setCurrentModel] = useState('gemini-3-flash-preview');
  const [systemPrompt, setSystemPrompt] = useState('');

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('rajgpt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loginOpen, setLoginOpen] = useState(false);

  // Modals
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);

  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        const savedUser = (() => {
          try {
            const saved = localStorage.getItem('rajgpt_user');
            return saved ? JSON.parse(saved) : null;
          } catch {
            return null;
          }
        })();

        const [modelsData, settingsData, convsData] = await Promise.all([
          fetchModels(),
          fetchSettings(),
          fetchConversations('', savedUser?.id || null)
        ]);
        setModels(modelsData.models || []);
        if (settingsData.default_model) {
          setCurrentModel(settingsData.default_model);
        }
        setConversations(convsData || []);

        // Check URL pathname for conversation id (e.g. /c/uuid)
        const path = window.location.pathname;
        const match = path.match(/\/c\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          const matchedId = match[1];
          if (convsData.some(c => c.id === matchedId)) {
            loadConversation(matchedId, false, savedUser?.id || null);
          } else {
            window.history.replaceState(null, '', '/');
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setIsInitialLoading(false);
      }
    }
    init();

    // Browser back/forward navigation
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/\/c\/([a-zA-Z0-9-]+)/);
      if (match && match[1]) {
        loadConversation(match[1], false);
      } else {
        setActiveConversationId(null);
        setCurrentConversation(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize conversations whenever currentUser changes (login / switch / logout)
  useEffect(() => {
    if (isInitialLoading) return;

    async function syncConversationsForUser() {
      try {
        const convs = await fetchConversations('', currentUser?.id || null);
        setConversations(convs || []);

        // If current active conversation does not belong to the user's chats, reset to fresh screen
        if (activeConversationId && !(convs || []).some(c => c.id === activeConversationId)) {
          setActiveConversationId(null);
          setCurrentConversation(null);
          window.history.pushState(null, '', '/');
        }
      } catch (err) {
        console.error('Failed to sync user conversations:', err);
      }
    }

    syncConversationsForUser();
  }, [currentUser?.id]);

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingContent, isGenerating]);

  // Load a conversation
  const loadConversation = async (id, updateHistory = true, customUserId = undefined) => {
    if (isGenerating) return;
    setIsLoadingChat(true);
    const effectiveUserId = customUserId !== undefined ? customUserId : (currentUser?.id || null);
    try {
      const conv = await fetchConversation(id, effectiveUserId);
      setActiveConversationId(conv.id);
      setCurrentConversation(conv);
      if (conv.model) setCurrentModel(conv.model);
      if (conv.system_prompt !== undefined) setSystemPrompt(conv.system_prompt);
      if (updateHistory) {
        window.history.pushState(null, '', `/c/${conv.id}`);
      }
    } catch (err) {
      console.error('Failed to load conversation', err);
      setActiveConversationId(null);
      setCurrentConversation(null);
      window.history.pushState(null, '', '/');
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleLoginSuccess = async (user, token) => {
    setCurrentUser(user);
    if (token) localStorage.setItem('rajgpt_token', token);
    if (user) localStorage.setItem('rajgpt_user', JSON.stringify(user));
    // Immediately clear any active guest chat from view
    setActiveConversationId(null);
    setCurrentConversation(null);
    window.history.pushState(null, '', '/');
    try {
      const convs = await fetchConversations('', user?.id || null);
      setConversations(convs || []);
    } catch (err) {
      console.error('Failed to load user conversations', err);
    }
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    localStorage.removeItem('rajgpt_token');
    localStorage.removeItem('rajgpt_user');
    setActiveConversationId(null);
    setCurrentConversation(null);
    window.history.pushState(null, '', '/');
    try {
      const convs = await fetchConversations('', null);
      setConversations(convs || []);
    } catch (err) {
      console.error('Failed to load guest conversations', err);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsGenerating(false);
    setStreamingContent('');
    setActiveConversationId(null);
    setCurrentConversation(null);
    setInput('');
    window.history.pushState(null, '', '/');
  };

  // Send message
  const handleSendMessage = async (textToSend = null) => {
    const messageText = (typeof textToSend === 'string' && textToSend.trim() ? textToSend : input).trim();
    if (!messageText || isGenerating) return;

    setInput('');
    let convId = activeConversationId;

    // Create conversation if not yet active
    if (!convId) {
      try {
        const newConv = await createConversation({
          title: 'New chat',
          model: currentModel,
          system_prompt: systemPrompt
        }, currentUser?.id || null);
        convId = newConv.id;
        setActiveConversationId(newConv.id);
        setCurrentConversation(newConv);
        window.history.pushState(null, '', `/c/${newConv.id}`);
      } catch (err) {
        console.error('Failed to create conversation', err);
        alert('Could not initialize conversation: ' + err.message);
        return;
      }
    }

    // Add user message optimistically to UI
    const tempUserMessage = {
      id: 'temp-' + Date.now(),
      conversation_id: convId,
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString()
    };

    setCurrentConversation(prev => ({
      ...prev,
      messages: [...(prev?.messages || []), tempUserMessage]
    }));

    setIsGenerating(true);
    setStreamingContent('');

    // Prepare abort controller for stop generation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    let fullResponse = '';

    try {
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          model: currentModel,
          system_prompt: systemPrompt
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep unfinished trailing chunk

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              if (data.chunk) {
                fullResponse += data.chunk;
                setStreamingContent(prev => prev + data.chunk);
              }
              if (data.title && currentConversation) {
                // Title updated
                setCurrentConversation(prev => ({ ...prev, title: data.title }));
              }
              if (data.error) {
                fullResponse += `\n\n*Error: ${data.error}*`;
                setStreamingContent(fullResponse);
              }
            } catch (parseErr) {
              console.error('Error parsing SSE json', parseErr, jsonStr);
            }
          }
        }
      }

      // Finish streaming and append permanent message
      const finalAssistantMessage = {
        id: 'assistant-' + Date.now(),
        conversation_id: convId,
        role: 'assistant',
        content: fullResponse || 'No response received.',
        created_at: new Date().toISOString()
      };

      setCurrentConversation(prev => ({
        ...prev,
        messages: [...(prev?.messages || []), finalAssistantMessage]
      }));

      // Refresh conversations list in sidebar for current user
      const updatedList = await fetchConversations('', currentUser?.id || null);
      setConversations(updatedList || []);

    } catch (err) {
      if (err.name === 'AbortError') {
        if (fullResponse) {
          const partialMessage = {
            id: 'assistant-' + Date.now(),
            conversation_id: convId,
            role: 'assistant',
            content: fullResponse + ' [Generation stopped]',
            created_at: new Date().toISOString()
          };
          setCurrentConversation(prev => ({
            ...prev,
            messages: [...(prev?.messages || []), partialMessage]
          }));
        }
      } else {
        console.error('Message stream error:', err);
        const errorMsg = {
          id: 'error-' + Date.now(),
          conversation_id: convId,
          role: 'assistant',
          content: 'An error occurred while connecting to the AI backend. Please verify your Gemini API key in Settings.',
          created_at: new Date().toISOString()
        };
        setCurrentConversation(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), errorMsg]
        }));
      }
    } finally {
      setIsGenerating(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleStopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRenameConversation = async (id, newTitle) => {
    try {
      await updateConversation(id, { title: newTitle });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => ({ ...prev, title: newTitle }));
      }
    } catch (err) {
      console.error('Failed to rename', err);
    }
  };

  const handleDeleteConversation = async (id) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllConversations(currentUser?.id || null);
      setConversations([]);
      handleNewChat();
    } catch (err) {
      console.error('Failed to clear conversations', err);
    }
  };

  const handleSaveSystemPrompt = async (prompt) => {
    setSystemPrompt(prompt);
    if (activeConversationId) {
      try {
        await updateConversation(activeConversationId, { system_prompt: prompt });
      } catch (err) {
        console.error('Failed to update system prompt on conversation', err);
      }
    }
  };

  const messages = currentConversation?.messages || [];
  const showEmptyState = !activeConversationId || messages.length === 0;

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#212121',
      overflow: 'hidden',
      color: '#ececec'
    }}>
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => loadConversation(id, true)}
        onNewChat={handleNewChat}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
        onClearAll={handleClearAll}
        isLoading={isInitialLoading}
        currentUser={currentUser}
        onOpenLogin={() => setLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: 0,
        backgroundColor: '#212121',
        position: 'relative'
      }}>
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentModel={currentModel}
          onSelectModel={setCurrentModel}
          models={models}
          activeConversation={currentConversation}
          onNewChat={handleNewChat}
          onOpenSystemPrompt={() => setSystemPromptOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          systemPrompt={systemPrompt}
          currentUser={currentUser}
          onOpenLogin={() => setLoginOpen(true)}
        />

        {/* Chat / Message Stream Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}>
          {isLoadingChat ? (
            <div style={{ maxWidth: '780px', width: '100%', margin: '0 auto', padding: '32px 16px' }}>
              <SkeletonMessage />
              <div style={{ height: '24px' }} />
              <SkeletonMessage />
            </div>
          ) : showEmptyState ? (
            <EmptyState onSelectSuggestion={(text) => handleSendMessage(text)} />
          ) : (
            <div style={{
              maxWidth: '780px',
              width: '100%',
              margin: '0 auto',
              padding: '24px 16px 12px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} />
              ))}

              {/* Streaming or loading assistant state */}
              {isGenerating && (
                streamingContent ? (
                  <MessageItem
                    message={{
                      role: 'assistant',
                      content: streamingContent
                    }}
                    isStreaming={true}
                  />
                ) : (
                  <SkeletonMessage />
                )
              )}

              <div ref={messagesEndRef} style={{ height: '8px' }} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={() => handleSendMessage()}
          onStop={handleStopGenerating}
          isGenerating={isGenerating}
          disabled={isLoadingChat}
        />
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        models={models}
        onRefreshSettings={(s) => {
          if (s.default_model) setCurrentModel(s.default_model);
        }}
      />

      <TermsOfServiceModal
        isOpen={termsOpen}
        onClose={() => setTermsOpen(false)}
      />

      <PrivacyPolicyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
      />

      <SystemPromptModal
        isOpen={systemPromptOpen}
        onClose={() => setSystemPromptOpen(false)}
        initialPrompt={systemPrompt}
        onSave={handleSaveSystemPrompt}
      />

      <LoginPage
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={handleLoginSuccess}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />
    </div>
  );
}
