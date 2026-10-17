import {Router} from 'express'
import {z} from 'zod'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import {rateLimit} from 'express-rate-limit'
import {requireAuth,requireRole} from '../middleware/auth.js'
import {validate} from '../middleware/validate.js'
import {asyncRoute,badRequest,forbidden,notFound,unauthorized} from '../lib/errors.js'
import {Assignment,AttendanceRecord,AttendanceSession,Mark,Section} from '../models/Academic.js'
import {Concept,LearningPlan} from '../models/Learning.js'
import {requireFacultySection} from '../services/academics.js'
import {audit} from '../services/audit.js'
import {emitToSections,emitToUser} from '../services/events.js'

const router=Router()
router.use(requireAuth,requireRole('faculty'))
const oid=z.string().refine(mongoose.isValidObjectId,'Invalid record identifier')
const sessionSchema=z.object({sectionId:oid,subjectId:oid}).strict()
const markSchema=z.object({studentId:oid,sectionId:oid,subjectId:oid,assessmentName:z.string().trim().min(1).max(160),score:z.number().min(0),maxScore:z.number().min(1),term:z.string().trim().min(1).max(80),remarks:z.string().max(1000).optional(),publish:z.boolean().default(false)}).strict().refine(v=>v.score<=v.maxScore,{message:'Score cannot exceed maximum score',path:['score']})
const assignmentSchema=z.object({title:z.string().trim().min(1).max(180),description:z.string().max(5000).default(''),sectionIds:z.array(oid).min(1).max(20),subjectId:oid,dueAt:z.coerce.date(),priority:z.enum(['low','medium','high']).default('medium')}).strict()
const correctionSchema=z.object({studentId:oid,status:z.enum(['present','absent','excused']),reason:z.string().trim().min(5).max(500)}).strict()
const scanSchema=z.object({token:z.string().min(30).max(4000)}).strict()
const scanLimiter=rateLimit({windowMs:60_000,limit:8,standardHeaders:'draft-7',legacyHeaders:false})

async function finalizeSessionAbsences(session,actorId){
  const section=await Section.findById(session.sectionId).select('studentIds').lean()
  if(!section?.studentIds.length)return 0
  const now=new Date()
  const result=await AttendanceRecord.bulkWrite(section.studentIds.map(studentId=>({updateOne:{filter:{sessionId:session._id,studentId},update:{$setOnInsert:{sectionId:session.sectionId,subjectId:session.subjectId,status:'absent',source:'session-close',actorId,recordedAt:now}},upsert:true}})),{ordered:false})
  return result.upsertedCount||0
}

router.get('/dashboard',asyncRoute(async(req,res)=>{
  const sections=await Section.find({facultyIds:req.user._id,isActive:true}).populate('subjectIds','name code').lean()
  const sectionIds=sections.map(s=>s._id)
  const studentIds=[...new Set(sections.flatMap(s=>s.studentIds.map(String))) ]
  const [marks,attendance,plans]=await Promise.all([
    Mark.find({sectionId:{$in:sectionIds},publishedAt:{$ne:null}}).lean(),
    AttendanceRecord.find({sectionId:{$in:sectionIds}}).lean(),
    LearningPlan.find({studentId:{$in:studentIds},status:{$ne:'resolved'}}).populate('conceptId','name').lean(),
  ])
  const avg=marks.length?Math.round(marks.reduce((n,m)=>n+m.score/m.maxScore*100,0)/marks.length):null
  const attendanceRate=attendance.length?Math.round(attendance.filter(a=>a.status==='present').length/attendance.length*100):null
  const flagged=Object.values(plans.reduce((acc,p)=>{const name=p.conceptId?.name||'Unknown';acc[name]??={concept:name,students:new Set(),evidenceCount:0};acc[name].students.add(String(p.studentId));acc[name].evidenceCount+=p.evidenceCount;return acc},{})).map(v=>({concept:v.concept,students:v.students.size,evidenceCount:v.evidenceCount})).sort((a,b)=>b.students-a.students)
  res.json({data:{sections:sections.map(s=>({id:String(s._id),name:s.name,term:s.term,subjects:s.subjectIds.map(x=>({id:String(x._id),name:x.name,code:x.code})),studentCount:s.studentIds.length})),summary:{totalStudents:studentIds.length,classAverage:avg,attendance:attendanceRate,studentsNeedingSupport:new Set(plans.map(p=>String(p.studentId))).size},flaggedConcepts:flagged,empty:sectionIds.length===0}})
}))

router.get('/analytics',asyncRoute(async(req,res)=>{
  const sections=await Section.find({facultyIds:req.user._id,isActive:true}).select('_id studentIds subjectIds').lean()
  const sectionIds=sections.map(s=>s._id),studentIds=[...new Set(sections.flatMap(s=>s.studentIds.map(String)))]
  const subjectId=req.query.subjectId
  if(subjectId&&!mongoose.isValidObjectId(subjectId))throw badRequest('Invalid subjectId')
  if(subjectId&&!sections.some(s=>s.subjectIds.some(id=>String(id)===subjectId)))throw forbidden('Subject is not assigned to your faculty account')
  const concepts=await Concept.find({isActive:true,...(subjectId?{subjectId}:{subjectId:{$in:[...new Set(sections.flatMap(s=>s.subjectIds.map(id=>String(id))))]}})}).lean()
  const plans=await LearningPlan.find({studentId:{$in:studentIds},...(subjectId?{conceptId:{$in:concepts.map(c=>c._id)}}:{})}).populate('studentId','name institutionId').populate('conceptId','name key').lean()
  const distribution=concepts.map(c=>{const rows=plans.filter(p=>String(p.conceptId?._id)===String(c._id));return {conceptId:String(c._id),concept:c.name,students:rows.length,meanAccuracy:rows.length?Math.round(rows.reduce((n,p)=>n+p.accuracy,0)/rows.length):null,evidenceCount:rows.reduce((n,p)=>n+p.evidenceCount,0)}})
  res.json({data:{distribution,students:plans.map(p=>({student:{id:String(p.studentId?._id),name:p.studentId?.name,institutionId:p.studentId?.institutionId},concept:p.conceptId?.name,accuracy:p.accuracy,evidenceCount:p.evidenceCount,reason:p.reason,status:p.status})),empty:concepts.length===0}})
}))

router.get('/academics',asyncRoute(async(req,res)=>{
  const sections=await Section.find({facultyIds:req.user._id,isActive:true}).populate('subjectIds','name code').populate('studentIds','name institutionId email').lean()
  const ids=sections.map(s=>s._id)
  const [marks,attendance,assignments]=await Promise.all([
    Mark.find({sectionId:{$in:ids}}).populate('studentId','name institutionId').populate('subjectId','name code').sort({updatedAt:-1}).lean(),
    AttendanceRecord.find({sectionId:{$in:ids}}).populate('studentId','name').populate('subjectId','name code').sort({recordedAt:-1}).limit(1000).lean(),
    Assignment.find({sectionIds:{$in:ids}}).sort({dueAt:-1}).limit(200).lean(),
  ])
  res.json({data:{sections:sections.map(s=>({id:String(s._id),name:s.name,term:s.term,subjects:s.subjectIds.map(x=>({id:String(x._id),name:x.name,code:x.code})),students:s.studentIds.map(u=>({id:String(u._id),name:u.name,institutionId:u.institutionId}))})),marks:marks.map(m=>({id:String(m._id),studentId:String(m.studentId?._id),student:m.studentId?.name,subjectId:String(m.subjectId?._id),subject:m.subjectId?.name,assessmentName:m.assessmentName,score:m.score,maxScore:m.maxScore,term:m.term,published:Boolean(m.publishedAt),updatedAt:m.updatedAt})),attendance:attendance.map(a=>({id:String(a._id),student:a.studentId?.name,studentId:String(a.studentId?._id),subject:a.subjectId?.name,status:a.status,recordedAt:a.recordedAt})),assignments:assignments.map(a=>({id:String(a._id),title:a.title,dueAt:a.dueAt})),empty:sections.length===0}})
}))

router.post('/attendance/sessions',validate(sessionSchema),asyncRoute(async(req,res)=>{
  const section=await requireFacultySection(req.user._id,req.body.sectionId)
  if(!section.subjectIds.some(id=>String(id)===req.body.subjectId))throw forbidden('Subject does not belong to this section')
  const previous=await AttendanceSession.find({sectionId:section._id,status:'active'})
  for(const old of previous){old.status='closed';old.closedAt=new Date();old.tokenVersion++;await old.save();const finalizedAbsent=await finalizeSessionAbsences(old,req.user._id);await audit(req,{action:'attendance.session.closed',entityType:'AttendanceSession',entityId:old._id,reason:'Replaced by a new attendance session',after:{finalizedAbsent}});emitToSections(req,[section._id],'attendance:session-closed',{sessionId:String(old._id)})}
  const session=await AttendanceSession.create({sectionId:section._id,subjectId:req.body.subjectId,createdBy:req.user._id,status:'active'})
  await audit(req,{action:'attendance.session.started',entityType:'AttendanceSession',entityId:session._id,after:{sectionId:section._id,subjectId:req.body.subjectId}})
  emitToSections(req,[section._id],'attendance:session-started',{sessionId:String(session._id),subjectId:req.body.subjectId})
  res.status(201).json({data:{id:String(session._id),sectionId:String(section._id),subjectId:req.body.subjectId,startedAt:session.startedAt,status:session.status}})
}))

router.post('/attendance/sessions/:id/token',asyncRoute(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))throw notFound('Attendance session not found')
  let query=AttendanceSession.findOne({_id:req.params.id,status:'active'})
  if(req.user.role==='faculty')query=query.where({createdBy:req.user._id})
  const session=await query.where({expiresAt:{$gt:new Date()}})
  if(!session)throw notFound('Active attendance session not found')
  const now=new Date()
  session.tokenVersion++
  session.rotatedAt=now
  await session.save()
  const token=jwt.sign({type:'attendance',sessionId:String(session._id),version:session.tokenVersion},req.app.locals.config.JWT_SECRET,{issuer:'saarthi-api',audience:'saarthi-qr',subject:String(session._id),expiresIn:12})
  res.json({data:{token,sessionId:String(session._id),expiresAt:new Date(now.getTime()+12_000),refreshAfterMs:10_000}})
}))

router.post('/attendance/sessions/:id/close',asyncRoute(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))throw notFound('Attendance session not found')
  let query=AttendanceSession.findOne({_id:req.params.id,status:'active'})
  if(req.user.role==='faculty')query=query.where({createdBy:req.user._id})
  const session=await query
  if(!session)throw notFound('Active attendance session not found')
  session.status='closed';session.closedAt=new Date();session.tokenVersion++
  await session.save()
  const finalizedAbsent=await finalizeSessionAbsences(session,req.user._id)
  await audit(req,{action:'attendance.session.closed',entityType:'AttendanceSession',entityId:session._id,after:{finalizedAbsent}})
  emitToSections(req,[session.sectionId],'attendance:session-closed',{sessionId:String(session._id)})
  res.json({data:{id:String(session._id),status:session.status,closedAt:session.closedAt}})
}))

router.post('/attendance/sessions/:id/corrections',validate(correctionSchema),asyncRoute(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))throw notFound('Attendance session not found')
  const session=await AttendanceSession.findOne({_id:req.params.id,createdBy:req.user._id})
  if(!session)throw notFound('Attendance session not found')
  const section=await requireFacultySection(req.user._id,session.sectionId)
  if(!section.studentIds.some(id=>String(id)===req.body.studentId))throw forbidden('Student is not enrolled in this section')
  const before=await AttendanceRecord.findOne({sessionId:session._id,studentId:req.body.studentId}).lean()
  const record=await AttendanceRecord.findOneAndUpdate({sessionId:session._id,studentId:req.body.studentId},{$set:{sectionId:session.sectionId,subjectId:session.subjectId,status:req.body.status,source:'faculty-correction',actorId:req.user._id,correctionReason:req.body.reason,recordedAt:new Date()}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true})
  await audit(req,{action:'attendance.corrected',entityType:'AttendanceRecord',entityId:record._id,reason:req.body.reason,before:before?{status:before.status,source:before.source}:null,after:{status:record.status,source:record.source,studentId:record.studentId}})
  emitToUser(req,record.studentId,'attendance:updated',{recordId:String(record._id),status:record.status,subjectId:String(record.subjectId)})
  res.json({data:{id:String(record._id),status:record.status,recordedAt:record.recordedAt}})
}))

router.post('/marks',validate(markSchema),asyncRoute(async(req,res)=>{
  const section=await requireFacultySection(req.user._id,req.body.sectionId)
  if(!section.subjectIds.some(id=>String(id)===req.body.subjectId))throw forbidden('Subject does not belong to this section')
  if(!section.studentIds.some(id=>String(id)===req.body.studentId))throw forbidden('Student is not enrolled in this section')
  const filter={studentId:req.body.studentId,sectionId:section._id,subjectId:req.body.subjectId,assessmentName:req.body.assessmentName,term:req.body.term}
  const before=await Mark.findOne(filter).lean()
  const after=await Mark.findOneAndUpdate(filter,{$set:{score:req.body.score,maxScore:req.body.maxScore,remarks:req.body.remarks,enteredBy:req.user._id,...(req.body.publish?{publishedAt:new Date()}:{})}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true})
  await audit(req,{action:before?'marks.updated':'marks.created',entityType:'Mark',entityId:after._id,before:before?{score:before.score,maxScore:before.maxScore,publishedAt:before.publishedAt}:null,after:{score:after.score,maxScore:after.maxScore,publishedAt:after.publishedAt}})
  if(after.publishedAt)emitToUser(req,after.studentId,'marks:published',{markId:String(after._id),subjectId:String(after.subjectId)})
  emitToUser(req,req.user._id,'marks:saved',{markId:String(after._id)})
  res.status(before?200:201).json({data:{id:String(after._id),score:after.score,maxScore:after.maxScore,published:Boolean(after.publishedAt)}})
}))

router.post('/assignments',validate(assignmentSchema),asyncRoute(async(req,res)=>{
  const sections=[]
  for(const id of req.body.sectionIds)sections.push(await requireFacultySection(req.user._id,id))
  if(sections.some(s=>!s.subjectIds.some(id=>String(id)===req.body.subjectId)))throw forbidden('Subject must be taught in every selected section')
  const assignment=await Assignment.create({...req.body,createdBy:req.user._id,publishedAt:new Date()})
  await audit(req,{action:'assignment.created',entityType:'Assignment',entityId:assignment._id,after:{title:assignment.title,sectionIds:assignment.sectionIds,subjectId:assignment.subjectId,dueAt:assignment.dueAt}})
  emitToSections(req,assignment.sectionIds,'assignment:created',{assignmentId:String(assignment._id),subjectId:String(assignment.subjectId)})
  res.status(201).json({data:{id:String(assignment._id),title:assignment.title,dueAt:assignment.dueAt}})
}))

export default router
