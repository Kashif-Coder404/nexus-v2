import screenshot from "screenshot-desktop";

// Takes a screenshot and returns a Buffer (or saves to file)
export const captureScreen = async (): Promise<{
  imageBuffer: Buffer;
  success: boolean;
  error?: string;
}> => {
  try {
    const filename = "screenshot.png";
    await screenshot({ filename });
    console.log(`[SCREENSHOT ${new Date()}] Saved to ${filename}`);
    // Return image Buffer directly
    const imgBuffer = await screenshot({ format: "png" });
    return { imageBuffer: imgBuffer, success: true };
  } catch (error: any) {
    console.error("[SCREENSHOT ERROR] ", error);
    return {
      imageBuffer: Buffer.from("", "base64"),
      success: false,
      error: "[SCREENSHOT ERROR] " + (error || ""),
    };
  }
};
