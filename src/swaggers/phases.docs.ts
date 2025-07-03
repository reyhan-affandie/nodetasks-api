const moduleName = "phases";
const moduleSingular = "phase";
const tags = moduleName.toUpperCase();

export const phases = {
  tags: [
    {
      name: tags,
      description: "API",
    },
  ],
  paths: {
    [`/api/${moduleName}`]: {
      post: {
        tags: [tags],
        summary: `Create ${moduleName}`,
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    example: "To Do",
                  },
                },
                required: ["name"],
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
            schema: { type: "integer", example: 1 },
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page",
            schema: { type: "integer", example: 10 },
          },
          {
            name: "search",
            in: "query",
            description: "Search query string",
            schema: { type: "string" },
          },
          {
            name: "sort",
            in: "query",
            description: "Field to sort by",
            schema: { type: "string", example: "updatedAt" },
          },
          {
            name: "order",
            in: "query",
            description: "Order of sorting",
            schema: { type: "string", enum: ["asc", "desc"], example: "desc" },
          },
        ],
        responses: {},
      },
      patch: {
        tags: [tags],
        summary: `Update ${moduleName}`,
        requestBody: {
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  name: { type: "string", example: "Doing" },
                },
                required: ["id", "name"],
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
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                },
                required: ["id"],
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
            required: true,
            schema: { type: "integer", example: 1 },
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
          required: true,
          content: {
            "application/x-www-form-urlencoded": {
              schema: {
                type: "object",
                properties: {
                  ids: {
                    type: "string",
                    example: "1,2,3",
                    description: "Comma separated list of IDs",
                  },
                },
                required: ["ids"],
              },
            },
          },
        },
        responses: {},
      },
    },
  },
};
