/* 李付远：弹窗的焦点、键盘与滚动交互；不依赖外部库。 */
window.FoodDialog=function({requestClose}){
  const root=document.querySelector('#modal-root');let returnFocus=null;
  const backgrounds=()=>document.querySelectorAll('.sidebar,.workspace,#compare-tray');
  function open(html){
    if(!root.firstElementChild)returnFocus=document.activeElement;
    root.innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="交互窗口"><button class="modal-close" data-action="close" aria-label="关闭">×</button>${html}</section></div>`;
    const heading=root.querySelector('h1');if(heading){heading.id='dialog-title';heading.tabIndex=-1;root.querySelector('[role="dialog"]').setAttribute('aria-labelledby',heading.id);}
    backgrounds().forEach(el=>el.inert=true);document.body.classList.add('dialog-open');
    (heading||root.querySelector('button')).focus({preventScroll:true});
  }
  function close(){const wasOpen=!!root.firstElementChild;root.innerHTML='';backgrounds().forEach(el=>el.inert=false);document.body.classList.remove('dialog-open');if(wasOpen){const target=returnFocus&&returnFocus.isConnected?returnFocus:document.querySelector('#nav a.active');if(target)target.focus({preventScroll:true});}returnFocus=null;}
  root.addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))requestClose();});
  document.addEventListener('keydown',e=>{
    if(!root.firstElementChild)return;
    if(e.key==='Escape'){e.preventDefault();requestClose();return;}
    if(e.key!=='Tab')return;
    const nodes=Array.from(root.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')).filter(el=>el.getClientRects().length);
    if(!nodes.length){e.preventDefault();return;}
    const i=nodes.indexOf(document.activeElement);
    if(e.shiftKey&&(i<=0)){e.preventDefault();nodes[nodes.length-1].focus();}else if(!e.shiftKey&&(i===nodes.length-1||i<0)){e.preventDefault();nodes[0].focus();}
  });
  return {open,close};
};
