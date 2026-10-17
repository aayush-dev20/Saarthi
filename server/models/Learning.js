import mongoose from 'mongoose'
const {Schema}=mongoose

const conceptSchema=new Schema({key:{type:String,required:true,trim:true,lowercase:true},name:{type:String,required:true,trim:true,maxLength:160},subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true,index:true},description:{type:String,default:'',maxLength:2000},prerequisiteIds:[{type:Schema.Types.ObjectId,ref:'Concept'}],version:{type:Number,required:true,min:1,default:1},isActive:{type:Boolean,default:true}},{timestamps:true,strict:'throw'})
conceptSchema.index({subjectId:1,key:1,version:1},{unique:true})

const questionSchema=new Schema({prompt:{type:String,required:true,maxLength:3000},options:[{type:String,required:true,maxLength:1000}],answerKey:{type:Number,required:true,min:0,select:false},explanation:{type:String,required:true,maxLength:3000},conceptId:{type:Schema.Types.ObjectId,ref:'Concept',required:true,index:true},subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true,index:true},difficulty:{type:String,enum:['foundational','practice','challenge'],default:'practice'},version:{type:Number,default:1,min:1},isActive:{type:Boolean,default:true}},{timestamps:true,strict:'throw'})
questionSchema.path('options').validate(v=>v.length>=2&&v.length<=6,'Questions require 2 to 6 options')

const attemptSchema=new Schema({studentId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true},kind:{type:String,enum:['diagnostic','practice','reassessment'],required:true},responses:[{questionId:{type:Schema.Types.ObjectId,ref:'Question',required:true},selectedIndex:{type:Number,required:true,min:0},isCorrect:{type:Boolean,required:true},conceptId:{type:Schema.Types.ObjectId,ref:'Concept',required:true}}],score:{type:Number,required:true,min:0,max:100},completedAt:{type:Date,default:Date.now}},{timestamps:true,strict:'throw'})
attemptSchema.index({studentId:1,subjectId:1,completedAt:-1})

const planSchema=new Schema({studentId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},conceptId:{type:Schema.Types.ObjectId,ref:'Concept',required:true},evidenceCount:{type:Number,required:true,min:0},correctCount:{type:Number,required:true,min:0},accuracy:{type:Number,required:true,min:0,max:100},reason:{type:String,required:true,maxLength:1000},recommendedQuestionIds:[{type:Schema.Types.ObjectId,ref:'Question'}],status:{type:String,enum:['open','improving','resolved'],default:'open'}},{timestamps:true,strict:'throw'})
planSchema.index({studentId:1,conceptId:1},{unique:true})

const notificationSchema=new Schema({userId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},type:{type:String,required:true,maxLength:60},message:{type:String,required:true,maxLength:500},readAt:{type:Date,default:null},metadata:{type:Schema.Types.Mixed,default:{}}},{timestamps:true,strict:'throw'})
const auditSchema=new Schema({actorId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},action:{type:String,required:true,maxLength:100},entityType:{type:String,required:true,maxLength:80},entityId:{type:Schema.Types.ObjectId,required:true},reason:{type:String,maxLength:1000},before:{type:Schema.Types.Mixed},after:{type:Schema.Types.Mixed},requestId:{type:String,maxLength:100}},{timestamps:true,strict:'throw'})
auditSchema.index({entityType:1,entityId:1,createdAt:-1})

export const Concept=mongoose.models.Concept||mongoose.model('Concept',conceptSchema)
export const Question=mongoose.models.Question||mongoose.model('Question',questionSchema)
export const AssessmentAttempt=mongoose.models.AssessmentAttempt||mongoose.model('AssessmentAttempt',attemptSchema)
export const LearningPlan=mongoose.models.LearningPlan||mongoose.model('LearningPlan',planSchema)
export const Notification=mongoose.models.Notification||mongoose.model('Notification',notificationSchema)
export const AuditLog=mongoose.models.AuditLog||mongoose.model('AuditLog',auditSchema)
