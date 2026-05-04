import { Router, type IRouter } from "express";
import healthRouter from "./health";
import seedRouter from "./seed";
import missionsRouter from "./missions";
import driversRouter from "./drivers";
import sitesRouter from "./sites";
import generatorsRouter from "./generators";
import notificationsRouter from "./notifications";
import settingsRouter from "./settings";
import adminsRouter from "./admins";
import techniciansRouter from "./technicians";
import dashboardRouter from "./dashboard";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(seedRouter);
router.use(missionsRouter);
router.use(driversRouter);
router.use(sitesRouter);
router.use(generatorsRouter);
router.use(notificationsRouter);
router.use(settingsRouter);
router.use(adminsRouter);
router.use(techniciansRouter);
router.use(dashboardRouter);
router.use(storageRouter);

export default router;
