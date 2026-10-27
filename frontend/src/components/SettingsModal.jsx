import React, { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon, GoogleIcon, PhoneIcon } from './Icons';
import { fetchSettings, updateSettings } from '../api';

export default function SettingsModal({ isOpen, onClose, models = [], onRefreshSettings }) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'auth_sms'

  // General settings
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState('gemini-3-flash-preview');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');

  // OAuth & SMS settings
  const [googleClientId, setGoogleClientId] = useState('');
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');
  const [fast2smsKey, setFast2smsKey] = useState('');
  const [hasTwilio, setHasTwilio] = useState(false);
  const [hasFast2sms, setHasFast2sms] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setHasApiKey(data.has_api_key);
      setMaskedKey(data.gemini_api_key_masked || '');
      setDefaultModel(data.default_model || 'gemini-3-flash-preview');
      setGoogleClientId(data.google_client_id || '');
      setHasTwilio(data.has_twilio || false);
      setHasFast2sms(data.has_fast2sms || false);
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { default_model: defaultModel };
      if (apiKey.trim()) {
        payload.gemini_api_key = apiKey.trim();
      }
      if (googleClientId !== undefined) {
        payload.google_client_id = googleClientId.trim();
      }
      if (twilioSid.trim()) {
        payload.twilio_account_sid = twilioSid.trim();
      }
      if (twilioToken.trim()) {
        payload.twilio_auth_token = twilioToken.trim();
      }
      if (twilioFrom.trim()) {
        payload.twilio_phone_number = twilioFrom.trim();
      }
      if (fast2smsKey.trim()) {
        payload.fast2sms_api_key = fast2smsKey.trim();
      }

      const res = await updateSettings(payload);
      setHasApiKey(res.has_api_key);
      setMaskedKey(res.gemini_api_key_masked || '');
      setApiKey('');
      setTwilioToken('');
      setHasTwilio(res.has_twilio);
      setHasFast2sms(res.has_fast2sms);
      setSavedSuccess(true);
      if (onRefreshSettings) onRefreshSettings(res);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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
      padding: '16px'
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#212121',
        border: '1px solid #333333',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '540px',
        maxHeight: '90vh',
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid #2e2e2e'
        }}>
          <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#ececec', margin: 0 }}>Settings</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8e8e93',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid #2a2a2a', padding: '0 20px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'general' ? '2px solid #10a37f' : '2px solid transparent',
              color: activeTab === 'general' ? '#ececec' : '#8e8e93',
              fontSize: '13px',
              fontWeight: 600,
              padding: '10px 14px',
              cursor: 'pointer'
            }}
          >
            AI & Model
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('auth_sms')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'auth_sms' ? '2px solid #10a37f' : '2px solid transparent',
              color: activeTab === 'auth_sms' ? '#ececec' : '#8e8e93',
              fontSize: '13px',
              fontWeight: 600,
              padding: '10px 14px',
              cursor: 'pointer'
            }}
          >
            Google & SMS Gateway
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {activeTab === 'general' ? (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#ececec', marginBottom: '6px' }}>
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  placeholder={hasApiKey ? `Configured (${maskedKey}) - leave blank to keep unchanged` : "AIzaSy..."}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#171717',
                    border: '1px solid #383838',
                    borderRadius: '8px',
                    color: '#ececec',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '11.5px', color: '#8e8e93', marginTop: '4px' }}>
                  Stored securely in your local SQLite database for multi-turn chats.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#ececec', marginBottom: '6px' }}>
                  Default AI Model
                </label>
                <select
                  value={defaultModel}
                  onChange={e => setDefaultModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#171717',
                    border: '1px solid #383838',
                    borderRadius: '8px',
                    color: '#ececec',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.badge})</option>
                  ))}
                </select>
              </div>

              <div style={{
                padding: '10px 12px',
                backgroundColor: '#1a1a1d',
                borderRadius: '8px',
                border: '1px solid #28282b',
                fontSize: '12px',
                color: '#a1a1aa',
                lineHeight: '1.5'
              }}>
                <div style={{ fontWeight: 600, color: '#ececec', marginBottom: '2px' }}>System Architecture</div>
                <div>App: RAJGPT (React + Vite + FastAPI + SQLite)</div>
                <div>AI Engine: Google Gemini API (gemini-3-flash-preview default)</div>
              </div>
            </>
          ) : (
            <>
              {/* Google OAuth Client ID */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#ececec', marginBottom: '6px' }}>
                  <GoogleIcon size={15} />
                  <span>Google OAuth Client ID</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                  value={googleClientId}
                  onChange={e => setGoogleClientId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: '#171717',
                    border: '1px solid #383838',
                    borderRadius: '8px',
                    color: '#ececec',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '11.5px', color: '#8e8e93', marginTop: '4px' }}>
                  From Google Cloud Console. Enables the official One-Tap Google button.
                </p>
              </div>

              {/* Twilio SMS Configuration */}
              <div style={{
                padding: '12px',
                backgroundColor: '#18181b',
                border: '1px solid #2e2e33',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ececec' }}>
                    Twilio Real SMS Gateway
                  </span>
                  {hasTwilio && (
                    <span style={{ fontSize: '11px', color: '#10a37f', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckIcon size={12} color="#10a37f" /> Active
                    </span>
                  )}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Twilio Account SID (AC...)"
                    value={twilioSid}
                    onChange={e => setTwilioSid(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: '#121214',
                      border: '1px solid #333336',
                      borderRadius: '6px',
                      color: '#ececec',
                      fontSize: '12.5px',
                      outline: 'none',
                      marginBottom: '8px'
                    }}
                  />
                  <input
                    type="password"
                    placeholder="Twilio Auth Token"
                    value={twilioToken}
                    onChange={e => setTwilioToken(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: '#121214',
                      border: '1px solid #333336',
                      borderRadius: '6px',
                      color: '#ececec',
                      fontSize: '12.5px',
                      outline: 'none',
                      marginBottom: '8px'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Twilio Phone Number (+1...)"
                    value={twilioFrom}
                    onChange={e => setTwilioFrom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      backgroundColor: '#121214',
                      border: '1px solid #333336',
                      borderRadius: '6px',
                      color: '#ececec',
                      fontSize: '12.5px',
                      outline: 'none'
                    }}
                  />
                </div>
                <p style={{ fontSize: '11px', color: '#8e8e93', margin: 0 }}>
                  Sends actual SMS messages worldwide to user phones when requesting OTP.
                </p>
              </div>

              {/* Fast2SMS Configuration (India) */}
              <div style={{
                padding: '12px',
                backgroundColor: '#18181b',
                border: '1px solid #2e2e33',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#ececec' }}>
                    Fast2SMS (India Direct OTP)
                  </span>
                  {hasFast2sms && (
                    <span style={{ fontSize: '11px', color: '#10a37f', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <CheckIcon size={12} color="#10a37f" /> Active
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="Fast2SMS Authorization API Key"
                  value={fast2smsKey}
                  onChange={e => setFast2smsKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    backgroundColor: '#121214',
                    border: '1px solid #333336',
                    borderRadius: '6px',
                    color: '#ececec',
                    fontSize: '12.5px',
                    outline: 'none'
                  }}
                />
                <p style={{ fontSize: '11px', color: '#8e8e93', margin: 0 }}>
                  Direct SMS gateway for Indian numbers (+91).
                </p>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            {savedSuccess && (
              <span style={{ fontSize: '12.5px', color: '#10a37f', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckIcon size={13} color="#10a37f" /> Saved successfully
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #383838',
                backgroundColor: 'transparent',
                color: '#ececec',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#10a37f',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
