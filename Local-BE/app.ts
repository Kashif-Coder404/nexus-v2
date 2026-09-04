import express from "express";
import cors from "cors";
import router from "./routes/cmd.route";
import path from "path";
import fs from "fs";
import { isSea, getAsset } from "node:sea";
import {
  generatePairingCode,
  forceNewPairingCode,
  readDeviceTokenFile,
  isConnectedToBackend,
  pairingMessage,
  sendRevokeRequestToCloud,
} from "./services/ws.service";
import { uninstallNexus } from "./setupnexus";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use("/commands", router); // Temp usage

// Serve pairing setup page
const serveSetupPage = (req: express.Request, res: express.Response) => {
  try {
    if (isSea()) {
      const asset = getAsset("paringcode.html", "utf8");
      const html = typeof asset === "string" ? asset : Buffer.from(asset).toString("utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    }

    const localFilePath = path.join(__dirname, "paringcode.html");
    const cwdFilePath = path.join(process.cwd(), "paringcode.html");
    const targetPath = fs.existsSync(localFilePath) ? localFilePath : cwdFilePath;

    return res.sendFile(targetPath);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

app.get("/", serveSetupPage);
app.get("/login", serveSetupPage);
app.get("/setup", serveSetupPage);
app.get("/paring", serveSetupPage);

// API to get current status and pairing code
app.get("/api/pairing-status", async (req, res) => {
  try {
    const wsState = isConnectedToBackend;
    const pairingState = await generatePairingCode();
    const deviceData = await readDeviceTokenFile();

    return res.status(200).json({
      success: true,
      isConnected: wsState,
      isPaired: !!deviceData?.token,
      code: pairingState.code,
      expiresat: pairingState.expiresat,
      remainingSeconds: pairingState.remainingSeconds,
      pairingError: pairingMessage,
      message: pairingState.message,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error: " + error.message,
    });
  }
});

// Backwards compatibility alias
app.get("/getParingCode", async (req, res) => {
  try {
    const pairingState = await generatePairingCode();
    return res.status(200).json({
      success: true,
      hasCode: !!pairingState.code,
      code: pairingState.code,
      expiresat: pairingState.expiresat,
      remainingSeconds: pairingState.remainingSeconds,
      isConnected: pairingState.isConnected,
      message: pairingState.message,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// API to force generate a new pairing code
app.post("/api/generate-code", async (req, res) => {
  try {
    const newCodeData = await forceNewPairingCode();
    return res.status(200).json({
      success: true,
      ...newCodeData,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to generate pairing code",
    });
  }
});

// API to completely uninstall Nexus, unregister device, and stop service
app.post("/api/uninstall", async (req, res) => {
  try {
    console.log("[API] /api/uninstall requested.");

    // 1. Notify Cloud Backend to remove this device registration
    await sendRevokeRequestToCloud();

    // 2. Perform file & startup script removal
    const uninstallResult = await uninstallNexus();

    // 3. Respond to browser client
    res.status(200).json({
      success: true,
      message: uninstallResult.message,
    });

    // 4. Terminate process shortly after response is flushed
    setTimeout(() => {
      console.log("[SERVER] Exiting process after uninstallation.");
      process.exit(0);
    }, 1000);
  } catch (error: any) {
    console.error("[API UNINSTALL ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to uninstall: " + error.message,
    });
  }
});

export default app;
