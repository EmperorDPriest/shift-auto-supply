import { z } from 'zod';

const schema = z.object({
  NODE_ENV:               z.enum(['development', 'production', 'test']).default('development'),
  PORT:                   z.string().default('5000'),
  MONGO_URI:              z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET:             z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET:     z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN:         z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL:             z.string().default('http://localhost:3000'),
  CLOUDINARY_CLOUD_NAME:  z.string().optional(),
  CLOUDINARY_API_KEY:     z.string().optional(),
  CLOUDINARY_API_SECRET:  z.string().optional(),
  ADMIN_EMAIL:            z.string().email().default('admin@shiftautosupply.com'),
  ADMIN_PASSWORD:         z.string().min(8).default('Admin@ShiftAuto2024!'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
