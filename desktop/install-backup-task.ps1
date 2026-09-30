# install-backup-task.ps1 - tell Windows to make the nightly backup.
#
# Run it once, in PowerShell, from anywhere:
#
#     powershell -ExecutionPolicy Bypass -File "C:\Users\user\Downloads\Motherbase\desktop\install-backup-task.ps1"
#
# It makes a scheduled task called "Motherbase backup" that starts Backup.exe
# at 4am and again ten minutes after each sign-in. Backup.exe makes one copy a
# day and does nothing if today's is already there, so the second start only
# matters on a day the PC was off at 4am. `-Remove` takes the task away:
#
#     powershell -ExecutionPolicy Bypass -File "...\install-backup-task.ps1" -Remove
#
# The copies land in Documents\Backups\Motherbase nightly, the last 30 kept,
# with backup.log beside them saying what each night did.

param([switch]$Remove)

$ErrorActionPreference = 'Stop'
$name = 'Motherbase backup'
$exe  = Join-Path $PSScriptRoot 'Backup.exe'

if ($Remove) {
    Unregister-ScheduledTask -TaskName $name -Confirm:$false
    Write-Host "Removed the task. No more nightly copies."
    return
}

if (-not (Test-Path $exe)) { throw "Backup.exe is not next to this file: $exe. Run build.ps1 first." }

$action = New-ScheduledTaskAction -Execute $exe -WorkingDirectory $PSScriptRoot

# His own account, only while he is signed in: the backup reads the store
# through a web engine, which needs his desktop session. Admin is not needed.
$me = "$env:USERDOMAIN\$env:USERNAME"
$principal = New-ScheduledTaskPrincipal -UserId $me -LogonType Interactive -RunLevel Limited

$night = New-ScheduledTaskTrigger -Daily -At 4am
$logon = New-ScheduledTaskTrigger -AtLogOn -User $me
$logon.Delay = 'PT10M'

# A PC that was asleep at 4am makes the copy as soon as it can.
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $name -Action $action -Trigger @($night, $logon) -Principal $principal `
    -Settings $settings -Description 'A full copy of the Motherbase store, once a day' -Force | Out-Null

Write-Host "Done. Windows makes a Motherbase backup every night at 4am."
