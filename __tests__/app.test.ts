import { corsOptions } from "../src/app";

describe("CORS Options", () => {
  let allowedOrigins: string[];

  beforeEach(() => {
    // Reset the allowedOrigins before each test
    allowedOrigins = ["http://example.com", "http://allowed.com"];

    Object.defineProperty(global, "allowedOrigins", {
      value: allowedOrigins,
      writable: true,
    });
  });

  it("should allow requests with no origin (undefined)", () => {
    const callback = jest.fn();

    corsOptions.origin(undefined, callback);
    expect(callback).toHaveBeenCalledWith(null, true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should allow requests with a matching allowed origin", () => {
    const callback = jest.fn();
    const origin = "http://example.com";

    const corsOptionsWithMock = {
      ...corsOptions,
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void): void => {
        if (!origin) {
          callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS error: Origin ${origin} not allowed`));
        }
      },
    };

    corsOptionsWithMock.origin(origin, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should reject requests with an empty string origin", () => {
    const callback = jest.fn();
    const origin = "";

    corsOptions.origin(origin, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should reject requests from disallowed origins", () => {
    const callback = jest.fn();
    const origin = "http://notallowed.com";

    corsOptions.origin(origin, callback);

    expect(callback).toHaveBeenCalledWith(new Error(`CORS error: Origin ${origin} not allowed`));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle undefined allowed origins (edge case)", () => {
    const callback = jest.fn();
    const origin = "http://example.com";

    Object.defineProperty(global, "allowedOrigins", {
      value: undefined,
      writable: true,
    });

    corsOptions.origin(origin, callback);

    expect(callback).toHaveBeenCalledWith(new Error(`CORS error: Origin ${origin} not allowed`));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
