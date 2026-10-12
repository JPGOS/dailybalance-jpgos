// Offline vector artwork and controls: no icon fonts or network dependencies.
function uiIcon(name){const paths={today:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>',food:'<path d="M5 3v7m3-7v7M3 7h7M6.5 10v11M17 3c-3 4-3 8 1 8h2V3h-3ZM20 11v10"/>',exercise:'<path d="m3 15 4-7 5 10 5-12 4 6"/><path d="M3 21h18"/>',history:'<path d="M4 4v16h17M8 15v-4m5 4V7m5 8V3"/>',settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',leaf:'<path d="M19 4C6 3 2 10 7 16c6 5 13 0 12-12ZM6 19l9-10"/>'};return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.leaf}</svg>`}
document.addEventListener('keydown',()=>{document.documentElement.dataset.input='keyboard'});
document.addEventListener('pointerdown',()=>{document.documentElement.dataset.input='pointer'},{passive:true});

function exerciseIntensity(met){const t=Math.max(0,Math.min(1,(met-1)/11)),a=[112,67,167],b=[156,112,0];return {color:'rgb('+a.map((n,i)=>Math.round(n+(b[i]-n)*t)).join(',')+')',label:met<3?'低强度':met<6?'中等强度':'高强度'}}

function favoriteStar(){return '<svg class="favorite-star" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.7 2.6 5.3 5.8.85-4.2 4.1.99 5.8L12 17l-5.19 2.75.99-5.8-4.2-4.1L9.4 9Z"/></svg>'}
