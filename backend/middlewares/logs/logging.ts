import { RequestHandler } from "express";

export const logging: RequestHandler = (req, res, next) => {
  next();
};

export const finalLog: RequestHandler = (req, res, next) => {
  next();
};
