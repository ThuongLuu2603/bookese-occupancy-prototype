// Use the top layer so the tooltip is not clipped by the scrollable room table.
if(typeof document!=='undefined'){
 let timer;
 const tipFor=button=>document.getElementById(button.getAttribute('popovertarget'));
 const position=button=>{
  const tip=tipFor(button);if(!tip)return;
  const r=button.getBoundingClientRect(),width=Math.min(tip.classList.contains('price-tooltip')?440:300,window.innerWidth-24);
  tip.style.width=width+'px';
  tip.style.left=Math.max(12,Math.min(r.left,window.innerWidth-width-12))+'px';
  tip.style.top=Math.max(12,Math.min(r.bottom+8,window.innerHeight-tip.offsetHeight-12))+'px';
 };
 const close=()=>document.querySelectorAll('.info-tooltip:popover-open').forEach(t=>t.hidePopover());
 const open=button=>{clearTimeout(timer);const tip=tipFor(button);if(!tip)return;tip.showPopover();position(button);};
 document.addEventListener('pointerover',e=>{const button=e.target.closest('.info-trigger');if(button)open(button);else if(e.target.closest('.info-tooltip'))clearTimeout(timer);});
 document.addEventListener('pointerout',e=>{if(e.target.closest('.info-trigger,.info-tooltip')&&!e.relatedTarget?.closest?.('.info-trigger,.info-tooltip'))timer=setTimeout(close,150);});
 document.addEventListener('focusin',e=>{if(e.target.matches('.info-trigger'))open(e.target);});
 document.addEventListener('focusout',e=>{if(e.target.matches('.info-trigger'))close();});
 document.addEventListener('click',e=>{const button=e.target.closest('.info-trigger');if(button){e.preventDefault();open(button);}});
 document.addEventListener('toggle',e=>{if(!e.target.matches('.info-tooltip'))return;const button=document.querySelector(`[popovertarget="${e.target.id}"]`);if(button){button.setAttribute('aria-expanded',String(e.newState==='open'));if(e.newState==='open')position(button);}},true);
 window.addEventListener('resize',close);
 document.addEventListener('scroll',e=>{if(!e.target.closest?.('.info-tooltip'))close();},true);
}
