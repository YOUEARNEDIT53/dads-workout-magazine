import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
dotenvConfig({ path: resolve(process.cwd(), '.env') });

export interface Config {
  anthropic: {
    apiKey: string;
  };
  supabase: {
    url: string;
    serviceKey: string;
  };
  resend: {
    apiKey: string;
    emailTo: string;
    emailFrom: string;
  };
  app: {
    siteUrl: string;
    isProduction: boolean;
  };
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

export function getConfig(): Config {
  return {
    anthropic: {
      apiKey: requireEnv('ANTHROPIC_API_KEY'),
    },
    supabase: {
      url: requireEnv('SUPABASE_URL'),
      serviceKey: requireEnv('SUPABASE_SERVICE_KEY'),
    },
    resend: {
      apiKey: requireEnv('RESEND_API_KEY'),
      emailTo: optionalEnv('DIGEST_EMAIL_TO', 'youearndit@gmail.com'),
      emailFrom: optionalEnv('DIGEST_EMAIL_FROM', "Dad's Workout <onboarding@resend.dev>"),
    },
    app: {
      siteUrl: optionalEnv('SITE_URL', 'http://localhost:3000'),
      isProduction: process.env.NODE_ENV === 'production',
    },
  };
}

// Singleton config instance
let configInstance: Config | null = null;

export function config(): Config {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}
