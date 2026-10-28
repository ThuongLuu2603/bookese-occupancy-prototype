import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,recommendations,validateBooking} from '../dist/engine.js';
import {automaticRecommendations,quoteAutomatic,automaticSummary,aggregateRoomsHTML,bookingFees,bookingFeeLabel,automaticTable} from '../dist/automatic.js';
import {checkoutContent} from '../dist/checkout.js';
const stay={in:'2026-11-10',out:'2026-11-11',adults:5,children:[],rooms:2,market:'Đà Nẵng'};
function example(){const c=initialConfig();c.rooms=c.rooms.slice(0,2);Object.assign(c.rooms[0],{base:2,max:4,adults:4,children:2});Object.assign(c.rooms[1],{base:3,max:5,adults:5,children:2});return c;}
test('A×1 is explicitly incomplete; A×2 recalculates to only one extra bed',()=>{
 const c=example(),one=quoteAutomatic({a:1},stay,c),two=quoteAutomatic({a:2},stay,c);
 assert.equal(one.valid,false);assert.equal(one.covered,4);assert.equal(one.missing,1);assert.equal(one.total,1050000);
 assert.equal(two.valid,true);assert.equal(two.total,1600000);
 const fees=automaticSummary(two.allocation,two.search,c)[0].fees;
 assert.equal(fees.length,1);assert.equal(fees[0].category,'bed');assert.equal(fees[0].count,1);assert.equal(fees[0].amount,200000);
});
test('B×1 fits five guests and is recommended ahead of more expensive A×2',()=>{
 const c=example(),best=automaticRecommendations(stay,c)[0];
 assert.deepEqual(best.rooms,['b']);assert.equal(best.total,1150000);
 const q=quoteAutomatic({b:1},stay,c);assert(q.valid);assert.equal(q.search.rooms,1);
 const g=automaticSummary(q.allocation,q.search,c)[0];assert.equal(g.fees.find(f=>f.category==='adult').amount,150000);assert.equal(g.fees.find(f=>f.category==='bed').amount,200000);
 assert(recommendations(stay,c).every(r=>r.rooms.length===2),'original manual recommendations still require two rooms');
});
test('mixed room types choose the cheaper legal surcharge without customer allocation',()=>{
 const c=initialConfig();c.extraEnabled=false;c.rooms[0].adultFee=500000;c.rooms[1].adultFee=100000;
 const q=quoteAutomatic({a:1,b:1},stay,c);assert(q.valid);assert.equal(q.total,1600000);
 const groups=automaticSummary(q.allocation,q.search,c);assert.equal(groups[0].fees.length,0);assert.equal(groups[1].fees[0].amount,100000);
 assert.equal(groups.reduce((n,g)=>n+g.total,0),q.total);
 const html=aggregateRoomsHTML(groups,1);assert(!html.includes('Người lớn 5'));assert(!html.includes('Phòng 1'));
});
test('younger children use existing beds even when their surcharge exceeds the adult fee',()=>{
 const c=initialConfig();c.childFee=500000;const s={...stay,adults:3,children:[8],rooms:1};
 const q=quoteAutomatic({b:1},s,c);assert(q.valid);assert.equal(q.total,1500000);
 assert.equal(q.allocation[0].bedIds.length,1);assert(!q.allocation[0].bedIds.includes('c0'));
 assert.equal(q.quotes[0].lines.filter(l=>l.type==='guest'&&l.amount>0).length,1);assert.equal(q.quotes[0].lines.find(l=>l.type==='guest'&&l.amount>0).amount,500000);
});
test('free children and child limits still constrain each individual room',()=>{
 const c=example();c.rooms.forEach(r=>r.children=1);const s={...stay,adults:2,children:[2,3,4]};
 const q=quoteAutomatic({a:1,b:1},s,c);assert.equal(q.valid,true);assert.equal(q.missing,0);
 c.allowChildren=false;assert.equal(quoteAutomatic({a:1}, {...stay,adults:2,children:[12]},c).valid,false);
});
test('inventory, minimum adults, nights and plan prices are checked',()=>{
 const c=example();assert(!quoteAutomatic({b:2},stay,c).valid);assert(!quoteAutomatic({a:6},stay,c).valid);
 const q=quoteAutomatic({a:2},{...stay,out:'2026-11-13'},c,'flex');assert(q.valid);assert.equal(q.total,5700000);
 assert.equal(automaticSummary(q.allocation,q.search,c)[0].fees[0].count,1);
 assert(!quoteAutomatic({a:1},{...stay,out:stay.in},c).valid);
});
test('automatic checkout confirms room types and services, never numbered-room guest assignments',()=>{
 const c=example(),q=quoteAutomatic({b:1},stay,c),html=checkoutContent({allocation:q.allocation,search:q.search,config:c,contact:{},v:q,automatic:true});
 assert(html.includes('alo ha × 1'));assert(html.includes('Phụ thu giá người lớn'));assert(html.includes('Giường phụ'));
 assert(!html.includes('Phòng 1'));assert(!html.includes('Người lớn 1'));assert(!html.includes('Người lớn 5'));
 assert(html.includes('1.150.000đ'));assert(html.includes('5 người lớn · 0 trẻ em · 1 phòng'));
});
test('automatic recommendations cover every guest and all selected types remain valid',()=>{
 const c=initialConfig(),s={...stay,adults:3,children:[5,8,12]};
 for(const rec of automaticRecommendations(s,c))assert(validateBooking(rec.allocation,{...s,rooms:rec.rooms.length},c).valid);
});


test('five adults plus a child in three standard-double rooms have no surcharge',()=>{
 const c=initialConfig(),s={...stay,children:[8]},q=quoteAutomatic({a:3},s,c);
 assert(q.valid);assert.equal(q.search.rooms,3);assert.equal(q.total,2100000);
 assert(q.allocation.every(r=>r.guestIds.length===2&&r.bedIds.length===0));
 assert.equal(automaticSummary(q.allocation,q.search,c)[0].fees.length,0);
 const html=checkoutContent({allocation:q.allocation,search:q.search,config:c,contact:{},v:q,automatic:true});
 assert(html.includes('2.100.000đ'));assert(html.includes('Không phát sinh phụ thu'));
 const manual=validateBooking(q.allocation,{...s,rooms:3},c);
 assert.equal(manual.total,2100000,'both modes include children in standard occupancy');
 const two=quoteAutomatic({a:2},s,c);assert(two.valid);assert.equal(two.total,1700000);
 assert.equal(automaticSummary(two.allocation,two.search,c)[0].fees[0].count,1);assert.equal(automaticSummary(two.allocation,two.search,c)[0].fees.find(f=>f.category==='child').amount,100000);
});

test('child fees only apply outside room-standard occupancy, including without extra beds',()=>{
 const c=initialConfig();c.extraEnabled=false;
 for(const age of [0,8,12,17])assert.equal(quoteAutomatic({a:1},{...stay,adults:1,children:[age]},c).total,700000);
 const extra=quoteAutomatic({a:1},{...stay,adults:2,children:[8]},c);
 assert(extra.valid);assert.equal(extra.total,800000);
 assert.equal(automaticSummary(extra.allocation,extra.search,c)[0].fees[0].category,'child');
});

test('unused standard slots accept children without consuming extra-child allowance',()=>{
 const c=initialConfig();c.rooms[0].children=0;
 const q=quoteAutomatic({a:1,b:1},{...stay,adults:2,children:[8,9]},c);
 assert(q.valid);assert.equal(q.total,1500000);
 assert(automaticSummary(q.allocation,q.search,c).every(g=>g.fees.length===0));
});


test('two double rooms: adult extra bed plus age-priced child sharing, consistent through checkout',()=>{
 const c=initialConfig();
 for(const [age,total,bedCount,childAmount] of [[5,1600000,1,0],[8,1700000,1,100000],[12,1800000,2,null]]){
  const s={...stay,children:[age]},q=quoteAutomatic({a:2},s,c),g=automaticSummary(q.allocation,q.search,c)[0];
  assert(q.valid);assert.equal(q.total,total);assert.equal(g.fees.find(f=>f.category==='bed').count,bedCount);
  assert.equal(g.fees.find(f=>f.category==='child')?.amount??null,childAmount);
  assert.equal(validateBooking(q.allocation,q.search,c).total,total);
  const rec=automaticRecommendations(s,c).find(r=>r.ratePlanId==='standard'&&r.rooms.length===2&&r.rooms.every(id=>id==='a'));
  assert.equal(rec.total,total);
  if(age===8){const html=checkoutContent({allocation:q.allocation,search:q.search,config:c,contact:{},v:q,automatic:true});assert(html.includes('1.700.000đ'));assert(html.includes('Phụ thu trẻ em (100.000đ) × 1'));}
 }
 c.bedIncludesGuest=false;assert.equal(quoteAutomatic({a:2},{...stay,children:[8]},c).total,1700000);
 c.extraEnabled=false;assert.equal(quoteAutomatic({a:2},{...stay,children:[8]},c).total,1650000);
});

test('sharing children still respect individual total and child capacity limits',()=>{
 const c=initialConfig();
 assert(!quoteAutomatic({a:1},{...stay,adults:3,children:[8]},c).valid);
 assert(quoteAutomatic({a:1},{...stay,adults:1,children:[8,9]},c).valid);
 const manual=recommendations({...stay,children:[8]},c).find(r=>r.ratePlanId==='standard'&&r.rooms.every(id=>id==='a'));
 assert.equal(manual.total,1700000,'both modes share the same child-sharing rule');
});


test('PA2 mixed booking exposes only booking-wide fees in table, checkout and confirmation',()=>{
 const c=initialConfig(),s={...stay,children:[8]},q=quoteAutomatic({a:1,b:1},s,c);
 assert(q.valid);assert.equal(q.total,1800000);
 const groups=automaticSummary(q.allocation,q.search,c),fees=bookingFees(groups);
 assert.deepEqual(fees.map(f=>[f.category,f.unit,f.count]),[['child',100000,1],['bed',200000,1]]);
 const table=automaticTable({config:c,search:s,selected:{a:1,b:1},selectedPlan:'standard',quote:q,recs:[]});
 const checkout=checkoutContent({allocation:q.allocation,search:q.search,config:c,contact:{},v:q,automatic:true});
 const confirmation=aggregateRoomsHTML(groups,1);
 for(const html of [table,checkout,confirmation]){
  assert(html.includes('Awaken Da Nang Hotel × 1'));assert(html.includes('alo ha × 1'));
  if(html===table){assert(html.includes('Phụ thu trẻ em × 1'));assert(html.includes('Giường phụ × 1'));assert(html.includes('Phụ thu đã bao gồm trong toàn đơn'));}else{assert(html.includes('Phụ thu trẻ em (100.000đ) × 1'));assert(html.includes('Giường phụ (200.000đ) × 1'));}
  assert(!html.includes('auto-type-fees'));assert(!html.includes('Tổng loại phòng'));
  if(html!==table)assert(!html.includes('1.000.000đ'),'confirmation keeps aggregate-only surcharges');
 }
 const roomSections=[...confirmation.matchAll(/<div class="booking-room auto-confirm-type">(.*?)<\/p><\/div>/g)];
 assert.equal(roomSections.length,2);
 assert(roomSections.every(m=>!m[1].includes('Giường phụ')&&!m[1].includes('Phụ thu trẻ em')));
 assert(!checkout.includes('alo ha · Giường phụ'));assert(!checkout.includes('Phòng 1'));
 const manual=checkoutContent({allocation:q.allocation,search:q.search,config:c,contact:{},v:q,automatic:false});
 assert(manual.includes('Phòng 1'));assert(manual.includes('1.000.000đ'),'PA1 retains room-specific pricing');
});

test('booking fees combine shared bed prices across types and multiply nights once',()=>{
 const c=initialConfig(),s={...stay,adults:6,out:'2026-11-13'};c.rooms[1].adults=3;
 const q=quoteAutomatic({a:1,b:1},s,c);
 assert(q.valid);
 const groups=automaticSummary(q.allocation,q.search,c),fees=bookingFees(groups);
 assert.equal(fees.length,1);assert.equal(fees[0].count,2);assert.equal(fees[0].amount,1200000);
 assert.equal(bookingFeeLabel(fees[0],3),'Giường phụ (200.000đ/đêm) × 2 × 3 đêm');
 assert.equal(groups.reduce((n,g)=>n+g.base,0)+fees.reduce((n,f)=>n+f.amount,0),q.total);
 c.bedPrice=250000;
 const changed=quoteAutomatic({a:1,b:1},s,c),split=bookingFees(automaticSummary(changed.allocation,changed.search,c));
 assert.deepEqual(split.map(f=>[f.unit,f.count,f.amount]),[[250000,2,1500000]]);
 assert(split.every(f=>!('roomId' in f)&&!('room' in f)&&!('guest' in f)));
});

