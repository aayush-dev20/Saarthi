import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'
export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'')
  const apiTarget=env.API_ORIGIN||'http://127.0.0.1:4000'
  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    // React Flow 11.11.4 ships its ESM core as index.js while package metadata
    // points to index.mjs. Resolve that published entry mismatch for Vite.
    alias: {
      '@reactflow/core': fileURLToPath(new URL('./node_modules/@reactflow/core/dist/esm/index.js', import.meta.url)),
      'zustand/traditional': fileURLToPath(new URL('./node_modules/zustand/traditional.js', import.meta.url)),
    },
  },
  server:{proxy:{'/api':{target:apiTarget,changeOrigin:true,configure(proxy){proxy.on('error',(_error,_request,response)=>{if(!response||response.headersSent||response.destroyed)return;response.writeHead(503,{'Content-Type':'application/json'});response.end(JSON.stringify({error:{code:'API_UNAVAILABLE',message:'Saarthi API is not running. Configure MongoDB in .env, then run npm run dev:server.'}}))})}},'/socket.io':{target:apiTarget,changeOrigin:true,ws:true}}},
  }
})
