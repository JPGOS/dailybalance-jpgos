// Only the bundled offline app exposes this native interface.
if(window.MealBalanceAndroid){
  window.download=function(name,data,type){MealBalanceAndroid.exportFile(name,data,type.split(';')[0]);};
  document.addEventListener('click',function(e){const a=e.target.closest('a');if(!a)return;const url=new URL(a.href,location.href);if(url.origin!==location.origin&&url.protocol==='https:'){e.preventDefault();MealBalanceAndroid.openLink(url.href);}else if(url.origin===location.origin){a.removeAttribute('target');}});
}
