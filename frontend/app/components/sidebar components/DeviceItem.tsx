import React from "react";
import { DropdownItem } from "../Dropdown";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
interface DeviceItemProps {
  data: {
    id: string;
    deviceName: string;
    online: boolean;
    service?: boolean;
  };
  onRevoke: (id: string) => void;
}

const DeviceItem = ({ data, onRevoke }: DeviceItemProps) => {
  const id = data.id;
  const name = data.deviceName;
  const online = data.online;
  const service = data.service;
  const router = useRouter();
  const handleSelectDevice = () => {
    router.push("/devices");
  };
  return (
    <DropdownItem className="group" key={id} onClick={handleSelectDevice}>
      <span
        className="font-semibold text-sm sm:text-base truncate max-w-[130px]"
        title={name}
      >
        {name}
      </span>
      <div className="flex items-center shrink-0">
        <span
          className={`text-xs shrink-0 transition-colors ${
            !online
              ? "text-red-500"
              : service === false
                ? "text-amber-400"
                : "text-emerald-400"
          }`}
        >
          {online === true && service === false ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {/* Paused */}
            </span>
          ) : online === true ? (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-caret-blink"></span>
              {/* Online */}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></span>
              {/* Offline */}
            </span>
          )}
        </span>
        <div className="md:w-0 md:opacity-0 w-7 group-hover:w-7 group-hover:opacity-100 group-hover:ml-1.5 overflow-hidden transition-all duration-200 ease-out flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRevoke(id);
            }}
            className="shrink-0 p-1 text-zinc-400 hover:text-rose-400 cursor-pointer transition-colors"
            title="Revoke / Delete device"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </DropdownItem>
  );
};

export default DeviceItem;
