import passport from 'passport';
import OAuth2Strategy from 'passport-oauth2';
import { AuthConfig, User } from './types';

export class OAuthService {
  constructor(private readonly config: AuthConfig) {
    this.setupOAuth();
  }

  private setupOAuth() {
    passport.use(
      new OAuth2Strategy(
        {
          authorizationURL: this.config.oauth.authorizationURL,
          tokenURL: this.config.oauth.tokenURL,
          clientID: this.config.oauth.clientId,
          clientSecret: this.config.oauth.clientSecret,
          callbackURL: this.config.oauth.callbackURL,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Implementation would depend on your user store
            const user: User = {
              id: profile.id,
              email: profile.email,
              roles: ['user'],
            };
            done(null, user);
          } catch (error) {
            done(error as Error);
          }
        }
      )
    );
  }
}