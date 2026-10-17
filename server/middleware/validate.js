import {badRequest} from '../lib/errors.js'

export function validate(schema,source='body'){
  return (req,_res,next)=>{
    const result=schema.safeParse(req[source])
    if(!result.success)return next(badRequest('Request data is invalid','VALIDATION_ERROR'))
    req[source]=result.data
    next()
  }
}
