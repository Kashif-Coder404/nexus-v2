import { create } from "zustand";

interface dataType {
  localBackendVersion: string;
  isDownloadAlertOpen: boolean;
  openDownloadAlert: () => void;
  closeDownloadAlert: () => void;
}

const useData = create<dataType>((set) => ({
  localBackendVersion: "2.6.2",
  isDownloadAlertOpen: false,
  openDownloadAlert: () => set({ isDownloadAlertOpen: true }),
  closeDownloadAlert: () => set({ isDownloadAlertOpen: false }),
}));

export default useData;
