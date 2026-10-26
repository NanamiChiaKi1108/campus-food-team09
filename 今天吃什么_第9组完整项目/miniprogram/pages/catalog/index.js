// 负责人：王俊杰。食堂、窗口、菜品目录。
const S=require('../../services/store');
Page({
  data:{canteens:[],canteenOptions:[],selectedCanteen:'',selectedWindow:null,items:[],windowCount:0,dishCount:0,demo:S.config.mode==='demo'},
  async onShow(){try{await S.refresh();this.update();}catch(e){S.error(e);}},
  update(){const s=S.current(),selected=s.windows.find(w=>w.id===(this.data.selectedWindow||{}).id)||null;
    this.setData({canteenOptions:s.canteens,windowCount:s.windows.length,dishCount:s.dishes.filter(d=>d.available).length,selectedWindow:selected?{...selected,crowd:S.C.crowd(s,'window',selected.id),favorite:S.favorite('window',selected.id),canteenName:(s.canteens.find(c=>c.id===selected.canteenId)||{}).name}:null,
      canteens:s.canteens.filter(c=>!this.data.selectedCanteen||c.id===this.data.selectedCanteen).map(c=>({...c,crowd:S.C.crowd(s,'canteen',c.id),windows:s.windows.filter(w=>w.canteenId===c.id).map(w=>({...w,favorite:S.favorite('window',w.id),crowd:S.C.crowd(s,'window',w.id)}))})),
      items:selected?S.dishes(s.dishes.filter(d=>d.windowId===selected.id&&d.available)):[]});
  },
  selectCanteen(e){this.setData({selectedCanteen:e.currentTarget.dataset.id,selectedWindow:null});this.update();},
  open(e){const w=S.current().windows.find(w=>w.id===e.currentTarget.dataset.id);this.setData({selectedWindow:w});this.update();},
  close(){this.setData({selectedWindow:null,items:[]});this.update();},
  async favorite(e){if(!S.requireLogin())return;try{await S.action('favorite',{type:'window',targetId:e.currentTarget.dataset.id});this.update();}catch(e){S.error(e);}}
});
