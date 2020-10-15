import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';

import { v4 as uuidv4 } from 'uuid';
import { name, internet } from 'faker/locale/pt_BR';

import createMockInstance from 'jest-create-mock-instance';

import { User } from '../modules/users/infra/typeorm/entities/User';

import { AuthenticationService } from '../services/authentication.service';
import { FindUserByEmailService } from '../modules/users/services/find-user-by-email.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let jwtService: JwtService;
  let findUserByEmailService: FindUserByEmailService;

  beforeEach(async () => {
    jwtService = createMockInstance(JwtService);
    findUserByEmailService = createMockInstance(FindUserByEmailService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: JwtService, useValue: jwtService },
        { provide: FindUserByEmailService, useValue: findUserByEmailService },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Execute', () => {
    it("Should throw UnauthorizedException if user or password wasn't match", async () => {
      findUserByEmailService.execute = jest.fn().mockResolvedValue(undefined);

      try {
        await service.execute({ email: 'email@email.com', password: '123456' });
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
      }
    });

    it('Should return token for logged user', async () => {
      const user: Partial<User> = {
        id: uuidv4(),
        name: name.findName(),
        email: internet.email(),
        document: '00000000000',
        password:
          '$2b$12$0scVnCvI1hBDVmL/X6WeOOjC0/KoHEQFSUj1nBryKOFLR3qyMuSxK',
      };

      findUserByEmailService.execute = jest.fn().mockResolvedValue(user);
      jwtService.sign = jest
        .fn()
        .mockResolvedValue(
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiQzIzNTQzM0UtRjM2Qi0xNDEwLTgxQjMtMDBGRkZGRkZGRkZGIiwibmFtZSI6IkZ1bGFubyBkZSBUYWwgZG9zIEFuesOzaXMiLCJkb2N1bWVudCI6IjYxODE3OTQ1MzAwIiwiZW1haWwiOiJ2aXRvcnNzb3V6YS5kZXYrNEBnbWFpbC5jb20ifSwiaWF0IjoxNjAxMDAwMDE2LCJleHAiOjE2MDIyOTYwMTZ9.8sMrg3dbh-gZRZldBxXeQHF7G-BMZkDMFbwAK47tW78',
        );

      const { token } = await service.execute({
        email: 'email@email.com',
        password: '123456',
      });

      expect(token).toBeDefined();
    });
  });
});
