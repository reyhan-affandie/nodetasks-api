const moduleName = "auth";
const tags = moduleName.toUpperCase();

export const auth = {
  tags: [
    {
      name: tags,
      description: `API`,
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      BearerAuth: [] as string[],
    },
  ],
  paths: {
    [`/api/${moduleName}/register`]: {
      post: {
        tags: [tags],
        summary: "Register",
        security: [] as string[],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  photo: {
                    type: "string",
                    format: "binary",
                    description: "photo*",
                  },
                  nik: {
                    type: "string",
                    description: "NIK*",
                    example: "123456789",
                  },
                  name: {
                    type: "string",
                    description: "Name*",
                    example: "Reyhan Emir Affandie",
                  },
                  email: {
                    type: "string",
                    format: "email",
                    description: "Email*",
                    example: "reyhanz1988@gmail.com",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    minLength: 6,
                    description: "Password*",
                    example: "admin1234",
                  },
                  phone: {
                    type: "string",
                    description: "Phone*",
                    example: "+6287778306720",
                  },
                  address: {
                    type: "string",
                    description: "Address*",
                    example: "Pondok Maharta, Jl Kemuning II Blok H3 No 31 Tangerang Selatan 15226",
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
    [`/api/${moduleName}/login`]: {
      post: {
        tags: [tags],
        summary: "Login",
        security: [] as string[],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "Email*",
                    example: "reyhanz1988@gmail.com",
                  },
                  password: {
                    type: "string",
                    description: "Password*",
                    example: "admin1234",
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
    [`/api/${moduleName}/password/verify`]: {
      post: {
        tags: [tags],
        summary: "Send forgot password email",
        security: [] as string[],
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  email: {
                    type: "string",
                    format: "email",
                    description: "Email*",
                    example: "reyhanz1988@gmail.com",
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
    [`/api/${moduleName}/password/forgot`]: {
      patch: {
        tags: [tags],
        summary: "Execute forgot password",
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  password: {
                    type: "string",
                    format: "password",
                    description: "Password*",
                    example: "admin1234",
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
    [`/api/${moduleName}/password/update`]: {
      patch: {
        tags: [tags],
        summary: "Update user password",
        description: "Change user password using old password to verify.",
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  oldPassword: {
                    type: "string",
                    format: "password",
                    description: "Password*",
                    example: "admin1234",
                  },
                  password: {
                    type: "string",
                    format: "password",
                    description: "Password*",
                    example: "admin1234",
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
    [`/api/${moduleName}`]: {
      get: {
        tags: [tags],
        summary: `Get ${moduleName} user.`,
        responses: {},
      },
    },
    [`/api/${moduleName}/refresh`]: {
      get: {
        tags: [tags],
        summary: "Refresh token.",
        responses: {},
      },
    },
    [`/api/${moduleName}/logout`]: {
      get: {
        tags: [tags],
        summary: "logout.",
        responses: {},
      },
    },
  },
};
