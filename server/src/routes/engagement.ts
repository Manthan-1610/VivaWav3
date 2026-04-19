import { Router, Request, Response } from "express";
import { getEngagement } from "../services/sessionStore.js";

export const engagementRouter = Router();

engagementRouter.get("/:userId", (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const data = getEngagement(userId);
    return res.json({ ok: true, engagement: data });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Failed to fetch engagement" });
  }
});
