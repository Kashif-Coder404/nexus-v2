import express from "express";
import {
  renameDeviceHandler,
  getDevicesHandler,
} from "../controllers/device.controller.js";
const router = express.Router();

router.post("/rename", renameDeviceHandler);
router.get("/get", getDevicesHandler);

export default router;
