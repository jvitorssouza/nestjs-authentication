import { BadRequestException } from '@nestjs/common';

import HapiJoi from '@hapi/joi';
import validator, { cnpj, cpf } from 'cpf-cnpj-validator';

export class DocumentValidateService {
  execute(documentStr: string) {
    try {
      const Joi = HapiJoi.extend(validator);
      const document = documentStr.match(/\d+/g).join('');

      const cnpjSchema = Joi.document().cnpj();
      const cpfSchema = Joi.document().cpf();

      if (!cpfSchema.validate(document) && !cnpjSchema.validate(document)) {
        throw new BadRequestException(
          'O CPF/CNPJ fornecido está em um formato inválido!',
        );
      }

      if (!cpf.isValid(document) && !cnpj.isValid(document)) {
        return false;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}
