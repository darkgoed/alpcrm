import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { join } from 'path';

interface RawBodyRequest extends express.Request {
  rawBody?: Buffer;
}

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  // Servir uploads de mídia como arquivos estáticos
  app.use('/api/uploads', express.static(join(process.cwd(), 'uploads')));

  // Capturar rawBody para validação de assinatura do webhook da Meta
  app.use(
    express.json({
      verify: (req: RawBodyRequest, _res, buf) => {
        req.rawBody = buf;
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true; // allow all when not set (dev-friendly)
  app.enableCors({ origin: corsOrigin, credentials: true });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`CRM Backend rodando em http://localhost:${port}/api`);
}
void bootstrap();
