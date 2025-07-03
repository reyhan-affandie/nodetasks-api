import dotenv from "dotenv";
import createHttpError from "http-errors";
import { BAD_REQUEST } from "@/constants/http";

const envFile = ".env";
dotenv.config({ path: envFile });

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (value === undefined) {
    /* istanbul ignore next */
    throw createHttpError(BAD_REQUEST);
  }

  return value;
};

export const NODE_ENV = getEnv("NODE_ENV").trim();
export const APP_NAME = getEnv("APP_NAME").replace("-"," ").trim();
export const APP_ORIGIN = getEnv("APP_ORIGIN").trim();
export const CLIENT_ORIGIN = getEnv("CLIENT_ORIGIN").trim();
export const REDIS_URL = getEnv("REDIS_URL").trim();
export const MYSQL = getEnv("MYSQL").trim();
export const JWT_SECRET = getEnv("JWT_SECRET").trim();
export const PORT = getEnv("PORT").trim();
export const EMAIL_SERVER = getEnv("EMAIL_SERVER").trim();
export const EMAIL_LOGO = getEnv("EMAIL_LOGO").trim();
export const EMAIL_USER = getEnv("EMAIL_USER").trim();
export const EMAIL_PASS = getEnv("EMAIL_PASS").trim();