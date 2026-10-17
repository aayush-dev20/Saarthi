import {Router} from 'express'
import {z} from 'zod'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import {requireAuth,requireRole} from '../middleware/auth.js'
import {validate} from '../middleware/validate.js'
import {asyncRoute,badRequest,notFound} from '../lib/errors.js'
import {Section,Subject} from '../models/Academic.js'
import {AuditLog,Concept,Question} from '../models/Learning.js'
import {User} from '../models/User.js'

const router=Router()
router.use(requireAuth,requireRole('admin'))
const oid=z.string().refine(v=>mongoose.isValidObjectId(v),'Invalid record identifier')
const userSchema=z.object({name:z.string().trim().min(1).max(120),email:z.string().email().max(254).transform(v=>v.toLowerCase()),password:z.string().min(12).max(200),role:z.enum(['student','faculty','admin']),institutionId:z.string().trim().max(100).optional(),institutionalRecordRef:z.string().trim().max(200).optional(),department:z.string().trim().max(120).optional(),sectionIds:z.array(oid).default([])}).strict().refine(v=>v.role==='admin'||(Boolean(v.institutionId)&&Boolean(v.institutionalRecordRef)),{message:'Institution ID and institutional record reference are required for student and faculty accounts',path:['institutionalRecordRef']})
const subjectSchema=z.object({name:z.string().trim().min(1).max(120),code:z.string().trim().min(2).max(20),department:z.string().trim().max(120).optional(),semester:z.number().int().min(1).max(12)}).strict()
const sectionSchema=z.object({name:z.string().trim().min(1).max(80),term:z.string().trim().min(1).max(80),subjectIds:z.array(oid).max(30).default([]),studentIds:z.array(oid).max(500).default([]),facultyIds:z.array(oid).max(30).default([])}).strict()
const conceptSchema=z.object({key:z.string().trim().min(1).max(80).toLowerCase(),name:z.string().trim().min(1).max(160),subjectId:oid,description:z.string().max(2000).default(''),prerequisiteIds:z.array(oid).max(50).default([]),version:z.number().int().min(1).default(1)}).strict()
const questionSchema=z.object({prompt:z.string().trim().min(1).max(3000),options:z.array(z.string().trim().min(1).max(1000)).min(2).max(6),answerKey:z.number().int().min(0).max(5),explanation:z.string().trim().min(1).max(3000),conceptId:oid,subjectId:oid,difficulty:z.enum(['foundational','practice','challenge']).default('practice'),version:z.number().int().min(1).default(1)}).strict()

router.post('/users',validate(userSchema),asyncRoute(async(req,res)=>{
  const body=req.body
  const sections=body.sectionIds.length?await Section.find({_id:{$in:body.sectionIds},isActive:true}):[]
  if(sections.length!==body.sectionIds.length)throw badRequest('One or more sections do not exist')
  const user=await User.create({name:body.name,email:body.email,passwordHash:await bcrypt.hash(body.password,12),role:body.role,institutionId:body.institutionId,institutionalRecordRef:body.institutionalRecordRef,department:body.department,sectionIds:body.sectionIds,verifiedAt:body.role==='admin'?null:new Date()})
  for(const section of sections){if(body.role==='student')await Section.updateOne({_id:section._id},{$addToSet:{studentIds:user._id}});if(body.role==='faculty')await Section.updateOne({_id:section._id},{$addToSet:{facultyIds:user._id}})}
  await AuditLog.create({actorId:req.user._id,action:'user.created',entityType:'User',entityId:user._id,after:{email:user.email,role:user.role,institutionId:user.institutionId,institutionalRecordRef:user.institutionalRecordRef,verified:Boolean(user.verifiedAt)},requestId:req.id})
  res.status(201).json({data:{id:String(user._id),name:user.name,email:user.email,role:user.role,verified:Boolean(user.verifiedAt)}})
}))

router.patch('/users/:id/sections',asyncRoute(async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))throw notFound('User not found')
  const parsed=z.object({sectionIds:z.array(oid).max(100)}).strict().safeParse(req.body)
  if(!parsed.success)throw badRequest('Invalid section list')
  const user=await User.findById(req.params.id)
  if(!user)throw notFound('User not found')
  const sections=await Section.find({_id:{$in:parsed.data.sectionIds},isActive:true})
  if(sections.length!==parsed.data.sectionIds.length)throw badRequest('One or more sections do not exist')
  const before=user.sectionIds.map(String)
  user.sectionIds=sections.map(s=>s._id)
  await user.save()
  const membershipField=user.role==='student'?'studentIds':'facultyIds'
  await Section.updateMany({[membershipField]:user._id},{$pull:{[membershipField]:user._id}})
  if(user.role!=='admin')await Section.updateMany({_id:{$in:sections.map(s=>s._id)}},{$addToSet:{[membershipField]:user._id}})
  await AuditLog.create({actorId:req.user._id,action:'user.sections.updated',entityType:'User',entityId:user._id,before:{sectionIds:before},after:{sectionIds:parsed.data.sectionIds},requestId:req.id})
  res.json({data:{id:String(user._id),sectionIds:parsed.data.sectionIds}})
}))

router.post('/subjects',validate(subjectSchema),asyncRoute(async(req,res)=>{
  const subject=await Subject.create(req.body)
  await AuditLog.create({actorId:req.user._id,action:'subject.created',entityType:'Subject',entityId:subject._id,after:{name:subject.name,code:subject.code,semester:subject.semester},requestId:req.id})
  res.status(201).json({data:{id:String(subject._id),name:subject.name,code:subject.code}})
}))

router.post('/sections',validate(sectionSchema),asyncRoute(async(req,res)=>{
  const [students,faculty,subjects]=await Promise.all([
    User.find({_id:{$in:req.body.studentIds},role:'student',isActive:true}),User.find({_id:{$in:req.body.facultyIds},role:'faculty',isActive:true}),Subject.find({_id:{$in:req.body.subjectIds},isActive:true}),
  ])
  if(students.length!==req.body.studentIds.length||faculty.length!==req.body.facultyIds.length||subjects.length!==req.body.subjectIds.length)throw badRequest('Roster contains an inactive or incorrectly-role-assigned user or subject')
  const section=await Section.create(req.body)
  await Promise.all([...students.map(u=>User.updateOne({_id:u._id},{$addToSet:{sectionIds:section._id}})),...faculty.map(u=>User.updateOne({_id:u._id},{$addToSet:{sectionIds:section._id}}))])
  await AuditLog.create({actorId:req.user._id,action:'section.created',entityType:'Section',entityId:section._id,after:{name:section.name,term:section.term,studentCount:students.length,facultyCount:faculty.length},requestId:req.id})
  res.status(201).json({data:{id:String(section._id),name:section.name,term:section.term}})
}))

router.post('/concepts',validate(conceptSchema),asyncRoute(async(req,res)=>{
  const subject=await Subject.findById(req.body.subjectId)
  if(!subject)throw notFound('Subject not found')
  const prereqs=req.body.prerequisiteIds
  if(new Set(prereqs).size!==prereqs.length)throw badRequest('Prerequisites must be unique')
  if(prereqs.length&&await Concept.countDocuments({_id:{$in:prereqs},subjectId:req.body.subjectId})!==prereqs.length)throw badRequest('Prerequisites must belong to the same subject')
  const concept=await Concept.create(req.body)
  await AuditLog.create({actorId:req.user._id,action:'concept.created',entityType:'Concept',entityId:concept._id,after:{key:concept.key,version:concept.version,prerequisiteIds:concept.prerequisiteIds},requestId:req.id})
  res.status(201).json({data:{id:String(concept._id),name:concept.name,key:concept.key,version:concept.version}})
}))

router.post('/questions',validate(questionSchema),asyncRoute(async(req,res)=>{
  if(req.body.answerKey>=req.body.options.length)throw badRequest('Correct answer index is outside the option list')
  const concept=await Concept.findOne({_id:req.body.conceptId,subjectId:req.body.subjectId,isActive:true})
  if(!concept)throw badRequest('Question concept must belong to the selected subject')
  const question=await Question.create(req.body)
  await AuditLog.create({actorId:req.user._id,action:'question.created',entityType:'Question',entityId:question._id,after:{conceptId:question.conceptId,subjectId:question.subjectId,version:question.version},requestId:req.id})
  res.status(201).json({data:{id:String(question._id),conceptId:String(question.conceptId),version:question.version}})
}))

router.get('/audit',asyncRoute(async(req,res)=>{
  const rows=await AuditLog.find().sort({createdAt:-1}).limit(200).populate('actorId','name email role').lean()
  res.json({data:{entries:rows.map(a=>({id:String(a._id),actor:a.actorId?.name,role:a.actorId?.role,action:a.action,entityType:a.entityType,entityId:String(a.entityId),reason:a.reason,createdAt:a.createdAt,before:a.before,after:a.after}))}})
}))

export default router
