import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { DatabaseService } from './database/database.service'
import { ValidationPipe } from '@nestjs/common'
import 'dotenv/config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  )

  const dbService = app.get(DatabaseService)
  await dbService.migrate()

  await app.listen(process.env.PORT || 3001)
}
bootstrap()
