import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, OtpVerifyDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Local OTP storage cache
  private otpStorage = new Map<string, string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateAndLogin(dto: LoginDto) {
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Automatically create a user profile in credentials mode if missing
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: dto.password, // In production, hash using bcrypt/argon2
          provider: 'credentials',
        },
      });
      // Register Standard Subscription
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          tier: 'Free Plan',
          status: 'active',
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      token: this.jwtService.sign(payload),
      email: user.email,
    };
  }

  async sendOtp(email: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStorage.set(email, code);
    console.log(`[NESTJS SECURITY] OTP code issued for ${email}: ==> ${code} <==`);
    return { success: true };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const cachedCode = this.otpStorage.get(dto.email);
    if (dto.code !== cachedCode) {
      throw new BadRequestException('Verification code is invalid or has expired');
    }
    this.otpStorage.delete(dto.email);

    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          provider: 'otp',
        },
      });
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          tier: 'Free Plan',
          status: 'active',
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      token: this.jwtService.sign(payload),
      email: user.email,
    };
  }

  async oAuthLogin(email: string, provider: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email, provider },
      });
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          tier: 'Free Plan',
          status: 'active',
        },
      });
    }

    const payload = { email: user.email, sub: user.id };
    return {
      token: this.jwtService.sign(payload),
      email: user.email,
    };
  }
}
