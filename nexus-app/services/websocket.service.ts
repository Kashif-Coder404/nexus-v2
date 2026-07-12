export default function initWebsocket() {
  const wss: WebSocket = new WebSocket("ws://192.168.31.116:3100");
  wss.onopen = () => {
    console.log("Connected to Nexus Server");
  };
  return wss;
}
