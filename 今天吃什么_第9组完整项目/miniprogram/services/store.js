// 负责人：范星宇；跨端调用和本地持久化。云模式错误不回退成演示成功。
const C=require('../shared/core'),config=require('../config');
const KEY='campus-food-native-v1',SKEY='campus-food-native-session-v1';
let cache,session,cloudLogged=false;
try{const saved=wx.getStorageSync(KEY);cache=(config.mode==='demo'?C.upgradeDemoCatalog:C.migrate)(saved&&saved.state?saved.state:saved||C.seed());session=saved&&saved.state?saved.session:wx.getStorageSync(SKEY)||{userId:'',isAdmin:false};cloudLogged=!!wx.getStorageSync('campus-food-cloud-logged');}catch(e){cache=C.seed();session={userId:'',isAdmin:false};try{wx.setStorageSync(KEY+'-recovery',wx.getStorageSync(KEY));}catch(ignore){}wx.showToast({title:'历史数据异常，已备份并加载体验资料',icon:'none'});}
if(config.mode==='cloud') { cache=C.seed();Object.keys(cache).forEach(k=>{if(Array.isArray(cache[k]))cache[k]=[];});session={userId:'',isAdmin:false}; }
function save(){wx.setStorageSync(KEY,{version:2,state:cache,session});}
let queue=Promise.resolve(),generation=0,authEpoch=0;
function adopt(r){cache=cloudLogged?r.state:C.snapshot(r.state,{userId:'',isAdmin:false});session={userId:cloudLogged?(r.userId||''):'',isAdmin:cloudLogged&&!!r.isAdmin};}
async function remote(action,payload,epoch){if(epoch!==authEpoch)throw new Error('登录状态已改变，已取消尚未发送的操作');const response=await wx.cloud.callFunction({name:config.functionName,data:{action,payload:payload||{}}});const r=response.result;if(epoch!==authEpoch)return cache;if(!r||!r.ok){if(r&&r.committed){generation++;try{const fresh=await wx.cloud.callFunction({name:config.functionName,data:{action:'snapshot',payload:{}}});if(epoch===authEpoch&&fresh.result&&fresh.result.ok)adopt(fresh.result);}catch(ignore){} }throw new Error(r&&r.error||'云端请求失败');}if(action==='login'){wx.setStorageSync('campus-food-cloud-logged',true);cloudLogged=true;}adopt(r);return cache;}
async function refresh(){if(config.mode==='cloud'){const ticket=++generation,epoch=authEpoch;await queue;if(epoch!==authEpoch)return cache;const response=await wx.cloud.callFunction({name:config.functionName,data:{action:'snapshot',payload:{}}});const r=response.result;if(epoch!==authEpoch)return cache;if(!r||!r.ok)throw new Error(r&&r.error||'云端请求失败');if(ticket===generation)adopt(r);return cache;}return cache;}
async function action(name,payload){
  if(config.mode==='cloud'){if(name!=='login'&&(!cloudLogged||!session.userId))throw new Error('请先登录');generation++;const epoch=authEpoch,task=queue.then(()=>remote(name,payload,epoch));queue=task.catch(()=>{});return task;}
  const oldCache=cache,oldSession={...session};try{if(name==='login')session.userId='demo-student';cache=C.apply(cache,name,payload,{...session,demo:true});save();return cache;}catch(e){cache=oldCache;session=oldSession;throw e;}
}
function login(){return action('login');}
function demoAdmin(){if(config.mode!=='demo')throw new Error('云端权限只能在服务端配置');const old={...session},before=cache;session={userId:'demo-student',isAdmin:true};try{cache=C.apply(cache,'login',{},session);save();}catch(e){session=old;cache=before;throw e;}}
function logout(){const before=cache,old={...session},oldLogged=cloudLogged;generation++;authEpoch++;try{session={userId:'',isAdmin:false};if(config.mode==='demo')save();else{wx.setStorageSync('campus-food-cloud-logged',false);cloudLogged=false;cache=C.snapshot(cache,{userId:'',isAdmin:false});}}catch(e){cache=before;session=old;cloudLogged=oldLogged;throw e;}}
function profile(){return cache.users.find(u=>u.id===session.userId)||{nickname:'未登录',taste:'不限',avoid:[],maxSpice:3};}
function current(){return cache;}
function ctx(){return session;}
function favorite(type,id){return cache.favorites.some(f=>f.userId===session.userId&&f.type===type&&f.targetId===id);}
function dishes(items){return items.map(d=>{const w=cache.windows.find(w=>w.id===d.windowId)||{},c=cache.canteens.find(c=>c.id===d.canteenId)||{};return {...d,price:(d.priceCents/100).toFixed(d.priceCents%100?2:0),windowName:w.name,canteenName:c.name,rating:C.rating(cache,d.id).score,spiceLabel:['不辣','微辣','中辣','重辣'][d.spice],favorite:favorite('dish',d.id),crowd:C.crowd(cache,'window',d.windowId)};});}
function error(e){wx.showToast({title:e.message||'操作失败，请重试',icon:'none',duration:3000});}
function requireLogin(){if(session.userId)return true;wx.showModal({title:'先登录，再留下食堂记忆',content:config.mode==='demo'?'在个人中心使用本地体验身份即可收藏、评价和上报。':'请前往个人中心登录。',confirmText:'去登录',success:r=>{if(r.confirm)wx.switchTab({url:'/pages/profile/index'});}});return false;}
module.exports={C,config,refresh,action,login,logout,demoAdmin,profile,current,ctx,favorite,dishes,error,requireLogin};
