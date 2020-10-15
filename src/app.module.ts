import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import OrmConfig from '../ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { SharedModule } from '@shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(OrmConfig),
    SharedModule,
    AuthenticationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
