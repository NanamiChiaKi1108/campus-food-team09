// 只在本机预览演示资源；云函数、配置、备份和文档不通过 HTTP 暴露。
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=fs.realpathSync(path.resolve(__dirname,'..')),demo=path.join(root,'demo');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};
function createServer(){return http.createServer((req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
  const end=(code,message)=>{res.writeHead(code,headers);res.end(message||'');};
  if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/i.test(req.headers.host||''))return end(403,'Local host required');
  if(!['GET','HEAD'].includes(req.method)){headers.Allow='GET, HEAD';return end(405);}
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(e){return end(400);}
  if(pathname==='/'||pathname==='/demo/')pathname='/demo/index.html';
  if(pathname==='/favicon.ico')return end(204);
  if(pathname.includes('\0')||pathname.includes('\\'))return end(400);
  const file=path.resolve(root,'.'+pathname),isDemo=file.startsWith(demo+path.sep),isCore=file===path.join(root,'miniprogram','shared','core.js');
  if((!isDemo&&!isCore)||!types[path.extname(file)])return end(404);
  fs.realpath(file,(err,real)=>{
    if(err||real!==file)return end(404);
    fs.readFile(real,(error,b)=>{if(error)return end(404);res.writeHead(200,{...headers,'Content-Type':types[path.extname(real)],'Content-Length':b.length});res.end(req.method==='HEAD'?undefined:b);});
  });
});}
if(require.main===module){const port=Number(process.env.PORT||4173);createServer().listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}/demo/index.html`));}
module.exports={createServer};
