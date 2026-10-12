$ErrorActionPreference='Stop'
$root=$PSScriptRoot
Set-Location -LiteralPath $root
Add-Type -AssemblyName System.IO.Compression.FileSystem
$javaBin='C:/Program Files/JetBrains/PyCharm 2026.1/jbr/bin'
$buildTools=Join-Path $root 'tools/android-15'
$androidJar=Join-Path $root 'tools/android-35/android.jar'
function Run-Checked([string]$Program,[string[]]$Arguments) {
  & $Program @Arguments
  if ($LASTEXITCODE -ne 0) { throw "Build command failed: $Program" }
}
foreach($folder in @('build/classes','build/dex','release','.signing')) { New-Item -ItemType Directory -Path $folder -Force | Out-Null }
Run-Checked "$buildTools/aapt2.exe" @('compile','--dir','res','-o','build/resources.zip')
Run-Checked "$buildTools/aapt2.exe" @('link','-o','build/base.apk','-I',$androidJar,'--manifest','AndroidManifest.xml','build/resources.zip')
$sources=@(Get-ChildItem -LiteralPath 'src' -Filter '*.java' -Recurse | ForEach-Object { $_.FullName })
Run-Checked "$javaBin/javac.exe" (@('--release','8','-encoding','UTF-8','-classpath',$androidJar,'-d','build/classes')+$sources)
$classes=@(Get-ChildItem -LiteralPath 'build/classes' -Filter '*.class' -Recurse | ForEach-Object { $_.FullName })
Run-Checked "$javaBin/java.exe" (@('-cp',"$buildTools/lib/d8.jar",'com.android.tools.r8.D8','--release','--min-api','26','--lib',$androidJar,'--output','build/dex')+$classes)
Copy-Item -LiteralPath 'build/base.apk' -Destination 'build/unsigned.apk' -Force
$apkArchive=[System.IO.Compression.ZipFile]::Open((Join-Path $root 'build/unsigned.apk'),[System.IO.Compression.ZipArchiveMode]::Update)
try {
  [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($apkArchive,(Join-Path $root 'build/dex/classes.dex'),'classes.dex',[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  $assetRoot=Join-Path $root 'web'
  foreach($asset in Get-ChildItem -LiteralPath $assetRoot -File -Recurse) {
    $entryName='assets/'+[System.IO.Path]::GetRelativePath($assetRoot,$asset.FullName).Replace('\','/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($apkArchive,$asset.FullName,$entryName,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $apkArchive.Dispose() }
& "$root/check-apk-assets.ps1" -Apk 'build/unsigned.apk'
Run-Checked "$buildTools/zipalign.exe" @('-f','-P','16','4','build/unsigned.apk','build/aligned.apk')
$keyFile=Join-Path $root '.signing/meal-balance-release.p12'
$secretFile=Join-Path $root '.signing/signing-password.txt'
if (!(Test-Path -LiteralPath $keyFile)) {
  if (!(Test-Path -LiteralPath $secretFile)) {
    $randomBytes=[System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
    [System.IO.File]::WriteAllText($secretFile,[Convert]::ToBase64String($randomBytes))
  }
  $env:MEAL_BALANCE_SIGNING_PASSWORD=[System.IO.File]::ReadAllText($secretFile).Trim()
  Run-Checked "$javaBin/keytool.exe" @('-genkeypair','-keystore',$keyFile,'-storetype','PKCS12','-alias','meal-balance','-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Meal Balance Family, O=Meal Balance, C=CN','-storepass:env','MEAL_BALANCE_SIGNING_PASSWORD','-keypass:env','MEAL_BALANCE_SIGNING_PASSWORD')
}
try {
  $env:MEAL_BALANCE_SIGNING_PASSWORD=[System.IO.File]::ReadAllText($secretFile).Trim()
  Run-Checked "$javaBin/java.exe" @('-jar',"$buildTools/lib/apksigner.jar",'sign','--ks',$keyFile,'--ks-type','PKCS12','--ks-key-alias','meal-balance','--ks-pass','env:MEAL_BALANCE_SIGNING_PASSWORD','--key-pass','env:MEAL_BALANCE_SIGNING_PASSWORD','--out','release/DailyBalance-1.5.3.apk','build/aligned.apk')
} finally { Remove-Item Env:MEAL_BALANCE_SIGNING_PASSWORD -ErrorAction SilentlyContinue }
Run-Checked "$javaBin/java.exe" @('-jar',"$buildTools/lib/apksigner.jar",'verify','--verbose','--print-certs','release/DailyBalance-1.5.3.apk')
Run-Checked "$buildTools/zipalign.exe" @('-c','-P','16','4','release/DailyBalance-1.5.3.apk')
Run-Checked "$buildTools/aapt.exe" @('dump','badging','release/DailyBalance-1.5.3.apk')
$hash=(Get-FileHash -LiteralPath 'release/DailyBalance-1.5.3.apk' -Algorithm SHA256).Hash.ToLower()
[System.IO.File]::WriteAllText((Join-Path $root 'release/DailyBalance-1.5.3-SHA256.txt'),"$hash  DailyBalance-1.5.3.apk`n")
Get-Item -LiteralPath 'release/DailyBalance-1.5.3.apk' | Select-Object Name,Length
