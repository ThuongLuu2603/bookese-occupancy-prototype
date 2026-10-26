import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,validateBooking} from '../dist/engine.js';
import {quoteAutomatic} from '../dist/automatic.js';
import {quoteManual} from '../dist/manual.js';
import {typeServices,transferTypeService} from '../dist/placements.js';
const s={in:'2026-11-10',out:'2026-11-11',adults:5,children:[],rooms:2};
const previous=q=>({rows:q.allocation,stay:q.search});
const count=(q,c,id,kind)=>typeServices(q.allocation,q.search,c,id).filter(x=>x.kind===kind).reduce((n,x)=>n+x.count,0);

test('adding alo ha keeps the previously displayed Awaken bed at the cheapest total',()=>{
 const c=initialConfig(),first=quoteManual({a:1},s,c),copy=structuredClone(first);
 assert.equal(first.valid,false);assert.equal(first.covered,3);assert.equal(count(first,c,'a','bed'),1);
 const next=quoteManual({a:1,b:1},s,c,'standard',previous(first));
 assert(next.valid);assert.equal(next.total,1700000);assert.equal(count(next,c,'a','bed'),1);assert.equal(count(next,c,'b','bed'),0);
 assert.equal(next.allocation.find(r=>r.roomId==='b').guestIds.length,2);assert.deepEqual(first,copy);
});

test('reverse selection retains alo ha bed but removes an adult fee that is no longer needed',()=>{
 const c=initialConfig(),first=quoteManual({b:1},s,c);
 assert.equal(count(first,c,'b','adult'),1);
 const next=quoteManual({a:1,b:1},s,c,'standard',previous(first));
 assert(next.valid);assert.equal(next.total,1700000);assert.equal(count(next,c,'b','bed'),1);assert.equal(count(next,c,'b','adult'),0);
});

test('additional standard capacity removes unnecessary beds and child fees',()=>{
 const c=initialConfig(),stay={...s,children:[9]},first=quoteManual({a:2},stay,c);
 assert.equal(first.total,1700000);
 const next=quoteManual({a:3},stay,c,'standard',previous(first));
 assert(next.valid);assert.equal(next.total,2100000);assert.equal(typeServices(next.allocation,next.search,c,'a').length,0);
});

test('explicit bed and child placements survive an equally priced recalculation',()=>{
 const c=initialConfig(),stay={...s,children:[9]},first=quoteManual({a:1,b:1},stay,c);
 const bed=typeServices(first.allocation,first.search,c,'b').find(x=>x.kind==='bed');
 const moved=transferTypeService(first.allocation,first.search,c,'b','a',bed.key);
 assert(moved.valid);
 const next=quoteManual({a:1,b:1},stay,c,'standard',{rows:moved.rows,stay:first.search});
 assert(next.valid);assert.equal(next.total,1800000);assert.equal(count(next,c,'a','bed'),1);assert.equal(count(next,c,'b','child'),1);
});

test('partial recalculation keeps its incomplete status and never permits full-party checkout',()=>{
 const c=initialConfig(),stay={...s,adults:13,rooms:3},first=quoteManual({a:1},stay,c);
 const next=quoteManual({a:3},stay,c,'standard',previous(first));
 assert.equal(next.valid,false);assert.equal(next.covered,9);assert.equal(next.missing,4);assert.equal(next.total,2700000);assert.equal(count(next,c,'a','bed'),3);
 assert.equal(validateBooking(next.allocation,stay,c).valid,false);
});

test('price reduction takes precedence over keeping an adult surcharge on the old type',()=>{
 const c=initialConfig();c.extraEnabled=false;c.rooms[0].adultFee=300000;c.rooms[1].adultFee=100000;
 const first=quoteManual({a:1},s,c),next=quoteManual({a:1,b:1},s,c,'standard',previous(first));
 assert(next.valid);assert.equal(next.total,1600000);assert.equal(count(next,c,'a','adult'),0);assert.equal(count(next,c,'b','adult'),1);
});

test('removed or no-longer-eligible types cannot retain an extra bed',()=>{
 const c=initialConfig(),first=quoteManual({a:1},s,c);c.rooms[0].bedEnabled=false;
 const next=quoteManual({a:1,b:1},s,c,'standard',previous(first));
 assert(next.valid);assert.equal(count(next,c,'a','bed'),0);assert(validateBooking(next.allocation,next.search,c).valid);
 const removed=quoteManual({d:1},s,c,'standard',previous(first));assert(removed.valid);assert.equal(count(removed,c,'d','bed'),1);
});

test('automatic allocation remains independent of manual placement history',()=>{
 const c=initialConfig(),q=quoteAutomatic({a:1,b:1},s,c);
 assert(q.valid);assert.equal(q.total,1700000);assert.equal(count(q,c,'b','bed'),1);
});
