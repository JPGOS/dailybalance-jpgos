package app.mealbalance.family;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/index.html";
    private static final int PICK_FILE = 40, SAVE_FILE = 41;
    private WebView web;
    private String themeMode="system";
    private FrameLayout root;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingExport;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        themeMode=getPreferences(MODE_PRIVATE).getString("theme","system");
        boolean night = isNightMode();
        root = new FrameLayout(this);
        root.setBackgroundColor(night ? Color.rgb(23, 28, 24) : Color.rgb(246, 243, 236));
        web = new WebView(this);
        web.setBackgroundColor(night ? Color.rgb(23, 28, 24) : Color.rgb(246, 243, 236));
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        applySystemTheme();
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
            root.setOnApplyWindowInsetsListener((v,insets)->{
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                v.setPadding(bars.left,bars.top,bars.right,bars.bottom);
                return insets;
            });
        }
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        if(Build.VERSION.SDK_INT>=33)settings.setAlgorithmicDarkeningAllowed(false);
        else if(Build.VERSION.SDK_INT>=29)settings.setForceDark(WebSettings.FORCE_DARK_OFF);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new FileBridge(), "MealBalanceAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                if (!"https".equals(uri.getScheme()) || !HOST.equals(uri.getHost()) || !"GET".equals(req.getMethod())) return blocked();
                String file = uri.getPath();
                if (file == null || !file.startsWith("/assets/") || file.contains("..") || file.contains("\\")) return blocked();
                try {
                    InputStream input = getAssets().open(file.substring(8));
                    String lower = file.toLowerCase(Locale.ROOT);
                    String mime = lower.endsWith(".html") ? "text/html" : lower.endsWith(".js") ? "text/javascript" : lower.endsWith(".css") ? "text/css" : lower.endsWith(".png") ? "image/png" : lower.endsWith(".webp") ? "image/webp" : lower.endsWith(".svg") ? "image/svg+xml" : "image/jpeg";
                    HashMap<String,String> headers = new HashMap<>();
                    headers.put("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'");
                    headers.put("Cache-Control", "no-cache");
                    return new WebResourceResponse(mime, mime.startsWith("text/") ? "UTF-8" : null, 200,"OK",headers,input);
                } catch (Exception e) { return blocked(); }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri=request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                if (request.isForMainFrame()) openExternal(uri);
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onJsAlert(WebView view,String url,String message,JsResult result) {
                alertBuilder().setTitle("DailyBalance").setMessage(message).setPositiveButton("知道了",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;
            }
            @Override public boolean onJsConfirm(WebView view,String url,String message,JsResult result) {
                alertBuilder().setTitle("DailyBalance").setMessage(message).setPositiveButton("确定",(d,w)->result.confirm()).setNegativeButton("取消",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if(fileCallback!=null)fileCallback.onReceiveValue(null);
                fileCallback=callback;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                String[] accepted=params.getAcceptTypes();
                boolean images=accepted!=null&&accepted.length>0&&accepted[0].startsWith("image/");
                intent.setType(images?"image/*":"*/*");
                if(images)intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{"image/jpeg","image/png","image/webp"});
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try{startActivityForResult(intent,PICK_FILE);}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;message("没有找到文件选择器");}
                return true;
            }
        });
        web.loadUrl(HOME);
    }
    private static WebResourceResponse blocked(){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",new HashMap<>(),new ByteArrayInputStream(new byte[0]));}
    private AlertDialog.Builder alertBuilder(){return new AlertDialog.Builder(this,isNightMode()?android.R.style.Theme_Material_Dialog_Alert:android.R.style.Theme_Material_Light_Dialog_Alert);}
    private boolean isNightMode(){return "dark".equals(themeMode)||(!"light".equals(themeMode)&&(getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)==Configuration.UI_MODE_NIGHT_YES);}
    private void applySystemTheme(){
        boolean night=isNightMode();
        int bg=night?Color.rgb(23,28,24):Color.rgb(246,243,236);
        if(root!=null)root.setBackgroundColor(bg);
        if(web!=null)web.setBackgroundColor(bg);
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);
        int flags=getWindow().getDecorView().getSystemUiVisibility();
        int light=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        getWindow().getDecorView().setSystemUiVisibility(night?(flags&~light):(flags|light));
    }
    @Override public void onConfigurationChanged(Configuration cfg){
        super.onConfigurationChanged(cfg);
        int bg = isNightMode() ? Color.rgb(23, 28, 24) : Color.rgb(246, 243, 236);
        if (root != null) root.setBackgroundColor(bg);
        if (web != null) web.setBackgroundColor(bg);
        applySystemTheme();
    }
    private void message(String text){runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}
    private void openExternal(Uri uri){if(!"https".equals(uri.getScheme()))return;try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception e){message("未找到浏览器，请联网后打开来源链接");}}
    public final class FileBridge {
        @JavascriptInterface public void setTheme(String mode){if(!"light".equals(mode)&&!"dark".equals(mode)&&!"system".equals(mode))return;runOnUiThread(()->{themeMode=mode;getPreferences(MODE_PRIVATE).edit().putString("theme",mode).apply();applySystemTheme();});}
        @JavascriptInterface public void exportFile(String name,String data,String mime){
            if(data==null||data.length()>12_000_000){message("备份文件过大，无法导出");return;}
            final byte[] bytes=data.getBytes(StandardCharsets.UTF_8);
            runOnUiThread(()->{
                if(pendingExport!=null){message("请先完成当前文件保存");return;}
                pendingExport=bytes;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json".equals(mime)?"application/json":"text/csv");
                intent.putExtra(Intent.EXTRA_TITLE,name==null?"DailyBalance备份.json":name.replaceAll("[\\\\/:*?\"<>|]","_"));
                try{startActivityForResult(intent,SAVE_FILE);}catch(Exception e){pendingExport=null;message("无法打开系统保存窗口");}
            });
        }
        @JavascriptInterface public void openLink(String url){if(url!=null&&url.length()<4096)runOnUiThread(()->openExternal(Uri.parse(url)));}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(request==PICK_FILE&&fileCallback!=null){
            Uri uri=result==RESULT_OK&&data!=null?data.getData():null;
            // Only content-provider selections are accepted, never arbitrary file URLs.
            fileCallback.onReceiveValue(uri!=null&&"content".equals(uri.getScheme())?new Uri[]{uri}:null);fileCallback=null;
        }
        if(request==SAVE_FILE){
            byte[] bytes=pendingExport;pendingExport=null;
            if(result!=RESULT_OK||data==null||data.getData()==null)return;
            if(bytes==null){message("保存已中断，请重新导出");return;}
            Uri destination=data.getData();
            new Thread(()->{try(OutputStream out=getContentResolver().openOutputStream(destination,"wt")){if(out==null)throw new Exception();out.write(bytes);out.flush();message("文件已保存");}catch(Exception e){message("保存失败，请换一个位置后重试");}},"meal-balance-export").start();
        }
    }
    @Override public void onBackPressed(){
        web.evaluateJavascript("(function(){if(typeof page==='undefined')return false;var m=document.querySelector('dialog[open]');if(m&&m.open){m.close();return true;}if(document.querySelector('#foodEditorForm')){render();return true;}if(page!=='today'){go('today');return true;}return false;})()",value->{if("true".equals(value))return;if(web.canGoBack())web.goBack();else alertBuilder().setMessage("退出DailyBalance？记录已保存在本机。").setPositiveButton("退出",(d,w)->finish()).setNegativeButton("取消",null).show();});
    }
    @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);if(web!=null){web.removeJavascriptInterface("MealBalanceAndroid");web.destroy();}super.onDestroy();}
}
