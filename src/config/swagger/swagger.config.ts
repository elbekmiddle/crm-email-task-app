import { INestApplication } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

export function setupSwagger(app: INestApplication): void {
  const configService = app.get(ConfigService)

  const apiPrefix = configService.get<string>('env.apiPrefix') ?? 'api/v1'

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CRM Email-to-Task API')
    .setDescription(
      'Inbound email -> AI classification -> multi-tenant CRM task automation',
    )
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-company-id',
        description: "Tenant company's Mongo _id (mock tenant resolution, see DESIGN.md)",
      },
      'company-id',
    )
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)

  SwaggerModule.setup(`${apiPrefix}/docs`, app, document)
}