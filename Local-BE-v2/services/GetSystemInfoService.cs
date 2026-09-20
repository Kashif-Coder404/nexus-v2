namespace Nexus.Agent.Services;

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using LibreHardwareMonitor.Hardware;

public static class SystemInfoService
{
    private static readonly Computer _computer = new()
    {
        IsCpuEnabled = true,
        IsGpuEnabled = true,
        IsMemoryEnabled = true,
        IsMotherboardEnabled = true,
        IsStorageEnabled = true,
        IsNetworkEnabled = true,
        IsControllerEnabled = true
    };

    private static readonly object _lock = new();
    private static bool _isOpen = false;

    static SystemInfoService()
    {
        try
        {
            _computer.Open();
            _isOpen = true;
        }
        catch { }
    }

    private static bool TryGetSensorValue(ISensor s, out float val)
    {
        if (s.Value is { } v && !float.IsNaN(v) && !float.IsInfinity(v))
        {
            val = v;
            return true;
        }
        val = 0;
        return false;
    }

    public static string GetSystemInfoJson()
    {
        var data = GetSystemInfoData();
        return JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            WriteIndented = true,
            NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowNamedFloatingPointLiterals
        });
    }

    public static Dictionary<string, object?> GetSystemInfoData()
    {
        var result = new Dictionary<string, object?>();

        lock (_lock)
        {
            if (!_isOpen)
            {
                try { _computer.Open(); _isOpen = true; } catch { }
            }

            // Default fallbacks matching the exact telemetry schema
            result["cpu_usage"] = 0.0;
            result["cpu_temp"] = 0.0;
            result["cpu_load"] = 0.0;
            result["cpu_power"] = 0.0;
            result["cpu_clock_ghz"] = 0.0;
            result["cpu_voltage"] = 0.0;
            result["cpu_fan_rpm"] = 0;
            result["cpu_fan_pct"] = 0;

            result["gpu_temp"] = 0.0;
            result["gpu_hotspot"] = 0.0;
            result["gpu_load"] = 0.0;
            result["gpu_power"] = 0.0;
            result["gpu_vram_used"] = 0.0;
            result["gpu_vram_total"] = 0.0;
            result["gpu_fan_rpm"] = 0;
            result["gpu_fan_pct"] = 0;
            result["gpu_clock_mhz"] = 0.0;
            result["gpu_memory_clock_mhz"] = 0.0;
            result["gpu_voltage"] = 0.0;

            result["ram_usage"] = 0.0;
            result["ram_used_gb"] = 0.0;
            result["ram_avail_gb"] = 0.0;

            result["disk_usage"] = 0.0;
            result["nvme_temp"] = 0.0;
            result["nvme_used_pct"] = 0.0;

            result["net_up_mbps"] = 0.0;
            result["net_down_mbps"] = 0.0;
            result["net_up_str"] = "0.0 KB/s";
            result["net_down_str"] = "0.0 KB/s";

            result["uptime_hours"] = Math.Round(TimeSpan.FromMilliseconds(Environment.TickCount64).TotalHours, 2);

            result["motherboard_system_temp"] = 0.0;
            result["motherboard_vrm_temp"] = 0.0;
            result["motherboard_pch_temp"] = 0.0;

            var systemFans = new List<Dictionary<string, object>>();
            var disks = new List<Dictionary<string, object>>();

            try
            {
                foreach (var hardware in _computer.Hardware)
                {
                    hardware.Update();

                    // 1. CPU (e.g. AMD Ryzen 5 5500)
                    if (hardware.HardwareType == HardwareType.Cpu)
                    {
                        foreach (var s in hardware.Sensors)
                        {
                            if (!TryGetSensorValue(s, out float val)) continue;

                            if (s.SensorType == SensorType.Load && s.Name.Contains("Total"))
                            {
                                result["cpu_usage"] = Math.Round(val, 1);
                                result["cpu_load"] = Math.Round(val, 1);
                            }
                            else if (s.SensorType == SensorType.Temperature && (s.Name.Contains("Core Max") || s.Name.Contains("Package") || s.Name.Contains("Tctl")))
                            {
                                if (val > 0) result["cpu_temp"] = Math.Round(val, 1);
                            }
                            else if (s.SensorType == SensorType.Power && s.Name.Contains("Package"))
                            {
                                result["cpu_power"] = Math.Round(val, 1);
                            }
                            else if (s.SensorType == SensorType.Clock && s.Name.Contains("Core #1"))
                            {
                                result["cpu_clock_ghz"] = Math.Round(val / 1000.0, 2);
                            }
                            else if (s.SensorType == SensorType.Voltage && s.Name.Contains("Core"))
                            {
                                result["cpu_voltage"] = Math.Round(val, 2);
                            }
                            else if (s.SensorType == SensorType.Fan && s.Name.Contains("CPU"))
                            {
                                result["cpu_fan_rpm"] = (int)val;
                            }
                        }
                    }

                    // 2. GPU (e.g. AMD Radeon RX 6500 XT / Nvidia / Intel)
                    if (hardware.HardwareType == HardwareType.GpuNvidia ||
                        hardware.HardwareType == HardwareType.GpuAmd ||
                        hardware.HardwareType == HardwareType.GpuIntel)
                    {
                        foreach (var s in hardware.Sensors)
                        {
                            if (!TryGetSensorValue(s, out float val)) continue;

                            if (s.SensorType == SensorType.Temperature && s.Name.Equals("GPU Core", StringComparison.OrdinalIgnoreCase))
                                result["gpu_temp"] = Math.Round(val, 1);
                            else if (s.SensorType == SensorType.Temperature && s.Name.Contains("Hot Spot"))
                                result["gpu_hotspot"] = Math.Round(val, 1);
                            else if (s.SensorType == SensorType.Load && s.Name.Contains("Core"))
                                result["gpu_load"] = Math.Round(val, 1);
                            else if (s.SensorType == SensorType.Power)
                                result["gpu_power"] = Math.Round(val, 1);
                            else if (s.SensorType == SensorType.SmallData && s.Name.Contains("Memory Used"))
                                result["gpu_vram_used"] = Math.Round(val / 1024.0, 2);
                            else if (s.SensorType == SensorType.SmallData && s.Name.Contains("Memory Total"))
                                result["gpu_vram_total"] = Math.Round(val / 1024.0, 2);
                            else if (s.SensorType == SensorType.Fan)
                                result["gpu_fan_rpm"] = (int)val;
                            else if (s.SensorType == SensorType.Control)
                                result["gpu_fan_pct"] = (int)val;
                            else if (s.SensorType == SensorType.Clock && s.Name.Contains("Core"))
                                result["gpu_clock_mhz"] = (int)val;
                            else if (s.SensorType == SensorType.Clock && s.Name.Contains("Memory"))
                                result["gpu_memory_clock_mhz"] = (int)val;
                            else if (s.SensorType == SensorType.Voltage)
                                result["gpu_voltage"] = Math.Round(val, 3);
                        }
                    }

                    // 3. RAM (Memory)
                    if (hardware.HardwareType == HardwareType.Memory)
                    {
                        foreach (var s in hardware.Sensors)
                        {
                            if (!TryGetSensorValue(s, out float val)) continue;

                            if (s.SensorType == SensorType.Data && s.Name.Contains("Memory Used"))
                                result["ram_used_gb"] = Math.Round(val, 1);
                            else if (s.SensorType == SensorType.Data && s.Name.Contains("Memory Available"))
                                result["ram_avail_gb"] = Math.Round(val, 1);
                            else if (s.SensorType == SensorType.Load && s.Name.Contains("Memory"))
                                result["ram_usage"] = Math.Round(val, 1);
                        }
                    }

                    // 4. Motherboard & Fans
                    if (hardware.HardwareType == HardwareType.Motherboard)
                    {
                        foreach (var subHw in hardware.SubHardware)
                        {
                            subHw.Update();
                            foreach (var s in subHw.Sensors)
                            {
                                if (!TryGetSensorValue(s, out float val)) continue;

                                if (s.SensorType == SensorType.Temperature)
                                {
                                    if (s.Name.Contains("System")) result["motherboard_system_temp"] = Math.Round(val, 1);
                                    else if (s.Name.Contains("VRM") || s.Name.Contains("MOS")) result["motherboard_vrm_temp"] = Math.Round(val, 1);
                                    else if (s.Name.Contains("PCH") || s.Name.Contains("Chipset")) result["motherboard_pch_temp"] = Math.Round(val, 1);
                                }
                                else if (s.SensorType == SensorType.Fan)
                                {
                                    systemFans.Add(new Dictionary<string, object>
                                    {
                                        ["name"] = s.Name,
                                        ["rpm"] = (int)val,
                                        ["pct"] = 0
                                    });
                                }
                            }
                        }
                    }

                    // 5. Storage (NVMe / SSD)
                    if (hardware.HardwareType == HardwareType.Storage)
                    {
                        var diskEntry = new Dictionary<string, object> { ["name"] = hardware.Name };
                        foreach (var s in hardware.Sensors)
                        {
                            if (!TryGetSensorValue(s, out float val)) continue;

                            if (s.SensorType == SensorType.Temperature)
                            {
                                diskEntry["temp"] = Math.Round(val, 1);
                                result["nvme_temp"] = Math.Round(val, 1);
                            }
                            else if (s.SensorType == SensorType.Load && s.Name.Contains("Used"))
                            {
                                diskEntry["used_pct"] = Math.Round(val, 1);
                                result["nvme_used_pct"] = Math.Round(val, 1);
                            }
                        }
                        disks.Add(diskEntry);
                    }
                }
            }
            catch { }

            // 6. Native .NET Fallback for Disks & RAM (if hardware sensors are missing)
            if (disks.Count == 0)
            {
                foreach (var d in DriveInfo.GetDrives().Where(d => d.IsReady))
                {
                    double totalGb = Math.Round((double)d.TotalSize / (1024 * 1024 * 1024), 1);
                    double freeGb = Math.Round((double)d.AvailableFreeSpace / (1024 * 1024 * 1024), 1);
                    double usedPct = Math.Round((1.0 - ((double)d.AvailableFreeSpace / d.TotalSize)) * 100, 1);

                    disks.Add(new Dictionary<string, object>
                    {
                        ["name"] = string.IsNullOrWhiteSpace(d.VolumeLabel) ? d.Name : $"{d.VolumeLabel} ({d.Name})",
                        ["temp"] = 0,
                        ["used_pct"] = usedPct,
                        ["read_rate"] = "0.0 KB/s",
                        ["write_rate"] = "0.0 KB/s",
                        ["total_space"] = $"{totalGb} GB",
                        ["free_space"] = $"{freeGb} GB"
                    });
                }
            }

            result["system_fans"] = systemFans;
            result["disks"] = disks;
        }

        return result;
    }
}