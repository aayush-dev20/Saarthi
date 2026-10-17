export class ApiError extends Error{
  constructor(message,status,code){super(message);this.name='ApiError';this.status=status;this.code=code}
}

async function send(path,options={},retry=true){
  let response
  try{response=await fetch(`/api${path}`,{...options,credentials:'include',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}})}
  catch{throw new ApiError('Could not connect to Saarthi. Check that the API server is running.',0,'NETWORK_ERROR')}
  if(response.status===401&&retry&&!path.startsWith('/auth/')){
    const refresh=await fetch('/api/auth/refresh',{method:'POST',credentials:'include'})
    if(refresh.ok)return send(path,options,false)
  }
  if(response.status===204)return null
  const body=await response.json().catch(()=>({}))
  if(!response.ok)throw new ApiError(body.error?.message||'The request could not be completed.',response.status,body.error?.code)
  return body
}

export const api={
  get:(path)=>send(path),
  post:(path,body)=>send(path,{method:'POST',body:JSON.stringify(body)}),
  patch:(path,body)=>send(path,{method:'PATCH',body:JSON.stringify(body)}),
  delete:(path)=>send(path,{method:'DELETE'}),
}
