import React from 'react';
import { CloseIcon, FileTextIcon, ShieldIcon } from './Icons';

export function TermsOfServiceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1f1f21',
        border: '1px solid #333333',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #2e2e2e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileTextIcon className="w-5 h-5 text-[#10a37f]" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ececec' }}>Terms of Service</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8e8e93',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          fontSize: '14px',
          lineHeight: '1.7',
          color: '#d1d1d6'
        }}>
          <p style={{ marginBottom: '16px', color: '#8e8e93' }}>Last updated: October 2026</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>1. Acceptance of Terms</h3>
          <p style={{ marginBottom: '16px' }}>
            By using this application, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of this service immediately.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>2. Permitted Use</h3>
          <p style={{ marginBottom: '16px' }}>
            You may use this chat interface for lawful personal and commercial purposes. You agree not to generate malware, engage in unauthorized data extraction, or facilitate activities that violate applicable local or international laws.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>3. AI Generated Content and Disclaimers</h3>
          <p style={{ marginBottom: '16px' }}>
            Responses generated through this platform are produced by automated artificial intelligence models. While designed to be helpful and accurate, outputs may occasionally contain factual errors, code vulnerabilities, or biased statements. You remain solely responsible for validating all generated information before relying upon it.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>4. Content Ownership</h3>
          <p style={{ marginBottom: '16px' }}>
            As between you and this application, you retain all rights to the prompts you submit and the resulting responses generated for your account, subject to relevant third-party terms governing the underlying language model APIs.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>5. Limitation of Liability</h3>
          <p style={{ marginBottom: '16px' }}>
            Under no circumstances shall the operators or maintainers of this application be liable for direct, indirect, incidental, or consequential damages resulting from the use or inability to use this software.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #2e2e2e',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#1a1a1c'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#10a37f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPolicyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1f1f21',
        border: '1px solid #333333',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid #2e2e2e'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldIcon className="w-5 h-5 text-[#10a37f]" />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ececec' }}>Privacy Policy</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8e8e93',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          fontSize: '14px',
          lineHeight: '1.7',
          color: '#d1d1d6'
        }}>
          <p style={{ marginBottom: '16px', color: '#8e8e93' }}>Last updated: October 2026</p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>1. Data Storage and Locality</h3>
          <p style={{ marginBottom: '16px' }}>
            This application stores your conversation sessions, chat messages, and user preferences locally in your SQLite database instance. Your chat history is not uploaded to centralized tracking servers or third-party ad networks.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>2. Language Model Processing</h3>
          <p style={{ marginBottom: '16px' }}>
            When you send a message, conversation history necessary for multi-turn context is transmitted securely over HTTPS to the Google Gemini API using your configured API credentials. Review Google's Privacy Policy regarding their data processing and API retention standards.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>3. API Key Security</h3>
          <p style={{ marginBottom: '16px' }}>
            Your API keys are stored in the local SQLite settings table and in local environment variables. They are never transmitted to client web browsers in unmasked form nor exposed to external parties.
          </p>

          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#f4f4f5', marginBottom: '8px' }}>4. Data Retention and Deletion</h3>
          <p style={{ marginBottom: '16px' }}>
            You maintain full control over your data. You can delete individual chat conversations or purge all chat records at any moment using the "Clear all chats" option in the sidebar menu.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #2e2e2e',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#1a1a1c'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              backgroundColor: '#10a37f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13.5px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
