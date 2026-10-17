export class HttpError extends Error{
  constructor(status,message,code='REQUEST_FAILED'){super(message);this.status=status;this.code=code}
}
export const badRequest=(message,code)=>new HttpError(400,message,code)
export const unauthorized=(message='Authentication required')=>new HttpError(401,message,'UNAUTHORIZED')
export const forbidden=(message='You do not have permission for this action')=>new HttpError(403,message,'FORBIDDEN')
export const notFound=(message='Resource not found')=>new HttpError(404,message,'NOT_FOUND')
export const unavailable=(message='Database service is unavailable')=>new HttpError(503,message,'SERVICE_UNAVAILABLE')
export function asyncRoute(handler){return (req,res,next)=>Promise.resolve(handler(req,res,next)).catch(next)}
