const moduleName = "schedules";
const moduleSingular = "schedule";
const tags = moduleName.toUpperCase();

export const schedules = {
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
                  title: { type: "string", example: "Lunch Break" },
                  dataDate: { type: "string", format: "date", example: "2025-08-01" },
                  startTime: { type: "string", example: "12:00" },
                  endTime: { type: "string", example: "13:00" },
                },
                required: ["title", "dataDate", "startTime", "endTime"],
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
                  title: { type: "string", example: "Updated Schedule Title" },
                  dataDate: { type: "string", format: "date", example: "2025-08-01" },
                  startTime: { type: "string", example: "12:00" },
                  endTime: { type: "string", example: "13:00" },
                },
                required: ["id"],
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
