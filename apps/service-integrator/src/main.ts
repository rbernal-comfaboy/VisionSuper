import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Prefijo global para coincidir con la configuración del Gateway
  app.setGlobalPrefix('api/v1/extraction');
  
  await app.listen(3000);
}
bootstrap();
