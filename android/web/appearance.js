function applyAppearance(mode='system'){
 if(!['light','dark','system'].includes(mode))mode='system';
 document.documentElement.dataset.theme=mode;
 const dark=mode==='dark'||mode==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;
 const meta=document.querySelector('meta[name=theme-color]');if(meta){meta.removeAttribute('media');meta.content=dark?'#171c18':'#f6f3ec'}
 if(window.MealBalanceAndroid?.setTheme)MealBalanceAndroid.setTheme(mode);
}
const appearanceMedia=matchMedia('(prefers-color-scheme: dark)');
appearanceMedia.addEventListener('change',()=>{if(document.documentElement.dataset.theme==='system')applyAppearance('system')});
