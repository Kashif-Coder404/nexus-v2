import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Device = {
  _id: string;
  deviceName: string;
};
type User = {
  _id: string;
  name: string;
  email: string;
  role: "user";
  devices: Device[];
};
type UserCredentialsType = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setCredentials: (token: string, user: User) => void;
  logout: () => void;
};

export const useUserCredentials = create<UserCredentialsType>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),
      setCredentials: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "nexus_auth",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
// export const useSideBar = create<SidebarState>((set) => ({
//   isSidebarOpen: true,
//   toggleSidebar: () =>
//     set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
// }));
