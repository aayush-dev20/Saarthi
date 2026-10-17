export function emitToSections(req,sectionIds,event,payload){
  const io=req.app.locals.io
  if(!io)return
  for(const id of sectionIds)io.to(`section:${String(id)}`).emit(event,payload)
}
export function emitToUser(req,userId,event,payload){
  req.app.locals.io?.to(`user:${String(userId)}`).emit(event,payload)
}
