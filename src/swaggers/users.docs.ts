const moduleName = "users";
const moduleSingular = "user";
const tags = moduleName.toUpperCase();

export const users = {
  tags: [
    {
      name: tags,
      description: `API`,
    },
  ],
  paths: {
    [`/api/${moduleName}`]: {
      post: {
        tags: [tags],
        summary: `Create ${moduleName}`,
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
      get: {
        tags: [tags],
        summary: `Read ${moduleName} List`,
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            required: false,
            schema: {
              type: "integer",
              example: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page",
            required: false,
            schema: {
              type: "integer",
              example: 10,
            },
          },
          {
            name: "search",
            in: "query",
            description: "Search query string",
            required: false,
            schema: {
              type: "string",
            },
          },
          {
            name: "sort",
            in: "query",
            description: "Field to sort by",
            required: false,
            schema: {
              type: "string",
              example: "updatedAt",
            },
          },
          {
            name: "order",
            in: "query",
            description: "Order of sorting",
            required: false,
            schema: {
              type: "string",
              enum: ["asc", "desc"],
              example: "desc",
            },
          },
        ],
        responses: {},
      },
      patch: {
        tags: [tags],
        summary: `Update ${moduleName}`,
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  id: {
                    type: "integer",
                    description: `${moduleSingular} id*`,
                    example: 1,
                  },
                  photo: {
                    type: "string",
                    format: "binary",
                    description: "photo*",
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
      delete: {
        tags: [tags],
        summary: `Delete ${moduleName}`,
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  id: {
                    type: "integer",
                    description: `${moduleSingular} id*`,
                    example: 1,
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
    [`/api/${moduleName}/{id}`]: {
      get: {
        tags: [tags],
        summary: `Read ${moduleSingular} details`,
        parameters: [
          {
            name: "id",
            in: "path",
            description: `Unique ID of the ${moduleSingular}`,
            required: true,
            schema: {
              type: "integer",
              example: 1,
            },
          },
        ],
        responses: {},
      },
    },
    [`/api/${moduleName}/bulk`]: {
      delete: {
        tags: [tags],
        summary: `Delete Bulk ${moduleSingular}`,
        requestBody: {
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  ids: {
                    type: "array",
                    items: {
                      type: "integer",
                    },
                    description: [`Array of ${moduleSingular} id*`],
                    example: [1, 2],
                  },
                },
              },
            },
          },
        },
        responses: {},
      },
    },
  },
};
