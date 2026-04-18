import { Router, type Request, type Response } from "express";

export const generateProtocolRouter = Router();

function notImplemented(_req: Request, res: Response) {
  res.status(501).json({
    error: "not_implemented",
    message: "This endpoint is not wired up yet.",
  });
}

generateProtocolRouter.post("/generate-protocol", notImplemented);
generateProtocolRouter.post("/assessment", notImplemented);
