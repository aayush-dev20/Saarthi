import {Router} from 'express'
import {z} from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {rateLimit} from 'express-rate-limit'
import {User,RefreshToken} from '../models/User.js'
import {asyncRoute,unauthorized} from '../lib/errors.js'
import {validate} from '../middleware/validate.js'
import {requireAuth} from '../middleware/auth.js'
import {clearAuthCookies,issueTokenPair,setAuthCookies,tokenHash} from '../auth/tokens.js'

const loginSchema=z.object({email:z.string().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(1).max(200)}).strict()
const router=Router()
const loginLimiter=rateLimit({windowMs:15*60_000,limit:8,standardHeaders:'draft-7',legacyHeaders:false,message:{error:{code:'RATE_LIMITED',message:'Too many sign-in attempts. Try again later.'}}})

router.post('/login',loginLimiter,validate(loginSchema),asyncRoute(async(req,res)=>{
  const user=await User.findOne({email:req.body.email}).select('+passwordHash')
  const valid=user&&user.isActive&&await bcrypt.compare(req.body.password,user.passwordHash)
  if(!valid)throw unauthorized('Email or password is incorrect')
  user.lastLoginAt=new Date()
  await user.save()
  const pair=await issueTokenPair(user,req.app.locals.config)
  setAuthCookies(res,pair,req.app.locals.config)
  res.json({user:{id:String(user._id),name:user.name,email:user.email,role:user.role,department:user.department}})
}))

router.post('/refresh',asyncRoute(async(req,res)=>{
  const raw=req.cookies?.saarthi_refresh
  if(!raw)throw unauthorized('Refresh session is missing')
  let claims
  try{claims=jwt.verify(raw,req.app.locals.config.JWT_SECRET,{issuer:'saarthi-api',audience:'saarthi-web'})}catch{throw unauthorized('Refresh session expired')}
  if(claims.type!=='refresh'||!claims.jti)throw unauthorized('Refresh session is invalid')
  const old=await RefreshToken.findOneAndUpdate({userId:claims.sub,tokenHash:tokenHash(claims.jti),revokedAt:null,expiresAt:{$gt:new Date()}},{$set:{revokedAt:new Date()}},{new:true})
  if(!old)throw unauthorized('Refresh session has already been used')
  const user=await User.findById(claims.sub)
  if(!user||!user.isActive)throw unauthorized('Account is unavailable')
  const pair=await issueTokenPair(user,req.app.locals.config)
  setAuthCookies(res,pair,req.app.locals.config)
  res.json({user:{id:String(user._id),name:user.name,email:user.email,role:user.role,department:user.department}})
}))

router.post('/logout',asyncRoute(async(req,res)=>{
  const raw=req.cookies?.saarthi_refresh
  if(raw){try{const claims=jwt.verify(raw,req.app.locals.config.JWT_SECRET,{issuer:'saarthi-api',audience:'saarthi-web'});if(claims.jti)await RefreshToken.updateOne({tokenHash:tokenHash(claims.jti),revokedAt:null},{$set:{revokedAt:new Date()}})}catch{}}
  clearAuthCookies(res,req.app.locals.config)
  res.status(204).end()
}))

router.get('/me',requireAuth,(req,res)=>res.json({user:{id:String(req.user._id),name:req.user.name,email:req.user.email,role:req.user.role,department:req.user.department}}))
export default router
