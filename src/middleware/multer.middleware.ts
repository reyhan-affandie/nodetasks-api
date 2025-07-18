import multer, { FileFilterCallback } from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import { BAD_REQUEST } from "@/constants/http";

const getDynamicDestination = (moduleName: string, type: string): string => {
  let basePath = "./public";
  const folder = moduleName === "auth" ? "users" : moduleName;

  basePath = `${basePath}/${type === "image" ? "images" : "files"}/${folder}`;

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  return basePath;
};

const dynamicFileFilter = (allowedFileType: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    const fileType = file.mimetype.split("/")[1];
    if (!allowedFileType.includes(fileType)) {
      cb(new Error("Unsupported file type"));
    } else {
      cb(null, true);
    }
  };
};

const getStorage = (type: "image" | "file") =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const moduleName = req.baseUrl.match(/\/api\/([a-zA-Z0-9]+)/)?.[1] || "default";
      const destinationPath = getDynamicDestination(moduleName, type);
      cb(null, destinationPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${uuidv4()}.${Date.now()}${ext}`);
    },
  });

export const multerMiddlewareImage = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
    storage: getStorage("image"),
    fileFilter: dynamicFileFilter(["jpg", "jpeg", "png"]),
  });

  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(BAD_REQUEST).json({ error: err.message });
    }
    if (!req.body) {
      req.body = {};
    }
    next();
  });
};

export const multerMiddlewareFile = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
      files: 5,
    },
    storage: getStorage("file"),
    fileFilter: dynamicFileFilter(["pdf", "octet-stream"]),
  });

  upload.any()(req, res, (err) => {
    if (err) {
      return res.status(BAD_REQUEST).json({ error: err.message });
    }
    if (!req.body) {
      req.body = {};
    }
    next();
  });
};

const dynamicTypeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("FIELD:", file.fieldname, "MIMETYPE:", file.mimetype, "ORIGINALNAME:", file.originalname);
    const moduleName = req.baseUrl.match(/\/api\/([a-zA-Z0-9]+)/)?.[1] || "default";
    let type = "file";
    if (file.mimetype === "application/pdf") {
      type = "file";
    } else if (file.mimetype.startsWith("image/")) {
      type = "image";
    }
    const dest = getDynamicDestination(moduleName, type);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}.${Date.now()}${ext}`);
  },
});

export const multerMiddlewareImageFile = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    limits: {
      fileSize: 100 * 1024 * 1024,
      files: 5,
    },
    storage: dynamicTypeStorage,
    fileFilter: (req, file, cb) => {
      const allowed = ["jpg", "jpeg", "png", "pdf"];
      const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
      if (!allowed.includes(ext)) {
        cb(new Error("Unsupported file type"));
      } else {
        cb(null, true);
      }
    },
  });

  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      return res.status(BAD_REQUEST).json({ error: err.message });
    }
    if (!req.body) {
      req.body = {};
    }
    next();
  });
};

export const ensureBodyExists = (req: Request, res: Response, next: NextFunction) => {
  if (!req.body) {
    req.body = {};
  }
  next();
};
