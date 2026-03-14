import "./load-env";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import routes from "./routes";

const app = express();

const corsOptions: { origin: boolean | string | string[]; credentials: boolean } = {
  credentials: true,
  origin:
    config.nodeEnv === "production" && config.corsOrigin
      ? config.corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
      : true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api", routes);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
