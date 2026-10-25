import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,allocate,guestList,suggestedBeds,validateBooking} from '../dist/engine.js';
import {quoteAutomatic} from '../dist/automatic.js';
import {checkoutContent} from '../dist/checkout.js';
const stay={in:'2026-11-10',out:'2026-11-11',adults:5,children:[8],rooms:2};

test('manual and automatic allocation share pricing for ages, plans, nights, beds and mixed rooms',()=>{
 for(const age of [3,8,12,17])for(const count of [2,3])for(const plan of ['standard','flex'])for(const enabled of [true,false]){
  const c=initialConfig();c.extraEnabled=enabled;
  const s={...stay,children:[age],rooms:count,out:'2026-11-13'},rooms=Array(count).fill(c.rooms[0]);
  const rows=allocate(rooms,s,c,plan),manual=validateBooking(rows,s,c),auto=quoteAutomatic({a:count},s,c,plan);
  assert(manual.valid&&auto.valid);assert.equal(manual.total,auto.total);assert.deepEqual(manual.quotes,auto.quotes);
 }
 const c=initialConfig(),q=quoteAutomatic({a:1,b:1},stay,c);
 assert.equal(validateBooking(allocate([c.rooms[0],c.rooms[1]],stay,c),stay,c).total,q.total);
});

test('manual move recomputes beds and child fees, rejects overcrowding, checkout stays consistent',()=>{
 const c=initialConfig(),s={...stay,rooms:3},all=guestList(s),rows=allocate(Array(3).fill(c.rooms[0]),s,c);
 let v=validateBooking(rows,s,c);assert(v.valid);assert.equal(v.total,2100000);
 const childRoom=rows.find(r=>r.guestIds.includes('c0')),target=rows.find(r=>r!==childRoom);
 childRoom.guestIds=childRoom.guestIds.filter(id=>id!=='c0');target.guestIds.push('c0');
 rows.forEach(r=>r.bedIds=suggestedBeds(c.rooms[0],all.filter(g=>r.guestIds.includes(g.id)),c));
 v=validateBooking(rows,s,c);assert(v.valid);assert.equal(v.total,2200000);assert(rows.every(r=>r.bedIds.length===0));
 const html=checkoutContent({allocation:rows,search:s,config:c,contact:{},v,automatic:false});
 assert(html.includes('2.200.000đ'));assert(html.includes('Phòng 1'));assert(html.includes('Trẻ 1'));
 target.bedIds=['c0'];assert(!validateBooking(rows,s,c).valid);target.bedIds=[];
 const other=rows.find(r=>r!==childRoom&&r!==target),adult=other.guestIds.shift();target.guestIds.push(adult);
 assert(!validateBooking(rows,s,c).valid);
});
