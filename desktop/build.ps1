# Builds STATUS.exe, the desktop app.
#
# There is nothing to install. This uses the C# compiler that is already
# inside Windows, in the .NET Framework folder, which has shipped with every
# copy of Windows for years. The three files in lib\ are Microsoft's WebView2
# package, kept here so there is nothing to download either.
#
# Run this only if the .cs files change. Editing STATUS itself never needs a
# rebuild, because the app loads status\index.html from disk every time.
#
#   powershell -ExecutionPolicy Bypass -File build.ps1

$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'

if (-not (Test-Path $csc)) {
  Write-Output "The C# compiler is not where it should be:"
  Write-Output "  $csc"
  exit 1
}

$lib = Join-Path $dir 'lib'
foreach ($need in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll')) {
  if (-not (Test-Path (Join-Path $lib $need))) {
    Write-Output "Missing $need in lib\. The WebView2 files have to sit there."
    exit 1
  }
}

$out = Join-Path $dir 'STATUS.exe'

& $csc -nologo -target:winexe -out:"$out" `
  -reference:System.dll -reference:System.Windows.Forms.dll -reference:System.Drawing.dll `
  -reference:"$lib\Microsoft.Web.WebView2.Core.dll" `
  -reference:"$lib\Microsoft.Web.WebView2.WinForms.dll" `
  (Join-Path $dir 'StatusApp.cs') (Join-Path $dir 'KeyBox.cs')

if ($LASTEXITCODE -ne 0) { Write-Output "Build failed."; exit $LASTEXITCODE }

# The exe has to find the WebView2 files, so they sit beside it.
foreach ($f in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll')) {
  Copy-Item (Join-Path $lib $f) $dir -Force
}

# ── the Main Menu, the suite in an ordinary window ──
$menu = Join-Path $dir 'Main Menu.exe'
& $csc -nologo -target:winexe -out:"$menu" `
  -reference:System.dll -reference:System.Windows.Forms.dll -reference:System.Drawing.dll `
  -reference:"$lib\Microsoft.Web.WebView2.Core.dll" `
  -reference:"$lib\Microsoft.Web.WebView2.WinForms.dll" `
  (Join-Path $dir 'MenuApp.cs')

if ($LASTEXITCODE -ne 0) { Write-Output "Main Menu build failed."; exit $LASTEXITCODE }

Write-Output "Built:"
Write-Output "  $out"
Write-Output "  $menu"
Write-Output ""
Write-Output "Double click it. It puts an icon in the tray, next to the clock."
