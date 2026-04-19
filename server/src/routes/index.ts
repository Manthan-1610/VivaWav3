import { Router } from "express";
import { clientsRouter } from "./clients.js";
import { generateProtocolRouter } from "./generateProtocol.js";
import { recoveryRouter } from "./recovery.js";
import { sessionRouter } from "./session.js";
import { engagementRouter } from "./engagement.js";

export const apiRouter = Router();

apiRouter.use(generateProtocolRouter);
apiRouter.use(recoveryRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/session", sessionRouter);
apiRouter.use("/engagement", engagementRouter);
