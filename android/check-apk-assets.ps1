param([string]$Apk='release/MealBalance-1.3.0.apk')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$assetRoot=Join-Path $PSScriptRoot 'web'
$archive=[IO.Compression.ZipFile]::OpenRead((Join-Path $PSScriptRoot $Apk))
try {
  $bad=@($archive.Entries | Where-Object { $_.FullName.Contains('\') })
  if($bad.Count) { throw 'APK contains backslash paths that Android cannot resolve.' }
  $count=0; $photos=0
  foreach($file in Get-ChildItem -LiteralPath $assetRoot -File -Recurse) {
    $name='assets/'+$file.FullName.Substring($assetRoot.Length+1).Replace('\','/')
    $entry=$archive.GetEntry($name)
    if(!$entry) { throw "Missing APK asset: $name" }
    $stream=$entry.Open(); $sha=[Security.Cryptography.SHA256]::Create()
    try { $actual=[BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-','') }
    finally { $stream.Dispose(); $sha.Dispose() }
    if($actual -ne (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash) { throw "Corrupt APK asset: $name" }
    $count++
    if($name.StartsWith('assets/photos/')) { $photos++ }
  }
  Write-Output "PASS: $count APK assets match source bytes; $photos photo files use Android-compatible paths."
} finally { $archive.Dispose() }
