import { create } from "zustand";

interface dataType {
  localBackendVersion: string;
}

const useData = create<dataType>((set) => ({
  localBackendVersion: "2.6.1",
}));

export default useData;
