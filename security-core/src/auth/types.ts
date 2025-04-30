export interface User {
  id: string;
  email: string;
  roles: string[];
}

export interface JWTPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  oauth: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
    authorizationURL: string;
    tokenURL: string;
  };
}