import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, OtpSendDto, OtpVerifyDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.validateAndLogin(dto);
  }

  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  async sendOtp(@Body() dto: OtpSendDto) {
    return this.authService.sendOtp(dto.email);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('oauth/google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(@Body() body: { email: string }) {
    return this.authService.oAuthLogin(body.email, 'google');
  }

  @Post('oauth/apple')
  @HttpCode(HttpStatus.OK)
  async appleLogin(@Body() body: { email: string }) {
    return this.authService.oAuthLogin(body.email, 'apple');
  }
}
