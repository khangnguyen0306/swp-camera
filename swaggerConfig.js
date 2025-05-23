import dotenv from 'dotenv';
dotenv.config();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0', // Specification (optional, though recommended)
    info: {
      title: 'Camera Store API', // Title of the API
      version: '1.0.0', // Version of the API
      description: 'API documentation for the Camera Store application', // Description of the API
      contact: {
        name: 'Your Name or Company', // Your name or company name
        email: 'your.email@example.com', // Your email
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api`, // Base URL for the API, assuming API routes are prefixed with /api
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ProductType: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Brand: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            brand: { $ref: '#/components/schemas/Brand' },
            origin: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            categories: { type: 'array', items: { $ref: '#/components/schemas/ProductType' } },
            stock: { type: 'integer' },
            images: { type: 'array', items: { type: 'string' } },
            model: { type: 'string' },
            type: { type: 'string' },
            sensorType: { type: 'string' },
            megapixels: { type: 'number' },
            lensMount: { type: 'string' },
            videoResolution: { type: 'string' },
            connectivity: { type: 'array', items: { type: 'string' } },
            features: { type: 'array', items: { type: 'string' } },
            weight: { type: 'number' },
            dimensions: { type: 'string' },
            usageInstructions: { type: 'string' },
            certifications: { type: 'array', items: { type: 'string' } },
            warnings: { type: 'string' },
            rating: { type: 'number' },
            reviews: { type: 'array', items: { type: 'string' } }, // Assuming Review schema exists elsewhere
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            availabilityType: { type: 'string', enum: ['in_stock', 'pre_order'] },
            preOrderDeliveryTime: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Specify the paths to the API docs, relative to the location of the file where swagger-jsdoc is run
  apis: ['./routes/*.js', './controllers/*.js'], // Look for comments in route and controller files
};

export default swaggerOptions; 