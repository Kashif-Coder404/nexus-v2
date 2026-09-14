export const livewebsocket = (
  ipAddress: string,
  onMessage?: (data: any) => void,
  onStatusChange?: (isConnected: boolean) => void,
) => {
  if (!ipAddress || ipAddress === "undefined") return null;
  const ws = new WebSocket(`ws://${ipAddress}:4100/`);

  ws.onopen = () => {
    onStatusChange?.(true);
  };
  ws.onmessage = (event) => {
    if (onMessage) onMessage(event);
  };
  ws.onclose = () => {
    onStatusChange?.(false);
  };
  ws.onerror = () => {
    onStatusChange?.(false);
  };
  return ws;
};
