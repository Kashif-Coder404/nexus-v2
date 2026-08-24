// import { VolumeType } from "../AI/Types/ParserTypes.js";
import { executeCmd } from "../services/execute.service.js";

const volume = async (volumeType: any) => {
  const { action, times, level } = volumeType;

  const volumeActions: Record<string, () => Promise<any>> = {
    current_volume: async () => {
      return await executeCmd(
        `powershell -Command "Get-AudioDevice -PlaybackVolume"`,
      );
    },
    set_volume: async () => {
      if (level === undefined || level === null) {
        return {
          stdout: "",
          stderr: "ERROR: Please provide a volume level!",
        };
      }
      await executeCmd(
        `powershell -Command "Set-AudioDevice -PlaybackVolume ${level}"`,
      );
      const currentRes = await volumeActions.current_volume();
      return {
        stdout: `Volume set to: ${currentRes.stdout.trim()}`,
        stderr: currentRes.stderr,
      };
    },
    mute: async () => {
      return await executeCmd(
        `powershell -Command "Set-AudioDevice -PlaybackMute $true"`,
      );
    },
    unmute: async () => {
      return await executeCmd(
        `powershell -Command "Set-AudioDevice -PlaybackMute $false"`,
      );
    },
    volume_up: async () => {
      const currentRes = await volumeActions.current_volume();
      const currentVol: number = parseInt(
        currentRes.stdout.replace("%", "").trim(),
      );
      const newVol = Math.min(100, currentVol + times!);
      return await executeCmd(
        `powershell -Command "Set-AudioDevice -PlaybackVolume ${newVol < 0 ? 0 : newVol}"`,
      );
    },
    volume_down: async () => {
      const currentRes = await volumeActions.current_volume();
      const currentVol: number = parseInt(
        currentRes.stdout.replace("%", "").trim(),
      );
      const newVol = Math.max(0, currentVol - times!);
      return await executeCmd(
        `powershell -Command "Set-AudioDevice -PlaybackVolume ${newVol >= 0 ? newVol : 0}"`,
      );
    },
  };

  return await volumeActions[action]();
};

export default volume;
