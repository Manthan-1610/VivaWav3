import { Router, type Request, type Response } from "express";

export const clientsRouter = Router();

function notImplemented(_req: Request, res: Response) {
  res.status(501).json({
    error: "not_implemented",
    message: "This endpoint is not wired up yet.",
  });
}

clientsRouter.get("/clients", notImplemented);
