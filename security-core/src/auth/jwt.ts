import jwt from 'jsonwebtoken';
import { JWTPayload, User } from './types';

export class JWTService {
  constructor(private readonly secret: string, private readonly expiresIn: string) {}

  generateToken(user: User): string {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, this.secret) as JWTPayload;
  }
}