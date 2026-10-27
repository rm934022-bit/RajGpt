const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchModels() {
  const res = await fetch(`${API_BASE}/models`);
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/settings`);
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}

export async function fetchConversations(searchTerm = '', userId = null) {
  const params = new URLSearchParams();
  if (searchTerm) params.append('q', searchTerm);
  if (userId) params.append('user_id', userId);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/conversations${qs}`);
  return res.json();
}

export async function createConversation(data = {}, userId = null) {
  const payload = { ...data };
  if (userId) payload.user_id = userId;
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorText = await res.text();
    let errorDetail = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (parsed.detail) errorDetail = parsed.detail;
    } catch {
      // Keep plain text
    }
    throw new Error(errorDetail || `Server error (${res.status})`);
  }
  return res.json();
}

export async function fetchConversation(id, userId = null) {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE}/conversations/${id}${qs}`);
  if (!res.ok) throw new Error('Conversation not found');
  return res.json();
}

export async function updateConversation(id, data) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteConversation(id) {
  const res = await fetch(`${API_BASE}/conversations/${id}`, {
    method: 'DELETE',
  });
  return res.json();
}

export async function clearAllConversations(userId = null) {
  const qs = userId ? `?user_id=${encodeURIComponent(userId)}` : '';
  const res = await fetch(`${API_BASE}/conversations${qs}`, {
    method: 'DELETE',
  });
  return res.json();
}

// Authentication API methods
export async function sendPhoneOTP(phone) {
  const res = await fetch(`${API_BASE}/auth/phone/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Failed to send verification code');
  }
  return res.json();
}

export async function verifyPhoneOTP(phone, otp, name) {
  const res = await fetch(`${API_BASE}/auth/phone/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp, name }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Invalid or expired code');
  }
  return res.json();
}

export async function googleLogin(payload = {}) {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || 'Google sign-in failed');
  }
  return res.json();
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${API_BASE}/auth/me?token=${encodeURIComponent(token)}`);
  if (!res.ok) return null;
  return res.json();
}

