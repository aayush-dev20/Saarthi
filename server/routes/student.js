import {Router} from 'express'
import {z} from 'zod'
import mongoose from 'mongoose'
import {requireAuth,requireRole} from '../middleware/auth.js'
import {validate} from '../middleware/validate.js'
import {asyncRoute,badRequest,forbidden,notFound} from '../lib/errors.js'
import {Assignment,AttendanceRecord,AttendanceSession,Mark,Section,Subject,Submission} from '../models/Academic.js'
import {AssessmentAttempt,AuditLog,Concept,LearningPlan,Question} from '../models/Learning.js'
import {requireEnrolled,studentSections} from '../services/academics.js'
import {refreshLearningPlans} from '../services/learning.js'
import {emitToUser} from '../services/events.js'
import jwt from 'jsonwebtoken'
import {rateLimit} from 'express-rate-limit'

const router=Router()
router.use(requireAuth,requireRole('student'))
const objectId=z.string().refine(v=>mongoose.isValidObjectId(v),'Invalid record identifier')
const answerSchema=z.object({questionId:objectId,selectedIndex:z.number().int().min(0).max(5)}).strict()
const attemptSchema=z.object({subjectId:objectId,kind:z.enum(['diagnostic','practice','reassessment']),responses:z.array(answerSchema).min(1).max(40)}).strict()
const submissionSchema=z.object({responseText:z.string().max(10000).default('')}).strict()
const checkinSchema=z.object({token:z.string().min(30).max(4000)}).strict()
const checkinLimiter=rateLimit({windowMs:60_000,limit:8,standardHeaders:'draft-7',legacyHeaders:false})

async function studentSubjectIds(userId){
  const sections=await Section.find({studentIds:userId,isActive:true}).select('subjectIds').lean()
  return [...new Set(sections.flatMap(s=>s.subjectIds.map(String))) ]
}

router.get('/dashboard',asyncRoute(async(req,res)=>{
  const sections=await studentSections(req.user._id)
  const subjectIds=[...new Set(sections.flatMap(s=>s.subjectIds.map(x=>String(x._id))))]
  const sectionIds=sections.map(s=>s._id)
  const [marks,attendance,assignments,submissions,plans,attempts]=await Promise.all([
    Mark.find({studentId:req.user._id,publishedAt:{$ne:null}}).populate('subjectId','name code').lean(),
    AttendanceRecord.find({studentId:req.user._id}).populate('subjectId','name code').lean(),
    Assignment.find({sectionIds:{$in:sectionIds},publishedAt:{$ne:null}}).populate('subjectId','name code').sort({dueAt:1}).lean(),
    Submission.find({studentId:req.user._id}).select('assignmentId status').lean(),
    LearningPlan.find({studentId:req.user._id}).populate('conceptId','name key subjectId').lean(),
    AssessmentAttempt.find({studentId:req.user._id}).sort({completedAt:-1}).limit(10).lean(),
  ])
  const average=marks.length?Math.round(marks.reduce((a,m)=>a+m.score/m.maxScore*100,0)/marks.length):null
  const attendancePct=attendance.length?Math.round(attendance.filter(a=>a.status==='present').length/attendance.length*100):null
  const submitted=new Set(submissions.map(s=>String(s.assignmentId)))
  const pending=assignments.filter(a=>!submitted.has(String(a._id)))
  res.json({data:{student:{id:String(req.user._id),name:req.user.name},summary:{attendance:attendancePct,averageMarks:average,pendingAssignments:pending.length,conceptsMastered:plans.filter(p=>p.status==='resolved').length},subjects:subjectIds.length,marksCount:marks.length,attendanceCount:attendance.length,pendingAssignments:pending.map(a=>({id:String(a._id),title:a.title,dueAt:a.dueAt,subject:a.subjectId?.name})),learningPlans:plans.filter(p=>p.status!=='resolved').map(p=>({id:String(p._id),concept:p.conceptId?.name,accuracy:p.accuracy,evidenceCount:p.evidenceCount,reason:p.reason})),recentAttempts:attempts.map(a=>({id:String(a._id),score:a.score,kind:a.kind,completedAt:a.completedAt}))},empty:sections.length===0})
}))

router.get('/academics',asyncRoute(async(req,res)=>{
  const sections=await studentSections(req.user._id)
  const sectionIds=sections.map(s=>s._id)
  const subjectIds=[...new Set(sections.flatMap(s=>s.subjectIds.map(x=>String(x._id))))]
  const [marks,records]=await Promise.all([
    Mark.find({studentId:req.user._id,publishedAt:{$ne:null}}).populate('subjectId','name code semester').sort({createdAt:-1}).lean(),
    AttendanceRecord.find({studentId:req.user._id}).populate('subjectId','name code').lean(),
  ])
  const subjects=sections.flatMap(s=>s.subjectIds).filter((v,i,a)=>a.findIndex(x=>String(x._id)===String(v._id))===i).map(subject=>{
    const attended=records.filter(r=>String(r.subjectId?._id)===String(subject._id)&&r.status==='present').length
    const total=records.filter(r=>String(r.subjectId?._id)===String(subject._id)).length
    return {id:String(subject._id),name:subject.name,code:subject.code,semester:subject.semester,attendance:total?Math.round(attended/total*100):null,attendanceCount:total}
  })
  res.json({data:{subjects,marks:marks.map(m=>({id:String(m._id),subject:m.subjectId?.name,subjectCode:m.subjectId?.code,assessmentName:m.assessmentName,score:m.score,maxScore:m.maxScore,percentage:Math.round(m.score/m.maxScore*100),term:m.term,enteredAt:m.createdAt})),sections:sectionIds.map(String),empty:subjects.length===0&&marks.length===0}})
}))

router.get('/attendance',asyncRoute(async(req,res)=>{
  const records=await AttendanceRecord.find({studentId:req.user._id}).populate('subjectId','name code').populate('sessionId','startedAt').sort({recordedAt:-1}).limit(300).lean()
  const sessions=await AttendanceSession.find({sectionId:{$in:(await studentSections(req.user._id)).map(s=>s._id)},status:'active',expiresAt:{$gt:new Date()}}).populate('subjectId','name code').select('subjectId startedAt').lean()
  res.json({data:{records:records.map(r=>({id:String(r._id),subject:r.subjectId?.name,code:r.subjectId?.code,status:r.status,recordedAt:r.recordedAt,sessionStartedAt:r.sessionId?.startedAt})),activeSessions:sessions.map(s=>({subject:s.subjectId?.name,code:s.subjectId?.code,startedAt:s.startedAt})),present:records.filter(r=>r.status==='present').length,total:records.length,percentage:records.length?Math.round(records.filter(r=>r.status==='present').length/records.length*100):null,empty:records.length===0}})
}))

router.post('/attendance/check-in',checkinLimiter,validate(checkinSchema),asyncRoute(async(req,res)=>{
  let claims
  try{claims=jwt.verify(req.body.token,req.app.locals.config.JWT_SECRET,{issuer:'saarthi-api',audience:'saarthi-qr',clockTolerance:1})}catch{throw badRequest('QR token is invalid or expired','QR_INVALID')}
  if(claims.type!=='attendance'||claims.sub!==claims.sessionId||!claims.version)throw badRequest('QR token is invalid','QR_INVALID')
  const session=await AttendanceSession.findOne({_id:claims.sessionId,status:'active',tokenVersion:claims.version,expiresAt:{$gt:new Date()}})
  if(!session)throw badRequest('QR code was rotated or the session has closed. Scan the current code.','QR_EXPIRED')
  const section=await requireEnrolled(req.user._id,session.sectionId)
  if(!section.subjectIds.some(id=>String(id)===String(session.subjectId)))throw forbidden('Session subject does not belong to your enrollment')
  let record
  try{
    record=await AttendanceRecord.create({sessionId:session._id,sectionId:session.sectionId,subjectId:session.subjectId,studentId:req.user._id,status:'present',source:'qr',actorId:req.user._id})
  }catch(error){
    if(error?.code===11000)throw badRequest('Attendance has already been recorded for this session','DUPLICATE_CHECK_IN')
    throw error
  }
  await AuditLog.create({actorId:req.user._id,action:'attendance.qr.checked-in',entityType:'AttendanceRecord',entityId:record._id,after:{sessionId:session._id,subjectId:session.subjectId,status:'present'},requestId:req.id})
  const faculty=await Section.findById(section._id).select('facultyIds').lean()
  for(const facultyId of faculty?.facultyIds||[])emitToUser(req,facultyId,'attendance:recorded',{sectionId:String(section._id),subjectId:String(session.subjectId),recorded:true})
  res.status(201).json({data:{id:String(record._id),status:record.status,recordedAt:record.recordedAt,subjectId:String(record.subjectId)}})
}))

router.get('/assignments',asyncRoute(async(req,res)=>{
  const sections=await studentSections(req.user._id)
  const assignments=await Assignment.find({sectionIds:{$in:sections.map(s=>s._id)},publishedAt:{$ne:null}}).populate('subjectId','name code').sort({dueAt:1}).lean()
  const submissions=await Submission.find({studentId:req.user._id,assignmentId:{$in:assignments.map(a=>a._id)}}).lean()
  const byAssignment=new Map(submissions.map(s=>[String(s.assignmentId),s]))
  res.json({data:{assignments:assignments.map(a=>{const s=byAssignment.get(String(a._id));return {id:String(a._id),title:a.title,description:a.description,subject:a.subjectId?.name,subjectCode:a.subjectId?.code,dueAt:a.dueAt,priority:a.priority,status:s?.status||((a.dueAt<new Date())?'overdue':'pending'),submittedAt:s?.submittedAt}}),empty:assignments.length===0}})
}))

router.post('/assignments/:id/submissions',validate(submissionSchema),asyncRoute(async(req,res)=>{
  const assignment=await Assignment.findOne({_id:req.params.id,sectionIds:{$in:(await studentSections(req.user._id)).map(s=>s._id)},publishedAt:{$ne:null}})
  if(!assignment)throw notFound('Assignment not found for your enrolled classes')
  const submission=await Submission.findOneAndUpdate({assignmentId:assignment._id,studentId:req.user._id},{$set:{responseText:req.body.responseText,status:'submitted',submittedAt:new Date()}},{upsert:true,new:true,runValidators:true,setDefaultsOnInsert:true})
  res.status(200).json({data:{id:String(submission._id),status:submission.status,submittedAt:submission.submittedAt}})
}))

router.get('/learning-gaps',asyncRoute(async(req,res)=>{
  const sections=await studentSections(req.user._id)
  const subjectIds=[...new Set(sections.flatMap(s=>s.subjectIds.map(x=>String(x._id))))]
  const [conceptList,plans]=await Promise.all([
    Concept.find({subjectId:{$in:subjectIds},isActive:true}).populate('subjectId','name code').populate('prerequisiteIds','name key version').lean(),
    LearningPlan.find({studentId:req.user._id}).populate('conceptId','name key subjectId prerequisiteIds version').lean(),
  ])
  res.json({data:{concepts:conceptList.map(c=>({id:String(c._id),key:c.key,name:c.name,subject:c.subjectId?.name,version:c.version,prerequisiteIds:c.prerequisiteIds.map(x=>String(x._id))})),plans:plans.map(p=>({id:String(p._id),concept:p.conceptId?.name,conceptId:String(p.conceptId?._id),accuracy:p.accuracy,evidenceCount:p.evidenceCount,correctCount:p.correctCount,reason:p.reason,status:p.status,version:p.conceptId?.version})),empty:conceptList.length===0}})
}))

router.get('/assessment/questions',asyncRoute(async(req,res)=>{
  const subjectId=req.query.subjectId
  if(!subjectId||!mongoose.isValidObjectId(subjectId))throw badRequest('A valid subjectId is required')
  const allowed=await studentSubjectIds(req.user._id)
  if(!allowed.includes(String(subjectId)))throw forbidden('You are not enrolled in this subject')
  const docs=await Question.find({subjectId,isActive:true}).select('-answerKey -explanation').populate('conceptId','name key').limit(40).lean()
  res.json({data:{questions:docs.map(q=>({id:String(q._id),prompt:q.prompt,options:q.options,conceptId:String(q.conceptId?._id),concept:q.conceptId?.name,difficulty:q.difficulty,version:q.version})),empty:docs.length===0}})
}))

router.post('/assessment/attempts',validate(attemptSchema),asyncRoute(async(req,res)=>{
  if(!(await studentSubjectIds(req.user._id)).includes(req.body.subjectId))throw forbidden('You are not enrolled in this subject')
  const unique=new Set(req.body.responses.map(a=>a.questionId))
  if(unique.size!==req.body.responses.length)throw badRequest('Question answers must be unique')
  const questions=await Question.find({_id:{$in:[...unique]},subjectId:req.body.subjectId,isActive:true}).select('+answerKey').lean()
  if(questions.length!==unique.size)throw badRequest('One or more questions are unavailable')
  const byId=new Map(questions.map(q=>[String(q._id),q]))
  const responses=req.body.responses.map(a=>{
    const q=byId.get(a.questionId)
    if(a.selectedIndex>=q.options.length)throw badRequest('Selected answer is not a valid option')
    return {questionId:q._id,selectedIndex:a.selectedIndex,isCorrect:a.selectedIndex===q.answerKey,conceptId:q.conceptId}
  })
  const score=Math.round(responses.filter(a=>a.isCorrect).length/responses.length*100)
  const attempt=await AssessmentAttempt.create({studentId:req.user._id,subjectId:req.body.subjectId,kind:req.body.kind,responses,score})
  await refreshLearningPlans(req.user._id,req.body.subjectId)
  emitToUser(req,req.user._id,'learning:plan-updated',{subjectId:req.body.subjectId})
  const result=await AssessmentAttempt.findById(attempt._id).populate('subjectId','name').lean()
  emitToUser(req,req.user._id,'assessment:completed',{attemptId:String(attempt._id),score})
  res.status(201).json({data:{id:String(result._id),score:result.score,kind:result.kind,completedAt:result.completedAt,subject:result.subjectId?.name,topicResults:responses.reduce((map,r)=>{const key=String(r.conceptId);map[key]??={correct:0,total:0};map[key].total++;if(r.isCorrect)map[key].correct++;return map},{})}})
}))

router.get('/practice',asyncRoute(async(req,res)=>{
  const plans=await LearningPlan.find({studentId:req.user._id,status:{$ne:'resolved'}}).populate('conceptId','name subjectId').populate('recommendedQuestionIds','prompt options difficulty conceptId').lean()
  res.json({data:{practiceSets:plans.map(p=>({conceptId:String(p.conceptId?._id),concept:p.conceptId?.name,subjectId:String(p.conceptId?.subjectId),accuracy:p.accuracy,evidenceCount:p.evidenceCount,reason:p.reason,questions:(p.recommendedQuestionIds||[]).map(q=>({id:String(q._id),prompt:q.prompt,options:q.options,explanation:q.explanation,difficulty:q.difficulty}))})),empty:plans.length===0}})
}))

router.get('/progress',asyncRoute(async(req,res)=>{
  const [attempts,plans,marks,attendance]=await Promise.all([
    AssessmentAttempt.find({studentId:req.user._id}).populate('subjectId','name code').sort({completedAt:1}).lean(),
    LearningPlan.find({studentId:req.user._id}).populate('conceptId','name').lean(),
    Mark.find({studentId:req.user._id,publishedAt:{$ne:null}}).lean(),
    AttendanceRecord.countDocuments({studentId:req.user._id}),
  ])
  res.json({data:{attempts:attempts.map(a=>({id:String(a._id),score:a.score,kind:a.kind,subject:a.subjectId?.name,completedAt:a.completedAt})),concepts:plans.map(p=>({name:p.conceptId?.name,accuracy:p.accuracy,evidenceCount:p.evidenceCount,status:p.status})),learningTimeMinutes:null,practiceCompletion:null,marksCount:marks.length,attendanceRecords:attendance,empty:attempts.length===0&&plans.length===0&&marks.length===0}})
}))

export default router
