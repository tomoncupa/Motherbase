# install-task.ps1 - tell Windows to check the receipts folder every five minutes.
#
# Run it once, in PowerShell, from anywhere:
#
#     powershell -ExecutionPolicy Bypass -File "C:\Users\user\Downloads\Motherbase\tools\receipts\install-task.ps1"
#
# It makes a scheduled task called "Motherbase receipts". Nothing else on the
# machine changes, and `-Remove` takes it away again:
#
#     powershell -ExecutionPolicy Bypass -File "...\install-task.ps1" -Remove
#
# Five minutes is the gap because iCloud is the slow part, not the reading. A
# photo taken on the phone usually lands on the PC inside a minute or two, and
# a receipt is never urgent: it waits for him, not the other way round.

param(
    [switch]$Remove,
    [int]$Minutes = 5
)

$ErrorActionPreference = 'Stop'
$name   = 'Motherbase receipts'
$script = Join-Path $PSScriptRoot 'read_receipt.py'

if ($Remove) {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false
    Write-Host "Removed the task. Nothing watches the folder now."
    return
}

if (-not (Test-Path $script)) { throw "read_receipt.py is not next to this file: $script" }

# The launcher, `pyw -3`, rather than a path to python.exe: the launcher
# survives a Python update, a full path does not. The w is no window: `py`
# flashed a black box up every five minutes. Found by its full path, because
# the task does not search his own PATH and answered "file not found".
$pyw = (Get-Command pyw.exe -ErrorAction Stop).Source
$action = New-ScheduledTaskAction -Execute $pyw `
    -Argument ('-3 "{0}"' -f $script) -WorkingDirectory $PSScriptRoot

# His own account only: a task for every user needs admin, and was refused
# as "Access is denied" (watched 2026-09-24).
$me = "$env:USERDOMAIN\$env:USERNAME"
$principal = New-ScheduledTaskPrincipal -UserId $me -LogonType Interactive -RunLevel Limited

# Every few minutes from now, and again from each logon, so a PC left on
# keeps checking and one that was off catches up when he signs in. A logon
# trigger alone would not start repeating until the next sign-in. No
# -RepetitionDuration: left out it means forever, and [TimeSpan]::MaxValue
# is refused by Windows 11 as out of range.
$every = New-TimeSpan -Minutes $Minutes
$now = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval $every
$logon = New-ScheduledTaskTrigger -AtLogOn -User $me
$logon.Repetition = $now.Repetition
$trigger = @($now, $logon)

# No window, and it gives up rather than piling up if something hangs.
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger -Principal $principal `
    -Settings $settings -Description 'Reads receipt photos into Motherbase' -Force | Out-Null

Write-Host "Done. Windows checks the receipts folder every $Minutes minutes."
Write-Host "Reading one receipt takes about fifteen seconds and costs nothing."
