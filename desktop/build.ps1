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

# A running program cannot be overwritten, but Windows lets it be renamed.
# So building while STATUS or the Main Menu is open moves the old exe aside
# as <name>.old; it keeps running, and the next build deletes it.
function Free-Exe($exe) {
  $old = "$exe.old"
  if (Test-Path $old) { try { Remove-Item $old -Force -ErrorAction Stop } catch {} }
  if (Test-Path $exe) {
    try { [IO.File]::Open($exe, 'Open', 'ReadWrite', 'None').Close() }
    catch { if (-not (Test-Path $old)) { Rename-Item $exe (Split-Path -Leaf $old) } }
  }
}

# The icon is built into the exe, because a desktop shortcut and a taskbar
# pin read it from the file, never from the window. status.ico and menu.ico
# are the apps' own install icons cut to the window, the corners clear.
Free-Exe $out
& $csc -nologo -target:winexe -out:"$out" -win32icon:"$dir\status.ico" `
  -reference:System.dll -reference:System.Windows.Forms.dll -reference:System.Drawing.dll `
  -reference:"$lib\Microsoft.Web.WebView2.Core.dll" `
  -reference:"$lib\Microsoft.Web.WebView2.WinForms.dll" `
  (Join-Path $dir 'StatusApp.cs') (Join-Path $dir 'KeyBox.cs')

if ($LASTEXITCODE -ne 0) { Write-Output "Build failed."; exit $LASTEXITCODE }

# The exe has to find the WebView2 files, so they sit beside it. A running
# program holds them, and then the copy already there is the same file.
foreach ($f in @('Microsoft.Web.WebView2.Core.dll','Microsoft.Web.WebView2.WinForms.dll','WebView2Loader.dll')) {
  try { Copy-Item (Join-Path $lib $f) $dir -Force -ErrorAction Stop } catch {}
}

# ── the Main Menu, the suite in an ordinary window ──
$menu = Join-Path $dir 'Main Menu.exe'
Free-Exe $menu
& $csc -nologo -target:winexe -out:"$menu" -win32icon:"$dir\menu.ico" `
  -reference:System.dll -reference:System.Windows.Forms.dll -reference:System.Drawing.dll `
  -reference:"$lib\Microsoft.Web.WebView2.Core.dll" `
  -reference:"$lib\Microsoft.Web.WebView2.WinForms.dll" -reference:System.Web.Extensions.dll `
  (Join-Path $dir 'MenuApp.cs') (Join-Path $dir 'ClaudeBridge.cs')

if ($LASTEXITCODE -ne 0) { Write-Output "Main Menu build failed."; exit $LASTEXITCODE }

# ── the nightly backup, started by Windows, never seen ──
$backup = Join-Path $dir 'Backup.exe'
& $csc -nologo -target:winexe -out:"$backup" `
  -reference:System.dll -reference:System.Core.dll -reference:System.Windows.Forms.dll -reference:System.Drawing.dll `
  -reference:"$lib\Microsoft.Web.WebView2.Core.dll" `
  -reference:"$lib\Microsoft.Web.WebView2.WinForms.dll" `
  (Join-Path $dir 'Backup.cs')

if ($LASTEXITCODE -ne 0) { Write-Output "Backup build failed."; exit $LASTEXITCODE }

Write-Output "Built:"
Write-Output "  $out"
Write-Output "  $menu"
Write-Output "  $backup"
Write-Output ""
Write-Output "Double click it. It puts an icon in the tray, next to the clock."
