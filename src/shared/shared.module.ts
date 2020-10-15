import { Global, Module } from '@nestjs/common';
import { DocumentValidateService } from './utils/document-validate';

@Global()
@Module({
  providers: [DocumentValidateService],
  exports: [DocumentValidateService],
})
export class SharedModule {}
