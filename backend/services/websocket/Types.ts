import { WebSocket } from "ws";

export interface CustomWebSocket extends WebSocket {
  isAlive?: boolean;
  userId?: string;
  deviceId?: string;
  deviceName?: string;
  isAuthenticated?: boolean;
  pairingCode?: string;
  service?: boolean;
  ipAddress?: string;
  watchdogTimer?: NodeJS.Timeout | null;
}

export interface ActiveSessions {
  userId: string;
  sessionId: string;
  userMessage: string;
  workingon: string;
  executions: any[];
  middleMsg?: string;
}

export interface ActiveBackgroundTask {
  userId: string;
  sessionId: string;
  command: string;
  model?: any;
}

export interface PendingTask {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer: NodeJS.Timeout;
}

export interface PendingRequest {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  timer: NodeJS.Timeout;
}
