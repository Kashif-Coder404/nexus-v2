import { create } from "zustand";

interface dataType {
  localBackendVersion: string;
}

const useData = create<dataType>((set) => ({
  localBackendVersion: "2.5.x",
}));

export default useData;
