import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.db.orm.public.User
      .where({ email: dto.email })
      .first();

    if (existingEmail) {
      throw new ConflictException('Email sudah terdaftar.');
    }

    const existingUsername = await this.prisma.db.orm.public.User
      .where({ username: dto.username })
      .first();

    if (existingUsername) {
      throw new ConflictException('Username sudah terdaftar.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.db.orm.public.User.create({
      email: dto.email,
      username: dto.username,
      name: dto.name,
    });

    await this.prisma.db.orm.public.AuthAccount.create({
      userId: user.id,
      provider: 'PASSWORD',
      passwordHash,
    });

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  async login(dto: LoginDto) {
    const userByEmail = await this.prisma.db.orm.public.User
      .where({ email: dto.identifier })
      .first();

    const user =
      userByEmail ??
      (await this.prisma.db.orm.public.User
        .where({ username: dto.identifier })
        .first());

    if (!user) {
      throw new UnauthorizedException(
        'Identifier atau password salah.',
      );
    }

    const authAccount =
      await this.prisma.db.orm.public.AuthAccount
        .where({
          userId: user.id,
          provider: 'PASSWORD',
        })
        .first();

    if (!authAccount || !authAccount.passwordHash) {
      throw new UnauthorizedException(
        'Identifier atau password salah.',
      );
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      authAccount.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Identifier atau password salah.',
      );
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }
}
