import {quoteAutomatic} from './automatic.js?v=20261026-stable-placement';
import {typeServices,transferTypeService} from './placements.js?v=20261026-stable-placement';
import {validateBooking} from './engine.js?v=20261026-stable-placement';

// Keep already displayed services on their room type when an equally priced,
// valid allocation exists. Partial quotes remain partial and cannot be booked.
export function quoteManual(quantities,search,config,plan='standard',previous=null){
 const quote=quoteAutomatic(quantities,search,config,plan);
 if(!previous?.rows?.length||!previous.stay||!quote.allocation.length)return quote;
 const types=[...new Set(quote.allocation.map(r=>r.roomId))];
 const signature=s=>s.kind+'|'+s.label;
 const services=(rows,stay)=>types.flatMap(id=>typeServices(rows,stay,config,id).filter(s=>s.unit>0).map(s=>({...s,roomId:id,id:id+'|'+signature(s)})));
 const wanted=new Map(services(previous.rows,previous.stay).map(s=>[s.id,s.count]));
 if(!wanted.size)return quote;
 const distance=items=>{
  const counts=new Map(items.map(s=>[s.id,s.count]));
  return [...new Set([...wanted.keys(),...counts.keys()])].reduce((n,id)=>n+Math.abs((wanted.get(id)||0)-(counts.get(id)||0)),0);
 };
 let rows=quote.allocation,items=services(rows,quote.search),score=distance(items);
 while(score>0){
  let best=null;
  for(const source of items){
   if(source.count<=(wanted.get(source.id)||0))continue;
   for(const target of types){
    const id=target+'|'+signature(source),current=items.find(s=>s.id===id)?.count||0;
    if(target===source.roomId||current>=(wanted.get(id)||0))continue;
    const moved=transferTypeService(rows,quote.search,config,source.roomId,target,source.key,quote.total);
    if(!moved.valid||moved.total!==quote.total)continue;
    const nextItems=services(moved.rows,quote.search),nextScore=distance(nextItems);
    if(nextScore<score&&(!best||nextScore<best.score))best={rows:moved.rows,items:nextItems,score:nextScore};
   }
  }
  if(!best)break;
  ({rows,items,score}=best);
 }
 const check=validateBooking(rows,quote.search,config);
 if(!check.valid||check.total!==quote.total)return quote;
 return {...quote,allocation:rows.map((r,i)=>({...r,quote:check.quotes[i]})),quotes:check.quotes};
}
