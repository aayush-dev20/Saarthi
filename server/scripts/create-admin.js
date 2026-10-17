import readline from 'node:readline/promises'
import {stdin,stdout} from 'node:process'
import bcrypt from 'bcryptjs'
import {getConfig} from '../config.js'
import {connectDatabase,disconnectDatabase} from '../db.js'
import {User} from '../models/User.js'
import {logger} from '../logger.js'

const config=getConfig()
const rl=readline.createInterface({input:stdin,output:stdout})
function secret(prompt){
  return new Promise(resolve=>{
    stdout.write(prompt)
    stdin.setRawMode?.(true)
    let value=''
    const onData=chunk=>{
      const key=chunk.toString()
      if(key==='\r'||key==='\n'){stdin.off('data',onData);stdin.setRawMode?.(false);stdout.write('\n');resolve(value);return}
      if(key==='\u0003'){stdin.off('data',onData);stdin.setRawMode?.(false);rl.close();process.exit(130)}
      if(key==='\u007f'||key==='\b'){value=value.slice(0,-1);return}
      if(key.length===1)value+=key
    }
    stdin.on('data',onData)
  })
}
try{
  if(!stdin.isTTY)throw new Error('Run this command in an interactive terminal')
  await connectDatabase(config.MONGODB_URI,config.NODE_ENV)
  if(await User.exists({role:'admin'}))throw new Error('An admin account already exists. Add later admins through the authenticated admin API.')
  const name=(await rl.question('Administrator name: ')).trim()
  const email=(await rl.question('Administrator email: ')).trim().toLowerCase()
  const password=await secret('Password (12+ characters): ')
  if(!name||!email.includes('@')||password.length<12)throw new Error('Enter a valid name/email and a password of at least 12 characters')
  const user=await User.create({name,email,passwordHash:await bcrypt.hash(password,12),role:'admin',isActive:true})
  logger.info({userId:String(user._id)},'Initial administrator created')
}catch(error){
  logger.error({message:error.message},'Administrator provisioning failed')
  process.exitCode=1
}finally{
  rl.close()
  await disconnectDatabase().catch(()=>{})
}
