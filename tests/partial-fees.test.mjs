import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,validateBooking} from '../dist/engine.js';
import {quoteAutomatic} from '../dist/automatic.js';
import {typeServices} from '../dist/placements.js';
const search={in:'2026-11-10',out:'2026-11-11',adults:13,children:[],rooms:3};

test('incomplete three-room selection exposes three beds for 9 of 13 guests and recalculates when complete',()=>{
 const c=initialConfig(),q=quoteAutomatic({a:3},search,c);
 assert.equal(q.valid,false);assert.equal(q.covered,9);assert.equal(q.missing,4);assert.equal(q.total,2700000);
 const services=typeServices(q.allocation,q.search,c,'a');
 assert.deepEqual(services.map(x=>[x.kind,x.count,x.unit]),[['bed',3,200000]]);
 assert.equal(q.quotes.flatMap(x=>x.lines).reduce((n,l)=>n+l.amount,0),q.total);
 assert(!validateBooking(q.allocation,search,c).valid,'preview must not permit full-party checkout');
 const more=quoteAutomatic({a:5},search,c);assert(more.valid);assert.equal(more.total,4100000);
 assert.equal(typeServices(more.allocation,more.search,c,'a')[0].count,3);
 const fewer=quoteAutomatic({a:2},search,c);assert.equal(fewer.covered,6);assert.equal(fewer.total,1800000);
 assert.equal(typeServices(fewer.allocation,fewer.search,c,'a')[0].count,2);
 const empty=quoteAutomatic({a:0},search,c);assert.equal(empty.allocation.length,0);assert.equal(empty.total,0);
});

test('partial service labels use the covered child subset and nightly units, not full-search child IDs',()=>{
 const c=initialConfig(),s={...search,adults:2,children:[12,9],rooms:1,out:'2026-11-13'},q=quoteAutomatic({a:1},s,c);
 assert(!q.valid);assert.equal(q.covered,3);assert.equal(q.missing,1);assert.deepEqual(q.search.children,[9]);
 const services=typeServices(q.allocation,q.search,c,'a');
 assert.equal(services[0].label,'Phụ thu trẻ 9 tuổi');assert.equal(services[0].unit,100000);assert.equal(services[0].count,1);
 assert.equal(q.total,2400000);
});
