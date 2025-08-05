import "tsconfig-paths/register";
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import Redis from "ioredis";
import createHttpError from "http-errors";
import auth from "@/routes/auth.route";
import roles from "@/routes/roles.route";
import features from "@/routes/features.route";
import privileges from "@/routes/privileges.route";
import users from "@/routes/users.route";
import dashboard from "@/routes/dashboard.route";
import priorities from "@/routes/priorities.route";
import phases from "@/routes/phases.route";
import tasks from "@/routes/tasks.route";
import events from "@/routes/events.route";
import schedules from "@/routes/schedules.route";
import { NOT_FOUND, OK } from "@/constants/http";
import { cleanUnexpectedFiles, isAuth } from "@/middleware/auth.middleware";
import { APP_ORIGIN, CLIENT_ORIGIN, NODE_ENV, REDIS_URL } from "@/constants/env";
import { errorHandler } from "@/middleware/error.middleware";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "@/swaggers/swagger";

const app = express();

// Add middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true, // Use default policy but can be customized further
      directives: {
        defaultSrc: ["'self'"], // Only allow rephases from the same origin
        scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts (if necessary)
        objectSrc: ["'none'"], // Disallow Flash or other plugin-based content
        imgSrc: ["'self'", "data:"], // Allow images from the same origin or inline
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles (if necessary)
        upgradeInsecureRequests: [], // Upgrade all HTTP requests to HTTPS
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true, // Apply to all subdomains
      preload: true, // Preload the domain in browsers' HSTS list
    },
    frameguard: {
      action: "sameorigin", // Prevent the page from being framed by other sites
    },
    xssFilter: true, // Enable XSS filter
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin", // Only send referrer information when crossing origins
    },
    dnsPrefetchControl: {
      allow: false, // Prevent DNS prefetching to reduce information leakage
    },
    crossOriginOpenerPolicy: {
      policy: "same-origin", // Prevent side-channel attacks by controlling the opening of cross-origin windows
    },
    crossOriginEmbedderPolicy: {
      policy: "require-corp", // Ensure cross-origin rephases are isolated
    },
  }),
);
app.use(morgan("dev"));

const redis = new Redis(REDIS_URL);
redis.config("SET", "proto-max-bulk-len", "20mb").catch((err) => {
  console.error("Redis Config Error:", err);
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const allowedOrigins = [APP_ORIGIN, CLIENT_ORIGIN];

if (NODE_ENV === "development") {
  allowedOrigins.push("http://localhost:4000");
  allowedOrigins.push("http://host.docker.internal:4000");
}

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS error: Origin ${origin} not allowed`));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With"],
  credentials: true,
};

app.use(cors(corsOptions));

app.set("trust proxy", 1);

// Auth routes
app.use("/api/auth", cleanUnexpectedFiles, auth);

// public routes
app.use("/public", express.static(path.resolve(__dirname, "../public")));

// Protected routes
app.use("/api/roles", isAuth, roles);
app.use("/api/features", isAuth, features);
app.use("/api/privileges", isAuth, privileges);
app.use("/api/users", isAuth, cleanUnexpectedFiles, users);
app.use("/api/dashboard", isAuth, dashboard);
app.use("/api/priorities", isAuth, priorities);
app.use("/api/phases", isAuth, phases);
app.use("/api/tasks", isAuth, cleanUnexpectedFiles, tasks);
app.use("/api/events", isAuth, events);
app.use("/api/schedules", isAuth, schedules);

if (NODE_ENV === "development") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.get("/health", (req, res) => {
  res.status(OK).send("OK");
});

// Error handler
app.use((req, res, next) => {
  return next(createHttpError(NOT_FOUND, "No API routes detected"));
});
app.use(errorHandler);

export default app;
