import { create } from "zustand";

export interface Device {
  deviceName: string;
  id: string;
  online: boolean;
  service?: boolean;
  ipAddress?: string;
}

type DeviceStore = {
  devices: Device[];
  isPairModalOpen: boolean;
  setDevices: (devices: Device[]) => void;
  setOnlineDevices: (id: string, online: boolean) => void;
  setIpAddress: (id: string, ipAddress: string) => void;
  setService: (id: string, service: boolean) => void;
  removeDevice: (id: string) => void;
  openPairModal: () => void;
  closePairModal: () => void;
};
export const useDevices = create<DeviceStore>((set) => ({
  devices: [],
  isPairModalOpen: false,
  setDevices: (devices: Device[]) => set({ devices }),
  setOnlineDevices: (id: string, online: boolean) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, online } : device,
      ),
    })),
  setIpAddress: (id: string, ipAddress: string) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, ipAddress } : device,
      ),
    })),
  setService: (id: string, service: boolean) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, service } : device,
      ),
    })),
  removeDevice: (id: string) =>
    set((state) => ({
      devices: state.devices.filter((device) => device.id !== id),
    })),
  openPairModal: () => set({ isPairModalOpen: true }),
  closePairModal: () => set({ isPairModalOpen: false }),
}));
