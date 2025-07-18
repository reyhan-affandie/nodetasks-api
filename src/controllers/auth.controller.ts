import { RequestHandler } from "express";
import createHttpError from "http-errors";
import { fields } from "@/models/users.model";

import bcrypt from "bcryptjs";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK, UNAUTHORIZED } from "@/constants/http";
import { generateShortToken, generateToken, getAuthUser } from "@/middleware/auth.middleware";
import { AuthRequest } from "@/types/types";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import { EMAIL_USER, EMAIL_PASS, CLIENT_ORIGIN, EMAIL_SERVER, APP_NAME, EMAIL_LOGO, NODE_ENV } from "@/constants/env";
import { engineCreateUpdate } from "@/middleware/engine.middleware";
import { hashPassword, validations } from "@/utils/utlis";
import prisma, { getPrismaModel } from "@/utils/prisma";

export const register: RequestHandler = async (req, res, next) => {
  const Model = "users";
  const model = getPrismaModel(Model);
  try {
    req.body.role = 3;
    if (!validations(fields, req)) return;
    const requestValues = await engineCreateUpdate(Model, fields, req, false);
    const data = await model.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: requestValues as any,
    });
    res.status(CREATED).json(data);
  } catch (error) {
    return next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  const requiredFields = ["email", "password"];
  const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === "");

  if (missingFields.length > 0) {
    throw createHttpError(BAD_REQUEST, `${missingFields.join(", ")} required`);
  }

  const { email, password } = req.body;
  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });
    if (!user || typeof user.password !== "string") {
      throw createHttpError(UNAUTHORIZED, "Invalid email or password.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError(UNAUTHORIZED, "Invalid email or password.");
    }

    const tokenPayload: AuthRequest = {
      id: user.id,
      email: String(user.email),
      name: String(user.name),
      phone: String(user.phone),
      photo: String(user.photo),
    };
    const token = generateToken(tokenPayload);
    res.status(CREATED).json({ ...tokenPayload, token });
  } catch (error) {
    return next(error);
  }
};

export const sendForgotPasswordEmail: RequestHandler = async (req, res, next) => {
  const requiredFields = ["email"];
  const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === "");

  if (missingFields.length > 0) {
    throw createHttpError(BAD_REQUEST, `${missingFields.join(", ")} required`);
  }
  const { email } = req.body;
  try {
    const user = await prisma.users.findFirst({
      where: {
        email,
      },
    });
    if (!user) {
      throw createHttpError(NOT_FOUND, "User not found");
    }

    const tokenPayload: AuthRequest = {
      id: user.id,
      email: String(user.email),
      name: String(user.name),
      phone: String(user.phone),
      photo: String(user.photo),
    };
    let clientOrigin = CLIENT_ORIGIN;
    if (NODE_ENV === "development") {
      clientOrigin = "http://localhost:4000";
    }
    const verifyLink = clientOrigin + "/forgot-password/" + generateShortToken(tokenPayload);

    const transporter = nodemailer.createTransport({
      host: EMAIL_SERVER, 
      port: 587,
      secure: false,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: APP_NAME,
        link: clientOrigin,
        logo: EMAIL_LOGO,
        logoHeight: "200px",
        copyright: `Copyright © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.`,
      },
    });

    const emailContent = {
      body: {
        name: String(user.name),
        intro: "We received a request to reset your password.",
        action: {
          instructions: "Click the button below to reset your password:",
          button: {
            color: "#007bff",
            text: "Reset Password",
            link: verifyLink,
          },
        },
        outro: "If you did not request this, you can ignore this email.",
      },
    };

    const emailHtml = mailGenerator.generate(emailContent);
    await transporter.sendMail({
      from: `${APP_NAME} <${EMAIL_USER}>`,
      to: String(user.email),
      subject: "Reset Password Request",
      html: emailHtml,
    });
    res.status(OK).json({ message: "Reset password email sent successfully" });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword: RequestHandler = async (req, res, next) => {
  try {
    const requiredFields = ["password"];
    const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === "");

    if (missingFields.length > 0) {
      throw createHttpError(BAD_REQUEST, `${missingFields.join(", ")} required`);
    }

    const { password } = req.body;
    const user = await getAuthUser(req);
    await prisma.users.update({
      data: {
        password: await hashPassword(password),
      },
      where: { id: Number(user.id) },
    });
    await prisma.blacklists.create({
      data: {
        token: req.headers.authorization,
      },
    });

    const tokenPayload: AuthRequest = {
      id: user.id,
      email: String(user.email),
      name: String(user.name),
      phone: String(user.phone),
      photo: String(user.photo),
    };
    const token = generateToken(tokenPayload);
    res.status(OK).json({ ...tokenPayload, token });
  } catch (error) {
    return next(error);
  }
};

export const updatePassword: RequestHandler = async (req, res, next) => {
  const requiredFields = ["oldPassword", "password"];
  const missingFields = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === "");

  if (missingFields.length > 0) {
    throw createHttpError(BAD_REQUEST, `${missingFields.join(", ")} required`);
  }
  const { oldPassword, password } = req.body;
  try {
    const user = await getAuthUser(req);
    const isPasswordValid = await bcrypt.compare(oldPassword, String(user.password));
    if (!isPasswordValid) {
      throw createHttpError(UNAUTHORIZED, "Invalid old password");
    }
    await prisma.users.update({
      data: {
        password: await hashPassword(password),
      },
      where: { id: Number(user.id) },
    });
    await prisma.blacklists.create({
      data: {
        token: req.headers.authorization,
      },
    });
    const tokenPayload: AuthRequest = {
      id: user.id,
      email: String(user.email),
      name: String(user.name),
      phone: String(user.phone),
      photo: String(user.photo),
    };
    const token = generateToken(tokenPayload);
    res.status(OK).json({ ...tokenPayload, token });
  } catch (error) {
    return next(error);
  }
};

export const get: RequestHandler = async (req, res, next) => {
  try {
    const user = await getAuthUser(req, true);
    res.status(OK).json(user);
  } catch (error) {
    return next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const user = await getAuthUser(req);
    const tokenPayload: AuthRequest = {
      id: user.id,
      email: String(user.email),
      name: String(user.name),
      phone: String(user.phone),
      photo: String(user.photo),
    };
    await prisma.blacklists.create({
      data: {
        token: req.headers.authorization,
      },
    });
    res.status(CREATED).json({ ...tokenPayload, token: generateToken(tokenPayload) });
  } catch (error) {
    return next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const user = await getAuthUser(req);
    await prisma.blacklists.create({
      data: {
        token: req.headers.authorization,
      },
    });
    res.status(OK).json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      message: "logout successful",
    });
  } catch (error) {
    return next(error);
  }
};
