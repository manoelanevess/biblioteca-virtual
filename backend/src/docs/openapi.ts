import swaggerJsdoc from 'swagger-jsdoc'

export const openApiDocument = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Biblioteca Virtual API',
      version: '0.1.0',
      description: 'API da biblioteca virtual.',
    },
    servers: [
      {
        url: 'http://localhost:3333',
        description: 'Ambiente local',
      },
    ],
  },
  apis: ['./src/routes/**/*.ts'],
})
