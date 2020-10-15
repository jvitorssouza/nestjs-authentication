import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compareSync } from 'bcrypt';

import { IAuthenticationResponse } from '../interfaces/AuthenticationResponse';
import { IAuthenticationRequest } from '../interfaces/AuthenticationRequest';
import { FindUserByEmailService } from '../modules/users/services/find-user-by-email.service';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject('FindUserByEmailService')
    private readonly findUserByEmail: FindUserByEmailService,
    @Inject('JwtService') private readonly jwtService: JwtService,
  ) {}

  async execute({
    email,
    password,
  }: IAuthenticationRequest): Promise<IAuthenticationResponse> {
    try {
      const user = await this.findUserByEmail.execute(email);

      if (!user || !compareSync(password, user?.password)) {
        throw new UnauthorizedException('Usuário e/ou senha incorreto(s)!');
      }

      delete user.password;

      const payload = {
        user,
      };

      return { token: await this.jwtService.sign(payload) };
    } catch (error) {
      throw error;
    }
  }
}
