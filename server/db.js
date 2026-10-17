import mongoose from 'mongoose'
import {logger} from './logger.js'

export async function connectDatabase(uri,environment=process.env.NODE_ENV){
  mongoose.set('strictQuery',true)
  await mongoose.connect(uri,{serverSelectionTimeoutMS:8000,autoIndex:environment!=='production'})
  logger.info({database:'connected'},'MongoDB connection established')
  mongoose.connection.on('disconnected',()=>logger.warn('MongoDB connection lost'))
  mongoose.connection.on('error',error=>logger.error({errorName:error?.name},'MongoDB connection error'))
  return mongoose.connection
}

export async function disconnectDatabase(){
  await mongoose.disconnect()
}
