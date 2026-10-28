import './tooltips.js?v=20261028-nightly-total';
import {money,nights,ratePrice,ratePlan,validateBooking,guestList} from './engine.js?v=20261028-nightly-total';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function roomPriceDetail({room,plan,search,config,quantity=0,rows=[],stay=search,automatic=false,partial=false}){
 const days=nights(search),count=quantity||1,unit=ratePrice(room,plan),base=unit*count*days;
 const chosen=quantity>0,matching=rows.map((r,i)=>({r,i})).filter(x=>x.r.roomId===room.id&&x.r.ratePlanId===plan);
 const check=chosen&&matching.length===quantity?validateBooking(rows,{...stay,rooms:rows.length},config):null;
 const guests=guestList(stay);
 function collect(indices){
  const fees=[];
  for(const i of indices)for(const line of check.quotes[i].lines){
   if(line.type==='base'||line.amount<=0)continue;
   const g=guests.find(g=>g.id===line.guest),label=line.type==='bed'?'Giường phụ':g?.adult||g?.age>=config.adultFrom?'Phụ thu người lớn':automatic?'Phụ thu trẻ em':'Phụ thu trẻ '+g.age+' tuổi',unit=line.amount/days;
   let fee=fees.find(f=>f.label===label&&f.unit===unit);
   if(!fee){fee={label,unit,count:0,amount:0};fees.push(fee);}fee.count++;fee.amount+=line.amount;
  }
  return fees;
 }
 const priced=!!check?.valid;
 const total=priced?matching.reduce((n,{i})=>n+check.quotes[i].total,0):base;
 const fees=priced&&!automatic?collect(matching.map(x=>x.i)):[];
 const bookingFees=priced&&automatic?collect(rows.map((_,i)=>i)):[];
 return {days,count,unit,base,fees,bookingFees,surcharge:total-base,total,nightlyTotal:days>0?total/days:unit*count,chosen,priced,automatic,partial,bookingTotal:priced?check.total:null,coins:Math.floor(total*.02)};
}

export function priceHTML(options){
 const {room,plan,search}=options,d=roomPriceDetail(options),id='price-'+String(room.id+'-'+plan).replace(/[^a-zA-Z0-9_-]/g,'');
 const line=(label,value,cls='')=>`<div class="price-tip-line ${cls}"><span>${label}</span><span>${value}</span></div>`;
 const nightly=Array.from({length:d.days},(_,i)=>{const date=new Date(search.in+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+i);return line(`Đêm ${i+1} (${date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',timeZone:'UTC'})}) · ${d.count} phòng`,money(d.nightlyTotal));}).join('');
 const feeLines=fees=>fees.map(f=>line(`${esc(f.label)} × ${f.count}<small>${money(f.unit)}/đêm × ${d.days} đêm</small>`,money(f.amount))).join('')||'<span>Không phát sinh phụ thu</span>';
 const feeNote=!d.chosen?'Giá tham khảo cho một phòng. Chưa gồm phụ thu khách thêm.':!d.priced?'Chưa xác định được phụ thu. Vui lòng kiểm tra lựa chọn phòng.':d.partial?'Tạm tính cho khách đã xếp được; chưa phải giá cho toàn bộ nhóm.':'';
 const localBreakdown=d.priced&&!d.automatic?`${line('Tiền phòng theo số lượng đã chọn',money(d.base),'price-tip-main')}${line('Phụ thu đã bao gồm',money(d.surcharge),'price-tip-main')}<div class="price-tip-sub">${feeLines(d.fees)}</div>`:'';
 const globalBreakdown=d.priced&&d.automatic?`<div class="price-tip-total">${line('Phụ thu đã bao gồm trong toàn đơn',money(d.bookingFees.reduce((n,f)=>n+f.amount,0)))}<div class="price-tip-sub">${feeLines(d.bookingFees)}</div><p>Thông tin chung cho tất cả phòng đã chọn, không xác nhận phụ thu ở loại phòng nào. Các khoản này đã nằm trong Giá 1 đêm; không cộng lại.</p>${line(d.partial?'Tạm tính toàn đơn':'Tổng tiền toàn đơn',money(d.bookingTotal))}</div>`:'';
 const content=`<div class="price-tip-heading">Chi tiết giá</div><p class="price-tip-context">${esc(room.name)} · Gói ${ratePlan(plan).name}<br>${d.chosen?'Đã chọn':'Tham khảo'} ${d.count} phòng · ${d.days} đêm</p>${line(d.partial?'Giá 1 đêm tạm tính':'Giá 1 đêm',money(d.nightlyTotal),'price-tip-main')}<p class="price-tip-muted">${d.chosen?'Cho toàn bộ '+d.count+' phòng đã chọn tại dòng này':'Giá tiêu chuẩn cho '+room.base+' khách trong một phòng'}. ${d.priced?'Đã gồm phụ thu.':''}</p><div class="price-tip-sub">${nightly}</div>${localBreakdown}${line('Thuế &amp; Phí','Đã bao gồm','price-tip-main')}<div class="price-tip-total">${line(d.partial?'Tạm tính dòng đã chọn':d.chosen?'Tổng dòng đã chọn':'Tổng tham khảo',money(d.total))}<p>${money(d.nightlyTotal)} mỗi đêm × ${d.days} đêm. Không nhân số phòng hoặc cộng phụ thu lần nữa.</p>${feeNote?`<p class="price-tip-explanation">${feeNote}</p>`:''}</div>${globalBreakdown}<div class="price-tip-coins">${line('Xu dự kiến cho dòng này','+'+new Intl.NumberFormat('vi-VN').format(d.coins)+' xu')}<p>Xu cuối cùng theo tổng đơn xác nhận.</p></div>`;
 return `<div class="room-price-with-info"><span class="room-price">${money(d.nightlyTotal)}</span><button type="button" class="capacity-info info-trigger" popovertarget="${id}" aria-label="Chi tiết giá ${esc(room.name)} · ${ratePlan(plan).name}" aria-describedby="${id}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v2"/></svg></button><div id="${id}" popover="auto" role="tooltip" class="capacity-tooltip info-tooltip price-tooltip">${content}</div></div>`;
}
