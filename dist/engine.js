export const initialConfig = () => ({version:3,allowChildren:true,childFreeBelow:6,adultFrom:12,childFee:100000,adultFee:150000,extraEnabled:true,bedIncludesGuest:true,rooms:[
 {id:'a',name:'Awaken Da Nang Hotel',base:2,max:3,adults:3,children:1,beds:1,bedPrice:200000,bedEnabled:true,inventory:12,price:700000,flexPrice:850000},
 {id:'b',name:'alo ha',base:2,max:5,adults:4,children:2,beds:1,bedPrice:200000,bedEnabled:true,inventory:1,price:800000,flexPrice:950000},
 {id:'c',name:'Leo Truong',base:2,max:3,adults:2,children:1,beds:1,bedPrice:300000,bedEnabled:true,inventory:0,price:700000,flexPrice:850000},
 {id:'d',name:'Phòng Gia đình',base:4,max:5,adults:5,children:2,beds:1,bedPrice:200000,bedEnabled:true,inventory:2,price:1500000,flexPrice:1700000}
]});
// Preserve existing prices and age settings while removing retired controls.
export function normalizeConfig(saved){
 const defaults=initialConfig();
 if(!saved||![1,2,3].includes(saved.version)||!Array.isArray(saved.rooms))return defaults;
 const c={...defaults,...saved,version:3,rooms:saved.rooms.map(r=>({...r}))};
 delete c.preferBed;delete c.confirmation;
 c.rooms.forEach(r=>{delete r.noBed;if(saved.version<3){if(r.id==='b'&&r.price===700000)r.price=800000;r.flexPrice=r.price+150000;}});if(saved.version<3&&!c.rooms.some(r=>r.id==='d'))c.rooms.push({...defaults.rooms.find(r=>r.id==='d')});
 return c;
}
export const ratePlans=[
 {id:'standard',name:'Tiết kiệm',cancellation:'Không hoàn hủy',meals:'Bao gồm bữa sáng',payment:'Thanh toán trước'},
 {id:'flex',name:'Linh hoạt',cancellation:'Hủy miễn phí trước ngày nhận phòng 3 ngày',meals:'Bao gồm bữa sáng',payment:'Thanh toán tại chỗ nghỉ'}
];
export const ratePlan=id=>ratePlans.find(p=>p.id===id);
export const ratePrice=(r,id='standard')=>id==='standard'?r.price:id==='flex'?r.flexPrice:null;
export const childAgeUpper=c=>(c.adultFrom-0.01).toFixed(2);
export const existingExtraPlaces=(r,c)=>Math.max(0,r.max-r.base-roomBeds(r,c));
export const requiredExtraBeds=(r,count,c)=>Math.min(roomBeds(r,c),Math.max(0,count-r.base));
export const money=n=>new Intl.NumberFormat('vi-VN').format(n)+'đ';
export function nights(s){return Math.max(0,Math.round((Date.parse(s.out+'T00:00:00Z')-Date.parse(s.in+'T00:00:00Z'))/86400000));}
export function roomBeds(r,c){return c.extraEnabled&&r.bedEnabled?r.beds:0;}
export function guestList(s){return [...Array.from({length:s.adults},(_,i)=>({id:'a'+i,label:'Người lớn '+(i+1),adult:true})),...s.children.map((age,i)=>({id:'c'+i,label:'Trẻ '+(i+1)+' · '+age+' tuổi',age,adult:false}))];}
export function configErrors(c){const errors=[];if(!Number.isInteger(c.childFreeBelow)||!Number.isInteger(c.adultFrom)||c.childFreeBelow<0||c.childFreeBelow>=c.adultFrom||c.adultFrom>18)errors.push('Mốc tuổi phải liên tục: tuổi miễn phí nhỏ hơn tuổi tính giá người lớn (tối đa 18).');if([c.adultFee,c.childFee].some(v=>!Number.isFinite(v)||v<0))errors.push('Phụ thu phải là số từ 0 trở lên.');for(const r of c.rooms){if(['base','max','adults','children','beds','inventory','price','bedPrice'].some(k=>!Number.isFinite(r[k])||r[k]<0||!Number.isInteger(r[k])))errors.push(r.name+': các giá trị phải là số nguyên không âm.');if(r.base<1||r.adults<1||r.max<r.base||r.adults>r.max||r.children>=r.max)errors.push(r.name+': kiểm tra khách tiêu chuẩn, tổng tối đa, người lớn và trẻ em.');if(r.flexPrice!=null&&(!Number.isInteger(r.flexPrice)||r.flexPrice<0))errors.push(r.name+': giá linh hoạt không hợp lệ.');if(roomBeds(r,c)>r.max-r.base)errors.push(r.name+': số giường phụ không được vượt sức chứa tối đa trừ số khách tiêu chuẩn.');}return errors;}
export function priceRoom(r,guests,bedIds,c,stay,ratePlanId='standard'){
 const adults=guests.filter(g=>g.adult).length, kids=guests.filter(g=>!g.adult), bedSet=new Set(bedIds), days=nights(stay), errors=[];
 const beds=roomBeds(r,c), existing=r.base+existingExtraPlaces(r,c),required=requiredExtraBeds(r,guests.length,c);
 if(adults<1)errors.push('Mỗi phòng cần ít nhất 1 người lớn đi cùng.');
 if(guests.length>r.max)errors.push('Vượt tổng tối đa '+r.max+' khách.');
 if(adults>r.adults)errors.push('Tối đa '+r.adults+' người lớn.');
 if(kids.length>r.children)errors.push('Tối đa '+r.children+' trẻ em.');
 if(kids.length&&!c.allowChildren)errors.push('Chỗ nghỉ không nhận trẻ em.');
 if(bedSet.size<required)errors.push('Ưu tiên áp dụng '+required+' giường phụ trước khi dùng chỗ thêm giường có sẵn.');
 if(bedSet.size>beds)errors.push('Tối đa '+beds+' giường phụ.');
 if([...bedSet].some(id=>!guests.some(g=>g.id===id)))errors.push('Giường phụ phải gắn với khách trong phòng.');
 if(guests.length-bedSet.size>existing)errors.push('Giường có sẵn chỉ đáp ứng '+existing+' khách; cần thêm giường hoặc chuyển khách.');
 if(days<1)errors.push('Ngày trả phòng phải sau ngày nhận phòng.');
 // Included slots go to existing-bed guests first. A bundled extra bed must not
 // make an arbitrary guest ID consume an included slot and bill another guest.
 const guestFee=g=>g.adult||g.age>=c.adultFrom?c.adultFee:g.age<c.childFreeBelow?0:c.childFee;
 const eligible=stay.includeChildrenInBase?guests:guests.filter(g=>g.adult||g.age>=c.adultFrom);
 const included=new Set([...eligible].sort((a,b)=>Number(bedSet.has(a.id))-Number(bedSet.has(b.id))||(stay.includeChildrenInBase?guestFee(b)-guestFee(a):0)).slice(0,r.base).map(g=>g.id));
 const extra=new Set(guests.filter(g=>(g.adult||g.age>=c.adultFrom)&&!included.has(g.id)).map(g=>g.id));
 const basePrice=ratePrice(r,ratePlanId);if(!ratePlan(ratePlanId)||!Number.isFinite(basePrice)||basePrice<0)errors.push('Gói giá không còn khả dụng.');
 const lines=[{label:'Giá phòng · '+(ratePlan(ratePlanId)?.name||'Không hợp lệ')+' · '+days+' đêm',amount:(basePrice||0)*days,type:'base'}];
 for(const g of guests){let fee=0,description='';if(extra.has(g.id)){fee=c.adultFee;description=(g.adult?'Người lớn thêm':g.label+' · tính giá người lớn')+' · dùng giường có sẵn';}else if(!g.adult&&g.age<c.adultFrom&&(!stay.includeChildrenInBase||!included.has(g.id))){fee=g.age<c.childFreeBelow?0:c.childFee;description=g.label+' · dùng giường có sẵn';}
 if(bedSet.has(g.id)){if(!c.bedIncludesGuest&&fee>0)lines.push({label:g.label+' · phụ thu lưu trú',amount:fee*days,type:'guest',guest:g.id});lines.push({label:g.label+' · 1 giường phụ'+(c.bedIncludesGuest?' (đã gồm phụ thu người sử dụng)':''),amount:r.bedPrice*days,type:'bed',guest:g.id});}
 else if(description)lines.push({label:description,amount:fee*days,type:'guest',guest:g.id});}
 return {valid:errors.length===0,errors,lines,total:lines.reduce((s,l)=>s+l.amount,0),requiredBeds:required};
}
export function suggestedBeds(r,guests,c){
 const rated=guests.filter(g=>g.adult||g.age>=c.adultFrom),extras=rated.slice(r.base);
 const ordered=[...extras,...guests.filter(g=>!g.adult&&!extras.includes(g)).sort((a,b)=>b.age-a.age),...guests.filter(g=>g.adult&&!extras.includes(g))];
 return ordered.slice(0,requiredExtraBeds(r,guests.length,c)).map(g=>g.id);
}
// Dynamic programming examines all adult counts and child subsets per booked room.
// Adult identities are interchangeable; child identities/ages are retained exactly.
export function allocate(rooms,search,c,ratePlanId='standard',bedPicker=suggestedBeds){
 if(search.adults<rooms.length||nights(search)<1||search.adults+search.children.length>rooms.reduce((n,r)=>n+r.max,0)||search.adults>rooms.reduce((n,r)=>n+r.adults,0)||search.children.length>rooms.reduce((n,r)=>n+r.children,0))return null;
 const guests=guestList(search),adultGuests=guests.filter(g=>g.adult),children=guests.filter(g=>!g.adult),memo=new Map();
 function solve(i,leftAdults,mask){
  if(i===rooms.length)return leftAdults===0&&mask===0?{cost:0,rows:[]}:null;
  const key=i+':'+leftAdults+':'+mask;if(memo.has(key))return memo.get(key);
  const r=rooms[i],remainingRooms=rooms.length-i-1;let best=null;
  const maxAdults=Math.min(r.adults,r.max,leftAdults-remainingRooms);
  for(let n=1;n<=maxAdults;n++){
   for(let subset=mask;;subset=(subset-1)&mask){
    const kids=children.filter((g,k)=>subset&(1<<k));
    if(kids.length<=r.children&&n+kids.length<=r.max&&(!kids.length||c.allowChildren)){
     const group=[...adultGuests.slice(search.adults-leftAdults,search.adults-leftAdults+n),...kids];
     const bedIds=bedPicker(r,group,c,search,ratePlanId),quote=priceRoom(r,group,bedIds,c,search,ratePlanId);
     if(quote.valid){const tail=solve(i+1,leftAdults-n,mask^subset);if(tail&&(!best||quote.total+tail.cost<best.cost))best={cost:quote.total+tail.cost,rows:[{roomId:r.id,ratePlanId,guestIds:group.map(g=>g.id),bedIds,quote},...tail.rows]};}
    }
    if(subset===0)break;
   }
  }
  memo.set(key,best);return best;
 }
 return solve(0,search.adults,(1<<children.length)-1)?.rows||null;
}
export function recommendations(search,c,quantities,onlyPlan,bedPicker=suggestedBeds){
 if(search.rooms<1||search.rooms>6||search.adults<1||search.adults>24||search.children.length>8||search.children.some(a=>a<0||a>17)||!Number.isFinite(nights(search))||nights(search)<1)return [];
 const results=[];
 for(const plan of ratePlans.filter(p=>!onlyPlan||p.id===onlyPlan)){
  function build(i,list,counts){
   if(i===c.rooms.length){
    if(list.length!==search.rooms)return;
    const allocation=allocate(list,search,c,plan.id,bedPicker);
    if(allocation)results.push({ratePlanId:plan.id,rooms:list.map(r=>r.id),counts,allocation,total:allocation.reduce((s,a)=>s+a.quote.total,0),capacityGap:list.reduce((s,r)=>s+r.max,0)-search.adults-search.children.length,adultGap:list.reduce((s,r)=>s+r.adults,0)-search.adults});return;
   }
   const r=c.rooms[i],price=ratePrice(r,plan.id),max=Number.isFinite(price)&&price>=0?Math.min(r.inventory,search.rooms-list.length):0;
   for(let n=0;n<=max;n++){if(quantities&&n!==(quantities[r.id]||0))continue;build(i+1,[...list,...Array(n).fill(r)],{...counts,[r.id]:n});}
  }
  build(0,[],{});
 }
 // Honor the requested number of rooms. A single room is matched by capacity;
 // a multi-room request is ranked by the complete booking cost, not base prices.
 return results.sort((a,b)=>(search.rooms===1?(a.capacityGap-b.capacityGap||a.adultGap-b.adultGap):0)||a.total-b.total||a.capacityGap-b.capacityGap||new Set(a.rooms).size-new Set(b.rooms).size);
}
export function validateBooking(rows,search,c){const all=guestList(search),seen=rows.flatMap(r=>r.guestIds),errors=[];if(new Set(rows.map(r=>r.ratePlanId||'standard')).size>1)errors.push('Các phòng trong một booking phải cùng gói giá.');if(rows.length!==search.rooms)errors.push('Cần chọn đúng '+search.rooms+' phòng.');if(all.some(g=>seen.filter(id=>id===g.id).length!==1)||seen.some(id=>!all.some(g=>g.id===id)))errors.push('Mỗi khách cần được xếp đúng 1 phòng.');const counts={};const quotes=rows.map(row=>{const r=c.rooms.find(r=>r.id===row.roomId);if(!r){errors.push('Loại phòng không hợp lệ.');return {valid:false,total:0,lines:[],errors:['Loại phòng không hợp lệ.']};}counts[r.id]=(counts[r.id]||0)+1;return priceRoom(r,all.filter(g=>row.guestIds.includes(g.id)),row.bedIds,c,search,row.ratePlanId||'standard');});for(const [id,n]of Object.entries(counts))if(n>c.rooms.find(r=>r.id===id).inventory)errors.push('Không đủ inventory cho '+c.rooms.find(r=>r.id===id).name+'.');quotes.forEach((q,i)=>{errors.push(...q.errors.map(e=>'Phòng '+(i+1)+': '+e));});return {valid:!errors.length,errors,quotes,total:quotes.reduce((s,q)=>s+q.total,0)};}
