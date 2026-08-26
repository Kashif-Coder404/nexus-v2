import { NextFunction, Request, Response } from "express";
import { UserModel } from "../../db/schema/user-schema.js";
import { generateToken } from "../../services/jwt.service.js";

const authSignup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;
    if (!name) {
      throw { error: "Name is Required" };
    }
    if (!email) {
      throw { error: "Email is required" };
    }
    if (!password) {
      throw { error: "Password is required" };
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
  } catch (error: any) {
    if (error instanceof TypeError) {
      return res.status(401).json({
        success: false,
        message: "Invalid Payload!",
        data: null,
      });
    }
    return res.status(500).json({
      success: false,
      message: error.error || error.message,
      data: null,
    });
  }
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
  const jwtToken: string | null = generateToken({
    userId: user._id.toString(),
  });
  if (!jwtToken) {
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
