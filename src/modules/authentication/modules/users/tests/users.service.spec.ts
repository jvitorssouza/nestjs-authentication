import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';
import { name, internet } from 'faker/locale/pt_BR';
import { compareSync, hashSync } from 'bcrypt';

import { User } from '../infra/typeorm/entities/User';

import { UsersService } from '../services/users.service';

import {
  createMockRepository,
  MockRepository,
} from '@shared/infra/database/interfaces/MockRepository';
import { DocumentValidateService } from '@shared/utils/document-validate';
import createMockInstance from 'jest-create-mock-instance';

let mockedUsers: User[] = [];

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository;
  let documentValidate: DocumentValidateService;

  beforeAll(async () => {
    for (let i = 0; i < 100; i++) {
      mockedUsers = [
        ...mockedUsers,
        {
          id: uuidv4(),
          name: name.findName(),
          document: '00000000000',
          email: internet.email(),
          password: '123456',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
  });

  beforeEach(async () => {
    documentValidate = createMockInstance(DocumentValidateService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: DocumentValidateService,
          useValue: documentValidate,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<MockRepository>(getRepositoryToken(User));
  });

  afterEach(() => {
    usersRepository.find.mockClear();
    usersRepository.findAndCount.mockClear();
    usersRepository.findOne.mockClear();
    usersRepository.create.mockClear();
    usersRepository.save.mockClear();
    usersRepository.delete.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Find All', () => {
    it('Should return users without pagination and filters', async () => {
      usersRepository.find.mockReturnValue(mockedUsers);

      const user = await service.find({});

      expect(user).toEqual(mockedUsers);
    });

    it('Should return users paginated if pagination info was provided', async () => {
      const page = 1;
      const limit = 10;

      const paginatedUsers: [User[], number] = [
        mockedUsers.slice(page - 1, limit),
        mockedUsers.length,
      ];

      usersRepository.findAndCount.mockReturnValue(paginatedUsers);

      const user = await service.find({ page, limit });

      expect(user).toEqual(paginatedUsers);
    });

    it('Should return users filtered if filters are applied', async () => {
      const usersMatched = mockedUsers.filter(item =>
        item.name.includes('João '),
      );

      usersRepository.find.mockReturnValue(usersMatched);

      const user = await service.find({
        filter: { name: 'Joao' },
      });

      expect(user).toEqual(usersMatched);
    });
  });

  describe('Find One', () => {
    it('Should return user by ID', async () => {
      const index = 50;

      usersRepository.findOne.mockReturnValue(mockedUsers[index]);

      const user = await service.findOne(mockedUsers[index].id);

      expect(user.name).toEqual(mockedUsers[index].name);
    });

    it('Should throw NotFoundException if user by ID is not found', async () => {
      const index = 50;

      usersRepository.findOne.mockReturnValue(undefined);

      try {
        await service.findOne(mockedUsers[index].id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });

  describe('Create', () => {
    it('Should throw BadRequestException if document is invalid', async () => {
      const user: Partial<User> = {
        name: name.findName(),
        document: '00000000000',
        email: internet.email(),
        password: '123456',
      };

      documentValidate.execute = jest.fn().mockResolvedValue(false);

      usersRepository.find.mockReturnValue([]);

      try {
        await service.create(user);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });

    it('Should throw InternalServerErrorException if unique constraint is violated', async () => {
      const user: Partial<User> = {
        name: name.findName(),
        document: '58032508058',
        email: internet.email(),
        password: hashSync('123456', 12),
      };

      usersRepository.find.mockReturnValue(mockedUsers.slice(0, 4));

      try {
        await service.create(user);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('Should password be encrypted', async () => {
      const user: Partial<User> = {
        name: name.findName(),
        document: '23277728005',
        email: internet.email(),
        password: hashSync('123456', 12),
      };

      usersRepository.find.mockReturnValue([]);
      usersRepository.create.mockReturnValue(user);

      usersRepository.save.mockReturnValue({
        id: uuidv4(),
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      documentValidate.execute = jest.fn().mockResolvedValue(true);

      const newUser = await service.create(user);

      expect(compareSync('123456', newUser.password)).toBe(true);
    });

    it('Should create new user', async () => {
      const user: Partial<User> = {
        name: name.findName(),
        document: '23277728005',
        email: internet.email(),
        password: '123456',
      };

      usersRepository.find.mockReturnValue([]);

      documentValidate.execute = jest.fn().mockResolvedValue(true);

      usersRepository.create.mockReturnValue(user);

      usersRepository.save.mockReturnValue({
        id: uuidv4(),
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newUser = await service.create(user);

      expect(newUser).toHaveProperty('id');
      expect(newUser).toHaveProperty('createdAt');
      expect(newUser).toHaveProperty('updatedAt');
    });
  });

  describe('Update', () => {
    it('Should throw InternalServerErrorException if a new document is in use by another user', async () => {
      const user: Partial<User> = {
        id: uuidv4(),
        name: name.findName(),
        document: '58032508058',
        email: internet.email(),
        password: '123456',
      };

      usersRepository.find.mockReturnValue([
        {
          id: uuidv4(),
          name: name.findName(),
          document: '58032508058',
          email: internet.email(),
          password: '123456',
        },
      ]);

      usersRepository.create.mockReturnValue(user);

      usersRepository.save.mockReturnValue({
        id: uuidv4(),
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      try {
        await service.update(uuidv4(), user);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });

    it('Should throw InternalServerErrorException if a new email is in use by another user', async () => {
      const email = internet.email();

      const user: Partial<User> = {
        id: uuidv4(),
        name: name.findName(),
        document: '00000000000',
        email,
        password: '123456',
      };

      usersRepository.find.mockReturnValue([
        {
          id: uuidv4(),
          name: name.findName(),
          document: '58032508058',
          email,
          password: '123456',
        },
      ]);

      usersRepository.create.mockReturnValue(user);

      usersRepository.save.mockReturnValue({
        id: uuidv4(),
        ...user,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      try {
        await service.update(uuidv4(), user);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('Destroy', () => {
    it('Should throw NotFoundException if user not found', async () => {
      const id = 'abcd-123a-a5b6c-7d8e9';

      usersRepository.findOne.mockReturnValue(undefined);

      try {
        await service.destroy(id);
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });

    it('Should destroy user if user was found', async () => {
      const id = 'abcd-123a-a5b6c-7d8e9';

      const user = {
        id,
        name: name.findName(),
        document: '00000000000',
        email: internet.email(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      usersRepository.findOne.mockReturnValue(user);
      usersRepository.delete.mockReturnValue(user);

      const destroyed = await service.destroy(id);

      expect(destroyed).toEqual(user);
    });
  });
});
