import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1600778223022 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            default: null,
            isNullable: true,
          },
          {
            name: 'document',
            type: 'varchar',
            length: '20',
            default: null,
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '150',
            default: null,
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'password',
            type: 'varchar',
            length: '150',
            default: null,
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime2',
            default: 'getdate()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime2',
            default: 'getdate()',
            isNullable: false,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
