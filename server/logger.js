import pino from 'pino'

export const logger=pino({
  level:process.env.LOG_LEVEL||'info',
  redact:{paths:['req.headers.authorization','req.headers.cookie','password','passwordHash','token','refreshToken','qrToken','body.password'],censor:'[REDACTED]'},
  base:{service:'saarthi-api'},
  timestamp:pino.stdTimeFunctions.isoTime,
})
