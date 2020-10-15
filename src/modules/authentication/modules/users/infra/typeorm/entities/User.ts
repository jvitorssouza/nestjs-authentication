import { IsDefined, IsOptional, IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsDefined()
  @IsString()
  @Column()
  name: string;

  @IsDefined()
  @IsString()
  @Column()
  document: string;

  @IsDefined()
  @IsString()
  @Column()
  email: string;

  @IsOptional()
  @Column({ select: false })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
