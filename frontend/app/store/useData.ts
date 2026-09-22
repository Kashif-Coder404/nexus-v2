import { create } from "zustand";

interface dataType {
  localBackendVersion: string;
}

const useData = create<dataType>((set) => ({
  localBackendVersion: "2.6.0",
}));

export default useData;
