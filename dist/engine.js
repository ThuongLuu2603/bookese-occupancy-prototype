export const initialConfig = () => ({version:1,allowChildren:true,childFreeBelow:6,adultFrom:12,childFee:100000,adultFee:150000,extraEnabled:true,bedIncludesGuest:true,preferBed:true,confirmation:'guaranteed',rooms:[
 {id:'a',name:'Awaken Da Nang Hotel',base:2,max:3,adults:3,children:1,noBed:1,beds:1,bedPrice:200000,bedEnabled:true,inventory:12,price:700000},
 {id:'b',name:'alo ha',base:2,max:5,adults:4,children:2,noBed:2,beds:1,bedPrice:200000,bedEnabled:true,inventory:1,price:700000},
 {id:'c',name:'Leo Truong',base:2,max:3,adults:2,children:1,noBed:0,beds:1,bedPrice:300000,bedEnabled:true,inventory:0,price:700000}
]});
export const money=n=>new Intl.NumberFormat('vi-VN').format(n)+'đ';
export function nights(s){return Math.max(0,Math.round((Date.parse(s.out+'T00:00:00Z')-Date.parse(s.in+'T00:00:00Z'))/86400000));}
export function roomBeds(r,c){return c.extraEnabled&&r.bedEnabled?r.beds:0;}
export function guestList(s){return [...Array.from({length:s.adults},(_,i)=>({id:'a'+i,label:'Người lớn '+(i+1),adult:true})),...s.children.map((age,i)=>({id:'c'+i,label:'Trẻ '+(i+1)+' · '+age+' tuổi',age,adult:false}))];}
export function configErrors(c){const errors=[];if(c.childFreeBelow<0||c.childFreeBelow>=c.adultFrom||c.adultFrom>18)errors.push('Mốc tuổi phải liên tục: tuổi miễn phí nhỏ hơn tuổi tính giá người lớn (tối đa 18).');if([c.adultFee,c.childFee].some(v=>!Number.isFinite(v)||v<0))errors.push('Phụ thu phải là số từ 0 trở lên.');for(const r of c.rooms){if(['base','max','adults','children','noBed','beds','inventory','price','bedPrice'].some(k=>!Number.isFinite(r[k])||r[k]<0||!Number.isInteger(r[k])))errors.push(r.name+': các giá trị phải là số nguyên không âm.');if(r.base<1||r.adults<1||r.max<r.base||r.adults>r.max||r.children>=r.max)errors.push(r.name+': kiểm tra khách tiêu chuẩn, tổng tối đa, người lớn và trẻ em.');}return errors;}
export function priceRoom(r,guests,bedIds,c,stay){
 const adults=guests.filter(g=>g.adult).length, kids=guests.filter(g=>!g.adult), bedSet=new Set(bedIds), days=nights(stay), errors=[];
 const beds=roomBeds(r,c), existing=r.base+r.noBed;
 if(adults<1)errors.push('Mỗi phòng cần ít nhất 1 người lớn đi cùng.');
 if(guests.length>r.max)errors.push('Vượt tổng tối đa '+r.max+' khách.');
 if(adults>r.adults)errors.push('Tối đa '+r.adults+' người lớn.');
 if(kids.length>r.children)errors.push('Tối đa '+r.children+' trẻ em.');
 if(kids.length&&!c.allowChildren)errors.push('Chỗ nghỉ không nhận trẻ em.');
 if(bedSet.size>beds)errors.push('Tối đa '+beds+' giường phụ.');
 if([...bedSet].some(id=>!guests.some(g=>g.id===id)))errors.push('Giường phụ phải gắn với khách trong phòng.');
 if(guests.length-bedSet.size>existing)errors.push('Giường có sẵn chỉ đáp ứng '+existing+' khách; cần thêm giường hoặc chuyển khách.');
 if(days<1)errors.push('Ngày trả phòng phải sau ngày nhận phòng.');
 // Included slots go to existing-bed guests first. A bundled extra bed must not
 // make an arbitrary guest ID consume an included slot and bill another guest.
 const rated=guests.filter(g=>g.adult||g.age>=c.adultFrom).sort((a,b)=>Number(bedSet.has(a.id))-Number(bedSet.has(b.id)));const extra=new Set(rated.slice(r.base).map(g=>g.id));
 const lines=[{label:'Giá phòng · '+days+' đêm',amount:r.price*days,type:'base'}];
 for(const g of guests){let fee=0,description='';if(extra.has(g.id)){fee=c.adultFee;description=(g.adult?'Người lớn thêm':g.label+' · tính giá người lớn')+' · dùng giường có sẵn';}else if(!g.adult&&g.age<c.adultFrom){fee=g.age<c.childFreeBelow?0:c.childFee;description=g.label+' · dùng giường có sẵn';}
 if(bedSet.has(g.id)){if(!c.bedIncludesGuest&&fee>0)lines.push({label:g.label+' · phụ thu lưu trú',amount:fee*days,type:'guest',guest:g.id});lines.push({label:g.label+' · 1 giường phụ'+(c.bedIncludesGuest?' (đã gồm phụ thu người sử dụng)':''),amount:r.bedPrice*days,type:'bed',guest:g.id});}
 else if(description)lines.push({label:description,amount:fee*days,type:'guest',guest:g.id});}
 const required=Math.max(0,guests.length-existing);return {valid:errors.length===0,errors,lines,total:lines.reduce((s,l)=>s+l.amount,0),requiredBeds:required,pending:bedSet.size>0&&c.confirmation==='request',blocked:required>0&&c.confirmation==='request'};
}
export function suggestedBeds(r,guests,c){
 const rated=guests.filter(g=>g.adult||g.age>=c.adultFrom),extras=rated.slice(r.base),required=Math.max(0,guests.length-r.base-r.noBed),limit=roomBeds(r,c);
 const wanted=Math.max(required,c.preferBed?extras.length:0),ordered=[...extras,...guests.filter(g=>!extras.includes(g))];return ordered.slice(0,Math.min(limit,wanted)).map(g=>g.id);
}
export function allocate(rooms,search,c){
 const guests=guestList(search),slots=rooms.map(()=>[]);let found=null,steps=0;
 function walk(pos){if(found||steps++>150000)return;if(pos===guests.length){const rows=rooms.map((r,i)=>{const bedIds=suggestedBeds(r,slots[i],c);return {roomId:r.id,guestIds:slots[i].map(g=>g.id),bedIds,quote:priceRoom(r,slots[i],bedIds,c,search)};});if(rows.every(x=>x.quote.valid&&!x.quote.blocked))found=rows;return;}
 const g=guests[pos];for(let i=0;i<rooms.length;i++){const r=rooms[i],group=slots[i];if(group.length>=r.max||group.length>=r.base+r.noBed+roomBeds(r,c))continue;if(g.adult&&group.filter(x=>x.adult).length>=r.adults)continue;if(!g.adult&&(!c.allowChildren||group.filter(x=>!x.adult).length>=r.children))continue;
 // Reserve one actual adult in every room; fill from the last room to prefer 3+2.
 if(g.adult&&pos<rooms.length&&i!==pos)continue;
 group.push(g);walk(pos+1);group.pop();if(found)return;}
 }
 if(search.adults<rooms.length||nights(search)<1)return null;walk(0);return found;
}
export function recommendations(search,c,quantities){
 if(search.rooms<1||search.rooms>6||search.adults<1||search.adults>24||search.children.length>8||search.children.some(a=>a<0||a>17)||nights(search)<1)return [];
 const results=[];function build(i,list,counts){if(i===c.rooms.length){if(list.length!==search.rooms)return;const allocation=allocate(list,search,c);if(allocation)results.push({rooms:list.map(r=>r.id),counts,allocation,total:allocation.reduce((s,a)=>s+a.quote.total,0)});return;}
 const r=c.rooms[i],max=Math.min(r.inventory,search.rooms-list.length);for(let n=0;n<=max;n++){if(quantities&&n!==(quantities[r.id]||0))continue;build(i+1,[...list,...Array(n).fill(r)],{...counts,[r.id]:n});}}
 build(0,[],{});return results.sort((a,b)=>a.total-b.total||new Set(b.rooms).size-new Set(a.rooms).size);
}
export function validateBooking(rows,search,c){const all=guestList(search),seen=rows.flatMap(r=>r.guestIds),errors=[];if(rows.length!==search.rooms)errors.push('Cần chọn đúng '+search.rooms+' phòng.');if(all.some(g=>seen.filter(id=>id===g.id).length!==1)||seen.some(id=>!all.some(g=>g.id===id)))errors.push('Mỗi khách cần được xếp đúng 1 phòng.');const counts={};const quotes=rows.map(row=>{const r=c.rooms.find(r=>r.id===row.roomId);if(!r){errors.push('Loại phòng không hợp lệ.');return {valid:false,total:0,lines:[],errors:['Loại phòng không hợp lệ.']};}counts[r.id]=(counts[r.id]||0)+1;return priceRoom(r,all.filter(g=>row.guestIds.includes(g.id)),row.bedIds,c,search);});for(const [id,n]of Object.entries(counts))if(n>c.rooms.find(r=>r.id===id).inventory)errors.push('Không đủ inventory cho '+c.rooms.find(r=>r.id===id).name+'.');quotes.forEach((q,i)=>{errors.push(...q.errors.map(e=>'Phòng '+(i+1)+': '+e));if(q.blocked)errors.push('Phòng '+(i+1)+': giường phụ bắt buộc chưa được bảo đảm.');});return {valid:!errors.length,errors,quotes,total:quotes.reduce((s,q)=>s+q.total,0)};}
