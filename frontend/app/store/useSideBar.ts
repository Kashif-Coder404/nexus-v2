import { create } from "zustand";

interface SidebarState {
  isSidebarOpen: boolean;
  toggleSidebar: (bool?: boolean) => void;
}

export const useSideBar = create<SidebarState>((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));

