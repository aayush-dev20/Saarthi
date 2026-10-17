import mongoose from 'mongoose'

const userSchema=new mongoose.Schema({
  name:{type:String,required:true,trim:true,maxLength:120},
  email:{type:String,required:true,lowercase:true,trim:true,unique:true,index:true},
  passwordHash:{type:String,required:true,select:false},
  role:{type:String,enum:['student','faculty','admin'],required:true,index:true},
  institutionId:{type:String,trim:true,index:true,sparse:true},
  institutionalRecordRef:{type:String,trim:true,maxLength:200},
  department:{type:String,trim:true,maxLength:120},
  sectionIds:[{type:mongoose.Schema.Types.ObjectId,ref:'Section'}],
  isActive:{type:Boolean,default:true,index:true},
  verifiedAt:{type:Date,default:null},
  lastLoginAt:{type:Date,default:null},
},{timestamps:true,strict:'throw'})

const refreshTokenSchema=new mongoose.Schema({
  userId:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
  tokenHash:{type:String,required:true,unique:true},
  expiresAt:{type:Date,required:true},
  revokedAt:{type:Date,default:null},
},{timestamps:true,strict:'throw'})
refreshTokenSchema.index({expiresAt:1},{expireAfterSeconds:0})

export const User=mongoose.models.User||mongoose.model('User',userSchema)
export const RefreshToken=mongoose.models.RefreshToken||mongoose.model('RefreshToken',refreshTokenSchema)
