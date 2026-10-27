import './tooltips.js?v=20261027-adult-age-capacity';
import {money,nights,ratePrice,ratePlan,validateBooking,guestList} from './engine.js?v=20261027-adult-age-capacity';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function roomPriceDetail({room,plan,search,config,quantity=0,rows=[],stay=search,automatic=false,partial=false}){
 const days=nights(search),count=quantity||1,unit=ratePrice(room,plan),base=unit*count*days,fees=[];
 const chosen=quantity>0,matching=rows.map((r,i)=>({r,i})).filter(x=>x.r.roomId===room.id&&x.r.ratePlanId===plan);
 const check=!automatic&&chosen&&matching.length===quantity?validateBooking(rows,{...stay,rooms:rows.length},config):null;
 if(check?.valid){
  const guests=guestList(stay);
  for(const {i} of matching)for(const line of check.quotes[i].lines){
   if(line.type==='base'||line.amount<=0)continue;
   const g=guests.find(g=>g.id===line.guest),label=line.type==='bed'?'Giường phụ':g?.adult||g?.age>=config.adultFrom?'Phụ thu người lớn':'Phụ thu trẻ '+g.age+' tuổi',unit=line.amount/days;
   let fee=fees.find(f=>f.label===label&&f.unit===unit);
   if(!fee){fee={label,unit,count:0,amount:0};fees.push(fee);}fee.count++;fee.amount+=line.amount;
  }
 }
 const surcharge=fees.reduce((n,f)=>n+f.amount,0),total=base+surcharge;
 return {days,count,unit,base,fees,surcharge,total,chosen,priced:!!check?.valid,automatic,partial,coins:Math.floor(total*.02)};
}

export function priceHTML(options){
 const {room,plan,search,config}=options,d=roomPriceDetail(options),id='price-'+String(room.id+'-'+plan).replace(/[^a-zA-Z0-9_-]/g,'');
 const line=(label,value,cls='')=>`<div class="price-tip-line ${cls}"><span>${label}</span><span>${value}</span></div>`;
 const nightly=Array.from({length:d.days},(_,i)=>{const date=new Date(search.in+'T00:00:00Z');date.setUTCDate(date.getUTCDate()+i);return line(`Đêm ${i+1} (${date.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',timeZone:'UTC'})}) · ${d.count} phòng`,money(d.unit*d.count));}).join('');
 const feeNote=!d.chosen?'Chưa gồm phụ thu khách thêm. Chọn số lượng phòng để hệ thống tính phụ thu.':d.automatic?'Phụ thu được tính chung cho cả đơn tại “Tổng tiền”, không gắn với từng loại phòng.':!d.priced?'Chưa xác định được phụ thu. Vui lòng kiểm tra lựa chọn phòng.':d.partial?'Phụ thu tạm tính cho khách đã xếp được; chưa phải giá cho toàn bộ nhóm.':'';
 const totalLabel=d.priced?(d.partial?'Tạm tính loại phòng':'Tổng loại phòng'):'Tổng tiền phòng';
 const content=`<div class="price-tip-heading">Chi tiết giá</div><p class="price-tip-context">${esc(room.name)} · Gói ${ratePlan(plan).name}<br>${d.chosen?'Đã chọn':'Tham khảo'} ${d.count} phòng · ${d.days} đêm</p>${line('Giá phòng',money(d.base),'price-tip-main')}<div class="price-tip-sub">${nightly}</div>${line('Thuế &amp; Phí','Đã bao gồm','price-tip-main')}<p class="price-tip-muted">Đã nằm trong giá hiển thị, không cộng thêm lần nữa.</p>${d.priced?`${line(d.partial?'Phụ thu tạm tính':'Phụ thu',money(d.surcharge),'price-tip-main')}<div class="price-tip-sub">${d.fees.map(f=>line(`${esc(f.label)} × ${f.count}<small>${money(f.unit)}/đêm × ${d.days} đêm</small>`,money(f.amount))).join('')||'<span>Không phát sinh phụ thu</span>'}</div>`:''}<div class="price-tip-total">${line(totalLabel,money(d.total))}<p>${d.priced?'Đã gồm phụ thu, thuế &amp; phí':'Đã gồm thuế &amp; phí; chưa gồm phụ thu khách thêm'} cho ${d.days} đêm, ${d.count} phòng.</p>${feeNote?`<p class="price-tip-explanation">${feeNote}</p>`:''}</div><div class="price-tip-coins">${line('Xu dự kiến sau lưu trú','+'+new Intl.NumberFormat('vi-VN').format(d.coins)+' xu')}<p>Tạm tính trên số tiền ở trên; xu cuối cùng theo tổng đơn xác nhận.</p></div>`;
 return `<div class="room-price-with-info"><span class="room-price">${money(d.unit)}</span><button type="button" class="capacity-info info-trigger" popovertarget="${id}" aria-label="Chi tiết giá ${esc(room.name)} · ${ratePlan(plan).name}" aria-describedby="${id}" aria-expanded="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v2"/></svg></button><div id="${id}" popover="auto" role="tooltip" class="capacity-tooltip info-tooltip price-tooltip">${content}</div></div>`;
}
