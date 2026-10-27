import './tooltips.js?v=20261027-inclusive-bed';
// Shared customer-facing capacity copy; occupancy validation remains in engine.js.
export function capacityHTML(room,config){
 const extra=Math.max(0,room.max-room.base),children=config.allowChildren&&room.children>0;
 const additional=extra===1&&room.adults>room.base&&children
  ?'Cho phép ở thêm 1 người lớn hoặc 1 trẻ em.'
  :extra?`Cho phép ở thêm tối đa ${extra} ${children?'khách (người lớn và/hoặc trẻ em)':'người lớn'}.`:'Không nhận thêm khách ngoài số khách tiêu chuẩn.';
 const content=`<div class="capacity-copy"><p>Sức chứa tối đa<br><strong>${room.max} khách/phòng</strong></p><p>Số khách tiêu chuẩn: <b>${room.base}</b></p><p>${additional}${extra?' Có thể phát sinh phụ thu.':''}</p><p class="capacity-limits">Tổng không quá ${room.max} khách; tối đa ${room.adults} khách tính người lớn (gồm trẻ từ ${config.adultFrom} tuổi)${children?' và '+room.children+' trẻ dưới '+config.adultFrom+' tuổi':config.allowChildren?'. Không nhận trẻ dưới '+config.adultFrom+' tuổi':'. Chỗ nghỉ không nhận khách dưới 18 tuổi'}.</p><p class="capacity-fee-note">Chi tiết phí phụ thu vui lòng xem tại <b>“Tổng tiền”</b>.</p></div>`;
 const id='capacity-'+String(room.id).replace(/[^a-zA-Z0-9_-]/g,'');
 return `<div class="capacity-indicator"><span class="capacity-count" aria-label="${room.base} khách tiêu chuẩn"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3"/></svg><span>×${room.base}</span></span><button type="button" class="capacity-info info-trigger" popovertarget="${id}" aria-label="Chi tiết sức chứa" aria-describedby="${id}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v2"/></svg></button><div id="${id}" popover="auto" role="tooltip" class="capacity-tooltip info-tooltip">${content}</div></div>`;
}
