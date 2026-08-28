import express from "express";
import { authSignup, SignUp } from "../middlewares/auth/authUserSignup.js";
import {
  UserLoginHandler,
  userAuthentication,
} from "../middlewares/auth/authUserLogin.js";
const router = express.Router();

router.post("/login", UserLoginHandler);
router.post("/signup", authSignup, SignUp);
export default router;
