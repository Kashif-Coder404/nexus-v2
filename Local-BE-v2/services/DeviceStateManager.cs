namespace Nexus.Agent.Services;

using System;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;

public static class DeviceStateManager
{
    private static readonly object _lock = new();

    public static bool IsServiceEnabled { get; set; } = true;
    public static bool IsConnectedToBackend { get; set; } = false;
    public static string? CurrentPairingCode { get; private set; }
    public static DateTime? CodeExpiresAt { get; private set; }
    public static string PairingError { get; set; } = "";
    public static DateTime? LastCodeGeneratedAt { get; set; }

    public static int CooldownSecondsRemaining
    {
        get
        {
            if (LastCodeGeneratedAt == null) return 0;
            var elapsed = (DateTime.UtcNow - LastCodeGeneratedAt.Value).TotalSeconds;
            return Math.Max(0, 15 - (int)elapsed);
        }
    }

    public static int RemainingSeconds
    {
        get
        {
            if (CodeExpiresAt == null) return 0;
            var remaining = (int)(CodeExpiresAt.Value - DateTime.UtcNow).TotalSeconds;
            return Math.Max(0, remaining);
        }
    }

    public static string GenerateNewPairingCode()
    {
        lock (_lock)
        {
            const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            var random = Random.Shared;
            char[] codeChars = new char[4];
            for (int i = 0; i < 4; i++)
            {
                codeChars[i] = chars[random.Next(chars.Length)];
            }
            CurrentPairingCode = "NX-" + new string(codeChars);
            CodeExpiresAt = DateTime.UtcNow.AddMinutes(5);
            LastCodeGeneratedAt = DateTime.UtcNow;
            return CurrentPairingCode;
        }
    }

    public static void ClearPairingCode()
    {
        lock (_lock)
        {
            CurrentPairingCode = null;
            CodeExpiresAt = null;
        }
    }

    public static string GetLocalIpAddress()
    {
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.OperationalStatus != OperationalStatus.Up ||
                    ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                    continue;

                var props = ni.GetIPProperties();
                foreach (var addr in props.UnicastAddresses)
                {
                    if (addr.Address.AddressFamily == AddressFamily.InterNetwork &&
                        !IPAddress.IsLoopback(addr.Address))
                    {
                        return addr.Address.ToString();
                    }
                }
            }
            return "127.0.0.1";
        }
        catch
        {
            return "127.0.0.1";
        }
    }
}
