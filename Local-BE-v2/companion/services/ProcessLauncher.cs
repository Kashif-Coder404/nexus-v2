using System.Collections.Concurrent;
using System.Diagnostics;
using Nexus.Agent.Models;
namespace Nexus.Agent.Services;

public static class ProcessLauncher
{

    public static readonly ConcurrentDictionary<int, Process> ActiveProcess = new();

    public static async Task<List<AppProcess>> LaunchAndDetectAsync(
       ProcessStartInfo psi,
       int maxAttempts = 10,
       int delayMs = 500,
       HashSet<string>? ignoredNames = null)
    {
        var beforePids = Process.GetProcesses().Select(p => p.Id).ToHashSet();
        using var launcher = Process.Start(psi);
        var detectedList = new List<AppProcess>();
        for (int i = 0; i < maxAttempts; i++)
        {
            await Task.Delay(delayMs);
            var currentPids = Process.GetProcesses().Select(p => p.Id).ToHashSet();
            var newPids = currentPids.Except(beforePids).ToList();
            foreach (int pid in newPids)
            {
                try
                {
                    Process p = Process.GetProcessById(pid);
                    if (ignoredNames != null && ignoredNames.Contains(p.ProcessName))
                    {
                        continue;
                    }
                    if (!detectedList.Any(d => d.Pid == pid))
                    {
                        detectedList.Add(new AppProcess(p.ProcessName, pid, p.MainWindowTitle));
                    }
                }
                catch (ArgumentException) { }
            }
            if (detectedList.Count > 0) break;

        }
        return detectedList;
    }


}