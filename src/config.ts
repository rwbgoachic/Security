import { config } from 'dotenv-encrypted';

// Initialize encrypted environment variables
config();

export const ENV_CONFIG = {
  auditServiceUrl: process.env.AUDIT_SERVICE_URL,
  auditServiceToken: process.env.AUDIT_SERVICE_TOKEN,
  auditEncryptionKey: process.env.AUDIT_ENCRYPTION_KEY
};

// Validate required environment variables
Object.entries(ENV_CONFIG).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});