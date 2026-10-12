import UIKit
import WebKit

@main
@MainActor
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        let window = UIWindow(frame: UIScreen.main.bounds)
        window.rootViewController = BalanceViewController()
        window.makeKeyAndVisible()
        self.window = window
        return true
    }
}

@MainActor
final class BalanceViewController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var webView: WKWebView!
    private let assets = LocalAssets()
    private lazy var bridge = ShareBridge(owner: self)

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(named: "Paper") ?? .systemBackground
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.setURLSchemeHandler(assets, forURLScheme: "dailybalance")
        config.userContentController.add(bridge, name: "dailyBalance")
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        // Keep content and controls above system bars and the keyboard.
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
        ])
        if let url = URL(string: "dailybalance://localhost/index.html") {
            webView.load(URLRequest(url: url))
        }
    }

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "dailybalance", url.host == "localhost" {
            decisionHandler(.allow)
        } else {
            decisionHandler(.cancel)
            if url.scheme == "https" { UIApplication.shared.open(url) }
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        guard let url = navigationAction.request.url else { return nil }
        if url.scheme == "dailybalance", url.host == "localhost" { webView.load(URLRequest(url: url)) }
        else if url.scheme == "https" { UIApplication.shared.open(url) }
        return nil
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "DailyBalance", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "知道了", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "DailyBalance", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "取消", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler(true) })
        present(alert, animated: true)
    }

    func share(name: String, text: String) {
        guard text.utf8.count <= 20_000_000 else { showError("备份文件过大，暂时无法分享。"); return }
        let cleanName = name.components(separatedBy: CharacterSet(charactersIn: "/\\:*?\"<>|").union(.controlCharacters)).joined(separator: "_")
        let folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        let file = folder.appendingPathComponent(cleanName.isEmpty ? "DailyBalance备份.json" : cleanName)
        do {
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            try Data(text.utf8).write(to: file, options: .atomic)
            let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            share.popoverPresentationController?.sourceView = view
            share.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
            present(share, animated: true)
        } catch { showError("无法导出文件，请稍后再试。") }
    }

    private func showError(_ message: String) {
        let alert = UIAlertController(title: "DailyBalance", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "知道了", style: .default))
        present(alert, animated: true)
    }
}

@MainActor
final class ShareBridge: NSObject, WKScriptMessageHandler {
    weak var owner: BalanceViewController?
    init(owner: BalanceViewController) { self.owner = owner }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              message.frameInfo.request.url?.scheme == "dailybalance",
              message.frameInfo.request.url?.host == "localhost",
              let payload = message.body as? [String: String],
              payload["action"] == "export",
              let name = payload["name"], let data = payload["data"] else { return }
        owner?.share(name: name, text: data)
    }
}

@MainActor
final class LocalAssets: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let requestURL = urlSchemeTask.request.url, requestURL.host == "localhost",
              let root = Bundle.main.url(forResource: "Web", withExtension: nil) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let relativePath = requestURL.path.removingPercentEncoding ?? requestURL.path
        let file = root.appendingPathComponent(relativePath.trimmingCharacters(in: CharacterSet(charactersIn: "/"))).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path + "/") else {
            urlSchemeTask.didFailWithError(URLError(.noPermissionsToReadFile)); return
        }
        do {
            let data = try Data(contentsOf: file)
            let type: String
            switch file.pathExtension.lowercased() {
            case "html": type = "text/html"
            case "js": type = "text/javascript"
            case "css": type = "text/css"
            case "png": type = "image/png"
            case "svg": type = "image/svg+xml"
            case "webp": type = "image/webp"
            default:
                if data.starts(with: [0x89, 0x50, 0x4e, 0x47]) { type = "image/png" }
                else if data.count >= 12 && data.prefix(4) == Data("RIFF".utf8) { type = "image/webp" }
                else { type = "image/jpeg" }
            }
            urlSchemeTask.didReceive(URLResponse(url: requestURL, mimeType: type, expectedContentLength: data.count, textEncodingName: type.hasPrefix("text/") ? "UTF-8" : nil))
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        } catch { urlSchemeTask.didFailWithError(error) }
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) { }
}
