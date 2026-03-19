const readEnv = (name: string, fallback?: string) => {
  const value = process.env[name] ?? fallback;

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  DATABASE_URL: readEnv('DATABASE_URL'),
  DIRECT_URL: readEnv('DIRECT_URL'),
  MIGRATE_DATABASE_URL: readEnv('MIGRATE_DATABASE_URL', process.env.DIRECT_URL),
  NEXT_PUBLIC_SUPABASE_URL: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};
