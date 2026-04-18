import { Router } from "express";
import { clientsRouter } from "./clients.js";
import { generateProtocolRouter } from "./generateProtocol.js";
import { recoveryRouter } from "./recovery.js";

export const apiRouter = Router();

apiRouter.use(generateProtocolRouter);
apiRouter.use(recoveryRouter);
apiRouter.use(clientsRouter);
