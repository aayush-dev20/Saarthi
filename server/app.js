import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import pinoHttp from 'pino-http'
import {rateLimit} from 'express-rate-limit'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import studentRoutes from './routes/student.js'
import teacherRoutes from './routes/teacher.js'
import adminRoutes from './routes/admin.js'
import {logger} from './logger.js'
import {HttpError} from './lib/errors.js'
import {requireTrustedOrigin} from './middleware/origin.js'

export function createApp(config,{io=null}={}){
  const app=express()
  app.disable('x-powered-by')
  app.locals.config=config
  app.locals.io=io
  app.use(helmet({crossOriginResourcePolicy:{policy:'same-site'}}))
  app.use(cors({origin(origin,callback){if(!origin||config.clientOrigins.includes(origin))return callback(null,true);return callback(null,false)},credentials:true,methods:['GET','POST','PATCH','DELETE','OPTIONS'],allowedHeaders:['Content-Type','X-Request-Id']}))
  app.use(pinoHttp({logger,genReqId:req=>req.get('x-request-id')?.slice(0,100)||cryptoRandomId(),autoLogging:{ignore:req=>req.url==='/api/health'},serializers:{req:req=>({id:req.id,method:req.method,url:req.url}),res:res=>({statusCode:res.statusCode})}}))
  app.use(express.json({limit:'1mb',strict:true}))
  app.use(cookieParser())
  app.use('/api',rateLimit({windowMs:60_000,limit:180,standardHeaders:'draft-7',legacyHeaders:false}))

  app.get('/api/health',(_req,res)=>{
    const ready=mongoose.connection.readyState===1
    res.status(ready?200:503).json({status:ready?'ok':'unavailable',database:ready?'connected':'disconnected',time:new Date().toISOString()})
  })
  app.use('/api',requireTrustedOrigin)
  app.use('/api/auth',authRoutes)
  app.use('/api/student',studentRoutes)
  app.use('/api/teacher',teacherRoutes)
  app.use('/api/admin',adminRoutes)
  app.use('/api',(req,res)=>res.status(404).json({error:{code:'API_ROUTE_NOT_FOUND',message:'API route not found'}}))

  app.use((error,req,res,_next)=>{
    if(res.headersSent)return
    const dbUnavailable=mongoose.connection.readyState!==1&&['MongooseError','MongoNotConnectedError','MongoServerSelectionError','MongoNetworkError'].includes(error?.name)
    const status=error instanceof HttpError?error.status:error?.name==='ValidationError'?422:error?.name==='CastError'?400:error?.code===11000?409:dbUnavailable||error?.name==='MongoServerSelectionError'||error?.name==='MongoNetworkError'?503:500
    const code=error instanceof HttpError?error.code:error?.code===11000?'DUPLICATE_RECORD':status===422?'DATABASE_VALIDATION':status===503?'DATABASE_UNAVAILABLE':'INTERNAL_ERROR'
    if(status>=500)req.log?.error({errorName:error?.name,requestId:req.id,code},'API request failed')
    else req.log?.warn({requestId:req.id,code,status},'API request rejected')
    const message=status===500?`The server could not complete this request. Contact the administrator with request ID ${req.id}.`:status===503?'Database unavailable. Check the MongoDB connection and Atlas network access.':error.message
    res.status(status).json({error:{code,message,requestId:req.id}})
  })
  return app
}

function cryptoRandomId(){return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`}
