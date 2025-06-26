import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from 'src/dto/signin.dto';
import { SignupDto } from 'src/dto/signup.dto';
import { RefreshDto } from 'src/dto/refresh.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // signup endpoint

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return await this.authService.Signup(dto);
  }

  // signin endpoint

  @Post('signin')
  async signin(@Body() dto: SigninDto) {
    return await this.authService.Signin(dto);
  }

  // signout endpoint
  @Post('signout')
  async signout(@Headers('authorization') authHeader: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authorization header is missing');
    }
    const token = authHeader.split(' ')[1];
    return await this.authService.signOut(token);
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return await this.authService.refresh(dto);
  }

  // Google OAuth endpoints

  // This endpoint will redirect to Google for authentication
  @Get('google')
@UseGuards(AuthGuard('google'))
googleAuth(@Query('role') role: string) {
  // Redirect URL construction is now handled by Passport
  // So we encode the role in the `state` query param
  return { state: Buffer.from(JSON.stringify({ role })).toString('base64') };
}


  // This endpoint will be called by Google after authentication
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req) {
    // user info now in req.user (set by GoogleStrategy)
    return this.authService.google_login(req.user);
  }
}
