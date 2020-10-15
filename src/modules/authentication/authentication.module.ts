import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { AuthenticationConfig } from '@config/Authetication';

import { UsersModule } from './modules/users/users.module';
import { AuthenticationController } from './controllers/authentication.controller';
import { AuthenticationService } from './services/authentication.service';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: AuthenticationConfig.defaultStrategy,
    }),
    JwtModule.register({
      secret: AuthenticationConfig.secret,
      signOptions: { expiresIn: AuthenticationConfig.expiresIn },
    }),
    UsersModule,
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
})
export class AuthenticationModule {}
