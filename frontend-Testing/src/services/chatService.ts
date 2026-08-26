const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  const host =
    typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "localhost";
  return `http://${host}:3100`;
};

export const API_BASE_URL = getBackendUrl();
const API_URL = `${API_BASE_URL}/api`;

const getHeaders = () => {
  const apiKey = import.meta.env.VITE_NEXUS_API_KEY || "MyCurrentAPI";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
};

export async function sendChatMessage(
  message: string,
  session: string,
  behaviour: string,
) {
  const res = await fetch(`${API_URL}/chat/message`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ message, session, behaviour }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
  }

  return res.json();
}

export async function fetchChatHistory(session: string) {
  const res = await fetch(`${API_URL}/chat/history`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ session }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
  }

  return res.json();
}

export async function checkServerHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) {
    throw new Error("Server is not responding");
  }
  return res.json();
}
