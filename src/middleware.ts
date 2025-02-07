import { JWT_PASSWORD } from "./config";
import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

export const userMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["authorization"];

  const decoded = jwt.verify(token as string, JWT_PASSWORD);

  if (decoded) {
    //@ts-ignore
    req.userId = decoded.id;
    next();
  } else {
    res.status(403).json("You are not logged in");
  }
};
