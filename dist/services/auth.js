"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const jwt_rotation_1 = require("./jwt-rotation");
// Initialize the JWT rotation service
const currentKey = jwt_rotation_1.jwtRotationService.getCurrentKey();
class AuthService {
    static generateToken(payload) {
        return jwt_rotation_1.jwtRotationService.generateToken(payload);
    }
    static verifyToken(token) {
        return jwt_rotation_1.jwtRotationService.verifyToken(token);
    }
}
exports.AuthService = AuthService;
