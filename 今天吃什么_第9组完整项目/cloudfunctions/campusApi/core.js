/* 共享业务规则。模块负责人：杨铭宇（筛选推荐）、范星宇（拥挤度与身份）、
 * 李付远（评价收藏）、王俊杰（目录和管理）。跨端共用，不依赖 wx 或 DOM。 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FoodCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var TTL = 15 * 60 * 1000;
  var OWNERS = {
    catalog: '王俊杰', admin: '王俊杰', home: '杨铭宇', recommend: '杨铭宇',
    reviews: '李付远', favorites: '李付远', profile: '李付远',
    auth: '范星宇', crowd: '范星宇', cloud: '范星宇', plan: '范星宇', budget: '范星宇'
  };
  function assert(ok, message) { if (!ok) {var e=new Error(message);e.name='FoodError';throw e;} }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function id(prefix) { return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10); }
  function clean(s, max) { return String(s || '').trim().slice(0, max); }
  function seed(now) {
    now = now || Date.now();
    var canteens = [
      { id: 'c1', name: '基础园餐厅', location: '具体位置待核实', hours: '营业时间待核实', emoji: '🍚', note: '示例窗口：家常小炒、一碗好面' },
      { id: 'c2', name: '湖畔餐厅', location: '具体位置待核实', hours: '营业时间待核实', emoji: '🍜', note: '示例窗口：川味食光、轻食研究所' },
      { id: 'c3', name: '翔远餐厅', location: '具体位置待核实', hours: '营业时间待核实', emoji: '🥗', note: '示例窗口：南洋风味、热气蒸坊' },
      { id: 'c4', name: '鸿鹄餐厅', location: '具体位置待核实', hours: '营业时间待核实', emoji: '🥘', note: '示例窗口：铁板风味、东北家常' },
      { id: 'c5', name: '莘子园餐厅', location: '具体位置待核实', hours: '营业时间待核实', emoji: '🥟', note: '示例窗口：手工饺子、砂锅小馆' }
    ];
    var windows = [
      { id: 'w1', canteenId: 'c1', name: '家常小炒', floor: '一楼 01号', hours: '10:30–19:30' },
      { id: 'w2', canteenId: 'c1', name: '一碗好面', floor: '一楼 06号', hours: '07:00–20:30' },
      { id: 'w3', canteenId: 'c2', name: '川味食光', floor: '二楼 03号', hours: '10:30–20:00' },
      { id: 'w4', canteenId: 'c2', name: '轻食研究所', floor: '一楼 08号', hours: '09:00–20:00' },
      { id: 'w5', canteenId: 'c3', name: '南洋风味', floor: '一楼 02号', hours: '10:00–20:30' },
      { id: 'w6', canteenId: 'c3', name: '热气蒸坊', floor: '一楼 05号', hours: '10:00–20:00' },
      { id: 'w7', canteenId: 'c4', name: '铁板风味' },
      { id: 'w8', canteenId: 'c4', name: '东北家常' },
      { id: 'w9', canteenId: 'c5', name: '手工饺子' },
      { id: 'w10', canteenId: 'c5', name: '砂锅小馆' }
    ];
    windows.forEach(function(w){w.floor='示例窗口 · 实际楼层待核实';w.hours='营业时间待核实';});
    var rows = [
      ['d1','w1','番茄炒蛋饭',1000,'清淡',0,'蛋奶素','🍅',['鸡蛋'],'酸甜番茄搭配嫩滑鸡蛋，附时蔬与米饭。'],
      ['d2','w1','土豆牛肉饭',1600,'咸香',1,'荤食','🥘',[],'软烂牛肉与绵密土豆，热乎的一餐。'],
      ['d3','w1','香菇青菜饭',900,'清淡',0,'纯素','🥬',[],'香菇与当季青菜，简单清爽。'],
      ['d4','w2','红烧牛肉面',1400,'咸香',1,'荤食','🍜',['小麦'],'手工面搭配红烧牛肉和鲜汤。'],
      ['d5','w2','菌菇汤面',1100,'清淡',0,'纯素','🍄',['小麦'],'菌菇清汤，适合想吃清爽的一天。'],
      ['d6','w2','鸡丝拌面',1200,'酸甜',1,'荤食','🥢',['小麦','花生'],'鸡丝、黄瓜与拌面，含花生酱。'],
      ['d7','w3','宫保鸡丁饭',1300,'咸香',2,'荤食','🍗',['花生'],'鸡丁与花生的经典组合，微麻带辣。'],
      ['d8','w3','麻婆豆腐饭',1000,'麻辣',2,'荤食','🌶️',['大豆'],'含少量肉末，麻辣鲜香。'],
      ['d9','w3','香辣鱼片饭',1500,'麻辣',3,'荤食','🐟',['鱼'],'鲜嫩鱼片，适合爱辣同学。'],
      ['d10','w4','鸡胸轻食碗',1800,'清淡',0,'荤食','🥗',[],'鸡胸肉、谷物与多种蔬菜。'],
      ['d11','w4','牛油果蔬菜碗',1700,'清淡',0,'纯素','🥑',[],'牛油果与时蔬，搭配杂粮。'],
      ['d12','w4','南瓜酸奶碗',1400,'酸甜',0,'蛋奶素','🎃',['牛奶'],'南瓜、酸奶与谷物的轻盈搭配。'],
      ['d13','w5','咖喱鸡肉饭',1600,'咖喱',1,'荤食','🍛',['牛奶'],'浓郁咖喱配鸡肉和土豆。'],
      ['d14','w5','菠萝炒饭',1300,'酸甜',0,'蛋奶素','🍍',['鸡蛋'],'菠萝的清甜与粒粒分明的炒饭。'],
      ['d15','w5','鲜虾炒河粉',1900,'咸香',1,'荤食','🍤',['虾','鸡蛋'],'鲜虾、蔬菜与河粉现点现炒。'],
      ['d16','w6','香菇滑鸡饭',1400,'咸香',0,'荤食','🍲',[],'蒸制滑鸡，保留食材鲜味。'],
      ['d17','w6','豉汁排骨饭',1600,'咸香',1,'荤食','🍖',['大豆'],'豉香排骨，搭配清蒸米饭。'],
      ['d18','w6','蒸南瓜杂粮饭',1000,'清淡',0,'纯素','🍠',[],'南瓜、红薯与杂粮，朴实温暖。'],
      ['d19','w7','黑椒鸡排饭',1500,'咸香',1,'荤食','🍗',['大豆'],'示例菜品：鸡排搭配黑椒汁、米饭和时蔬。'],
      ['d20','w7','铁板牛柳饭',1800,'咸香',1,'荤食','🥩',['大豆'],'示例菜品：牛柳、洋葱与青椒现炒。'],
      ['d21','w7','铁板菌菇饭',1200,'咸香',0,'纯素','🍄',['大豆'],'示例菜品：多种菌菇搭配米饭，使用植物调味汁。'],
      ['d22','w8','锅包肉套餐',1800,'酸甜',0,'荤食','🍱',[],'示例菜品：酸甜锅包肉搭配米饭与小菜。'],
      ['d23','w8','地三鲜饭',1200,'咸香',0,'纯素','🍆',['大豆'],'示例菜品：土豆、茄子与青椒，不添加肉类。'],
      ['d24','w8','尖椒肉丝饭',1400,'麻辣',2,'荤食','🌶️',['大豆'],'示例菜品：尖椒炒肉丝，适合喜欢辣味的同学。'],
      ['d25','w9','猪肉白菜水饺',1400,'咸香',0,'荤食','🥟',['小麦'],'示例菜品：猪肉白菜馅水饺，一份十二只。'],
      ['d26','w9','韭菜鸡蛋水饺',1200,'清淡',0,'蛋奶素','🥟',['小麦','鸡蛋'],'示例菜品：韭菜鸡蛋馅水饺，一份十二只。'],
      ['d27','w9','香菇素三鲜水饺',1300,'清淡',0,'纯素','🥬',['小麦'],'示例菜品：香菇、白菜、胡萝卜馅，不添加蛋奶和虾。'],
      ['d28','w10','番茄牛腩砂锅',1900,'酸甜',0,'荤食','🍲',[],'示例菜品：番茄与牛腩慢炖，配米饭。'],
      ['d29','w10','麻辣土豆粉',1300,'麻辣',2,'纯素','🍜',['大豆'],'示例菜品：土豆粉、豆皮与蔬菜，使用植物汤底。'],
      ['d30','w10','菌菇豆腐砂锅',1500,'清淡',0,'纯素','🥘',['大豆'],'示例菜品：菌菇、豆腐与时蔬，使用植物汤底。']
    ];
    var dishes = rows.map(function(r){ var w=windows.find(function(x){return x.id===r[1];}); return {id:r[0],windowId:r[1],canteenId:w.canteenId,name:r[2],priceCents:r[3],taste:r[4],spice:r[5],diet:r[6],emoji:r[7],allergens:r[8],description:r[9],available:true}; });
    return { version: 2, catalogVersion: 2, canteens:canteens, windows:windows, dishes:dishes,
      users:[{id:'demo-student',nickname:'校园食客',taste:'不限',avoid:[],maxSpice:3,createdAt:now}],
      reviews:[
        {id:'r1',userId:'sample-a',author:'小林',dishId:'d1',rating:5,text:'酸甜适口，分量很足。',images:[],status:'approved',createdAt:now-7200000},
        {id:'r2',userId:'sample-b',author:'小周',dishId:'d7',rating:4,text:'花生香脆，辣度刚刚好。',images:[],status:'approved',createdAt:now-3600000},
        {id:'r3',userId:'sample-c',author:'小夏',dishId:'d10',rating:5,text:'蔬菜新鲜，午饭很方便。',images:[],status:'approved',createdAt:now-2400000}
      ],
      crowds:[
        {id:'cr1',userId:'sample-a',targetType:'window',targetId:'w1',level:1,createdAt:now-120000},
        {id:'cr2',userId:'sample-b',targetType:'window',targetId:'w3',level:3,createdAt:now-180000},
        {id:'cr3',userId:'sample-c',targetType:'canteen',targetId:'c2',level:2,createdAt:now-90000}
      ],favorites:[],reports:[],votes:[],subscriptions:[],audit:[],mealPlans:[] };
  }
  function migrate(state){assert(state&&typeof state==='object'&&!Array.isArray(state),'本地数据格式无效');var s=clone(state);['canteens','windows','dishes','users','reviews','crowds','favorites','reports','votes','subscriptions','audit','mealPlans'].forEach(function(k){if(s[k]===undefined)s[k]=[];assert(Array.isArray(s[k]),'数据列表格式无效');var ids=new Set();s[k].forEach(function(r){assert(r&&typeof r==='object'&&!Array.isArray(r)&&typeof r.id==='string'&&r.id.length>0&&!ids.has(r.id),'数据记录格式或ID无效');ids.add(r.id);});});s.version=2;return s;}
  // 仅对本交付包旧示例目录升级；不清空私人记录，不向空云快照注入示例数据。
  function upgradeDemoCatalog(state){
    var s=migrate(state);if(s.catalogVersion>=2)return s;
    var defaults=seed(),oldNames=['第一食堂','第二食堂','风味餐厅'],oldLocations=['教学区东侧','宿舍区南侧','图书馆西侧'],oldHours=['06:30–21:00','07:00–21:30','10:00–20:30'],oldNotes=['家常菜与经典面食','风味小吃与轻食','地方风味与现做套餐'];
    var recognized=defaults.canteens.slice(0,3).every(function(c){return s.canteens.some(function(x){return x.id===c.id;});})&&defaults.windows.slice(0,6).every(function(w){return s.windows.some(function(x){return x.id===w.id&&x.canteenId===w.canteenId;});})&&defaults.dishes.slice(0,18).every(function(d){return s.dishes.some(function(x){return x.id===d.id&&x.windowId===d.windowId;});});
    if(!recognized)return s;
    // 扩展ID若已被自定义目录使用，保持原数据，交由管理员处理，不覆盖或部分升级。
    var conflict=['canteens','windows','dishes'].some(function(k){var start={canteens:3,windows:6,dishes:18}[k];return defaults[k].slice(start).some(function(item){var existing=s[k].find(function(x){return x.id===item.id;});return existing&&(existing.name!==item.name||(k==='windows'&&existing.canteenId!==item.canteenId)||(k==='dishes'&&existing.windowId!==item.windowId));});});
    if(conflict)return s;
    defaults.canteens.slice(0,3).forEach(function(c,i){var current=s.canteens.find(function(x){return x.id===c.id;});if(current.name===oldNames[i])current.name=c.name;if(current.location===oldLocations[i])current.location=c.location;if(current.hours===oldHours[i])current.hours=c.hours;if(current.note===oldNotes[i])current.note=c.note;});
    var oldFloors=['一楼 01号','一楼 06号','二楼 03号','一楼 08号','一楼 02号','一楼 05号'],oldWindowHours=['10:30–19:30','07:00–20:30','10:30–20:00','09:00–20:00','10:00–20:30','10:00–20:00'];
    s.windows.forEach(function(w){var i=defaults.windows.slice(0,6).findIndex(function(x){return x.id===w.id;});if(i>=0){if(w.floor===oldFloors[i])w.floor='示例窗口 · 实际楼层待核实';if(w.hours===oldWindowHours[i])w.hours='营业时间待核实';}});
    ['canteens','windows','dishes'].forEach(function(k){var start={canteens:3,windows:6,dishes:18}[k];defaults[k].slice(start).forEach(function(item){if(!s[k].some(function(x){return x.id===item.id;}))s[k].push(clone(item));});});
    s.catalogVersion=2;return s;
  }
  function dayKey(now){return new Date((now===undefined?Date.now():now)+8*3600000).toISOString().slice(0,10);}
  function dayOffset(date,n){return new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
  function validDay(date){return typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T00:00:00Z'))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;}
  function cents(value,min,max){var text=String(value==null?'':value).trim();assert(/^\d+(?:\.\d{1,2})?$/.test(text),'金额最多保留两位小数');var parts=text.split('.'),n=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));assert(Number.isSafeInteger(n)&&n>=min&&n<=max,'金额超出允许范围');return n;}
  function compareIds(state,ids){return Array.isArray(ids)?Array.from(new Set(ids.filter(function(id){return typeof id==='string'&&state.dishes.some(function(d){return d.id===id;});}))).slice(0,3):[];}
  function reviewToken(review){return JSON.stringify([review.text,review.rating,review.status,review.updatedAt||review.createdAt]);}
  function crowdAllowance(state,uid,type,id,now){now=now===undefined?Date.now():now;var own=state.crowds.filter(function(r){return uid&&(r.mine||r.userId===uid)&&Number.isFinite(r.createdAt)&&r.createdAt<=now;}),daily=own.filter(function(r){return dayKey(r.createdAt)===dayKey(now);}).length,last=own.filter(function(r){return r.targetType===type&&r.targetId===id;}).reduce(function(t,r){return Math.max(t,r.createdAt);},0),seconds=Math.max(0,Math.ceil((last+60000-now)/1000));return {daily:daily,remaining:Math.max(0,20-daily),seconds:seconds,blocked:daily>=20||seconds>0,reward:daily<5?2:0};}
  function imageSource(src){if(typeof src!=='string')return '';return /^(data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+|cloud:\/\/[^\s<>"']+|https:\/\/[^\s<>"']+|wxfile:\/\/[^\s<>"']+|http:\/\/(?:tmp|usr)\/[^\s<>"']+)$/.test(src)?src:'';}
  function mealStats(state,uid,now,anchor){var today=dayKey(now),base=validDay(anchor)?anchor:today,weekday=new Date(base+'T00:00:00Z').getUTCDay(),start=dayOffset(base,-((weekday+6)%7)),end=dayOffset(start,6),user=state.users.find(function(u){return u.id===uid;})||{};
    var meals=(state.mealPlans||[]).filter(function(m){return uid&&(m.mine||m.userId===uid)&&m.date>=start&&m.date<=end;});var spent=0,planned=0,count=0;
    meals.forEach(function(m){if(m.status==='completed'){spent+=m.actualCents;count++;}else if(m.date>=today)planned+=m.priceCents;});
    var budget=Number.isInteger(user.weeklyBudgetCents)?user.weeklyBudgetCents:15000;
    return {today:today,start:start,end:end,budgetCents:budget,spentCents:spent,plannedCents:planned,remainingCents:budget-spent,percent:Math.round(spent/budget*100),count:count,days:Array.from({length:7},function(_,i){var date=dayOffset(start,i),rs=meals.filter(function(m){return m.date===date;});return {date:date,label:date.slice(5),spentCents:rs.filter(function(m){return m.status==='completed';}).reduce(function(a,m){return a+m.actualCents;},0),count:rs.length};})};
  }
  function compareDishes(state,ids,now){return compareIds(state,ids).map(function(id){return state.dishes.find(function(d){return d.id===id;});}).map(function(d){return Object.assign({},d,{rating:rating(state,d.id),crowd:crowd(state,'window',d.windowId,now)});});}
  function filterDishes(state, f, profile) {
    f = f || {}; profile = profile || {};
    var minPrice=f.minPrice!==undefined&&f.minPrice!==''?cents(f.minPrice,0,100000):0;
    var maxPrice=f.maxPrice?cents(f.maxPrice,0,100000):100000;
    assert(minPrice<=maxPrice,'最低价格不能高于最高价格');
    var diet=f.diet&&f.diet!=='不限'?f.diet:(f.usePreferences?profile.diet:'');
    var avoid = f.usePreferences ? (profile.avoid || []) : (f.avoid || []);
    return state.dishes.filter(function(d) {
      if (!d.available) return false;
      if (Array.isArray(f.dishIds)&&!f.dishIds.includes(d.id)) return false;
      if (f.keyword && (d.name+' '+d.description).indexOf(String(f.keyword).trim()) < 0) return false;
      if (f.canteenId && d.canteenId !== f.canteenId) return false;
      if (f.windowId && d.windowId !== f.windowId) return false;
      if (d.priceCents<minPrice||d.priceCents>maxPrice) return false;
      if (f.taste && f.taste !== '不限' && d.taste !== f.taste) return false;
      if (diet&&diet!=='不限'&&d.diet!==diet) return false;
      if (f.maxCrowd) {var live=crowd(state,'window',d.windowId);if(!live.level||live.level>Number(f.maxCrowd))return false;}
      var max = f.maxSpice !== undefined && f.maxSpice !== '' ? Number(f.maxSpice) : (f.usePreferences ? profile.maxSpice : undefined);
      if (max !== undefined && d.spice > Number(max)) return false;
      return !avoid.some(function(a){ return d.allergens.indexOf(a) >= 0; });
    });
  }
  function recommend(state, f, profile, random, lastId) {
    var pool = filterDishes(state, f, profile);
    assert(pool.length, '没有符合条件的菜品，请放宽筛选条件');
    if (pool.length > 1 && lastId) pool = pool.filter(function(d){return d.id!==lastId;});
    var weights = pool.map(function(d){return f&&f.usePreferences&&profile&&profile.taste===d.taste ? 1.6 : 1;});
    var n = (random || Math.random)() * weights.reduce(function(a,b){return a+b;},0);
    for (var i=0; i<pool.length; i++){ n-=weights[i]; if(n<0) return pool[i]; }
    return pool[pool.length-1];
  }
  function wheelCandidates(state,f,profile,random){var pool=filterDishes(state,f,profile).slice(),rng=random||Math.random;for(var i=pool.length-1;i>0;i--){var j=Math.floor(rng()*(i+1)),tmp=pool[i];pool[i]=pool[j];pool[j]=tmp;}return pool.slice(0,8);}
  function wheelRotation(index,count,current){assert(Number.isInteger(count)&&count>0&&Number.isInteger(index)&&index>=0&&index<count,'转盘候选无效');current=Number(current)||0;var target=(360-(index+.5)*360/count)%360;return current+1440+((target-current%360+360)%360);}
  function recommendationReasons(d,f,profile){f=f||{};profile=profile||{};var reasons=['价格 ¥'+(d.priceCents/100).toFixed(2),d.diet,['不辣','微辣','中辣','重辣'][d.spice]];if(f.usePreferences){if(profile.taste===d.taste)reasons.push('符合偏好口味');if((profile.avoid||[]).length)reasons.push('已避开所选忌口标签');}if(f.maxCrowd)reasons.push('符合近期排队条件');return reasons;}
  function crowd(state, type, targetId, now) {
    now = now || Date.now(); var latest = Object.create(null);
    state.crowds.forEach(function(r){
      var match = r.targetType===type && r.targetId===targetId;
      if(type==='canteen' && r.targetType==='window') match = state.windows.some(function(w){return w.id===r.targetId && w.canteenId===targetId;});
      if(!match || !Number.isFinite(r.createdAt) || now-r.createdAt>=TTL || r.createdAt>now || ![1,2,3].includes(r.level)) return;
      if(!latest[r.userId] || latest[r.userId].createdAt<r.createdAt) latest[r.userId]=r;
    });
    var rs=Object.keys(latest).map(function(k){return latest[k];});
    if(!rs.length) return {level:0,label:'暂无上报',count:0,updatedAt:0,eta:'等待同学更新',freshness:'暂无有效数据',sampleHint:'等待同学上报',expiresIn:0};
    var sum=0,total=0;
    rs.forEach(function(r){var w=1-(now-r.createdAt)/TTL;sum+=r.level*w;total+=w;});
    var level=Math.max(1,Math.min(3,Math.round(sum/total)));
    var updated=Math.max.apply(null,rs.map(function(r){return r.createdAt;})),minutes=Math.floor((now-updated)/60000);
    return {level:level,label:['','较空闲','需等待','较拥挤'][level],count:rs.length,updatedAt:updated,eta:['','约 0–5 分钟','约 5–15 分钟','约 15 分钟以上'][level],freshness:minutes<1?'刚刚更新':minutes+'分钟前更新',sampleHint:rs.length<3?'样本较少，仅供参考':rs.length+'位同学参与',expiresIn:Math.ceil((TTL-(now-updated))/60000)};
  }
  function rating(state, dishId){var rs=state.reviews.filter(function(r){return r.dishId===dishId&&r.status==='approved';});return {count:rs.length,score:rs.length?(rs.reduce(function(a,r){return a+r.rating;},0)/rs.length).toFixed(1):'暂无'};}
  function points(state, uid){if(!uid)return 0;var days=Object.create(null);state.crowds.filter(function(r){return r.mine||r.userId===uid;}).forEach(function(r){var day=dayKey(r.createdAt);days[day]=(days[day]||0)+1;});return Object.keys(days).reduce(function(n,k){return n+Math.min(5,days[k])*2;},0)+state.reviews.filter(function(r){return (r.mine||r.userId===uid)&&r.status==='approved';}).length*5;}
  function badges(p){return p>=50?'校园美食家':p>=20?'食堂观察员':p>=5?'尝鲜达人':'新晋食客';}
  function badgeProgress(p){var next=p<5?5:p<20?20:p<50?50:0;return {current:badges(p),next:next?badges(next):'',remaining:next?next-p:0,percent:next?Math.min(100,Math.floor(p/next*100)):100};}
  function adminStats(state,now){return {pendingImages:state.reviews.filter(function(r){return r.status==='pending'&&(r.images||[]).length;}).length,approved:state.reviews.filter(function(r){return r.status==='approved';}).length,canteens:state.canteens.map(function(c){var dishes=state.dishes.filter(function(d){return d.canteenId===c.id;}),ids=dishes.map(function(d){return d.id;}),reviews=state.reviews.filter(function(r){return r.status==='approved'&&ids.includes(r.dishId);});return {id:c.id,name:c.name,windows:state.windows.filter(function(w){return w.canteenId===c.id;}).length,dishes:dishes.filter(function(d){return d.available;}).length,reviews:reviews.length,score:reviews.length?(reviews.reduce(function(n,r){return n+r.rating;},0)/reviews.length).toFixed(1):'暂无',crowd:crowd(state,'canteen',c.id,now)};})};}
  function ranked(state, kind, now){
    if(kind==='crowd') return state.canteens.map(function(c){return Object.assign({},c,{metric:crowd(state,'canteen',c.id,now).label,value:crowd(state,'canteen',c.id,now).level});}).sort(function(a,b){return b.value-a.value;});
    if(kind==='windows') return state.windows.map(function(w){var rs=state.reviews.filter(function(r){return r.status==='approved'&&state.dishes.some(function(d){return d.id===r.dishId&&d.windowId===w.id;});});var score=rs.length?rs.reduce(function(a,r){return a+r.rating;},0)/rs.length:0;return Object.assign({},w,{value:score,metric:rs.length?score.toFixed(1)+' 分 · '+rs.length+' 条评价':'暂无评价'});}).sort(function(a,b){return b.value-a.value;});
    return state.dishes.filter(function(d){return d.available;}).map(function(d){var votes=state.votes.filter(function(v){return v.dishId===d.id;}).length;var r=rating(state,d.id);return Object.assign({},d,{value:votes,metric:votes+' 票 · '+r.count+' 条评价'});}).sort(function(a,b){return b.value-a.value||b.priceCents-a.priceCents;});
  }
  function apply(state, action, p, ctx){
    p=p||{};ctx=ctx||{};var now=ctx.now||Date.now(),uid=ctx.userId;var s=migrate(state);
    assert(typeof p==='object'&&!Array.isArray(p),'请求参数格式无效');
    assert(uid,'请先登录或使用体验身份');
    var user=s.users.find(function(u){return u.id===uid;});
    if(action==='login'){if(!user)s.users.push({id:uid,nickname:'校园食客',taste:'不限',avoid:[],maxSpice:3,createdAt:now});return s;}
    assert(user,'请先登录');
    function admin(){assert(ctx.isAdmin,'此操作仅限管理员');}
    function target(type,targetId){assert(['dish','window','canteen'].includes(type),'目标类型无效');var key={dish:'dishes',window:'windows',canteen:'canteens'}[type];assert(s[key].some(function(x){return x.id===targetId;}),'目标不存在');}
    if(action==='profile'){
      assert(typeof p.nickname==='string'&&p.nickname.trim().length<=20,'昵称需要 2–20 个字符');
      var nick=clean(p.nickname,20);assert(nick.length>=2,'昵称需要 2–20 个字符');
      assert(['不限','清淡','咸香','酸甜','麻辣','咖喱'].includes(p.taste),'口味无效');
      assert([0,1,2,3].includes(Number(p.maxSpice)),'辣度无效');
      if(p.diet!==undefined){assert(['不限','荤食','蛋奶素','纯素'].includes(p.diet),'荤素偏好无效');user.diet=p.diet;}
      var allowed=['花生','牛奶','鸡蛋','鱼','虾','小麦','大豆'];
      assert(p.avoid===undefined||Array.isArray(p.avoid),'忌口应为列表');user.nickname=nick;user.taste=p.taste;user.maxSpice=Number(p.maxSpice);user.avoid=Array.from(new Set((p.avoid||[]).filter(function(x){return allowed.includes(x);})));
    } else if(action==='favorite'){
      target(p.type,p.targetId);assert(p.type!=='canteen','仅支持收藏菜品或窗口');
      var old=s.favorites.findIndex(function(x){return x.userId===uid&&x.type===p.type&&x.targetId===p.targetId;});
      assert(p.enabled===undefined||typeof p.enabled==='boolean','收藏状态无效');var enabled=p.enabled===undefined?old<0:p.enabled;
      if(old>=0&&!enabled)s.favorites.splice(old,1);else if(old<0&&enabled)s.favorites.push({id:id('fav'),userId:uid,type:p.type,targetId:p.targetId,createdAt:now});
    } else if(action==='crowd'){
      assert(['canteen','window'].includes(p.type),'上报类型无效');target(p.type,p.targetId);
      assert([1,2,3].includes(Number(p.level)),'拥挤度无效');
      assert(s.crowds.filter(function(x){return x.userId===uid&&dayKey(x.createdAt)===dayKey(now);}).length<20,'每天最多提交20次上报');
      assert(!s.crowds.some(function(x){return x.userId===uid&&x.targetType===p.type&&x.targetId===p.targetId&&now-x.createdAt<60000;}),'同一地点每分钟只能上报一次');
      s.crowds.push({id:id('crowd'),userId:uid,targetType:p.type,targetId:p.targetId,level:Number(p.level),createdAt:now});
    } else if(action==='review'){
      target('dish',p.dishId);var d=s.dishes.find(function(x){return x.id===p.dishId;});assert(d.available,'菜品已下架');
      var text=String(p.text||'').trim();assert(text.length>=5&&text.length<=300,'评价需要 5–300 个字符');
      assert([1,2,3,4,5].includes(Number(p.rating)),'请选择 1–5 星');
      var images=p.images||[];assert(Array.isArray(images)&&images.length<=3,'最多上传 3 张图片');
      images.forEach(function(x){assert(imageSource(x)&&x.length<=2200000,'图片格式或大小无效');});
      assert(!s.reviews.some(function(x){return x.userId===uid&&now-x.createdAt<60000;}),'请等待一分钟后再评价');
      s.reviews.push({id:id('review'),userId:uid,author:user.nickname,dishId:p.dishId,rating:Number(p.rating),text:text,images:images,status:'pending',createdAt:now});
    } else if(action==='updateReview'){
      var edit=s.reviews.find(function(r){return r.id===p.id;});assert(edit&&edit.userId===uid,'只能修改自己的评价');
      if(p.expectedToken!==undefined)assert(p.expectedToken===reviewToken(edit),'评价已更新，请刷新后再修改');
      var editText=String(p.text||'').trim();assert(editText.length>=5&&editText.length<=300,'评价需要5–300字');assert([1,2,3,4,5].includes(Number(p.rating)),'请选择1–5星');
      edit.text=editText;edit.rating=Number(p.rating);edit.status='pending';edit.machineChecked=false;edit.updatedAt=Math.max(now,(edit.updatedAt||edit.createdAt)+1);edit.reason='';
    } else if(action==='deleteReview'){
      var rev=s.reviews.find(function(r){return r.id===p.id;});assert(rev&&rev.userId===uid,'只能删除自己的评价');s.reviews=s.reviews.filter(function(r){return r.id!==p.id;});s.reports.forEach(function(r){if(r.reviewId===p.id&&r.status==='pending')r.status='removed';});
    } else if(action==='moderate'){
      admin();var review=s.reviews.find(function(r){return r.id===p.id;});assert(review,'评价不存在');if(p.expectedToken!==undefined)assert(p.expectedToken===reviewToken(review),'评价已更新，请刷新后重新审核');assert(['approved','rejected'].includes(p.status),'审核结果无效');review.status=p.status;review.reason=clean(p.reason,120);review.moderatedAt=now;
      s.audit.push({id:id('audit'),userId:uid,action:'moderate',targetId:p.id,createdAt:now});
    } else if(action==='report'){
      assert(s.reviews.some(function(r){return r.id===p.id&&r.status==='approved';}),'评价不存在');var reason=clean(p.reason,120);assert(reason.length>=3,'请填写举报原因');
      assert(!s.reports.some(function(r){return r.userId===uid&&r.reviewId===p.id&&r.status==='pending';}),'已提交举报，请等待处理');
      s.reports.push({id:id('report'),userId:uid,reviewId:p.id,reviewToken:reviewToken(s.reviews.find(function(r){return r.id===p.id;})),reason:reason,status:'pending',createdAt:now});
    } else if(action==='resolveReport'){
      admin();var report=s.reports.find(function(r){return r.id===p.id;});assert(report,'举报不存在');assert(report.status==='pending','举报已经处理');assert(['dismiss','hide'].includes(p.decision),'处理方式无效');report.status=p.decision;report.resolvedAt=now;
      if(p.decision==='hide'){var rr=s.reviews.find(function(r){return r.id===report.reviewId;});assert(rr&&(report.reviewToken?report.reviewToken===reviewToken(rr):(!rr.updatedAt||rr.updatedAt<=report.createdAt)),'原评价已修改，请重新查看评价审核；此举报可驳回');rr.status='rejected';rr.reason='因举报审核隐藏，请修改后重新送审';rr.moderatedAt=now;s.reports.forEach(function(r){if(r.reviewId===rr.id&&r.status==='pending'){r.status='hide';r.resolvedAt=now;}});}
      s.audit.push({id:id('audit'),userId:uid,action:'resolveReport',targetId:p.id,createdAt:now});
    } else if(action==='vote'){
      target('dish',p.dishId);assert(s.dishes.some(function(d){return d.id===p.dishId&&d.available;}),'菜品已下架');var day=new Date(now+8*3600000).toISOString().slice(0,10);
      assert(!s.votes.some(function(v){return v.userId===uid&&v.day===day;}),'今天已经投过票了');s.votes.push({id:id('vote'),userId:uid,dishId:p.dishId,day:day,createdAt:now});
    } else if(action==='subscribe'){
      assert(['11:30','17:30'].includes(p.time),'请选择午餐或晚餐时间');assert(typeof p.enabled==='boolean','提醒状态无效');assert(!s.subscriptions.some(function(x){return x.userId===uid&&x.status==='sending';}),'提醒正在发送，请稍后修改');s.subscriptions=s.subscriptions.filter(function(x){return x.userId!==uid;});
      if(p.enabled)s.subscriptions.push({id:id('sub'),userId:uid,time:p.time,createdAt:now,remaining:1,status:ctx.demo?'demo':'authorized'});
    } else if(action==='saveBudget'){
      assert(Number.isInteger(p.budgetCents)&&p.budgetCents>=2000&&p.budgetCents<=200000,'周预算应在20–2000元');user.weeklyBudgetCents=p.budgetCents;
    } else if(action==='saveMealPlan'){
      assert(validDay(p.date)&&p.date>=dayOffset(dayKey(now),-30)&&p.date<=dayOffset(dayKey(now),30),'日期应在前后30天内');assert(['午餐','晚餐'].includes(p.meal),'餐次无效');target('dish',p.dishId);
      var planDish=s.dishes.find(function(d){return d.id===p.dishId;});assert(planDish.available,'菜品已下架，请重新选择');var source=p.id?s.mealPlans.find(function(m){return m.id===p.id;}):null;assert(!p.id||(source&&source.userId===uid),'只能修改自己的用餐计划');assert(!source||source.status!=='completed','该餐已打卡，请先撤销打卡');var destination=s.mealPlans.find(function(m){return m.userId===uid&&m.date===p.date&&m.meal===p.meal;});assert(!source||!destination||source.id===destination.id,'目标日期餐次已有计划，请选择其他餐次');var prior=source||destination;assert(!prior||prior.status!=='completed','该餐已打卡，请先撤销打卡');assert(!prior||p.id===prior.id||p.replaceId===prior.id,'该餐已有计划，请确认替换');if(prior&&p.expectedUpdatedAt!==undefined)assert(p.expectedUpdatedAt===(prior.updatedAt||prior.createdAt),'计划已更新，请刷新后再保存');assert(p.note===undefined||(typeof p.note==='string'&&p.note.length<=80),'备注最多80字');
      var plan={id:prior?prior.id:id('meal'),userId:uid,date:p.date,meal:p.meal,dishId:planDish.id,dishName:planDish.name,emoji:planDish.emoji,priceCents:planDish.priceCents,windowId:planDish.windowId,note:clean(p.note,80),status:'planned',createdAt:prior?prior.createdAt:now,updatedAt:prior?Math.max(now,(prior.updatedAt||prior.createdAt)+1):now};
      if(prior)s.mealPlans[s.mealPlans.indexOf(prior)]=plan;else s.mealPlans.push(plan);
    } else if(['completeMealPlan','removeMealPlan','reopenMealPlan'].includes(action)){
      var meal=s.mealPlans.find(function(m){return m.id===p.id;});assert(meal&&meal.userId===uid,'只能操作自己的用餐计划');
      if(action==='completeMealPlan'){assert(meal.status==='planned','已经打卡，无需重复提交');assert(meal.date<=dayKey(now),'未来的用餐不能提前打卡');assert(Number.isInteger(p.actualCents)&&p.actualCents>=100&&p.actualCents<=100000,'实际花费应在1–1000元');meal.status='completed';meal.actualCents=p.actualCents;meal.completedAt=now;}
      if(action==='removeMealPlan'){assert(meal.status==='planned','请先撤销打卡再删除计划');s.mealPlans=s.mealPlans.filter(function(m){return m.id!==p.id;});}
      if(action==='reopenMealPlan'){assert(meal.status==='completed','该餐尚未打卡');meal.status='planned';delete meal.actualCents;delete meal.completedAt;}
    } else if(action==='upgradeCampusCatalog'){
      admin();s=upgradeDemoCatalog(s);assert(s.catalogVersion>=2,'目录已自定义或扩展ID冲突，请在食堂管理中手动维护五个餐厅');
      if(!s.audit.some(function(r){return r.action==='upgradeCampusCatalog';}))s.audit.push({id:id('audit'),userId:uid,action:'upgradeCampusCatalog',targetId:'campus-catalog-v2',createdAt:now});
    } else if(action==='saveCatalog'){
      admin();assert(['canteens','windows','dishes'].includes(p.kind),'目录类型无效');assert(p.item&&typeof p.item==='object'&&!Array.isArray(p.item),'目录数据无效');var raw=p.item,item={};
      var fields={canteens:['id','name','location','hours','note','emoji'],windows:['id','name','canteenId','floor','hours'],dishes:['id','name','windowId','priceCents','taste','spice','diet','emoji','description','allergens','available']}[p.kind];fields.forEach(function(k){if(raw[k]!==undefined)item[k]=clone(raw[k]);});item.id=item.id||id(p.kind);assert(typeof item.id==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(item.id),'目录ID只能包含字母数字和下划线短横线');item.name=clean(item.name,30);assert(item.name.length>=2,'名称至少 2 个字符');
      if(p.kind==='dishes'){
        var win=s.windows.find(function(w){return w.id===item.windowId;});assert(win,'所属窗口无效');item.canteenId=win.canteenId;
        assert(Number.isInteger(item.priceCents)&&item.priceCents>=100&&item.priceCents<=100000,'价格应在 1–1000 元');assert([0,1,2,3].includes(item.spice),'辣度无效');assert(['荤食','蛋奶素','纯素'].includes(item.diet),'荤素类型无效');assert(['清淡','咸香','酸甜','麻辣','咖喱'].includes(item.taste),'口味无效');
        item.emoji=clean(item.emoji,8)||'🍚';item.description=clean(item.description,300);assert(Array.isArray(item.allergens)&&item.allergens.length<=10&&item.allergens.every(function(x){return typeof x==='string'&&x.length<=20;}),'过敏原应为短文本列表');assert(typeof item.available==='boolean','在售状态应为布尔值');
      }
      if(p.kind==='windows'){assert(s.canteens.some(function(c){return c.id===item.canteenId;}),'所属食堂无效');item.floor=clean(item.floor,50);item.hours=clean(item.hours,50);s.dishes.forEach(function(d){if(d.windowId===item.id)d.canteenId=item.canteenId;});}
      if(p.kind==='canteens'){item.location=clean(item.location,50);item.hours=clean(item.hours,50);item.note=clean(item.note,120);item.emoji=clean(item.emoji,8)||'🍚';}
      var idx=s[p.kind].findIndex(function(x){return x.id===item.id;});if(idx>=0)s[p.kind][idx]=item;else s[p.kind].push(item);
      s.audit.push({id:id('audit'),userId:uid,action:'saveCatalog',targetId:item.id,createdAt:now});
    } else throw new Error('未知操作');
    return s;
  }
  function snapshot(state,ctx){
    var s=migrate(state),uid=ctx.userId;
    s.users=s.users.filter(function(u){return u.id===uid;});
    s.reviews=s.reviews.filter(function(r){return ctx.isAdmin||r.status==='approved'||r.userId===uid;}).map(function(r){r.mine=r.userId===uid;if(!ctx.isAdmin&&r.userId!==uid)delete r.userId;return r;});
    // 拥挤度去重在服务端计算，前端只拿匿名化稳定标识；不暴露 OPENID。
    var aliases=Object.create(null);
    s.crowds.forEach(function(r){r.mine=!!uid&&r.userId===uid;if(!ctx.isAdmin){if(!aliases[r.userId])aliases[r.userId]='anonymous_'+Object.keys(aliases).length;r.userId=r.publicUserId||aliases[r.userId];}delete r.publicUserId;});
    s.favorites=s.favorites.filter(function(r){return r.userId===uid;});
    s.reports=s.reports.filter(function(r){return ctx.isAdmin||r.userId===uid;});
    s.subscriptions=s.subscriptions.filter(function(r){return r.userId===uid;});
    s.mealPlans=s.mealPlans.filter(function(r){return r.userId===uid;}).map(function(r){r.mine=true;return r;});
    s.votes=s.votes.map(function(v){return {id:v.id,dishId:v.dishId,day:v.day,mine:v.userId===uid};});
    if(!ctx.isAdmin)s.audit=[];
    return s;
  }
  return {TTL:TTL,OWNERS:OWNERS,seed:seed,clone:clone,migrate:migrate,upgradeDemoCatalog:upgradeDemoCatalog,dayKey:dayKey,dayOffset:dayOffset,validDay:validDay,cents:cents,compareIds:compareIds,reviewToken:reviewToken,crowdAllowance:crowdAllowance,imageSource:imageSource,mealStats:mealStats,compareDishes:compareDishes,assert:assert,id:id,filterDishes:filterDishes,recommend:recommend,wheelCandidates:wheelCandidates,wheelRotation:wheelRotation,recommendationReasons:recommendationReasons,crowd:crowd,rating:rating,points:points,badges:badges,badgeProgress:badgeProgress,adminStats:adminStats,ranked:ranked,apply:apply,snapshot:snapshot};
});
