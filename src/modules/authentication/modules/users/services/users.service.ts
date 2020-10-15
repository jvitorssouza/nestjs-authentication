import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { hashSync } from 'bcrypt';
import { Repository } from 'typeorm';

import { User } from '../infra/typeorm/entities/User';
import { IFindAllEntity } from '@shared/infra/database/interfaces/FindAllEntity';
import { DocumentValidateService } from '@shared/utils/document-validate';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @Inject('DocumentValidateService')
    private readonly documentValidate: DocumentValidateService,
  ) {}

  async find({
    page,
    limit,
    filter,
  }: IFindAllEntity<User>): Promise<User[] | [User[], number]> {
    try {
      let users: User[] | [User[], number];

      if (page && limit) {
        users = await this.userRepo.findAndCount({
          where: {
            ...filter,
          },
          skip: (page - 1) * limit,
          take: limit,
        });
      }

      if (!page || !limit) {
        users = await this.userRepo.find({
          ...filter,
        });
      }

      return users;
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const user = await this.userRepo.findOne(id);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado!');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async create(data: Partial<User>): Promise<User> {
    try {
      const documentInserted: User[] = await this.userRepo.find({
        where: {
          document: data.document,
        },
      });

      if (documentInserted.length > 0) {
        throw new InternalServerErrorException(
          'O CPF/CNPJ indicado já está sendo utilizado por outro usuário!',
        );
      }

      if (!this.documentValidate.execute(data.document)) {
        throw new BadRequestException('O CPF/CNPJ informado é inválido!');
      }

      const emailInserted: User[] = await this.userRepo.find({
        where: {
          email: data.email,
        },
      });

      if (emailInserted.length > 0) {
        throw new InternalServerErrorException(
          'O email indicado já está sendo utilizado por outro usuário!',
        );
      }

      data.password = hashSync(data.password, 12);

      const create = await this.userRepo.create(data);
      const user = await this.userRepo.save(create);

      return user;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    try {
      const user = await this.userRepo.findOne(id);

      const documentInserted: User[] = await this.userRepo.find({
        where: {
          document: data.document,
        },
      });

      const isDocumentOfAnotherUser = documentInserted.findIndex(
        item => item.id !== data.id,
      );

      if (documentInserted.length > 0 && isDocumentOfAnotherUser > -1) {
        throw new InternalServerErrorException(
          'O CPF/CNPJ indicado já está sendo utilizado por outro usuário!',
        );
      }

      if (!this.documentValidate.execute(data.document)) {
        throw new BadRequestException('O CPF/CNPJ informado é inválido!');
      }

      const emailInserted: User[] = await this.userRepo.find({
        where: {
          email: data.email,
        },
      });

      const isEmailOfAnotherUser = documentInserted.findIndex(
        item => item.id !== data.id,
      );

      if (emailInserted.length > 0 && isEmailOfAnotherUser > -1) {
        throw new InternalServerErrorException(
          'O email indicado já está sendo utilizado por outro usuário!',
        );
      }

      if (data?.password) {
        data.password = hashSync(data.password, 12);
      }

      const saveUser = {
        ...user,
        ...data,
      };

      const updated = await this.userRepo.save(saveUser);

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async destroy(id: string): Promise<User> {
    try {
      const user = await this.userRepo.findOne(id);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado!');
      }

      await this.userRepo.delete({
        id,
      });

      return user;
    } catch (error) {
      throw error;
    }
  }
}
