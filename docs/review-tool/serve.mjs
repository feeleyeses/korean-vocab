import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./',import.meta.url)),port=Number(process.env.REVIEW_PORT||4174);
http.createServer(async(req,res)=>{try{
 if(req.method!=='GET'){res.writeHead(405);res.end();return;}
 const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
 const target=await fs.realpath(path.resolve(root,rel));
 if(!target.startsWith(root)){res.writeHead(403);res.end();return;}
 const mime={'.html':'text/html','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
 if(!mime[path.extname(target)]){res.writeHead(403);res.end();return;}
 res.writeHead(200,{'Content-Type':mime[path.extname(target)]+'; charset=utf-8','Cache-Control':'no-store'});res.end(await fs.readFile(target));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log('Research-only reviewer: http://127.0.0.1:'+port));
