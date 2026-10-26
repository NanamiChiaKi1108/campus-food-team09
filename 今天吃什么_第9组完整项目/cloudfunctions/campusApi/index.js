/* 公共云调用与身份：范星宇。业务责任：catalog/admin 王俊杰、recommend 杨铭宇、reviews/profile 李付远。
 * 仅允许微信小程序调用，不开放 HTTP/Web 触发。数据库客户端一律无直接读写权限。
 */
'use strict';
const cloud=require('wx-server-sdk'),crypto=require('crypto'),C=require('./core');
cloud.init({env:cloud.DYNAMIC_CURRENT_ENV});
const db=cloud.database(),META='appMeta',TABLES=['canteens','windows','dishes','users','reviews','crowds','favorites','reports','votes','subscriptions','audit','mealPlans'];
const hash=x=>crypto.createHash('sha256').update(String(x)).digest('hex').slice(0,24);
const isAdmin=uid=>(process.env.ADMIN_OPENIDS||'').split(',').map(x=>x.trim()).filter(Boolean).includes(uid);
function authorized(){const c=cloud.getWXContext();C.assert(c.OPENID&&c.SOURCE==='wx_client','仅允许微信小程序身份调用');return {userId:c.OPENID,isAdmin:isAdmin(c.OPENID),now:Date.now(),env:c.ENV};}
async function rows(table){const out=[];for(let skip=0;skip<=2000;skip+=100){const r=await db.collection(table).skip(skip).limit(100).get();out.push(...r.data.map(x=>{delete x._id;return x;}));if(out.length>2000)throw new Error('课程原型数据已超过2000条，请先归档历史数据再使用');if(r.data.length<100)return out;}throw new Error('课程原型数据已超过2000条，请先归档历史数据再使用');}
async function revision(){try{return (await db.collection(META).doc('revision').get()).data.version;}catch(e){throw new Error('云端尚未初始化，请按部署说明完成管理员初始化');}}
async function load(){for(let i=0;i<4;i++){const v=await revision();const lists=await Promise.all(TABLES.map(rows));if(v===await revision())return {version:v,state:Object.fromEntries(TABLES.map((t,i)=>[t,lists[i]]))};}throw new Error('数据更新较频繁，请稍后重试');}
function publicState(state,ctx){const s=C.clone(state);s.crowds.forEach(r=>{r.publicUserId=hash(r.userId);});return C.snapshot(s,ctx);}
async function output(ctx){
  const {state}=await load(),visible=publicState(state,ctx);
  // 旧版可由客户端覆盖的原图不再签名；作者修改评价后会重新检测并冻结。
  visible.reviews.forEach(r=>{if((r.images||[]).some(id=>String(id).startsWith('cloud://')&&!new URL(id).pathname.startsWith('/verified/'))){r.images=[];r.imageNotice='旧版图片需作者修改并重新送审后展示';}});
  const ids=[...new Set(visible.reviews.flatMap(r=>r.images||[]).filter(id=>String(id).startsWith('cloud://')))];
  if(ids.length){
    const urls=new Map();
    for(let i=0;i<ids.length;i+=50){const r=await cloud.getTempFileURL({fileList:ids.slice(i,i+50)});for(const f of r.fileList||[])if(f.tempFileURL)urls.set(f.fileID,f.tempFileURL);}
    visible.reviews.forEach(r=>{r.images=(r.images||[]).map(id=>urls.get(id)||'').filter(Boolean);});
  }
  return {ok:true,state:visible,userId:state.users.some(u=>u.id===ctx.userId)?ctx.userId:'',isAdmin:ctx.isAdmin};
}
async function initialize(ctx){C.assert(ctx.isAdmin,'请先在云函数环境变量配置 ADMIN_OPENIDS');
  for(const t of [META,'uploads',...TABLES]){try{await db.createCollection(t);}catch(e){if(!/exist|已存在|-502002/i.test(String(e.message)))throw e;}}
  try{const old=await db.collection(META).doc('revision').get();if(old.data)return output(ctx);}catch(e){if(!/not exist|not found|不存在|-502001/i.test(String(e.message)))throw e;}
  const s=C.seed();['users','reviews','crowds','favorites','reports','votes','subscriptions','audit'].forEach(t=>s[t]=[]);
  for(const t of TABLES)for(const item of s[t])await db.collection(t).doc(item.id).set({data:item});
  await db.collection(META).doc('revision').set({data:{version:1,initializedAt:Date.now()}});return output(ctx);
}
async function checkText(content,openid){
  const r=await cloud.openapi.security.msgSecCheck({version:2,scene:2,openid,content});
  C.assert(r&&r.result&&r.result.suggest==='pass','内容未通过微信安全检测，请修改后重试');
}
async function checkImages(files,ctx,retained){
  C.assert(Array.isArray(files)&&files.length<=3,'最多三张图片');
  C.assert(!files.length||process.env.SECURE_STORAGE_RULES_ACK==='v1.2','请先按部署说明配置1.2版云存储规则');const verified=[];
  for(const fileID of files){
    C.assert(typeof fileID==='string'&&fileID.startsWith('cloud://'),'请先上传图片到本小程序云存储');
    const parsed=new URL(fileID);C.assert(ctx.env&&parsed.hostname.startsWith(ctx.env+'.'),'图片不属于当前云环境');
    // fileID 形如 cloud://env.bucket/reviews/uid-hash/uuid.jpg
    const actualPath=fileID.substring(fileID.indexOf('/',8)+1);
    const frozen=(retained||[]).includes(fileID)&&actualPath.startsWith('verified/'+hash(ctx.userId)+'/');
    C.assert(frozen||actualPath.startsWith('reviews/'+hash(ctx.userId)+'/'),'图片不属于当前用户');
    const tickets=await db.collection('uploads').where({userId:ctx.userId,cloudPath:actualPath}).limit(1).get();
    C.assert((retained||[]).includes(fileID)||(tickets.data.length&&tickets.data[0].expiresAt>Date.now()),'上传凭证过期，请重新选择图片');
    const file=await cloud.downloadFile({fileID});C.assert(file.fileContent.length<=1024*1024,'微信图片安全接口限制1MB，请先压缩图片');
    const b=file.fileContent,isJpeg=b[0]===0xff&&b[1]===0xd8,isPng=b[0]===0x89&&b[1]===0x50;
    C.assert(isJpeg||isPng,'云端仅接收 JPG 或 PNG 图片');
    const r=await cloud.openapi.security.imgSecCheck({media:{contentType:isPng?'image/png':'image/jpeg',value:b}});
    C.assert(r&&((Number.isInteger(r.errCode)&&r.errCode===0)||(Number.isInteger(r.errcode)&&r.errcode===0)),'图片未通过微信安全检测');
    if(frozen)verified.push(fileID);else{const copy=await cloud.uploadFile({cloudPath:'verified/'+hash(ctx.userId)+'/'+crypto.randomUUID()+(isPng?'.png':'.jpg'),fileContent:b});C.assert(copy&&copy.fileID,'图片保存失败，请重试');verified.push(copy.fileID);}
  }
  return verified;
}
async function commit(before,after,version){
  return db.runTransaction(async tx=>{
    const v=await tx.collection(META).doc('revision').get();if(v.data.version!==version)throw new Error('REVISION_CONFLICT');
    for(const t of TABLES){const old=new Map(before[t].map(r=>[r.id,r])),next=new Map(after[t].map(r=>[r.id,r]));
      for(const [id,item] of next)if(JSON.stringify(item)!==JSON.stringify(old.get(id)))await tx.collection(t).doc(id).set({data:item});
      for(const id of old.keys())if(!next.has(id))await tx.collection(t).doc(id).remove();
    }
    await tx.collection(META).doc('revision').update({data:{version:version+1,updatedAt:Date.now()}});
  });
}
exports.main=async event=>{
  let committed=false;
  try{
    C.assert(event&&typeof event==='object'&&!Array.isArray(event),'请求格式无效');C.assert(Buffer.byteLength(JSON.stringify(event),'utf8')<=7*1024*1024,'请求内容过大，请减少图片');const ctx=authorized(),action=event.action,p=event.payload||{};
    if(action==='whoami')return {ok:true,openid:ctx.userId,isAdmin:ctx.isAdmin};
    if(action==='initialize')return await initialize(ctx);
    if(action==='snapshot')return await output(ctx);
    if(action==='uploadTicket'){
      C.assert(process.env.SECURE_STORAGE_RULES_ACK==='v1.2','请先按部署说明配置1.2版云存储规则');
      const data=await load();C.assert(data.state.users.some(u=>u.id===ctx.userId),'请先登录');
      const cloudPath='reviews/'+hash(ctx.userId)+'/'+crypto.randomUUID()+'.jpg';
      await db.collection('uploads').add({data:{userId:ctx.userId,cloudPath,expiresAt:Date.now()+30*60000}});return {ok:true,cloudPath};
    }
    C.assert(['login','profile','favorite','crowd','review','updateReview','deleteReview','moderate','report','resolveReport','vote','subscribe','saveCatalog','upgradeCampusCatalog','saveBudget','saveMealPlan','completeMealPlan','reopenMealPlan','removeMealPlan'].includes(action),'未知操作');
    if(['moderate','resolveReport','saveCatalog','upgradeCampusCatalog'].includes(action))C.assert(ctx.isAdmin,'此操作仅限管理员');
    const baseline=await load();if(action==='moderate')C.assert(typeof p.expectedToken==='string','请刷新评价列表后重新审核');C.apply(baseline.state,action,p,ctx);let checkedImages,editToken;
    if(action==='review'){C.assert(typeof p.text==='string'&&p.text.trim().length>=5&&p.text.length<=300,'评价需要5–300字');await checkText(p.text,ctx.userId);checkedImages=await checkImages(p.images||[],ctx);}
    if(action==='updateReview'){const original=baseline.state.reviews.find(r=>r.id===p.id);C.assert(original&&original.userId===ctx.userId,'只能修改自己的评价');editToken=C.reviewToken(original);await checkText(p.text,ctx.userId);checkedImages=await checkImages(original.images||[],ctx,original.images||[]);}
    if(action==='profile'){C.assert(typeof p.nickname==='string'&&p.nickname.trim().length>=2&&p.nickname.length<=20,'昵称需要2–20字');await checkText(p.nickname,ctx.userId);}
    if(action==='report'){C.assert(typeof p.reason==='string'&&p.reason.trim().length>=3&&p.reason.length<=120,'举报原因需要3–120字');await checkText(p.reason,ctx.userId);}
    if(action==='subscribe'&&p.enabled)C.assert(process.env.SUBSCRIBE_TEMPLATE_ID,'服务端尚未配置订阅模板');
    for(let retry=0;retry<4;retry++){
      const loaded=await load(),before=loaded.state;
      if(action==='moderate'&&p.status==='approved'){const r=before.reviews.find(r=>r.id===p.id);C.assert(r&&r.machineChecked===true,'评价尚未通过微信文本和图片检查，不能公开');}
      if(action==='updateReview'){const current=before.reviews.find(r=>r.id===p.id);C.assert(current&&C.reviewToken(current)===editToken,'评价已更新，请刷新后再修改');}
      const after=C.apply(before,action,p,ctx);
      if(action==='review'){after.reviews.filter(r=>!before.reviews.some(x=>x.id===r.id)).forEach(r=>{r.images=checkedImages;r.machineChecked=true;r.checkedAt=Date.now();});}
      if(action==='updateReview'){const r=after.reviews.find(r=>r.id===p.id);r.images=checkedImages;r.machineChecked=true;r.checkedAt=Date.now();}
      try{await commit(before,after,loaded.version);committed=true;return await output(ctx);}catch(e){if(!committed&&/REVISION_CONFLICT|transaction.*conflict|事务冲突/i.test(e.message)&&retry<3)continue;throw e;}
    }
    throw new Error('更新冲突，请重试');
  }catch(e){const requestId=crypto.randomUUID();console.error('[campusApi]',requestId,e.name);return {ok:false,committed,error:committed?'数据已保存，但刷新失败，请稍后刷新查看':e.name==='FoodError'?e.message:/security|openapi/i.test(e.message)?'微信内容检测暂不可用，内容未发布，请稍后重试':'云端操作失败，请稍后重试',requestId};}
};
