import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScannerService } from './scanner.service';

@Controller('api/scan')
@UseGuards(AuthGuard('jwt'))
export class ScannerController {
  constructor(private readonly scannerService: ScannerService) {}

  @Post()
  async scanFood(@Req() req: any, @Body() body: { imageUri: string; filename?: string }) {
    // req.user is populated by passport-jwt strategy verification
    const userId = req.user.id;
    return this.scannerService.processScan(userId, body.imageUri, body.filename);
  }
}
