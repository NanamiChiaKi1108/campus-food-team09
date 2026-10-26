const {test}=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function runtime(source='',fail=false,options={}){let record={_id:'s1',userId:'u1',time:'11:30',status:'authorized',remaining:1},sends=0;
 let revision={version:1};
 const db={async runTransaction(fn){return fn(db);},collection(name){return {where(q){return {limit(){return this;},async get(){return {data:Object.entries(q).every(([k,v])=>record[k]===v)?[{...record}]:[]};}};},doc(){const row=name==='appMeta'?revision:record;return {async get(){if(name==='subscriptions'&&options.missing)throw new Error('not found');return {data:{...row}};},async update({data}){Object.assign(row,data);}};}};}};
 const sdk={init(){},database:()=>db,getWXContext:()=>({SOURCE:source}),openapi:{subscribeMessage:{send:async()=>{sends++;if(fail)throw {errCode:43101};return {errCode:options.returnedCode||0};}}}};const module={exports:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../cloudfunctions/notifyMeals/index.js'),'utf8'),{require:()=>sdk,module,exports:module.exports,Date:class extends Date { static now(){return 1792380600000;} },process:{env:{SUBSCRIBE_TEMPLATE_ID:'test',SUBSCRIBE_DATA_JSON:'{"thing1":{"value":"午餐"},"time2":{"value":"{time}"}}'}}});return {main:module.exports.main,record,sends:()=>sends};}
test('小程序不能伪装定时器触发发送',async()=>{const r=runtime('wx_client');await a.rejects(()=>r.main({Type:'Timer'}),/仅允许/);a.equal(r.sends(),0);});
test('发送成功消耗一个额度并阻止重复消费',async()=>{const r=runtime();const out=await r.main({Type:'Timer'});a.equal(out.sent,1);a.equal(r.record.remaining,0);await r.main({Type:'Timer'});a.equal(r.sends(),1);});
test('发送失败保留失败状态，额度不标记成功消费',async()=>{const r=runtime('',true);const out=await r.main({Type:'Timer'});a.equal(out.failed,1);a.equal(r.record.status,'failed');a.equal(r.record.remaining,1);});

test('扫描后已被取消的提醒不会发送或中断整批任务',async()=>{const r=runtime('',false,{missing:true}),out=await r.main({Type:'Timer'});a.equal(out.sent,0);a.equal(r.sends(),0);});
test('SDK返回失败码时不能标记消息发送成功',async()=>{const r=runtime('',false,{returnedCode:43101}),out=await r.main({Type:'Timer'});a.equal(out.failed,1);a.equal(r.record.status,'failed');a.equal(r.record.remaining,1);});
