import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,allocate,validateBooking,guestList,suggestedBeds} from '../dist/engine.js';
import {transferService,roomServices,typeServices,transferTypeService} from '../dist/placements.js';
const s={in:'2026-11-10',out:'2026-11-11',adults:5,children:[],rooms:2};
const pair=c=>allocate([c.rooms[0],c.rooms[1]],s,c);

test('move extra bed from alo ha to Awaken with its guest, without changing counts or mutating input',()=>{
 const c=initialConfig(),rows=pair(c),copy=structuredClone(rows),bed=roomServices(rows,s,c,1).find(x=>x.kind==='bed');
 assert(bed);const q=transferService(rows,s,c,1,0,bed.guestId,'bed');assert(q.valid);assert.equal(q.exchange,null);assert.equal(q.total,1700000);
 assert.equal(q.rows[0].bedIds.length,1);assert.equal(q.rows[0].guestIds.length,3);assert.equal(q.rows[1].bedIds.length,0);assert.equal(q.rows[1].guestIds.length,2);
 assert(q.rows[0].bedIds.includes(bed.guestId));assert.deepEqual(rows,copy);assert(validateBooking(q.rows,s,c).valid);
});

test('extra bed transfer prices the destination across nights and keeps rate plan',()=>{
 const c=initialConfig();c.rooms[0].bedPrice=400000;const stay={...s,out:'2026-11-13'},rows=allocate([c.rooms[0],c.rooms[1]],stay,c,'flex');
 const bed=roomServices(rows,stay,c,1)[0],q=transferService(rows,stay,c,1,0,bed.guestId,'bed');
 assert(q.valid);assert.equal(q.delta,600000);assert(q.rows.every(r=>r.ratePlanId==='flex'));assert.equal(q.total,6600000);
});

test('disabled extra beds and full bed allowance explain why transfer is unavailable',()=>{
 const c=initialConfig(),rows=pair(c);c.rooms[0].bedEnabled=false;const bed=roomServices(rows,s,c,1)[0];
 assert.match(transferService(rows,s,c,1,0,bed.guestId,'bed').reason,/không cung cấp/);
 const d=initialConfig(),stay={...s,adults:6},full=allocate([d.rooms[0],d.rooms[0]],stay,d),id=full[1].bedIds[0];
 assert.match(transferService(full,stay,d,1,0,id,'bed').reason,/tối đa/);
});

test('full room can receive extra bed by exchanging its child, with explicit swap preview',()=>{
 const c=initialConfig(),stay={...s,children:[8]},rows=allocate([c.rooms[0],c.rooms[1]],stay,c);
 // Lock the requested setup: Awaken 2 adults + child, alo ha 3 adults + bed.
 rows[0].guestIds=['a0','a1','c0'];rows[0].bedIds=[];rows[1].guestIds=['a2','a3','a4'];rows[1].bedIds=['a4'];
 const q=transferService(rows,stay,c,1,0,'a4','bed');assert(q.valid);assert.equal(q.exchange,'c0');assert.equal(q.total,1800000);
 assert(q.rows[0].bedIds.includes('a4'));assert(q.rows[1].guestIds.includes('c0'));assert(validateBooking(q.rows,stay,c).valid);
});

test('child surcharge moves with child, respects child limits and may disappear in a free standard slot',()=>{
 const c=initialConfig(),stay={...s,adults:3,children:[8]},rows=[{roomId:'a',ratePlanId:'standard',guestIds:['a0','a1','c0'],bedIds:[]},{roomId:'b',ratePlanId:'standard',guestIds:['a2'],bedIds:[]}];
 const q=transferService(rows,stay,c,0,1,'c0','child');assert(q.valid);assert.equal(q.delta,-100000);assert.equal(q.total,1500000);assert.equal(roomServices(q.rows,stay,c,1).length,0);
 c.rooms[1].children=0;assert.match(transferService(rows,stay,c,0,1,'c0','child').reason,/không nhận trẻ/);
});

test('failed swaps never leave an adultless room or bypass maximum occupancy',()=>{
 const c=initialConfig(),stay={...s,adults:4,children:[8]},rows=[{roomId:'a',ratePlanId:'standard',guestIds:['a0','a1','a2'],bedIds:['a2']},{roomId:'b',ratePlanId:'standard',guestIds:['a3','c0'],bedIds:[]}];
 c.rooms[1].adults=1;
 const q=transferService(rows,stay,c,0,1,'a2','bed');assert(!q.valid);assert.match(q.reason,/giới hạn/);
});


test('type services group beds and same-age child fees with nightly unit prices',()=>{
 const c=initialConfig(),stay={...s,adults:4,children:[9,9],rooms:2,out:'2026-11-13'};
 const rows=[{roomId:'a',ratePlanId:'standard',guestIds:['a0','a1','c0'],bedIds:[]},{roomId:'a',ratePlanId:'standard',guestIds:['a2','a3','c1'],bedIds:[]}];
 const groups=typeServices(rows,stay,c,'a');assert.equal(groups.length,1);assert.equal(groups[0].count,2);assert.equal(groups[0].unit,100000);assert.equal(groups[0].label,'Phụ thu trẻ 9 tuổi');
 const key=groups[0].key;
 assert(!transferTypeService(rows,stay,c,'a','a',key).valid);
 assert(!transferTypeService(rows,stay,c,'a','b',key).valid,'cannot transfer to an unselected type');
});

test('type transfer finds a room with space when another room of the target type is full',()=>{
 const c=initialConfig(),stay={...s,adults:8,rooms:3};
 const rows=[{roomId:'a',ratePlanId:'standard',guestIds:['a0','a1','a2'],bedIds:['a2']},{roomId:'a',ratePlanId:'standard',guestIds:['a3','a4'],bedIds:[]},{roomId:'b',ratePlanId:'standard',guestIds:['a5','a6','a7'],bedIds:['a7']}];
 const original=structuredClone(rows),service=typeServices(rows,stay,c,'b')[0],q=transferTypeService(rows,stay,c,'b','a',service.key);
 assert(q.valid);assert.equal(q.target,1);assert.equal(q.delta,0);assert.equal(q.total,2600000);assert(validateBooking(q.rows,stay,c).valid);
 assert.equal(typeServices(q.rows,stay,c,'a')[0].count,2);assert.equal(typeServices(q.rows,stay,c,'b').length,0);assert.deepEqual(rows,original);
 c.rooms[0].bedEnabled=false;assert(!transferTypeService(rows,stay,c,'b','a',service.key).valid);
});

test('type transfer moves one service from a grouped line and respects child capacity',()=>{
 const c=initialConfig(),stay={...s,adults:5,children:[9],rooms:2},rows=allocate([c.rooms[0],c.rooms[1]],stay,c);
 const bed=typeServices(rows,stay,c,'b').find(g=>g.kind==='bed'),q=transferTypeService(rows,stay,c,'b','a',bed.key);
 assert(q.valid);assert.equal(q.total,1800000);assert.equal(typeServices(q.rows,stay,c,'a')[0].kind,'bed');assert.equal(typeServices(q.rows,stay,c,'b')[0].kind,'child');
 assert(validateBooking(q.rows,stay,c).valid);
});
