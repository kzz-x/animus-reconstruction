import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.ANIMUS_PORT||8787),url=`http://127.0.0.1:${port}/`;
async function ready(){try{const response=await fetch(url,{signal:AbortSignal.timeout(700)});return response.headers.get('x-animus-studio')==='1';}catch{return false;}}
if(!await ready()){const child=spawn(process.execPath,[path.join(root,'serve.mjs')],{cwd:root,detached:true,windowsHide:true,stdio:'ignore'});child.unref();}
let success=false;for(let attempt=0;attempt<30;attempt++){if(await ready()){success=true;break;}await new Promise(r=>setTimeout(r,100));}
if(!success){console.error(`启动失败：请检查端口 ${port} 是否被其他程序占用。`);process.exit(1);}
console.log('Animus Studio 已就绪：'+url);
if(process.platform==='win32')spawn('powershell.exe',['-NoProfile','-Command',`Start-Process '${url}'`],{windowsHide:true,stdio:'ignore'}).unref();
