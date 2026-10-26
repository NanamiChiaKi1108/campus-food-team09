const {test,before,after}=require('node:test'),a=require('node:assert/strict'),http=require('node:http'),{createServer}=require('../tools/serve.cjs');let server,port;
before(async()=>{server=createServer();await new Promise(done=>server.listen(0,'127.0.0.1',done));port=server.address().port;});
after(async()=>{await new Promise(done=>server.close(done));});
function request(path,options={}){return new Promise((resolve,reject)=>{http.request({hostname:'127.0.0.1',port,path,...options},r=>{let body='';r.on('data',b=>body+=b);r.on('end',()=>resolve({status:r.statusCode,headers:r.headers,body}));}).on('error',reject).end();});}
test('首页、共享规则、插画均可预览并携带安全响应头',async()=>{for(const url of ['/','/demo/dialog.js','/miniprogram/shared/core.js','/demo/assets/meal-hero.svg']){const r=await request(url);a.equal(r.status,200,url);a.equal(r.headers['x-content-type-options'],'nosniff');a.match(r.headers['content-security-policy'],/script-src 'self'/);}});
test('云函数、配置、备份和文档不会被预览服务公开',async()=>{for(const url of ['/cloudfunctions/campusApi/index.js','/miniprogram/config.js','/交付文件清单.txt','/package.json','/docs/README.md'])a.equal((await request(encodeURI(url))).status,404,url);});
test('目录遍历与编码反斜杠不能逃逸演示资源范围',async()=>{for(const url of ['/demo/../../package.json','/demo/%2e%2e/package.json','/demo/%5c..%5cpackage.json','/demo/%00.html'])a.ok([400,404].includes((await request(url)).status),url);});
test('非本机Host被拦截，防止主机头重绑定',async()=>{a.equal((await request('/',{headers:{Host:'attacker.example:4173'}})).status,403);a.equal((await request('/',{headers:{Host:'127.0.0.1.attacker.example'}})).status,403);});
test('预览只接受GET或HEAD，拒绝写入方法',async()=>{const r=await request('/',{method:'POST'});a.equal(r.status,405);a.equal(r.headers.allow,'GET, HEAD');});
test('HEAD返回正确资源长度但不传送正文，无效编码明确失败',async()=>{const r=await request('/demo/index.html',{method:'HEAD'});a.equal(r.status,200);a.equal(r.body,'');a.ok(Number(r.headers['content-length'])>0);a.equal((await request('/demo/%invalid')).status,400);});
