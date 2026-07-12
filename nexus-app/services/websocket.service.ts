export default function initWebsocket() {
  const wss: WebSocket = new WebSocket("ws://192.168.31.116:3100");
  
  wss.onopen = () => {
    console.log("Connected to Nexus Server");
  };

  // Detect if the server is down or connection fails
  wss.onerror = (error) => {
    console.log("WebSocket connection failed. Server might be down or unreachable.");
  };

  // Detect when connection is closed (including when it fails to open)
  wss.onclose = (event) => {
    if (!event.wasClean) {
      console.log("WebSocket closed unexpectedly. Check if the server is running.");
    }
  };

  return wss;
}
