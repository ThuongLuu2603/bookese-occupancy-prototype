import {guestList,suggestedBeds,validateBooking,roomBeds} from './engine.js?v=20261026-readonly-details';

export function roomServices(rows,search,config,index){
 const v=validateBooking(rows,{...search,rooms:rows.length},config),guests=guestList(search);
 return (v.quotes[index]?.lines||[]).filter(l=>l.type!=='base'&&l.guest).filter((l,i,ls)=>l.type==='bed'||!ls.some(x=>x.type==='bed'&&x.guest===l.guest)).map(l=>{
  const g=guests.find(g=>g.id===l.guest),kind=l.type==='bed'?'bed':g.adult||g.age>=config.adultFrom?'adult':'child';
  return {guestId:g.id,kind,label:kind==='bed'?'1 giường phụ':kind==='child'?'Phụ thu trẻ '+g.age+' tuổi':'Phụ thu người lớn · giường có sẵn',amount:(v.quotes[index].lines.filter(x=>x.guest===g.id).reduce((n,x)=>n+x.amount,0))};
 });
}

// Move the service and its guest together. If needed, exchange one destination
// guest; validate the complete booking and never mutate the original selection.
export function transferService(rows,search,config,source,target,guestId,kind){
 const stay={...search,rooms:rows.length},before=validateBooking(rows,stay,config),fail=reason=>({valid:false,reason});
 if(!before.valid)return fail('Hãy hoàn tất bố trí hợp lệ trước khi chuyển dịch vụ.');
 if(!Number.isInteger(source)||!Number.isInteger(target)||source===target||!rows[source]||!rows[target])return fail('Chọn một phòng khác đã đặt.');
 const service=roomServices(rows,stay,config,source).find(s=>s.guestId===guestId&&s.kind===kind);
 if(!service)return fail('Dịch vụ đã thay đổi. Vui lòng chọn lại.');
 const destination=config.rooms.find(r=>r.id===rows[target].roomId),guests=guestList(stay);
 if(kind==='bed'&&!roomBeds(destination,config))return fail('Phòng này không cung cấp giường phụ.');
 if(kind==='bed'&&rows[target].bedIds.length>=roomBeds(destination,config))return fail('Phòng này đã đủ số giường phụ tối đa.');
 const incoming=guests.find(g=>g.id===guestId);
 if(!incoming.adult&&destination.children===0)return fail('Phòng này không nhận trẻ em.');
 const candidates=[];
 for(const exchange of [null,...rows[target].guestIds]){
  const next=rows.map(r=>({...r,guestIds:[...r.guestIds],bedIds:[...r.bedIds]}));
  next[source].guestIds=next[source].guestIds.filter(id=>id!==guestId);next[target].guestIds.push(guestId);
  if(exchange){next[target].guestIds=next[target].guestIds.filter(id=>id!==exchange);next[source].guestIds.push(exchange);}
  for(const i of [source,target])next[i].bedIds=suggestedBeds(config.rooms.find(r=>r.id===next[i].roomId),guests.filter(g=>next[i].guestIds.includes(g.id)),config);
  if(kind==='bed'){
   if(next[source].bedIds.length!==rows[source].bedIds.length-1||next[target].bedIds.length!==rows[target].bedIds.length+1)continue;
   if(!next[target].bedIds.includes(guestId))next[target].bedIds[next[target].bedIds.length-1]=guestId;
  }
  const after=validateBooking(next,stay,config);if(!after.valid)continue;
  candidates.push({valid:true,rows:next,total:after.total,delta:after.total-before.total,exchange,guestId,source,target,kind,quotes:after.quotes});
 }
 // Prefer a direct move so unrelated guests stay put; then the cheapest swap.
 candidates.sort((a,b)=>Number(!!a.exchange)-Number(!!b.exchange)||a.total-b.total);
 return candidates[0]||fail('Không thể chuyển với bố trí hiện tại: cần giữ giới hạn tổng khách, người lớn, trẻ em và ít nhất 1 người lớn mỗi phòng.');
}
