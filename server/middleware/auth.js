import jwt from 'jsonwebtoken'
import {User} from '../models/User.js'
import {unauthorized,forbidden} from '../lib/errors.js'

export async function requireAuth(req,_res,next){
  try{
    const token=req.cookies?.saarthi_access
    if(!token)throw unauthorized()
    const claims=jwt.verify(token,req.app.locals.config.JWT_SECRET,{issuer:'saarthi-api',audience:'saarthi-web'})
    if(claims.type!=='access')throw unauthorized()
    const user=await User.findById(claims.sub).select('_id name email role sectionIds department isActive verifiedAt')
    if(!user||!user.isActive)throw unauthorized('Account is unavailable')
    req.user=user
    next()
  }catch(error){next(error.name==='JsonWebTokenError'||error.name==='TokenExpiredError'?unauthorized('Session expired. Sign in again.'):error)}
}

export function requireRole(...roles){return (req,_res,next)=>req.user&&roles.includes(req.user.role)?next():next(forbidden())}
