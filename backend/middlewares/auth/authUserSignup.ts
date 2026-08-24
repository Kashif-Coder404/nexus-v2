import { NextFunction, Request, Response } from "express";
import { UserModel } from "../../db/schema/user-schema.js";
import { generateToken } from "../../services/jwt.service.js";

const authSignup = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body;
  if (!name) {
    return res.status(401).json({
      success: false,
      message: "Name is required!",
      data: null,
    });
  }
  if (!email) {
    return res.status(401).json({
      success: false,
      message: "Email is required!",
      data: null,
    });
  }
  if (!password) {
    return res.status(401).json({
      success: false,
      message: "Password is required!",
      data: null,
    });
  }
  if (!email.includes("@") || !email.includes(".") || email.includes(" ")) {
    return res.status(401).json({
      success: false,
      message: "Email is not Valid!",
      data: null,
    });
  }
  const user = await UserModel.findOne({ email });
  if (user) {
    return res.status(401).json({
      success: false,
      message: "User is already Exists!",
      data: null,
    });
  }
  next();
};

const SignUp = async (req: Request, res: Response) => {
  const user: any = await UserModel.create(req.body);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Failed to Create User!",
      data: null,
    });
  }
  const jwtToken: string | null = generateToken({ userId: user._id.toString() });
  if(!jwtToken){
    return res.status(401).json({
      success: false,
      message: "Failed to Generate JWT Token!",
      data: null,
    });
  }
  return res.status(200).json({
    success: true,
    message: "User is Created Sucecssfully!",
    data: {
      token: jwtToken,
      user: user,
    },
  });
};

export { authSignup, SignUp };
