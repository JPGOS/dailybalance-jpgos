if(window.webkit?.messageHandlers?.dailyBalance){
 window.download=function(name,data,type){window.webkit.messageHandlers.dailyBalance.postMessage({action:'export',name,data,type});};
}
