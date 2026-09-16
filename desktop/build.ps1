# Builds STATUS Desktop tracker.
#
# There is nothing to install. This uses the C# compiler that is already
# inside Windows, in the .NET Framework folder, which has shipped with every
# copy of Windows for years. Run this once, and again only if
# StatusDesktop.cs changes. Editing STATUS itself never needs a rebuild.
#
#   powershell -ExecutionPolicy Bypass -File build.ps1

$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$csc = 'C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe'

if (-not (Test-Path $csc)) {
  Write-Output "The C# compiler is not where it should be:"
  Write-Output "  $csc"
  Write-Output "Look for csc.exe under C:\Windows\Microsoft.NET\Framework64."
  exit 1
}

$out = Join-Path $dir 'STATUS Desktop tracker.exe'
$src = Join-Path $dir 'StatusDesktop.cs'

& $csc -nologo -target:winexe -out:"$out" `
  -reference:System.dll -reference:System.Windows.Forms.dll -reference:System.Drawing.dll `
  "$src"

if ($LASTEXITCODE -ne 0) { Write-Output "Build failed."; exit $LASTEXITCODE }

Write-Output "Built:"
Write-Output "  $out"
Write-Output ""
Write-Output "Double click it to open STATUS. It puts an icon in the tray, next to the clock."
