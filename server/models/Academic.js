import mongoose from 'mongoose'
const {Schema}=mongoose

const subjectSchema=new Schema({name:{type:String,required:true,trim:true,maxLength:120},code:{type:String,required:true,uppercase:true,trim:true,unique:true},department:{type:String,trim:true},semester:{type:Number,min:1,max:12,required:true},isActive:{type:Boolean,default:true}},{timestamps:true,strict:'throw'})
const sectionSchema=new Schema({name:{type:String,required:true,trim:true,maxLength:80},term:{type:String,required:true,trim:true},subjectIds:[{type:Schema.Types.ObjectId,ref:'Subject'}],studentIds:[{type:Schema.Types.ObjectId,ref:'User'}],facultyIds:[{type:Schema.Types.ObjectId,ref:'User'}],isActive:{type:Boolean,default:true}},{timestamps:true,strict:'throw'})
sectionSchema.index({name:1,term:1},{unique:true})
sectionSchema.index({studentIds:1})
sectionSchema.index({facultyIds:1})

const sessionSchema=new Schema({sectionId:{type:Schema.Types.ObjectId,ref:'Section',required:true,index:true},subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true,index:true},createdBy:{type:Schema.Types.ObjectId,ref:'User',required:true},status:{type:String,enum:['active','closed'],default:'active',index:true},startedAt:{type:Date,default:Date.now},expiresAt:{type:Date,default:()=>new Date(Date.now()+4*60*60*1000),index:true},closedAt:{type:Date,default:null},tokenVersion:{type:Number,default:0},rotatedAt:{type:Date,default:null}},{timestamps:true,strict:'throw'})
sessionSchema.index({sectionId:1,status:1})

const attendanceSchema=new Schema({sessionId:{type:Schema.Types.ObjectId,ref:'AttendanceSession',required:true},sectionId:{type:Schema.Types.ObjectId,ref:'Section',required:true,index:true},subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true},studentId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},status:{type:String,enum:['present','absent','excused'],default:'present'},source:{type:String,enum:['qr','faculty-correction','session-close'],required:true},recordedAt:{type:Date,default:Date.now},actorId:{type:Schema.Types.ObjectId,ref:'User'},correctionReason:{type:String,maxLength:500}},{timestamps:true,strict:'throw'})
attendanceSchema.index({sessionId:1,studentId:1},{unique:true})
attendanceSchema.index({studentId:1,subjectId:1,recordedAt:-1})

const markSchema=new Schema({studentId:{type:Schema.Types.ObjectId,ref:'User',required:true,index:true},sectionId:{type:Schema.Types.ObjectId,ref:'Section',required:true,index:true},subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true,index:true},assessmentName:{type:String,required:true,trim:true,maxLength:160},score:{type:Number,required:true,min:0},maxScore:{type:Number,required:true,min:1},term:{type:String,required:true,trim:true},enteredBy:{type:Schema.Types.ObjectId,ref:'User',required:true},publishedAt:{type:Date,default:null},remarks:{type:String,maxLength:1000}},{timestamps:true,strict:'throw'})
markSchema.index({studentId:1,subjectId:1,assessmentName:1,term:1},{unique:true})

const assignmentSchema=new Schema({title:{type:String,required:true,trim:true,maxLength:180},description:{type:String,default:'',maxLength:5000},sectionIds:[{type:Schema.Types.ObjectId,ref:'Section',required:true}],subjectId:{type:Schema.Types.ObjectId,ref:'Subject',required:true},dueAt:{type:Date,required:true,index:true},priority:{type:String,enum:['low','medium','high'],default:'medium'},createdBy:{type:Schema.Types.ObjectId,ref:'User',required:true},publishedAt:{type:Date,default:Date.now}},{timestamps:true,strict:'throw'})
assignmentSchema.index({sectionIds:1,dueAt:1})

const submissionSchema=new Schema({assignmentId:{type:Schema.Types.ObjectId,ref:'Assignment',required:true},studentId:{type:Schema.Types.ObjectId,ref:'User',required:true},submittedAt:{type:Date,default:Date.now},responseText:{type:String,default:'',maxLength:10000},status:{type:String,enum:['submitted','graded'],default:'submitted'},score:{type:Number,min:0},feedback:{type:String,maxLength:3000}},{timestamps:true,strict:'throw'})
submissionSchema.index({assignmentId:1,studentId:1},{unique:true})

export const Subject=mongoose.models.Subject||mongoose.model('Subject',subjectSchema)
export const Section=mongoose.models.Section||mongoose.model('Section',sectionSchema)
export const AttendanceSession=mongoose.models.AttendanceSession||mongoose.model('AttendanceSession',sessionSchema)
export const AttendanceRecord=mongoose.models.AttendanceRecord||mongoose.model('AttendanceRecord',attendanceSchema)
export const Mark=mongoose.models.Mark||mongoose.model('Mark',markSchema)
export const Assignment=mongoose.models.Assignment||mongoose.model('Assignment',assignmentSchema)
export const Submission=mongoose.models.Submission||mongoose.model('Submission',submissionSchema)
