import React,{createContext,useContext,useState} from 'react'
import {api} from '../api/client.js'

const AuthContext=createContext(null)
export function AuthProvider({children}){
  const [user,setUser]=useState(null)
  const [ready,setReady]=useState(false)
  const [authError,setAuthError]=useState('')
  const initialize=async()=>{
    try{let result;try{result=await api.get('/auth/me')}catch(error){if(error.status!==401)throw error;await api.post('/auth/refresh',{});result=await api.get('/auth/me')}setUser(result.user);setAuthError('')}
    catch(error){if(error.status!==401)setAuthError(error.message);setUser(null)}
    finally{setReady(true)}
  }
  React.useEffect(()=>{initialize()},[])
  const login=async(credentials)=>{const result=await api.post('/auth/login',credentials);setUser(result.user);setAuthError('');return result.user}
  const logout=async()=>{try{await api.post('/auth/logout',{})}finally{setUser(null)}}
  return <AuthContext.Provider value={{user,ready,authError,login,logout,refreshUser:initialize}}>{children}</AuthContext.Provider>
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('useAuth must be used inside AuthProvider');return value}
