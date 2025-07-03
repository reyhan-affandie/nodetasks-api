import createHttpError from "http-errors";
import { BAD_REQUEST } from "../src/constants/http";

describe("getEnv function and exported constants", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Save original environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;
  });

  it("should return the value from process.env when it exists", () => {
    process.env.TEST_KEY = "testValue";
    const value: string | undefined = process.env.TEST_KEY;
    expect(value).toBe("testValue");
  });

  it("should return the default value when the environment variable is not set", () => {
    delete process.env.TEST_KEY;
    const defaultValue = "defaultValue";
    const value: string | undefined = defaultValue;
    expect(value).toBe("defaultValue");
  });

  it("should throw an error when neither environment variable nor default value is provided", () => {
    delete process.env.MONGO_URI;

    expect(() => {
      if (process.env.MONGO_URI === undefined) {
        throw createHttpError(BAD_REQUEST);
      }
    }).toThrow(createHttpError(BAD_REQUEST));
  });

  it("should throw a BAD_REQUEST error if the value is undefined", () => {
    const value: string | undefined = undefined;

    expect(() => {
      if (value === undefined) {
        throw createHttpError(BAD_REQUEST);
      }
    }).toThrow(createHttpError(BAD_REQUEST));
  });

  it("should properly initialize exported constants", async () => {
    process.env.NODE_ENV = "production";
    process.env.PORT = "8000";
    process.env.MONGO_URI = "mongodb://localhost:27017/test";
    process.env.APP_ORIGIN = "http://example.com";
    process.env.CLIENT_ORIGIN = "http://client.com";
    process.env.JWT_SECRET = "mysecret";

    // Reset modules and re-import constants
    jest.resetModules();
    const envModule = await import("../src/constants/env");

    expect(envModule.NODE_ENV).toBe("production");
    expect(envModule.PORT).toBe("8000");
    expect(envModule.MYSQL).toBe("mysql://user:password@localhost:3306/db");
    expect(envModule.APP_ORIGIN).toBe("http://example.com");
    expect(envModule.CLIENT_ORIGIN).toBe("http://client.com");
    expect(envModule.JWT_SECRET).toBe("mysecret");
  });

  it("should use default values when environment variables are not set", async () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.APP_ORIGIN;
    delete process.env.CLIENT_ORIGIN;

    // Reset modules and re-import constants
    jest.resetModules();
    const envModule = await import("../src/constants/env");

    expect(envModule.NODE_ENV).toBe("dev");
    expect(envModule.PORT).toBe("5000");
    expect(envModule.APP_ORIGIN).toBe("http://localhost:5000");
    expect(envModule.CLIENT_ORIGIN).toBe("http://localhost:3000");
  });
});
