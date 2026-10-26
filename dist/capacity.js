// Shared customer-facing capacity copy; occupancy validation remains in engine.js.
export function capacityHTML(room,config){
 const extra=Math.max(0,room.max-room.base),children=config.allowChildren&&room.children>0;
 const additional=extra===1&&room.adults>room.base&&children
  ?'Cho phép ở thêm 1 người lớn hoặc 1 trẻ em.'
  :extra?`Cho phép ở thêm tối đa ${extra} ${children?'khách (người lớn và/hoặc trẻ em)':'người lớn'}.`:'Không nhận thêm khách ngoài số khách tiêu chuẩn.';
 return `<div class="capacity-copy"><p>Sức chứa tối đa<br><strong>${room.max} khách/phòng</strong></p><p>Số khách tiêu chuẩn: <b>${room.base}</b></p><p>${additional}${extra?' Có thể phát sinh phụ thu.':''}</p><p class="capacity-limits">Tổng không quá ${room.max} khách; tối đa ${room.adults} người lớn${children?' và '+room.children+' trẻ em':'. Không nhận trẻ em'}.</p><p class="capacity-fee-note">Chi tiết phí phụ thu vui lòng xem tại <b>“Tổng tiền”</b>.</p></div>`;
}
