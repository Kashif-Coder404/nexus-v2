"use client";
import Devices from "@/app/components/Devices";
import DevicesRedesign from "@/app/components/DevicesRedesign";
import { useDevices } from "@/app/store/useDevices";
import React from "react";

const DevicesPage = () => {
  const devices = useDevices((state) => state.devices);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="border-b border-brand-border/30 ">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Manage Your Devices
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Direct hardware telemetry and companion devices linked to your
          account.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-white">
          Connected Companions (
          <span className="text-brand-glow">{devices.length}</span>)
        </span>
      </div>

      <div className="flex flex-col justify-center items-center w-full">
        {devices.length === 0 ? (
          <p className="text-sm text-zinc-500">No devices connected.</p>
        ) : (
          <>
            {devices.map((el) => (
              // <Devices key={el.id} device={el} />
              <div className="flex">
                <DevicesRedesign key={el.id} device={el} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DevicesPage;
