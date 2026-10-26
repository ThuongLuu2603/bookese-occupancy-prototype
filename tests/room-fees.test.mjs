import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,normalizeConfig,configErrors,priceRoom,guestList,suggestedBeds,validateBooking} from '../dist/engine.js';
import {quoteAutomatic,automaticSummary,bookingFees} from '../dist/automatic.js';
import {typeServices,transferTypeService} from '../dist/placements.js';
import {checkoutContent} from '../dist/checkout.js';
const stay={in:'2026-11-10',out:'2026-11-13',adults:2,children:[9],rooms:1};
test('room-specific child and adult fees reach both modes and checkout across nights',()=>{
 const c=initialConfig();c.rooms[1].childFee=180000;c.rooms[1].adultFee=240000;c.extraEnabled=false;
 for(const [age,fee] of [[5,0],[9,180000],[12,240000]]){
  const s={...stay,children:[age]},q=quoteAutomatic({b:1},s,c);
  assert(q.valid);assert.equal(q.total,(800000+fee)*3);
  assert.equal(validateBooking(q.allocation,q.search,c).total,q.total);
  for(const automatic of [false,true])assert(checkoutContent({allocation:q.allocation,search:q.search,config:c,contact:{},v:q,automatic}).includes(new Intl.NumberFormat('vi-VN').format(q.total)+'đ'));
 }
 assert.equal(quoteAutomatic({a:1},stay,c).total,2400000);
});
test('one bed price applies everywhere; per-room enable, limits and separate guest fees still apply',()=>{
 const c=initialConfig();c.bedPrice=275000;c.rooms[1].adultFee=240000;
 const s={...stay,adults:3,children:[]},g=guestList(s);
 for(const r of c.rooms.filter(r=>r.adults>=3)){
  const q=priceRoom(r,g,suggestedBeds(r,g,c),c,s);
  assert(q.valid);if(r.base===2)assert.equal(q.lines.find(l=>l.type==='bed').amount,825000);
 }
 c.bedIncludesGuest=false;assert.equal(quoteAutomatic({b:1},s,c).total,(800000+275000+240000)*3);
 c.rooms[1].bedEnabled=false;assert.equal(quoteAutomatic({b:1},s,c).total,(800000+240000)*3);
 c.rooms[1].beds=0;c.rooms[1].bedEnabled=true;assert.equal(quoteAutomatic({b:1},s,c).total,(800000+240000)*3);
});
test('child fee transfer reprices the destination while the exchanged bed keeps its shared price',()=>{
 const c=initialConfig();Object.assign(c.rooms[1],{childFee:180000,max:3,adults:3,children:1});
 const s={...stay,adults:5,rooms:2},q=quoteAutomatic({a:1,b:1},s,c);
 assert.equal(q.total,5400000);
 const service=typeServices(q.allocation,q.search,c,'a').find(x=>x.kind==='child');
 const moved=transferTypeService(q.allocation,q.search,c,'a','b',service.key);
 assert(moved.valid);assert.equal(moved.total,5640000);assert.equal(moved.delta,240000);
 assert.equal(typeServices(moved.rows,q.search,c,'a').find(x=>x.kind==='bed').unit,200000);
 assert.equal(typeServices(moved.rows,q.search,c,'b').find(x=>x.kind==='child').unit,180000);
});
test('PA2 keeps different room child rates as separate anonymous fee lines',()=>{
 const c=initialConfig();c.rooms[1].childFee=180000;c.rooms[1].children=1;
 const s={...stay,adults:4,children:[9,9],rooms:2},q=quoteAutomatic({a:1,b:1},s,c);
 assert(q.valid);assert.equal(q.total,5340000);
 const fees=bookingFees(automaticSummary(q.allocation,q.search,c));
 assert.deepEqual(fees.map(f=>[f.unit,f.count,f.amount]),[[100000,1,300000],[180000,1,540000]]);
 assert(fees.every(f=>!('roomId' in f)));
});
test('legacy settings preserve fees, age and room toggles; differing old beds are surfaced for review',()=>{
 const old={...initialConfig(),version:3,adultFrom:13,childFee:120000,adultFee:175000};
 old.rooms.forEach((r,i)=>{delete r.childFee;delete r.adultFee;r.bedPrice=i===1?300000:225000;});old.rooms[1].bedEnabled=false;
 const snapshot=structuredClone(old),c=normalizeConfig(old);
 assert.deepEqual(old,snapshot);assert.equal(c.version,4);assert.equal(c.adultFrom,13);assert.equal(c.bedPrice,225000);
 assert(c.rooms.every(r=>r.childFee===120000&&r.adultFee===175000&&!('bedPrice' in r)));
 assert.equal(c.rooms[1].bedEnabled,false);assert.equal(c.legacyBedPrices.length,4);
 assert.deepEqual(normalizeConfig(c),c);assert.deepEqual(configErrors(c),[]);
 c.rooms[1].childFee=0;c.rooms[1].adultFee=0;c.bedPrice=0;assert.deepEqual(configErrors(c),[]);
 c.rooms[1].childFee=-1;assert(configErrors(c).length);c.rooms[1].childFee=0;c.bedPrice=NaN;assert(configErrors(c).length);
});
