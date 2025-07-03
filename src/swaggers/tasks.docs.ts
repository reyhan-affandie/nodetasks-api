const moduleName = "tasks";
const moduleSingular = "task";
const tags = moduleName.toUpperCase();

export const tasks = {
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
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  phaseId: { type: "integer", example: 1 },
                  name: { type: "string", example: "Setup project repository" },
                  description: { type: "string", example: "Initialize a new git repository and push the initial project structure." },
                  priority: { type: "integer", example: 3 },
                  image: { type: "string", format: "binary" },
                  file: { type: "string", format: "binary" },
                },
                required: ["phaseId", "name", "description", "priority"],
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
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  phaseId: { type: "integer", example: 2 }, // Allowed, as per your sample
                  name: { type: "string", example: "Updated Task Name" },
                  description: { type: "string", example: "Updated description of the task." },
                  priority: { type: "integer", example: 2 },
                  image: { type: "string", format: "binary" },
                  file: { type: "string", format: "binary" },
                },
                required: ["id"],
              },
            },
          },
        },
        responses: {},
      },
      [`/api/${moduleName}/phase`]: {
        patch: {
          tags: [tags],
          summary: `Change ${moduleSingular} phase`,
          requestBody: {
            required: true,
            content: {
              "application/x-www-form-urlencoded": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    phase: { type: "integer", example: 2 },
                  },
                  required: ["id", "phase"],
                },
              },
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    phase: { type: "integer", example: 2 },
                  },
                  required: ["id", "phase"],
                },
              },
            },
          },
          responses: {},
        },
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
