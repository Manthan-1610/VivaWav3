import { Router, type Request, type Response } from "express";

export const recoveryRouter = Router();

function notImplemented(_req: Request, res: Response) {
  res.status(501).json({
    error: "not_implemented",
    message: "This endpoint is not wired up yet.",
  });
}

recoveryRouter.get("/recovery/:userId", notImplemented);
