export const isValidMongoId = (id?: string): boolean => {
  return Boolean(id && /^[0-9a-fA-F]{24}$/.test(id));
};

export const getBackendUrl = (): string => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("nexus_backend_url");
    if (saved) return saved;
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  return "http://localhost:3100";
};

export const setBackendUrl = (url: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("nexus_backend_url", url);
  }
};

export const getAuthToken = (): string => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("nexus_token");
    if (saved) return saved;
  }
  return import.meta.env.VITE_NEXUS_API_KEY || "MyCurrentAPI";
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("nexus_token", token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");
  }
};

export const getHeaders = (sessionId?: string): Record<string, string> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }

  // Only pass x-session-id if it is a valid MongoDB 24-char ObjectId
  if (isValidMongoId(sessionId)) {
    headers["x-session-id"] = sessionId!;
  }

  return headers;
};

export interface ModelType {
  provider: "gemini" | "tokenrouter" | "nvidia" | string;
  name: string;
  isLiveModel?: boolean;
}

export const PROVIDER_MODELS: Record<
  string,
  { label: string; models: { id: string; label: string; isLiveModel?: boolean }[] }
> = {
  gemini: {
    label: "Google Gemini",
    models: [
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
      { id: "gemini-3-pro-preview", label: "Gemini 3 Pro Preview" },
      {
        id: "gemini-3.1-flash-live-preview",
        label: "Gemini 3 Flash Live (Real-Time)",
        isLiveModel: true,
      },
    ],
  },
  tokenrouter: {
    label: "TokenRouter AI",
    models: [
      { id: "qwen/qwen3.8-max-free", label: "Qwen 3.8 Max (Free)" },
      {
        id: "google/gemini-2.0-flash-exp-image-preview",
        label: "Gemini 2.0 Flash Exp (Image)",
      },
      {
        id: "google/gemini-2.0-flash-exp-video-preview-09-2024",
        label: "Gemini 2.0 Flash Exp (Video)",
      },
      { id: "mistralai/mistral-large-2407", label: "Mistral Large 2407" },
      {
        id: "openai/gpt-oss-20b-instruct-20241022",
        label: "GPT-OSS 20B Instruct",
      },
      { id: "google/nano-banana-128b-1218", label: "Nano Banana 128B" },
    ],
  },
  nvidia: {
    label: "NVIDIA / Local NIM",
    models: [{ id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" }],
  },
};

// --- CHAT ENDPOINTS ---

export async function sendChatMessage(
  content: string,
  session?: string,
  behaviour: string = "friendly",
  model?: ModelType
) {
  const backendUrl = getBackendUrl();
  const validSession = isValidMongoId(session) ? session : undefined;

  const bodyPayload: Record<string, any> = {
    content,
    behaviour,
  };

  if (model) {
    bodyPayload.model = model;
  }

  if (validSession) {
    bodyPayload.session = validSession;
    bodyPayload.sessionId = validSession;
  }

  const res = await fetch(`${backendUrl}/api/chat/message`, {
    method: "POST",
    headers: getHeaders(validSession),
    body: JSON.stringify(bodyPayload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

export async function fetchChatHistory(
  session: string,
  lastMsgCount: number = 25
) {
  if (!isValidMongoId(session)) {
    return { success: true, data: { chat: [] } };
  }

  const backendUrl = getBackendUrl();
  const res = await fetch(
    `${backendUrl}/api/chat/history?lastMsgCount=${lastMsgCount}`,
    {
      method: "POST",
      headers: getHeaders(session),
      body: JSON.stringify({
        session,
        sessionId: session,
      }),
    }
  );

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

export async function fetchUserSessions() {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/chat/sessions`, {
    method: "GET",
    headers: getHeaders(),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

export async function deleteChatSession(session: string) {
  if (!isValidMongoId(session)) {
    return { success: true };
  }

  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/chat/delete-chat-session`, {
    method: "POST",
    headers: getHeaders(session),
    body: JSON.stringify({
      session,
      sessionId: session,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

// --- PAIRING ENDPOINT ---

export async function pairDevice(pairingcode: string) {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/pairrequest`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ pairingcode }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

// --- AUTH ENDPOINTS ---

export async function loginUser(email: string, password: string) {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

export async function signupUser(name: string, email: string, password: string) {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `HTTP error ${res.status}`);
  }

  return data;
}

// --- HEALTH CHECK ---

export async function checkServerHealth() {
  const backendUrl = getBackendUrl();
  const res = await fetch(`${backendUrl}/api/health`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error("Server is not responding");
  }
  return res.json();
}
