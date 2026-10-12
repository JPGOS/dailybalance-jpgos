# DailyBalance iOS 1.5.1

这是原生 iOS 容器工程，包含当前 DailyBalance 页面、103 种食物的离线图片、24 种运动、自定义食物、营养编辑、14 日趋势与自选时段分析。

## 当前交付状态

- 已提供可以在 Xcode 中打开的工程、Swift 原生容器、完整 Web 资源和 1024×1024 桌面图标。
- 已检查资源齐全、103 种食物图片可在浏览器中解码、五页移动布局及 UTF-8 导出消息。
- 当前环境为 Windows，没有 Xcode、iOS SDK、Mac 或 Apple Developer 签名配置。**尚未完成 iOS 原生编译、模拟器或真机测试，尚未生成 IPA，也未上传 TestFlight。**
- 需要 iOS 16.0 及以上。Mac 上建议使用 Xcode 26 或更新版本。

## 在 Mac 上打开和检查

1. 解压 ZIP，打开 `DailyBalance.xcodeproj`。
2. 选择 `DailyBalance` Scheme 和一台 iPhone 模拟器。
3. 点击运行。先完成下面的 iOS 检查清单。
4. 如需真机或分发，打开项目的 Signing & Capabilities，选择自己的 Team。
5. 将 Bundle Identifier 改为该开发者账号可使用的唯一标识；当前 `app.dailybalance.personal` 是工程预设值，并未注册。

## 通过 TestFlight 分发使用

1. 注册并配置 Apple Developer Program 账号，在 Xcode 的 Accounts 中登录。
2. 在 App Store Connect 中创建与 Bundle Identifier 对应的 App，显示名称设为 DailyBalance。
3. 选择通用 iOS 设备，使用 Product → Archive。
4. 在 Organizer 中选择 Distribute App，按 Xcode 的提示上传 App Store Connect。
5. 等构建处理完成后，在 TestFlight 配置测试者。对外测试可能需要 Apple 的 Beta App Review。

如果需要 IPA，在 Xcode 的分发向导中选择适合自己账号和设备的导出方式。未签名的 IPA 不能像安卓 APK 一样直接发给任意 iPhone 安装。

官方分发说明：https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases

## iOS 检查清单（必须在 Mac / iPhone 上完成）

- 工程能成功编译，103 种食物图片可在断网时显示。
- 首次保存记录、关闭并重新打开 App、升级后，记录仍存在。
- 自定义食物照片选择及 JSON 备份导入能正常工作。
- JSON / CSV 导出能打开系统分享面板，保存到“文件”后可重新导入。
- 删除记录、恢复备份的确认弹窗能正常确认和取消。
- 蓝橙方格桌面图标及 DailyBalance 名称正确显示。
- 设置入口、底部导航、键盘、安全区域和横竖屏布局正确。
- 浅色、深色模式下的食物、运动、盈余和缺口配色正确。
- 14 日图与时段分析的数值与原记录一致。

## 本地数据与图片许可

应用使用 WKWebView 的持久化数据存储，固定本地 URL 为 `dailybalance://localhost/index.html`；所有页面和图片随应用打包。记录不会上传到服务器。删除 App 会删除本机记录，请定期导出备份。

照片的来源与许可见 App 内“图片来源与许可”，也可查看 `DailyBalance/Web/photo-credits.html`。部分营养数据属于同类食物参考或配方估算，可在应用内编辑。
