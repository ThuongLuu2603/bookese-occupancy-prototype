import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,guestList,occupancyCounts,priceRoom,suggestedBeds,allocate,recommendations,validateBooking} from '../dist/engine.js';
import {quoteAutomatic} from '../dist/automatic.js';
import {quoteManual} from '../dist/manual.js';
import {transferService} from '../dist/placements.js';
import {capacityHTML} from '../dist/capacity.js';
const stay=(adults,children,rooms=1)=>({in:'2026-11-10',out:'2026-11-11',adults,children,rooms});
const quote=(r,s,c)=>priceRoom(r,guestList(s),suggestedBeds(r,guestList(s),c),c,s);

test('one accompanying adult and two 13-year-olds fit Awaken as three adults at 900k in both modes',()=>{
 const c=initialConfig(),s=stay(1,[13,13]),guests=guestList(s);
 assert.deepEqual(occupancyCounts(guests,c),{adults:3,children:0});
 assert.equal(quote(c.rooms[0],s,c).valid,true);assert.equal(quote(c.rooms[0],s,c).total,900000);
 for(const fn of [quoteAutomatic,quoteManual]){const q=fn({a:1},s,c);assert(q.valid);assert.equal(q.total,900000);assert.equal(q.allocation[0].bedIds.length,1);assert(validateBooking(q.allocation,q.search,c).valid);}
 assert.deepEqual(guests.filter(g=>!g.adult).map(g=>g.age),[13,13]);
 assert(recommendations(s,c).some(r=>r.counts.a===1));
});
test('zero child allowance permits adult-priced children while younger children remain blocked',()=>{
 const c=initialConfig(),r=c.rooms[0];r.children=0;
 assert(quote(r,stay(1,[13,13]),c).valid);assert(allocate([r],stay(1,[13,13]),c));
 assert(!quote(r,stay(1,[11]),c).valid);assert.equal(allocate([r],stay(1,[11]),c),null);
});
test('adult-priced children cannot bypass the adult maximum even with spare child capacity',()=>{
 const c=initialConfig(),r=c.rooms[1],s=stay(3,[13,13]);
 assert(!quote(r,s,c).valid);assert.equal(allocate([r],s,c),null);
 assert(quoteAutomatic({b:1},s,c).missing>=1);
});
test('mixed younger and older children consume disjoint capacity groups',()=>{
 const c=initialConfig(),r=c.rooms[1],s=stay(2,[13,9]);r.adults=3;r.children=1;
 assert.deepEqual(occupancyCounts(guestList(s),c),{adults:3,children:1});assert(quote(r,s,c).valid);
 assert.equal(quote(r,s,c).total,1100000);assert(allocate([r],s,c));
 r.children=0;assert(!quote(r,s,c).valid);
});
test('capacity reclassifies exactly at the configured age boundary',()=>{
 const c=initialConfig();c.adultFrom=13;
 for(const age of [12,12.99,12.999])assert.deepEqual(occupancyCounts(guestList(stay(1,[age])),c),{adults:1,children:1});
 for(const age of [13,17])assert.deepEqual(occupancyCounts(guestList(stay(1,[age])),c),{adults:2,children:0});
 const r=c.rooms[0];r.children=0;assert(!quote(r,stay(1,[12]),c).valid);assert(quote(r,stay(1,[13]),c).valid);
});
test('partial quote counts older children against adult capacity without using child slots',()=>{
 const c=initialConfig(),r=c.rooms[0];r.children=0;
 const q=quoteAutomatic({a:1},stay(1,[13,13,13]),c);
 assert(!q.valid);assert.equal(q.covered,3);assert.equal(q.missing,1);assert.equal(q.total,900000);
 assert.equal(q.allocation[0].bedIds.length,1);
});
test('each room keeps a real accompanying adult despite older children counting towards adult capacity',()=>{
 const c=initialConfig(),s=stay(1,[13,13],2);
 assert.equal(allocate([c.rooms[0],c.rooms[0]],s,c),null);assert(!quoteAutomatic({a:2},s,c).valid);
 const g=guestList(stay(1,[13,13])).filter(g=>!g.adult);
 assert(!priceRoom(c.rooms[0],g,[],c,stay(1,[13,13])).valid);
});
test('property-level no-under-18 policy still applies to actual ages',()=>{
 const c=initialConfig();c.allowChildren=false;
 assert(!quote(c.rooms[0],stay(1,[13,13]),c).valid);assert.equal(allocate([c.rooms[0]],stay(1,[13,13]),c),null);
});
test('transfer accepts an adult-priced child at a destination with zero child allowance',()=>{
 const c=initialConfig(),s=stay(3,[13,13],2);c.rooms[0].children=0;
 const rows=[{roomId:'a',ratePlanId:'standard',guestIds:['a0','a1'],bedIds:[]},{roomId:'b',ratePlanId:'standard',guestIds:['a2','c0','c1'],bedIds:['c1']}];
 assert(validateBooking(rows,s,c).valid);
 const moved=transferService(rows,s,c,1,0,'c1','bed');assert(moved.valid);assert.equal(moved.delta,0);
 assert(moved.rows[0].bedIds.includes('c1'));assert(validateBooking(moved.rows,s,c).valid);
});
test('transfer cannot bypass the destination adult allowance with an older child',()=>{
 const c=initialConfig(),s=stay(3,[13,13],2);c.rooms[0].adults=2;
 const rows=[{roomId:'a',ratePlanId:'standard',guestIds:['a0','a1'],bedIds:[]},{roomId:'b',ratePlanId:'standard',guestIds:['a2','c0','c1'],bedIds:['c1']}];
 assert(validateBooking(rows,s,c).valid);assert(!transferService(rows,s,c,1,0,'c1','bed').valid);
});
test('manual and automatic retain age-based prices across plans, nights and bed settings',()=>{
 for(const plan of ['standard','flex'])for(const beds of [true,false]){
  const c=initialConfig();c.extraEnabled=beds;c.rooms[0].children=0;
  const s={...stay(1,[13,13]),out:'2026-11-13'},auto=quoteAutomatic({a:1},s,c,plan),manual=quoteManual({a:1},s,c,plan);
  assert(auto.valid&&manual.valid);assert.equal(auto.total,manual.total);assert.equal(auto.total,((plan==='standard'?700000:850000)+(beds?200000:150000))*3);
 }
});
test('capacity tooltip explains age-dependent limits while retaining standard occupancy icon',()=>{
 const c=initialConfig(),r=c.rooms[0];r.children=0;
 const html=capacityHTML(r,c);assert.match(html,/×2/);assert.match(html,/gồm trẻ từ 12 tuổi/);assert.match(html,/Không nhận trẻ dưới 12 tuổi/);
});
