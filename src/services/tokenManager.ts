import { randomUUID } from 'crypto';

export const generateToken = (): string => randomUUID();