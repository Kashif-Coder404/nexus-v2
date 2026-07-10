import { RequestHandler } from "express";

export const logging: RequestHandler = (req, res, next) => {
  const timeIso: string = new Date().toISOString();
  console.log(
    `[${timeIso}] | INFO | ${req.method} | ${req.url} | ${req.body?.message}`,
  );
  next();
};

export const finalLog: RequestHandler = (req, res, next) => {
  const timeIso: string | number = new Date().toISOString();
  console.log(`[${timeIso}] Responded with Status:`, res.statusCode);
  next();
};
