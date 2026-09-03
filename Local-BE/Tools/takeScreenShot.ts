import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// Takes a screenshot using native Windows PowerShell / GDI+
const takeScreenshot = async (
  outputPath?: string
): Promise<{
  imageBuffer: Buffer;
  success: boolean;
  error?: string;
}> => {
  return new Promise((resolve) => {
    try {
      const filename =
        outputPath ||
        path.join(os.tmpdir(), `nexus_screen_${Date.now()}.png`);

      // PowerShell script using built-in .NET System.Drawing & Windows.Forms
      const psScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$bitmap.Save('${filename.replace(/\\/g, "\\\\")}', [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
`.trim();

      const encodedCommand = Buffer.from(psScript, "utf16le").toString("base64");

      exec(
        `powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encodedCommand}`,
        (error) => {
          if (error) {
            console.error("[SCREENSHOT ERROR]", error);
            return resolve({
              imageBuffer: Buffer.from("", "base64"),
              success: false,
              error: `[SCREENSHOT ERROR] ${error.message || String(error)}`,
            });
          }

          try {
            if (fs.existsSync(filename)) {
              const imgBuffer = fs.readFileSync(filename);

              // Clean up temporary file if no custom outputPath was requested
              if (!outputPath) {
                try {
                  fs.unlinkSync(filename);
                } catch {}
              }

              console.log(
                `[SCREENSHOT ${new Date().toISOString()}] Captured successfully (${(
                  imgBuffer.length / 1024
                ).toFixed(1)} KB)`
              );
              return resolve({ imageBuffer: imgBuffer, success: true });
            } else {
              return resolve({
                imageBuffer: Buffer.from("", "base64"),
                success: false,
                error: "[SCREENSHOT ERROR] Screenshot file was not created",
              });
            }
          } catch (readErr: any) {
            return resolve({
              imageBuffer: Buffer.from("", "base64"),
              success: false,
              error: `[SCREENSHOT ERROR] Failed to read screenshot: ${readErr.message}`,
            });
          }
        }
      );
    } catch (err: any) {
      console.error("[SCREENSHOT ERROR]", err);
      return resolve({
        imageBuffer: Buffer.from("", "base64"),
        success: false,
        error: `[SCREENSHOT ERROR] ${err.message || String(err)}`,
      });
    }
  });
};

const imageCapture = async () => {
  try {
    const { imageBuffer, success, error } = await takeScreenshot();
    if (!success || !imageBuffer || error) {
      return { success: false, data: null, error: error || "" };
    }
    return { success: true, data: imageBuffer, msg: "Image is Captured" };
  } catch (error: any) {
    return { success: false, data: null, error: error.message || "" };
  }
};

export { imageCapture, takeScreenshot };
