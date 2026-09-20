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

# `py -3` rather than a path to python.exe: the launcher survives a Python
# update, a full path does not.
$action = New-ScheduledTaskAction -Execute 'py.exe' `
    -Argument ('-3 "{0}"' -f $script) -WorkingDirectory $PSScriptRoot

# At logon AND every few minutes after it, so a PC left on all day keeps
# checking and a PC that was off catches up when he signs in.
$trigger = New-ScheduledTaskTrigger -AtLogOn
$trigger.Repetition = (New-ScheduledTaskTrigger -Once -At (Get-Date) `
    -RepetitionInterval (New-TimeSpan -Minutes $Minutes) `
    -RepetitionDuration ([TimeSpan]::MaxValue)).Repetition

# No window, and it gives up rather than piling up if something hangs.
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 30) `
    -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $name -Action $action -Trigger $trigger `
    -Settings $settings -Description 'Reads receipt photos into Motherbase' -Force | Out-Null

Write-Host "Done. Windows checks the receipts folder every $Minutes minutes."
Write-Host "Reading one receipt takes about fifteen seconds and costs nothing."
