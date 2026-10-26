// 负责人：范星宇。仅定时触发，一次授权最多发送一次；字段名必须匹配自选模板。
'use strict';
const cloud=require('wx-server-sdk');cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database();
async function change(id,expected,fields,expectedTime){return db.runTransaction(async tx=>{const meta=await tx.collection('appMeta').doc('revision').get();let doc;try{doc=await tx.collection('subscriptions').doc(id).get();}catch(e){if(/not exist|not found|不存在|-502001/i.test(String(e.message)))return false;throw e;}if(!doc.data||doc.data.status!==expected||(expectedTime&&(doc.data.time!==expectedTime||doc.data.remaining!==1)))return false;await tx.collection('subscriptions').doc(id).update({data:fields});await tx.collection('appMeta').doc('revision').update({data:{version:meta.data.version+1}});return true;});}
exports.main=async event=>{
  const wxContext=cloud.getWXContext();
  if(!event||event.Type!=='Timer'||String(wxContext.SOURCE||'').includes('wx_client'))throw new Error('仅允许服务端定时触发');
  const templateId=process.env.SUBSCRIBE_TEMPLATE_ID,definition=process.env.SUBSCRIBE_DATA_JSON;
  if(!templateId||!definition)throw new Error('请配置 SUBSCRIBE_TEMPLATE_ID 和 SUBSCRIBE_DATA_JSON');
  const now=Date.now(),china=new Date(now+8*3600000),time=china.toISOString().slice(11,16);
  const date=china.toISOString().slice(0,16).replace('T',' ');
  const data=JSON.parse(definition.replace(/\{time\}/g,date));
  const due=await db.collection('subscriptions').where({time,status:'authorized',remaining:1}).limit(100).get();
  let sent=0,failed=0;
  for(const sub of due.data){
    // 先原子占用名额，防止重复定时器并发发送同一授权。
    const claim=await change(sub._id,'authorized',{status:'sending',claimedAt:now},time);
    if(!claim)continue;
    try{
      const result=await cloud.openapi.subscribeMessage.send({touser:sub.userId,templateId,page:'pages/home/index',miniprogramState:process.env.MINIPROGRAM_STATE||'developer',lang:'zh_CN',data});
      if(!result||Number(result.errCode===undefined?result.errcode:result.errCode)!==0)throw new Error('SUBSCRIBE_RESULT_INVALID');
      await change(sub._id,'sending',{status:'sent',remaining:0,sentAt:Date.now()});sent++;
    }catch(e){
      // 网络结果不明时不自动恢复名额，避免重复发送。保留错误供管理员核对。
      await change(sub._id,'sending',{status:'failed',errorCode:String(e.errCode||e.errcode||'UNKNOWN'),failedAt:Date.now()});failed++;
    }
  }
  return {sent,failed,checked:due.data.length};
};
