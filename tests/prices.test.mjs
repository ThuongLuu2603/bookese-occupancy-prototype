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
 assert.equal(d.total,4200000);assert.equal(d.fees.length,0);assert.match(html,/Phụ thu được tính chung/);assert.doesNotMatch(html,/Giường phụ ×|Phụ thu trẻ 9 tuổi|Phòng 1:/);
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
