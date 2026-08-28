import screenshot from "screenshot-desktop";

// Takes a screenshot and returns a Buffer (or saves to file)
const takeScreenshot = async (): Promise<{
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

const imageCapture = async () => {
  try {
    const { imageBuffer, success, error } = await takeScreenshot();
    if (!success || !imageBuffer || error)
      return { success: false, data: null, error: error || "" };
    return { success: true, data: imageBuffer, msg: "Image is Captured" };
  } catch (error: any) {
    return { success: false, data: null, error: error.message || "" };
  }
};
// (async () => {
//   const result = await imageCapture();
//   if (result.success) {
//     const base64 = result.data?.toString("base64");
//     console.log(result);
//   }
// })();
export { imageCapture, takeScreenshot };
