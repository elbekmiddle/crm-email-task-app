import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from 'src/app.module'
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter'
import { setupSwagger } from 'src/config/swagger/swagger.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.useGlobalFilters(new HttpExceptionFilter())

  const apiPrefix = config.get<string>('env.apiPrefix')

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix)
  }


  setupSwagger(app)

  const port = config.get<number>('env.port') ?? 8080

  await app.listen(port)




  console.log(`
🚀 CRM Task API started successfully

API:     http://localhost:${port}${apiPrefix ? `/${apiPrefix}` : ''}
Swagger: http://localhost:${port}/docs
`)
}

void bootstrap()