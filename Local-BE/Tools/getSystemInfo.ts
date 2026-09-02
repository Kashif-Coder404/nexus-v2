import os from "os";

export default async function getSystemInfo() {
  try {
    const cpus = os.cpus();
    const totalMemBytes = os.totalmem();
    const freeMemBytes = os.freemem();
    const usedMemBytes = totalMemBytes - freeMemBytes;

    const info = {
      os: {
        platform: os.platform(),
        type: os.type(),
        release: os.release(),
        arch: os.arch(),
        hostname: os.hostname(),
        uptimeHours: (os.uptime() / 3600).toFixed(1),
      },
      cpu: {
        model: cpus.length > 0 ? cpus[0].model.trim() : "Unknown",
        cores: cpus.length,
        speedMHz: cpus.length > 0 ? cpus[0].speed : 0,
      },
      memory: {
        totalGB: (totalMemBytes / 1024 ** 3).toFixed(2) + " GB",
        freeGB: (freeMemBytes / 1024 ** 3).toFixed(2) + " GB",
        usedGB: (usedMemBytes / 1024 ** 3).toFixed(2) + " GB",
        usagePercentage:
          ((usedMemBytes / totalMemBytes) * 100).toFixed(1) + "%",
      },
      userInfo: {
        username: os.userInfo().username,
        homedir: os.homedir(),
      },
    };

    return {
      success: true,
      info: JSON.stringify(info, null, 2),
      error: "",
    };
  } catch (error: any) {
    return {
      success: false,
      info: "",
      error: "Failed to collect system info: " + error.message,
    };
  }
}
