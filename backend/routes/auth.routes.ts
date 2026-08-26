import express from "express";
import { authSignup, SignUp } from "../middlewares/auth/authUserSignup.js";
import {
  UserLogin,
  userAuthentication,
} from "../middlewares/auth/authUserLogin.js";
const router = express.Router();

router.post("/login", UserLogin);
router.post("/signup", authSignup, SignUp);
export default router;
