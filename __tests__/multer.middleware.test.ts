import request from "supertest";
import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { errorHandler } from "../src/middleware/error.middleware";
import { multerMiddlewareImage, multerMiddlewareFile } from "../src/middleware/multer.middleware";
import { BAD_REQUEST } from "../src/constants/http";

const app = express();
const imageUploadPath = path.resolve("./public/images/default");
const fileUploadPath = path.resolve("./public/files/default");

// Helper function to ensure directories exist
beforeAll(() => {
  [imageUploadPath, fileUploadPath].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

// Cleanup directories after tests
afterAll(() => {
  [imageUploadPath, fileUploadPath].forEach((dir) => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

app.post(
  "/public/images",
  multerMiddlewareImage.single("file"), // Call .single('file') to create the middleware
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(BAD_REQUEST).json({ message: "Invalid file type or file not uploaded" });
      return;
    }
    res.status(200).json({ message: "File uploaded successfully", file: req.file });
  },
  errorHandler,
);

app.post(
  "/public/files",
  multerMiddlewareFile.single("file"), // Call .single('file') to create the middleware
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(BAD_REQUEST).json({ message: "Invalid file type or file not uploaded" });
      return;
    }
    res.status(200).json({ message: "File uploaded successfully", file: req.file });
  },
  errorHandler,
);

// Test cases
describe("Multer Middleware Unit Tests", () => {
  describe("Image public", () => {
    it("should successfully upload a valid image file", async () => {
      const response = await request(app).post("/public/images").attach("file", Buffer.from("test-image"), {
        filename: "test.png",
        contentType: "image/png",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("File uploaded successfully");
      expect(response.body.file).toBeDefined();
    });

    it("should reject unsupported file types", async () => {
      const response = await request(app).post("/public/images").attach("file", Buffer.from("invalid-file"), {
        filename: "test.pdf",
        contentType: "application/pdf", // Unsupported type for images
      });
      console.log("Response status:", response.status);
      console.log("Response body:", response.body);

      // Expect a 400 Bad Request response
      expect(response.status).toBe(BAD_REQUEST);

      // Verify the correct error message is returned
      expect(response.body).toHaveProperty("message", "Unsupported file type");
    });

    it("should enforce file size limits", async () => {
      const largeFile = Buffer.alloc(2 * 1024 * 1024); // 2MB

      const response = await request(app).post("/public/images").attach("file", largeFile, {
        filename: "large.png",
        contentType: "image/png",
      });

      expect(response.status).toBe(BAD_REQUEST);
      expect(response.body.message).toBe("File size too large");
    });
  });

  describe("File public", () => {
    it("should successfully upload a valid PDF file", async () => {
      const response = await request(app).post("/public/files").attach("file", Buffer.from("test-file"), {
        filename: "test.pdf",
        contentType: "application/pdf",
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("File uploaded successfully");
      expect(response.body.file).toBeDefined();
    });

    it("should reject unsupported file types", async () => {
      const response = await request(app).post("/public/images").attach("file", Buffer.from("invalid-file"), {
        filename: "test.pdf",
        contentType: "application/pdf", // Unsupported type for images
      });
      console.log("Response status:", response.status);
      console.log("Response body:", response.body);

      // Expect a 400 Bad Request response
      expect(response.status).toBe(BAD_REQUEST);

      // Verify the correct error message is returned
      expect(response.body).toHaveProperty("message", "Unsupported file type");
    });

    it("should enforce file size limits", async () => {
      const largeFile = Buffer.alloc(2 * 1024 * 1024); // 2MB

      const response = await request(app).post("/public/files").attach("file", largeFile, {
        filename: "large.pdf",
        contentType: "application/pdf",
      });

      expect(response.status).toBe(BAD_REQUEST);
      expect(response.body.message).toBe("File size too large");
    });
  });
});
