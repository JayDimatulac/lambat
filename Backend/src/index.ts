import "dotenv/config";
import { app } from "./app";

const required = ["DATABASE_URL", "DIRECT_URL", "JWT_SECRET"];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}
if ((process.env.JWT_SECRET ?? "").length < 32) {
  console.error("JWT_SECRET is too short. Use at least 32 random characters.");
  process.exit(1);
}

const port = Number(process.env.PORT) || 4000;

app.listen(port, () => {
  console.log(`LAMBAT API running on http://localhost:${port}`);
});