import initWebsocket from "../../services/websocket.service";

const API_KEY = process.env.EXPO_PUBLIC_NEXUS_API_KEY;

export const useChatAPI = () => {
  const sendMessageToAPI = async (
    message: string,
    session: string,
  ): Promise<any> => {
    // 1. First ensure WebSocket is connected
    await new Promise<void>((resolve, reject) => {
      const socket: WebSocket = initWebsocket();

      const timeoutId = setTimeout(() => {
        reject(new Error("Server connection timed out"));
      }, 5000);

      socket.onopen = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      socket.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Server connection failed"));
      };
    });

    // 2. Then send the fetch request
    const response = await fetch("http://192.168.31.116:3100/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        message,
        session,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    return await response.json();
  };

  return { sendMessageToAPI };
};
