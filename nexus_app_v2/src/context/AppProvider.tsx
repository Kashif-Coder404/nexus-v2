import { AppContextType } from "@/types/AppContextTypes";
import { createContext } from "react";
export const AppContext = createContext<AppContextType | null>(null);
