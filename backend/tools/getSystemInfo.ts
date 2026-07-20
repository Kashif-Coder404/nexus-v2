import os from 'os';

export interface SystemInfo {
    platform: string;
    arch: string;
    cpu: {
        model: string;
        cores: number;
        speed: number;
    };
    memory: {
        total: number; // in bytes
        free: number;  // in bytes
        usagePercent: number;
    };
    uptime: number; // in seconds
}

export function getSystemInfo(): SystemInfo {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    return {
        platform: os.platform(),
        arch: os.arch(),
        cpu: {
            model: cpus.length > 0 ? cpus[0].model : 'Unknown',
            cores: cpus.length,
            speed: cpus.length > 0 ? cpus[0].speed : 0,
        },
        memory: {
            total: totalMemory,
            free: freeMemory,
            usagePercent: parseFloat(memoryUsagePercent.toFixed(2)),
        },
        uptime: os.uptime(),
    };
}
