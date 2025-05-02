import { jwtRotationService } from './jwt-rotation';

// Initialize the JWT rotation service
const currentKey = jwtRotationService.getCurrentKey();

export class AuthService {
  static generateToken(payload: object): string {
    return jwtRotationService.generateToken(payload);
  }

  static verifyToken(token: string): any {
    return jwtRotationService.verifyToken(token);
  }
}