// Shared customer-facing capacity copy; occupancy validation remains in engine.js.
export function capacityHTML(room,config){
 const extra=Math.max(0,room.max-room.base),children=config.allowChildren&&room.children>0;
 const additional=extra===1&&room.adults>room.base&&children
  ?'Cho phép ở thêm 1 người lớn hoặc 1 trẻ em.'
  :extra?`Cho phép ở thêm tối đa ${extra} ${children?'khách (người lớn và/hoặc trẻ em)':'người lớn'}.`:'Không nhận thêm khách ngoài số khách tiêu chuẩn.';
 const content=`<div class="capacity-copy"><p>Sức chứa tối đa<br><strong>${room.max} khách/phòng</strong></p><p>Số khách tiêu chuẩn: <b>${room.base}</b></p><p>${additional}${extra?' Có thể phát sinh phụ thu.':''}</p><p class="capacity-limits">Tổng không quá ${room.max} khách; tối đa ${room.adults} người lớn${children?' và '+room.children+' trẻ em':'. Không nhận trẻ em'}.</p><p class="capacity-fee-note">Chi tiết phí phụ thu vui lòng xem tại <b>“Tổng tiền”</b>.</p></div>`;
 const id='capacity-'+String(room.id).replace(/[^a-zA-Z0-9_-]/g,'');
 return `<div class="capacity-indicator"><span class="capacity-count" aria-label="${room.base} khách tiêu chuẩn"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/></svg><span>×${room.base}</span></span><button type="button" class="capacity-info" popovertarget="${id}" aria-label="Chi tiết sức chứa" aria-describedby="${id}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v2"/></svg></button><div id="${id}" popover="auto" role="tooltip" class="capacity-tooltip">${content}</div></div>`;
}

// Use the top layer so the tooltip is not clipped by the scrollable room table.
if(typeof document!=='undefined'){
 let timer;
 const tipFor=button=>document.getElementById(button.getAttribute('popovertarget'));
 const position=button=>{
  const tip=tipFor(button);if(!tip)return;
  const r=button.getBoundingClientRect(),width=Math.min(300,window.innerWidth-24);
  tip.style.width=width+'px';
  tip.style.left=Math.max(12,Math.min(r.left,window.innerWidth-width-12))+'px';
  tip.style.top=Math.max(12,Math.min(r.bottom+8,window.innerHeight-tip.offsetHeight-12))+'px';
 };
 const close=()=>document.querySelectorAll('.capacity-tooltip:popover-open').forEach(t=>t.hidePopover());
 const open=button=>{clearTimeout(timer);const tip=tipFor(button);if(!tip)return;tip.showPopover();position(button);};
 document.addEventListener('pointerover',e=>{const button=e.target.closest('.capacity-info');if(button)open(button);else if(e.target.closest('.capacity-tooltip'))clearTimeout(timer);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('.capacity-info,.capacity-tooltip')&&!e.relatedTarget?.closest?.('.capacity-info,.capacity-tooltip'))timer=setTimeout(close,150);});
 document.addEventListener('focusin',e=>{if(e.target.matches('.capacity-info'))open(e.target);});
 document.addEventListener('focusout',e=>{if(e.target.matches('.capacity-info'))close();});
 document.addEventListener('click',e=>{const button=e.target.closest('.capacity-info');if(button){e.preventDefault();open(button);}});
 document.addEventListener('toggle',e=>{if(!e.target.matches('.capacity-tooltip'))return;const button=document.querySelector(`[popovertarget="${e.target.id}"]`);if(button){button.setAttribute('aria-expanded',String(e.newState==='open'));if(e.newState==='open')position(button);}},true);
 window.addEventListener('resize',close);
 document.addEventListener('scroll',close,true);
}
