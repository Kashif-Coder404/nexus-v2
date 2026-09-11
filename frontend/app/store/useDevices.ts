import { create } from "zustand";

type Device = {
  deviceName: string;
  id: string;
  online: boolean;
  service?: boolean;
};

type DeviceStore = {
  devices: Device[];
  isPairModalOpen: boolean;
  setDevices: (devices: Device[]) => void;
  setOnlineDevices: (id: string, online: boolean) => void;
  setService: (id: string, service: boolean) => void;
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
  setService: (id: string, service: boolean) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, service } : device,
      ),
    })),
  openPairModal: () => set({ isPairModalOpen: true }),
  closePairModal: () => set({ isPairModalOpen: false }),
}));
