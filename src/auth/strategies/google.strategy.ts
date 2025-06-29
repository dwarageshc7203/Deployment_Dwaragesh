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
  let role = 'patient'; // default role
  try {
    if (req.query?.state) {
      const stateJson = Buffer.from(req.query.state, 'base64').toString();
      const stateObj = JSON.parse(stateJson);
      if (stateObj?.role === 'doctor' || stateObj?.role === 'patient') {
        role = stateObj.role;
      }
    }
  } catch (err) {
    console.warn('Invalid OAuth state received:', err.message);
  }

  const user = {
    email: profile.emails[0].value,
    name: profile.displayName,
    provider: 'google',
    role,
  };
  done(null, user);
}

}
