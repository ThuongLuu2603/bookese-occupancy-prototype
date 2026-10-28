import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,allocate,validateBooking} from '../dist/engine.js';
import {quoteAutomatic} from '../dist/automatic.js';
import {roomPriceDetail,priceHTML} from '../dist/prices.js';
const search={in:'2026-11-10',out:'2026-11-13',adults:5,children:[9],rooms:2};

test('manual tooltip reconciles quantity, multiple nights, beds and child fees with checkout',()=>{
 const config=initialConfig(),room=config.rooms[0],rows=allocate([room,room],search,config),d=roomPriceDetail({room,config,rows,search,plan:'standard',quantity:2});
 assert.equal(d.unit,700000);assert.equal(d.base,4200000);assert.equal(d.surcharge,900000);assert.equal(d.total,validateBooking(rows,search,config).total);assert.equal(d.coins,102000);assert.equal(d.fees.length,2);
});
test('unselected alternative plan shows one room and never inherits fees from selected plan',()=>{
 const config=initialConfig(),room=config.rooms[0],rows=allocate([room,room],search,config),d=roomPriceDetail({room,config,rows,search,plan:'flex'});
 assert.equal(d.unit,850000);assert.equal(d.count,1);assert.equal(d.total,2550000);assert.equal(d.priced,false);assert.equal(d.fees.length,0);
});
test('PA2 tooltip does not expose internally allocated surcharges or guest structure',()=>{
 const config=initialConfig(),room=config.rooms[0],rows=allocate([room,room],search,config),options={room,config,rows,search,plan:'standard',quantity:2,automatic:true};
 const d=roomPriceDetail(options),html=priceHTML(options);
 assert.equal(d.total,5100000);assert.equal(d.nightlyTotal,1700000);assert.equal(d.fees.length,0);assert.equal(d.bookingFees.length,2);assert.match(html,/Phụ thu đã bao gồm trong toàn đơn/);assert.doesNotMatch(html,/Phụ thu trẻ 9 tuổi|Phòng 1:/);
});
test('incomplete selection prices only its assigned subset and labels fees as provisional',()=>{
 const config=initialConfig(),room=config.rooms[0],stay={...search,adults:13,children:[],rooms:3},q=quoteAutomatic({a:3},stay,config);
 const options={room,config,rows:q.allocation,search:stay,stay:q.search,plan:'standard',quantity:3,partial:true},d=roomPriceDetail(options);
 assert.equal(d.total,q.total);assert.equal(d.surcharge,1800000);assert.match(priceHTML(options),/chưa phải giá cho toàn bộ nhóm/);
});
test('legacy unbundled flag cannot add a second occupant charge to an extra bed',()=>{
 const config=initialConfig();config.bedIncludesGuest=false;
 const room=config.rooms[0],rows=allocate([room,room],search,config),d=roomPriceDetail({room,config,rows,search,plan:'standard',quantity:2});
 assert.equal(d.fees.length,2);assert.equal(d.total,validateBooking(rows,search,config).total);assert.equal(d.total,d.base+d.surcharge);
});
import {quoteManual} from '../dist/manual.js';
import {transferService} from '../dist/placements.js';
for(const automatic of [false,true]){
 test((automatic?'PA2':'PA1')+' nightly price follows selected quantity without multiplying rooms twice',()=>{
  const c=initialConfig(),r=c.rooms[0],s={...search,children:[]};
  for(const [quantity,nightly] of [[0,700000],[1,900000],[2,1600000],[3,2100000]]){
   const q=(automatic?quoteAutomatic:quoteManual)({a:quantity},s,c);
   const o={room:r,plan:'standard',search:s,config:c,quantity,rows:q.allocation,stay:q.search||s,automatic,partial:quantity>0&&!q.valid},d=roomPriceDetail(o);
   assert.equal(d.nightlyTotal,nightly);assert.equal(d.total,nightly*3);
   assert.match(priceHTML(o),new RegExp('class="room-price">'+nightly.toLocaleString('vi-VN')+'đ'));
   if(quantity)assert.equal(d.total,q.total);
  }
 });
 test((automatic?'PA2':'PA1')+' mixed nightly rows reconcile with booking across nights and rate plans',()=>{
  const c=initialConfig();
  for(const plan of ['standard','flex']){
   const q=(automatic?quoteAutomatic:quoteManual)({a:1,b:1},search,c,plan);
   const ds=c.rooms.slice(0,2).map(room=>roomPriceDetail({room,plan,search,config:c,quantity:1,rows:q.allocation,stay:q.search,automatic}));
   assert.equal(ds.reduce((n,d)=>n+d.nightlyTotal,0)*3,q.total);
   if(automatic)assert(ds.every(d=>d.fees.length===0&&d.bookingFees.length===2));
  }
 });
}
test('moving a bed updates the source and destination nightly prices without duplicating fees',()=>{
 const c=initialConfig(),s={...search,children:[]},rows=allocate(c.rooms.slice(0,2),s,c);
 const before=room=>roomPriceDetail({room,plan:'standard',search:s,config:c,quantity:1,rows});
 const moved=transferService(rows,s,c,1,0,rows[1].bedIds[0],'bed');assert(moved.valid);
 const after=room=>roomPriceDetail({room,plan:'standard',search:s,config:c,quantity:1,rows:moved.rows});
 assert.equal(after(c.rooms[0]).nightlyTotal-before(c.rooms[0]).nightlyTotal,200000);
 assert.equal(after(c.rooms[1]).nightlyTotal-before(c.rooms[1]).nightlyTotal,-200000);
 assert.equal(after(c.rooms[0]).total+after(c.rooms[1]).total,moved.total);
});
