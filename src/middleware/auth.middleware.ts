import { RequestHandler, Request } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET, NODE_ENV, REDIS_URL } from "@/constants/env";
import createHttpError from "http-errors";
import { FORBIDDEN, TOO_MANY_REQUESTS, UNAUTHORIZED } from "@/constants/http";
import { AuthRequest } from "@/types/types";
import { cleanupUploadedFiles } from "@/utils/utlis";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import prisma from "@/utils/prisma";

export const generateToken = (user: AuthRequest) => {
  const signedJwt = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      photo: user.photo,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
  return signedJwt;
};

export const generateShortToken = (user: AuthRequest) => {
  const signedJwt = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      photo: user.photo,
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
  return signedJwt;
};

export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      if (req.files) cleanupUploadedFiles(req);
      return next(createHttpError(UNAUTHORIZED, "Access Denied"));
    }

    const token = authorization.split(" ")[1];
    const blacklisted = await prisma.blacklists.findFirst({ where: { token: authorization } });

    if (blacklisted) {
      if (req.files) cleanupUploadedFiles(req);
      return next(createHttpError(UNAUTHORIZED, "Token revoked"));
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      name: string;
      phone: string;
      photo: string;
      iat: number;
      exp: number;
    };
    const user = await prisma.users.findUnique({
      where: { id: Number(decoded.id) },
      include: {
        role: {
          include: {
            privileges: {
              include: { feature: true },
            },
          },
        },
      },
    });

    if (!user || !user.role) {
      return next(createHttpError(UNAUTHORIZED, "User role not found"));
    }

    const routePath = req.baseUrl.replace("/api/", ""); // e.g., "roles"
    const method = req.method.toUpperCase(); // GET, POST, PATCH, DELETE

    const publicRoutes = ["auth"];
    if (publicRoutes.includes(routePath)) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
      };
      return next();
    }

    // Map method to permission
    const methodPermissionMap: Record<string, keyof typeof privilege> = {
      GET: "privilegeRead",
      POST: "privilegeCreate",
      PATCH: "privilegeUpdate",
      PUT: "privilegeUpdate",
      DELETE: "privilegeDelete",
    };

    const permissionKey = methodPermissionMap[method];

    const privilege = user.role.privileges.find((p) => p.feature.name.toLowerCase() === routePath.toLowerCase());

    if (!privilege || !privilege[permissionKey]) {
      return next(createHttpError(FORBIDDEN, "You do not have permission to access this resource"));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
    };

    next();
  } catch (err) {
    if (req.files) cleanupUploadedFiles(req);

    const errorMessage =
      (err as jwt.JsonWebTokenError).name === "TokenExpiredError"
        ? "Token expired"
        : (err as jwt.JsonWebTokenError).name === "JsonWebTokenError" && (err as Error).message === "jwt malformed"
          ? "Malformed token"
          : "Access Denied";

    return next(createHttpError(UNAUTHORIZED, errorMessage));
  }
};

export const verifyAuthorization = async (req: Request, authorization: string) => {
  const token = authorization.split(" ")[1];
  try {
    const res = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      name: string;
      phone: string;
      photo: string;
      iat: number;
      exp: number;
    };
    return res;
  } catch (err) {
    if (req.files) cleanupUploadedFiles(req);
    const errorMessage =
      (err as jwt.JsonWebTokenError).name === "TokenExpiredError"
        ? "Token expired"
        : (err as jwt.JsonWebTokenError).name === "JsonWebTokenError" && (err as Error).message === "jwt malformed"
          ? "Malformed token"
          : "Access Denied";

    throw createHttpError(UNAUTHORIZED, errorMessage);
  }
};

export const checkIsAdmin = async (req: Request): Promise<boolean> => {
  const decodedToken = await verifyAuthorization(req, req.headers.authorization);
  const user = await prisma.users.findUnique({
    where: { id: Number(decodedToken.id) },
    include: {
      role: true,
    },
  });
  if (!user) throw createHttpError(UNAUTHORIZED);
  return ["Super Admin", "Admin"].includes(user.role?.name || "");
};

export const getAuthUser = async (req: Request, withPrivileges = false) => {
  const decodedToken = await verifyAuthorization(req, req.headers.authorization);
  const user = await prisma.users.findUnique({
    where: { id: Number(decodedToken.id) },
    include: {
      role: withPrivileges
        ? {
            include: {
              privileges: {
                include: { feature: true },
              },
            },
          }
        : true,
    },
  });
  if (!user) throw createHttpError(UNAUTHORIZED);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (user as any).password;
  return user;
};

export const cleanUnexpectedFiles: RequestHandler = (req, res, next) => {
  if (req.files) {
    cleanupUploadedFiles(req);
    delete req.files;
  }
  next();
};

const redisClient = new Redis(REDIS_URL);

export const createRateLimiter = (options: { windowMs: number; max: number }) =>
  rateLimit({
    store: new RedisStore({
      sendCommand: async (...args: (string | Buffer)[]) => {
        return (await redisClient.call(...(args as [string, ...string[]]))) as unknown as Promise<string>;
      },
    }),
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
    handler: (req, res) => {
      res.status(TOO_MANY_REQUESTS).json({
        success: false,
        error: "Too many requests. Please wait before trying again.",
      });
    },
  });

let maxLimiter = 9999;
if (NODE_ENV === "production") {
  maxLimiter = 10;
}
// Example usage for login rate limiting
export const redisLimiter15 = createRateLimiter({ windowMs: 15 * 60 * 1000, max: maxLimiter });
