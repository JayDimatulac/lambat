import { Router } from "express";
import { requireCronSecret } from "../middleware/cronAuth";
import { raiseRiskNotices } from "../services/riskAlerts";

export const internalRouter = Router();

internalRouter.use(requireCronSecret);

// Called on a timer (see .github/workflows/risk-alerts.yml). Checks every active catch
// and raises the high-risk and critical notices, so people are warned without opening the app.
internalRouter.post("/risk-alerts", async (_req, res) => {
  const created = await raiseRiskNotices();
  console.log(`[cron] risk alerts: ${created} new notice(s)`);
  res.json({ ok: true, created });
});