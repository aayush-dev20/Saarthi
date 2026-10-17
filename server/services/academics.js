import {Section} from '../models/Academic.js'
import {forbidden,notFound} from '../lib/errors.js'

export async function studentSections(userId){
  return Section.find({studentIds:userId,isActive:true}).populate('subjectIds','name code semester department').lean()
}

export async function facultySections(userId){
  return Section.find({facultyIds:userId,isActive:true}).populate('subjectIds','name code semester department').lean()
}

export async function requireFacultySection(userId,sectionId){
  const section=await Section.findOne({_id:sectionId,facultyIds:userId,isActive:true})
  if(!section)throw forbidden('This section is not assigned to your faculty account')
  return section
}

export async function requireEnrolled(userId,sectionId){
  const section=await Section.findOne({_id:sectionId,studentIds:userId,isActive:true})
  if(!section)throw notFound('No enrolled class matches this record')
  return section
}

export const idString=id=>String(id?._id||id)
