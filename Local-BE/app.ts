import express from "express";
import cors from "cors";
import router from "./routes/cmd.route";
import path from "path";
import {
  generatePairingCode,
  forceNewPairingCode,
  readDeviceTokenFile,
  isConnectedToBackend,
  pairingMessage,
} from "./services/ws.service";

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
    return res.sendFile(path.join(process.cwd(), "paringcode.html"));
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

export default app;
