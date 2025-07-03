import { auth } from "@/swaggers/auth.docs";
import swaggerSpec from "@/swaggers/swagger";
import swaggerUi from "swagger-ui-express";
import express from "express";

const app = express();
export const enforceAuthOnSwagger = (): void => {
  if (auth?.paths) {
    Object.keys(auth.paths).forEach((path: string) => {
      if (!path.includes("/api/auth/login") && !path.includes("/api/auth/register")) {
        const pathObj = auth.paths[path];
        Object.keys(pathObj).forEach((method: string) => {
          if (!pathObj[method].security) {
            pathObj[method].security = [{ BearerAuth: [] }];
          }
        });
      }
    });
    console.log("Swagger security updated: Auth required for all endpoints except login and register");
  }
};

// Middleware to dynamically update token in Swagger documentation
export const updateSwaggerSpec = (token: string): void => {
  if (token && auth?.paths) {
    auth.paths["/api/auth/login"].post.responses[201].content["text/plain"].schema.example = token;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (swaggerSpec as any).paths = { ...auth.paths };
    app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }
};
