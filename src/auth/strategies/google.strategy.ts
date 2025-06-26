import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

// it handles google oauth
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'default',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'default',
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        'http://localhost:3000/api/v1/auth/google/callback',
      passReqToCallback: true,
      scope: ['email', 'profile'],
    });
  }

  // passes the profile to the controller
  async validate(
    req: any,
    access_token: string,
    refresh_token: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Pass the Google profile + role to controller
    const role = req.query.role || 'patient';
    const user = {
      email: profile.emails[0].value,
      name: profile.displayName,
      provider: 'google',
      role,
    };
    done(null, user);
  }
}
