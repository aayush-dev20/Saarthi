import {createHash,randomBytes} from 'node:crypto'
import jwt from 'jsonwebtoken'
import {RefreshToken} from '../models/User.js'

export const tokenHash=value=>createHash('sha256').update(value).digest('hex')

export function cookieOptions(config,path='/'){
  return {httpOnly:true,secure:config.secureCookies,sameSite:'strict',path,domain:config.COOKIE_DOMAIN,maxAge:path==='/api/auth'?config.REFRESH_TOKEN_TTL_DAYS*86400000:15*60_000}
}

export async function issueTokenPair(user,config){
  const accessToken=jwt.sign({type:'access',role:user.role},config.JWT_SECRET,{subject:String(user._id),issuer:'saarthi-api',audience:'saarthi-web',expiresIn:config.ACCESS_TOKEN_TTL})
  const jti=randomBytes(32).toString('hex')
  const refreshToken=jwt.sign({type:'refresh',jti},config.JWT_SECRET,{subject:String(user._id),issuer:'saarthi-api',audience:'saarthi-web',expiresIn:`${config.REFRESH_TOKEN_TTL_DAYS}d`})
  await RefreshToken.create({userId:user._id,tokenHash:tokenHash(jti),expiresAt:new Date(Date.now()+config.REFRESH_TOKEN_TTL_DAYS*86400000)})
  return {accessToken,refreshToken}
}

export function setAuthCookies(res,pair,config){
  res.cookie('saarthi_access',pair.accessToken,cookieOptions(config,'/'))
  res.cookie('saarthi_refresh',pair.refreshToken,cookieOptions(config,'/api/auth'))
}

export function clearAuthCookies(res,config){
  const opts=cookieOptions(config,'/')
  res.clearCookie('saarthi_access',{httpOnly:opts.httpOnly,secure:opts.secure,sameSite:opts.sameSite,path:opts.path,domain:opts.domain})
  const refresh=cookieOptions(config,'/api/auth')
  res.clearCookie('saarthi_refresh',{httpOnly:refresh.httpOnly,secure:refresh.secure,sameSite:refresh.sameSite,path:refresh.path,domain:refresh.domain})
}
