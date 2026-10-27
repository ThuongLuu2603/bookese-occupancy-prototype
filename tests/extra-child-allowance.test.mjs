import test from 'node:test';
import assert from 'node:assert/strict';
import {initialConfig,validateBooking,recommendations} from '../dist/engine.js';
import {quoteAutomatic} from '../dist/automatic.js';
import {quoteManual} from '../dist/manual.js';
const stay=(adults,children)=>({in:'2026-11-10',out:'2026-11-11',adults,children,rooms:1});
for(const [name,quote] of [['manual',quoteManual],['automatic',quoteAutomatic]]){
 test(name+': standard child plus extra child costs 800k, no bed',()=>{
  const c=initialConfig(),s=stay(1,[9,9]),q=quote({a:1},s,c);
  assert(q.valid);assert.equal(q.total,800000);assert.equal(q.allocation[0].bedIds.length,0);assert(validateBooking(q.allocation,q.search,c).valid);
  assert(recommendations(s,c).some(r=>r.counts.a===1&&r.total===800000));
 });
 test(name+': zero extra allowance accepts standard child but rejects overflow even if free',()=>{
  const c=initialConfig();c.rooms[0].children=0;
  assert.equal(quote({a:1},stay(1,[9]),c).total,700000);
  assert(quote({a:1},stay(1,[9]),c).valid);
  assert(!quote({a:1},stay(1,[9,5]),c).valid);
  assert(!quote({a:1},stay(2,[5]),c).valid);
 });
 test(name+': partial child quote and full occupancy remain bounded',()=>{
  const c=initialConfig(),q=quote({a:1},stay(1,[9,9,9]),c);
  assert(!q.valid);assert.equal(q.covered,3);assert.equal(q.total,800000);
  assert.equal(quote({a:1},stay(1,[5,5]),c).total,700000);
 });
}
