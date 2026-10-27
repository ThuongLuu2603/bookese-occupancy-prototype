import {priceHTML} from './prices.js?v=20261027-child-extra';
import {capacityHTML} from './capacity.js?v=20261027-child-extra';
import {allocate,recommendations,validateBooking,suggestedBeds,ratePlans,ratePrice,ratePlan,roomBeds,guestList,nights,money} from './engine.js?v=20261027-child-extra';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export const automaticBeds=suggestedBeds;

// The requested number is an upper bound for suggestions in this variant.
// Every candidate still uses the same per-room capacity, age and bed rules.
export function automaticRecommendations(search,config){
 if(!Number.isInteger(search.rooms)||search.rooms<1||search.rooms>6)return [];
 const results=Array.from({length:search.rooms},(_,i)=>recommendations({...search,rooms:i+1},config,undefined,undefined,automaticBeds)).flat();
 return search.rooms===1?results:results.sort((a,b)=>a.total-b.total||a.capacityGap-b.capacityGap||Math.abs(a.rooms.length-search.rooms)-Math.abs(b.rooms.length-search.rooms));
}

export function quoteAutomatic(quantities,search,config,plan='standard'){
 if(!Number.isInteger(search.adults)||search.adults<1||search.adults>24||search.children.length>8||search.children.some(a=>!Number.isFinite(a)||a<0||a>17)||!Number.isFinite(nights(search))||nights(search)<1)return {valid:false,total:0,allocation:[],error:'Kiểm tra số khách, tuổi trẻ em và ngày lưu trú.'};
 const rooms=[];
 for(const [id,count] of Object.entries(quantities)){
  const r=config.rooms.find(r=>r.id===id);
  if(!Number.isInteger(count)||count<0||(!r&&count)||r&&count>r.inventory)return {valid:false,total:0,allocation:[],error:'Số lượng phòng không còn khả dụng.'};
  if(r)rooms.push(...Array(count).fill(r));
 }
 const empty={valid:false,total:0,allocation:[],covered:0,missing:search.adults+search.children.length};
 if(!rooms.length)return empty;
 if(rooms.length>6||rooms.length>search.adults)return {...empty,error:'Mỗi phòng cần ít nhất một người lớn. Vui lòng giảm số phòng.'};
 if(!ratePlan(plan)||rooms.some(r=>!Number.isFinite(ratePrice(r,plan))))return {...empty,error:'Gói giá không còn khả dụng.'};
 const stay={...search,rooms:rooms.length},rows=allocate(rooms,stay,config,plan,automaticBeds);
 if(rows){const v=validateBooking(rows,stay,config);return {...v,allocation:rows,covered:search.adults+search.children.length,missing:0,search:stay};}
 // An incomplete selection is a preview for the largest feasible subset only.
 // Never let this quote confirm a booking or masquerade as a full-party price.
 const cap=rooms.reduce((n,r)=>n+r.max,0),adultCap=rooms.reduce((n,r)=>n+r.adults,0),total=search.adults+search.children.length;
 for(let count=Math.min(cap,total-1);count>=rooms.length;count--){
  let best=null;
  for(let mask=0;mask<(1<<search.children.length);mask++){
   const children=search.children.filter((_,i)=>mask&(1<<i)),adults=count-children.length;
   const older=children.filter(age=>age>=config.adultFrom).length;
   if(adults<rooms.length||adults>search.adults||adults+older>adultCap)continue;
   const partial={...stay,adults,children},allocation=allocate(rooms,partial,config,plan,automaticBeds);
   if(!allocation)continue;
   const v=validateBooking(allocation,partial,config);
   if(v.valid&&(!best||v.total<best.total))best={...v,valid:false,allocation,covered:count,missing:total-count,search:partial};
  }
  if(best)return best;
 }
 return {...empty,error:'Tổ hợp này không có cách bố trí hợp lệ. Hãy chọn lại loại phòng.'};
}

// Internal per-type breakdown; public PA2 views must flatten charges across the booking.
export function automaticSummary(rows,search,config){
 const guests=guestList(search),days=nights(search),v=validateBooking(rows,{...search,rooms:rows.length},config),groups=[];
 rows.forEach((row,i)=>{
  const r=config.rooms.find(r=>r.id===row.roomId);let group=groups.find(g=>g.roomId===r.id);
  if(!group){group={roomId:r.id,name:r.name,count:0,base:0,total:0,fees:[],ratePlanId:row.ratePlanId||'standard'};groups.push(group);}
  group.count++;group.total+=v.quotes[i].total;
  for(const l of v.quotes[i].lines){
   if(l.type==='base'){group.base+=l.amount;continue;}
   const guest=guests.find(g=>g.id===l.guest),adultRate=guest?.adult||guest?.age>=config.adultFrom;
   const category=l.type==='bed'?'bed':adultRate?'adult':'child',onBed=row.bedIds.includes(l.guest);
   const label=category==='bed'?'Giường phụ (đã gồm phụ thu người dùng)':category==='adult'?'Phụ thu giá người lớn · '+(onBed?'dùng giường phụ':'giường có sẵn'):'Phụ thu trẻ em · '+(onBed?'dùng giường phụ':'giường có sẵn');
   const unit=l.amount/days,key=category+':'+onBed+':'+unit;
   let fee=group.fees.find(f=>f.key===key);
   if(!fee){fee={key,category,label,unit,count:0,amount:0};group.fees.push(fee);}
   fee.count++;fee.amount+=l.amount;
  }
 });
 groups.forEach(g=>g.fees.sort((a,b)=>['bed','adult','child'].indexOf(a.category)-['bed','adult','child'].indexOf(b.category)));
 return groups;
}
export const feeText=f=>`${f.count} ${f.category==='bed'?'giường phụ':f.category==='adult'?'phụ thu giá người lớn':'phụ thu trẻ em'}${f.amount===0?' (miễn phí)':''}`;
export const automaticNote='Suất tiêu chuẩn ưu tiên khách tính giá người lớn; trẻ em dùng suất còn trống không phụ thu. Trẻ dưới mốc giá người lớn vượt tiêu chuẩn dùng giường có sẵn, tính phụ thu theo tuổi; giường phụ ưu tiên cho khách tính giá người lớn vượt tiêu chuẩn. Hệ thống tính phụ thu theo phương án hợp lệ có tổng giá thấp nhất. Chỉ xác nhận số lượng loại phòng và tổng phụ thu toàn đơn. Chỗ nghỉ bố trí khách và giường phụ trong giới hạn đã đặt; không xác nhận phụ thu thuộc phòng nào.';
// Merge identical services across room types without exposing their room assignment.
export function bookingFees(groups){
 const fees=[];
 for(const group of groups)for(const f of group.fees){
  const key=f.category+':'+f.unit;
  let fee=fees.find(x=>x.key===key);
  if(!fee){fee={key,category:f.category,label:f.label,unit:f.unit,count:0,amount:0};fees.push(fee);}
  fee.count+=f.count;fee.amount+=f.amount;
 }
 return fees.sort((a,b)=>['child','bed','adult'].indexOf(a.category)-['child','bed','adult'].indexOf(b.category)||a.unit-b.unit);
}
export function bookingFeeLabel(f,days){
 const name=f.category==='bed'?'Giường phụ':f.category==='child'?'Phụ thu trẻ em':'Phụ thu giá người lớn';
 return `${name} (${money(f.unit)}${days>1?'/đêm':''}) × ${f.count}${days>1?' × '+days+' đêm':''}`;
}
export function aggregateRoomsHTML(groups,days){
 const fees=bookingFees(groups);
 return groups.map(g=>`<div class="booking-room auto-confirm-type"><div class="booking-line"><b>${esc(g.name)} × ${g.count}</b><b>${money(g.base)}</b></div><p class="booking-room-desc">Gói ${ratePlan(g.ratePlanId).name} · ${days} đêm · Giá phòng chưa gồm phụ thu</p></div>`).join('')+`<div class="booking-room auto-booking-fees"><b>Phụ thu toàn đơn</b>${fees.length?fees.map(f=>`<div class="booking-line"><span>${esc(bookingFeeLabel(f,days))}</span><span>${money(f.amount)}</span></div>`).join(''):'<p class="small green">Không phát sinh phụ thu</p>'}</div>`;
}

export function automaticTable({config,search,selected,selectedPlan,quote,recs}){
 const count=Object.values(selected).reduce((n,v)=>n+v,0),groups=quote.allocation.length?automaticSummary(quote.allocation,quote.search,config):[];
 const sorted=[...config.rooms].sort((a,b)=>{const best=id=>recs.findIndex(r=>r.rooms.includes(id));return (best(a.id)<0?Infinity:best(a.id))-(best(b.id)<0?Infinity:best(b.id));});
 const side=`<td rowspan="${sorted.length*ratePlans.length}" class="summary-cell"><div class="summary-sticky"><p class="small">Đã chọn ${count} phòng · ${nights(search)} đêm</p>${count?`<small class="${quote.valid?'green':'red'}">${quote.valid?'✓ Đủ chỗ cho cả '+quote.covered+' khách':quote.error||'Còn '+quote.missing+' khách chưa có chỗ. Thêm hoặc đổi phòng.'}</small>`:'<p class="small muted">Chọn số lượng phòng để xem tổng giá</p>'}${quote.allocation.length?`<p class="auto-total-label">${quote.valid?'Tổng thanh toán':'Tạm tính cho '+quote.covered+'/'+(search.adults+search.children.length)+' khách'}</p><strong class="room-price">${money(quote.total)}</strong><div class="auto-fee-list">${groups.map(g=>`<p><b>${esc(g.name)} × ${g.count}</b></p>`).join('')}<div class="auto-booking-fees"><b>Phụ thu toàn đơn</b>${bookingFees(groups).map(f=>`<p>${esc(bookingFeeLabel(f,nights(search)))}</p>`).join('')||'<p>Không phát sinh phụ thu</p>'}</div></div><p class="tax-note">${quote.valid?'Đã gồm phụ thu, thuế & phí':'Chưa phải giá cho toàn bộ đoàn'}</p>`:''}<button class="btn" data-action="checkout" ${quote.valid?'':'disabled'}>Tôi sẽ đặt</button>${quote.valid&&count!==search.rooms?`<p class="tax-note">Bạn tìm ${search.rooms} phòng; sẽ đặt ${count} phòng đủ chỗ cho cả nhóm.</p>`:''}<p class="tax-note">Các phòng cùng một gói giá. Khách tính giá người lớn vượt tiêu chuẩn: ưu tiên giường phụ. Trẻ dưới mốc giá người lớn: dùng giường có sẵn, phụ thu theo tuổi khi vượt tiêu chuẩn.</p></div></td>`;
 return `<table class="room-table auto-room-table"><colgroup><col style="width:23%"><col style="width:10%"><col style="width:17%"><col style="width:24%"><col style="width:8%"><col style="width:18%"></colgroup><thead><tr><th>Loại phòng</th><th>Sức chứa</th><th>Giá 1 phòng / 1 đêm</th><th>Lựa chọn của bạn</th><th>Số phòng</th><th>Tổng tiền</th></tr></thead><tbody>${sorted.map((r,ri)=>ratePlans.map((p,pi)=>{const locked=count>0&&selectedPlan!==p.id,enabled=r.inventory>0&&Number.isFinite(ratePrice(r,p.id));return `<tr class="rate-row ${selectedPlan===p.id&&selected[r.id]?'chosen-rate':''}">${pi===0?`<td rowspan="2"><button class="room-name linkbtn" data-action="room-details" data-id="${r.id}">${esc(r.name)}</button><p class="room-info">Giường đôi / giường đơn<br>Wifi miễn phí · Điều hòa</p><p class="small muted">Còn ${r.inventory} phòng</p></td><td rowspan="2">${capacityHTML(r,config)}</td>`:''}<td>${enabled?`${priceHTML({room:r,plan:p.id,search,config,quantity:selectedPlan===p.id?(selected[r.id]||0):0,automatic:true,partial:!quote.valid})}<p class="price-small">Cho ${r.base} khách, gồm người lớn và trẻ em<br>Phụ thu tự tính ở tổng tiền</p>`:'<p class="red small">Hết phòng</p>'}</td><td><strong class="rate-name">Gói ${p.name}</strong><p class="rate-policy">${p.cancellation}<br>✓ ${p.meals}<br>${p.payment}</p>${locked&&enabled?`<button class="linkbtn small" data-action="switch-plan" data-plan="${p.id}">Đổi cả đơn sang gói ${p.name} →</button>`:''}</td><td><select data-quantity="${r.id}" data-plan="${p.id}" aria-label="Số phòng ${esc(r.name)} · ${p.name}" ${!enabled||locked?'disabled':''}>${Array.from({length:Math.min(r.inventory,6,search.adults)+1},(_,n)=>`<option value="${n}" ${selectedPlan===p.id&&(selected[r.id]||0)===n?'selected':''}>${n}</option>`).join('')}</select></td>${ri===0&&pi===0?side:''}</tr>`;}).join('')).join('')}</tbody></table>`;
}
