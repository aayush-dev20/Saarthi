import {forbidden} from '../lib/errors.js'

export function requireTrustedOrigin(req,_res,next){
  const origin=req.get('origin')
  const allowed=req.app.locals.config.clientOrigins
  if(origin&&!allowed.includes(origin))return next(forbidden('Request origin is not allowed'))
  next()
}
