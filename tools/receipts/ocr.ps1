# ocr.ps1 - Windows' own text reader over a batch of pictures, free and offline.
#
# read_receipt.py calls this once per run with a file holding one picture path
# per line, and gets back one JSON line per picture: {"path", "text"} or
# {"path", "err"}. The words decide whether a picture is worth a Claude read,
# so a selfie costs nothing and a receipt costs one read.
#
# One PowerShell for the whole batch, because starting PowerShell and loading
# the reader is the slow part, not the reading.
#
# Nothing here writes to the pictures. It opens each one for reading only.

#
# With -Jpeg each line is "source|destination" instead, and each source is
# written out as a JPEG at the destination. That is how an iPhone HEIC reaches
# Claude, which reads JPEG and PNG but not HEIC; Windows can decode it.

param([Parameter(Mandatory)][string]$List, [switch]$Jpeg)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics, ContentType = WindowsRuntime]

# WinRT hands back IAsyncOperation; PowerShell 5.1 cannot await, so this
# turns one into a .NET task and waits on it.
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$type) {
    $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op))
    $t.Wait(-1) | Out-Null
    $t.Result
}
$asAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' })[0]
function AwaitAction($op) { $asAction.Invoke($null, @($op)).Wait(-1) | Out-Null }

$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage(
        [Windows.Globalization.Language]::new('en-US'))
}
# the text reader refuses anything past MaxImageDimension; a JPEG for Claude
# needs no more than this, since Claude shrinks anything bigger itself
$max = if ($Jpeg) { 2400 } else { [Windows.Media.Ocr.OcrEngine]::MaxImageDimension }

foreach ($line in (Get-Content -LiteralPath $List -Encoding UTF8)) {
    $path, $dest = ([string]$line).Split('|')
    if (-not $path) { continue }
    $stream = $null; $out = $null
    try {
        $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($path)) ([Windows.Storage.StorageFile])
        $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
        $dec = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $w, $h = $dec.PixelWidth, $dec.PixelHeight
        $s = [Math]::Min(1.0, $max / [double][Math]::Max($w, $h))
        $tf = [Windows.Graphics.Imaging.BitmapTransform]::new()
        $tf.ScaledWidth = [uint32][Math]::Floor($w * $s)
        $tf.ScaledHeight = [uint32][Math]::Floor($h * $s)
        $bmp = Await ($dec.GetSoftwareBitmapAsync(
            [Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8,
            [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied, $tf,
            [Windows.Graphics.Imaging.ExifOrientationMode]::RespectExifOrientation,
            [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.SoftwareBitmap])
        if ($Jpeg) {
            $out = [System.IO.WindowsRuntimeStreamExtensions]::AsRandomAccessStream(
                [System.IO.File]::Create($dest))
            $enc = Await ([Windows.Graphics.Imaging.BitmapEncoder]::CreateAsync(
                [Windows.Graphics.Imaging.BitmapEncoder]::JpegEncoderId, $out)) ([Windows.Graphics.Imaging.BitmapEncoder])
            $enc.SetSoftwareBitmap($bmp)
            AwaitAction ($enc.FlushAsync())
            [pscustomobject]@{ path = $path; text = $dest } | ConvertTo-Json -Compress
        } else {
            $res = Await ($engine.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
            [pscustomobject]@{ path = $path; text = $res.Text } | ConvertTo-Json -Compress
        }
    } catch {
        [pscustomobject]@{ path = $path; err = $_.Exception.Message } | ConvertTo-Json -Compress
    } finally {
        if ($out) { $out.Dispose() }
        if ($stream) { $stream.Dispose() }
    }
}
