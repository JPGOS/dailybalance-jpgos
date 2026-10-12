function applyAppearance(mode='light'){
 mode=mode==='dark'?'dark':'light';
 document.documentElement.dataset.theme=mode;
 const dark=mode==='dark',meta=document.querySelector('meta[name=theme-color]');
 if(meta){meta.removeAttribute('media');meta.content=dark?'#171c18':'#f6f3ec'}
 const button=document.getElementById('themeToggle');
 if(button){
  button.setAttribute('aria-label',dark?'切换到浅色模式':'切换到深色模式');
  button.title=dark?'深色模式，点击切换到浅色':'浅色模式，点击切换到深色';
  button.innerHTML='<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(dark?'<path d="M20.8 13.2A8.5 8.5 0 0 1 10.8 3.2 8.5 8.5 0 1 0 20.8 13.2Z"/>':'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')+'</svg>';
 }
 if(window.MealBalanceAndroid?.setTheme)MealBalanceAndroid.setTheme(mode);
}
