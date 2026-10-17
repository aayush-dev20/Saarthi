import 'dotenv/config'
import {z} from 'zod'

const schema=z.object({
  NODE_ENV:z.enum(['development','test','production']).default('development'),
  PORT:z.coerce.number().int().min(1).max(65535).default(4000),
  MONGODB_URI:z.string().min(1,'MONGODB_URI is required'),
  JWT_SECRET:z.string().min(32,'JWT_SECRET must contain at least 32 characters').refine(v=>!/(replace|example|changeme|your[-_ ]secret)/i.test(v),'JWT_SECRET must be a generated secret, not a placeholder'),
  ACCESS_TOKEN_TTL:z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS:z.coerce.number().int().min(1).max(30).default(7),
  CLIENT_ORIGINS:z.string().default('http://localhost:5173,http://127.0.0.1:5173,http://localhost:5191,http://127.0.0.1:5191'),
  COOKIE_DOMAIN:z.string().optional(),
})

export function getConfig(env=process.env){
  const parsed=schema.safeParse(env)
  if(!parsed.success){
    const issues=parsed.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`Invalid server configuration: ${issues}`)
  }
  return {...parsed.data,clientOrigins:parsed.data.CLIENT_ORIGINS.split(',').map(x=>x.trim()).filter(Boolean),secureCookies:parsed.data.NODE_ENV==='production'}
}
