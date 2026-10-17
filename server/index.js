import {createServer} from 'node:http'
import {Server as SocketServer} from 'socket.io'
import {parse as parseCookie} from 'cookie'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import {getConfig} from './config.js'
import {connectDatabase,disconnectDatabase} from './db.js'
import {createApp} from './app.js'
import {User} from './models/User.js'
import {Section} from './models/Academic.js'
import {logger} from './logger.js'

const config=getConfig()
await connectDatabase(config.MONGODB_URI,config.NODE_ENV)
const app=createApp(config)
const server=createServer(app)
const io=new SocketServer(server,{cors:{origin:config.clientOrigins,credentials:true},serveClient:false,connectionStateRecovery:{maxDisconnectionDuration:120_000,skipMiddlewares:false}})
app.locals.io=io

io.use(async(socket,next)=>{
  try{
    const cookies=parseCookie(socket.handshake.headers.cookie||'')
    const token=cookies.saarthi_access
    if(!token)throw new Error('Authentication required')
    const claims=jwt.verify(token,config.JWT_SECRET,{issuer:'saarthi-api',audience:'saarthi-web'})
    if(claims.type!=='access')throw new Error('Invalid access session')
    const user=await User.findById(claims.sub).select('_id role isActive')
    if(!user?.isActive)throw new Error('Account unavailable')
    socket.data.user={id:String(user._id),role:user.role}
    next()
  }catch{next(new Error('Socket authentication failed'))}
})

io.on('connection',async socket=>{
  const user=socket.data.user
  socket.join(`user:${user.id}`)
  if(user.role==='admin')socket.join('role:admin')
  const query=user.role==='student'?{studentIds:user.id}:{facultyIds:user.id}
  const sections=await Section.find(query).select('_id').lean()
  for(const section of sections)socket.join(`section:${String(section._id)}`)
  socket.on('error',error=>logger.warn({userId:user.id,error:error.message},'Socket client event rejected'))
})

server.listen(config.PORT,()=>logger.info({port:config.PORT,environment:config.NODE_ENV},'Saarthi API listening'))

let closing=false
async function shutdown(signal){
  if(closing)return
  closing=true
  logger.info({signal},'Graceful shutdown started')
  const timer=setTimeout(()=>{logger.error('Graceful shutdown timed out');process.exit(1)},10_000)
  timer.unref()
  await new Promise(resolve=>io.close(()=>resolve()))
  await disconnectDatabase()
  clearTimeout(timer)
  process.exit(0)
}
process.on('SIGINT',()=>shutdown('SIGINT'))
process.on('SIGTERM',()=>shutdown('SIGTERM'))
process.on('unhandledRejection',error=>{logger.fatal({errorName:error?.name},'Unhandled promise rejection');shutdown('unhandledRejection')})
process.on('uncaughtException',error=>{logger.fatal({errorName:error?.name},'Uncaught exception');shutdown('uncaughtException')})
