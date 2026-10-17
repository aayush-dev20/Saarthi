import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import {getConfig} from '../config.js'
import {createApp} from '../app.js'

const base={MONGODB_URI:'mongodb://127.0.0.1:27017/saarthi-test',JWT_SECRET:'a'.repeat(48)}

test('configuration parses origins and enables secure cookies in production',()=>{
  const config=getConfig({...base,NODE_ENV:'production',CLIENT_ORIGINS:'https://saarthi.example,https://admin.example'})
  assert.equal(config.secureCookies,true)
  assert.deepEqual(config.clientOrigins,['https://saarthi.example','https://admin.example'])
})

test('configuration refuses missing Mongo URI and weak JWT secrets',()=>{
  assert.throws(()=>getConfig({JWT_SECRET:'x'.repeat(31)}),/MONGODB_URI/)
  assert.throws(()=>getConfig({MONGODB_URI:base.MONGODB_URI,JWT_SECRET:'x'.repeat(31)}),/JWT_SECRET/)
  assert.throws(()=>getConfig({MONGODB_URI:base.MONGODB_URI,JWT_SECRET:'replace-with-at-least-32-random-bytes'}),/placeholder/)
})

test('health reports a disconnected database and protected student API rejects anonymous access',async t=>{
  mongoose.set('bufferCommands',false)
  const app=createApp(getConfig(base))
  const server=app.listen(0)
  t.after(()=>new Promise(resolve=>server.close(resolve)))
  const address=server.address()
  const origin=`http://127.0.0.1:${address.port}`
  const health=await fetch(`${origin}/api/health`)
  assert.equal(health.status,503)
  assert.equal((await health.json()).database,'disconnected')
  const student=await fetch(`${origin}/api/student/dashboard`)
  assert.equal(student.status,401)
  assert.equal((await student.json()).error.code,'UNAUTHORIZED')
  const login=await fetch(`${origin}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'student@college.example',password:'correct-horse-battery'})})
  assert.equal(login.status,503)
  assert.equal((await login.json()).error.code,'DATABASE_UNAVAILABLE')
})
