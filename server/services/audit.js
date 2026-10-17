import {AuditLog} from '../models/Learning.js'

export function audit(req,{action,entityType,entityId,reason,before,after}){
  return AuditLog.create({actorId:req.user._id,action,entityType,entityId,reason,before,after,requestId:req.id})
}
