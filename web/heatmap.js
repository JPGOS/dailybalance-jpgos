// One cell per local calendar day. Balances are derived from existing records.
const HEATMAP_BLUE=['#e1edf9','#bad4ef','#82b2e0','#4a8dc9','#2568a6'];
const HEATMAP_ORANGE=['#fff0df','#f8d5ae','#edac72','#d7843f','#b86220'];
const HEATMAP_MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function heatmapLevel(value){const n=Math.abs(value);return n<=100?0:n<=300?1:n<=500?2:n<=800?3:4}
function heatmapStatus(d,today=localDate()){
 if(d>today)return {kind:'future',label:'未来日期'};
 const x=db.days[d];if(!x)return {kind:'empty',label:'未记录'};
 const t=totals(d);
 if(!x.complete)return {...t,kind:'incomplete',label:'记录待确认完整'};
 if(!Number.isFinite(t.diff)||t.baseline<=0)return {...t,kind:'baseline',label:'未设置消耗基准'};
 const delta=Math.round(t.diff)||0,kind=delta<0?'deficit':delta>0?'surplus':'balanced';
 return {...t,delta,kind,label:delta<0?`缺口 ${Math.abs(delta)} 千卡`:delta>0?`盈余 ${delta} 千卡`:'基本平衡 · 约 0 千卡',color:delta?(delta<0?HEATMAP_BLUE:HEATMAP_ORANGE)[heatmapLevel(delta)]:null};
}
function heatmapMonth(year,month){
 const first=new Date(`${year}-${String(month+1).padStart(2,'0')}-01T12:00:00`),offset=(first.getDay()+6)%7,days=[];
 for(let dt=new Date(first);dt.getMonth()===month&&dt.getFullYear()===year;dt.setDate(dt.getDate()+1))days.push(localDate(dt));
 return {offset,days,slots:Array.from({length:42},(_,i)=>days[i-offset]||null)};
}
function heatmapYearDays(year){return HEATMAP_MONTHS.flatMap((_,month)=>heatmapMonth(year,month).days)}
function heatmapDefaultDate(year){
 if(Number(date.slice(0,4))===year)return date;
 const recorded=Object.keys(db.days).filter(d=>d.startsWith(year+'-')&&d<=localDate()).sort();
 return recorded[recorded.length-1]||`${year}-01-01`;
}
function heatmapMarkup(year=Number(date.slice(0,4))){
 const today=localDate(),selected=heatmapDefaultDate(year),statuses=heatmapYearDays(year).map(d=>heatmapStatus(d,today));
 const count=kind=>statuses.filter(s=>s.kind===kind).length;
 const days=heatmapYearDays(year),offset=heatmapMonth(year,0).offset,weeks=Math.ceil((offset+days.length)/7);
 const slots=Array.from({length:weeks*7},(_,i)=>days[i-offset]||null);
 const months=HEATMAP_MONTHS.map((name,m)=>({name,column:Math.floor((offset+days.indexOf(`${year}-${String(m+1).padStart(2,'0')}-01`))/7)+1}));
 return `<section class="panel heat-panel" data-heat-year="${year}" aria-labelledby="heat-title"><div class="heat-heading"><div><div class="eyebrow">DAY BY DAY</div><h2 id="heat-title">热量日历</h2></div><div class="heat-year"><button type="button" data-heat-year-step="-1" aria-label="查看上一年" ${year<=1970?'disabled':''}>‹</button><strong>${year}</strong><button type="button" data-heat-year-step="1" aria-label="查看下一年" ${year>=Number(today.slice(0,4))?'disabled':''}>›</button></div></div><div class="heat-counts"><span><i class="heat-dot blue"></i>缺口 <b>${count('deficit')}</b> 天</span><span><i class="heat-dot orange"></i>盈余 <b>${count('surplus')}</b> 天</span><span>平衡 <b>${count('balanced')}</b> 天</span></div><div class="heat-scroll" role="region" aria-label="全年热量方格图，可横向滚动"><div class="heat-track" style="--weeks:${weeks}"><div class="heat-month-labels">${months.map(m=>`<span style="grid-column:${m.column}">${m.name}</span>`).join('')}</div><div class="heat-year-grid" role="group" aria-label="每列一周，周一到周日从上到下">${slots.map(d=>{
 if(!d)return '<span class="heat-outside" aria-hidden="true"></span>';
 const s=heatmapStatus(d,today),label=`${d}，${s.label}`;
 return `<button type="button" class="heat-cell" data-heat-date="${d}" data-kind="${s.kind}" ${s.color?`style="--heat:${s.color}"`:''} title="${label}" aria-label="${label}" aria-haspopup="dialog" aria-pressed="false" tabindex="${d===selected?0:-1}"></button>`;
 }).join('')}</div></div></div></section>`;
}
function heatmapDetail(d){
 const s=heatmapStatus(d),hasRecord=!!db.days[d]&&s.kind!=='future',known=Number.isFinite(s.delta);
 return `<div class="heat-popup-head"><time id="heat-popup-title" datetime="${d}">${d.slice(0,4)}年${Number(d.slice(5,7))}月${Number(d.slice(8))}日</time><button type="button" class="heat-popup-close" aria-label="关闭当天明细">×</button></div><div class="heat-popup-balance ${s.kind==='deficit'?'heat-blue':s.kind==='surplus'?'heat-orange':''}"><span>${known?(s.delta<0?'热量缺口':s.delta>0?'热量盈余':'基本平衡'):s.label}</span><strong>${known?`${s.delta>0?'+':s.delta<0?'−':''}${Math.abs(s.delta)}`:'—'} <small>千卡</small></strong></div><dl class="heat-detail-values"><div><dt>摄入量</dt><dd>${hasRecord?Math.round(s.food||0):'—'}<small> 千卡</small></dd></div><div><dt>消耗量</dt><dd>${hasRecord&&s.baseline>0?Math.round(s.total):'—'}<small> 千卡</small></dd></div></dl>${s.kind==='future'?'':`<button type="button" class="textbutton" data-heat-open="${d}">${hasRecord?'查看 / 补全当天记录':'记录这一天'} ↗</button>`}`;
}
function heatmapPopup(){
 let popup=document.getElementById('heatPopup');if(popup)return popup;
 popup=document.createElement('dialog');popup.id='heatPopup';popup.className='heat-popup';popup.setAttribute('aria-labelledby','heat-popup-title');document.body.appendChild(popup);
 popup.addEventListener('click',e=>{if(e.target!==popup)return;const r=popup.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)popup.close()});
 popup.addEventListener('close',()=>{if(!popup.open)document.querySelectorAll('.heat-cell[aria-pressed=true]').forEach(b=>b.setAttribute('aria-pressed','false'))});return popup;
}
function selectHeatmapDate(d){
 const host=document.getElementById('heatmapMount');if(!host)return;
 const target=host.querySelector(`[data-heat-date="${d}"]`);if(!target)return;
 host.querySelectorAll('[data-heat-date]').forEach(b=>{b.tabIndex=b===target?0:-1;b.setAttribute('aria-pressed',String(b===target))});
 const popup=heatmapPopup();popup.innerHTML=heatmapDetail(d);popup.querySelector('.heat-popup-close').onclick=()=>popup.close();
 const open=popup.querySelector('[data-heat-open]');if(open)open.onclick=()=>{popup.close();date=d;$('#date').value=date;go('today')};
 popup.style.visibility='hidden';if(!popup.open)popup.showModal();
 const r=target.getBoundingClientRect(),p=popup.getBoundingClientRect(),margin=12;
 let top=r.bottom+10;if(top+p.height>innerHeight-margin)top=r.top-p.height-10;
 popup.style.top=Math.max(margin,Math.min(top,innerHeight-p.height-margin))+'px';popup.style.left=Math.max(margin,Math.min(r.left+r.width/2-p.width/2,innerWidth-p.width-margin))+'px';popup.style.visibility='visible';popup.querySelector('.heat-popup-close').focus({preventScroll:true});
}
function bindHeatmap(){
 const host=document.getElementById('heatmapMount');if(!host)return;
 const year=Number(host.querySelector('[data-heat-year]').dataset.heatYear);
 host.querySelectorAll('[data-heat-year-step]').forEach(b=>b.onclick=()=>{
  const next=year+Number(b.dataset.heatYearStep);if(next<1970||next>Number(localDate().slice(0,4)))return;
  const step=b.dataset.heatYearStep;host.innerHTML=heatmapMarkup(next);bindHeatmap();const control=host.querySelector(`[data-heat-year-step="${step}"]`);if(!control.disabled)control.focus({preventScroll:true});
 });
 alignHeatmapMonth(host,year);
 const days=heatmapYearDays(year);
 host.querySelectorAll('[data-heat-date]').forEach(b=>{
  b.onclick=()=>selectHeatmapDate(b.dataset.heatDate);
  b.onkeydown=e=>{
   const deltas={ArrowUp:-1,ArrowDown:1,ArrowLeft:-7,ArrowRight:7};let index=days.indexOf(b.dataset.heatDate);
   if(Object.prototype.hasOwnProperty.call(deltas,e.key))index+=deltas[e.key];else if(e.key==='Home')index-=((new Date(b.dataset.heatDate+'T12:00:00').getDay()+6)%7);else if(e.key==='End')index+=6-((new Date(b.dataset.heatDate+'T12:00:00').getDay()+6)%7);else return;
   e.preventDefault();index=Math.max(0,Math.min(index,days.length-1));const next=host.querySelector(`[data-heat-date="${days[index]}"]`);host.querySelectorAll('[data-heat-date]').forEach(cell=>cell.tabIndex=cell===next?0:-1);next.focus();
  };
 });
}
window.addEventListener('resize',()=>{const p=document.getElementById('heatPopup');if(p?.open)p.close()});

function alignHeatmapMonth(host,year){const scroll=host.querySelector('.heat-scroll'),track=host.querySelector('.heat-track');if(!scroll||!track)return;track.style.paddingRight='0px';const today=localDate();if(year!==Number(today.slice(0,4))){scroll.scrollLeft=0;return}const label=host.querySelectorAll('.heat-month-labels span')[Number(today.slice(5,7))-1],grid=host.querySelector('.heat-year-grid');if(!label||!grid)return;const offset=label.getBoundingClientRect().left-track.getBoundingClientRect().left;track.style.paddingRight=Math.max(0,scroll.clientWidth-(grid.getBoundingClientRect().width-offset))+'px';scroll.scrollLeft=offset}
