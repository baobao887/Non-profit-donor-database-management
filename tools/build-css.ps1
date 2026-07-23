<#
  build-css.ps1 — compile Tailwind for DonorTrack using the standalone CLI.

  Usage (from anywhere):
    powershell -File tools/build-css.ps1          # one-off, minified
    powershell -File tools/build-css.ps1 -Watch   # rebuild on change

  Requires no Node.js. Downloads the standalone binary into tools/ on first run.
#>
param(
  [switch]$Watch,
  [string]$Version = 'v3.4.17'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot          # project root (tools/..)
$exe  = Join-Path $PSScriptRoot 'tailwindcss.exe'
$input  = Join-Path $root 'assets/css/tailwind.css'
$output = Join-Path $root 'assets/css/app.css'
$config = Join-Path $root 'tailwind.config.js'

if (-not (Test-Path $exe)) {
  $url = "https://github.com/tailwindlabs/tailwindcss/releases/download/$Version/tailwindcss-windows-x64.exe"
  Write-Host "Tailwind CLI not found — downloading $Version ..." -ForegroundColor Yellow
  # curl.exe is bundled with Windows 10+ and handles the GitHub redirect reliably.
  & curl.exe -L -o $exe $url
  if (-not (Test-Path $exe)) { throw "Download failed. Fetch it manually (see README) and re-run." }
}

$common = @('-c', $config, '-i', $input, '-o', $output)
if ($Watch) {
  Write-Host 'Watching styles (Ctrl+C to stop)...' -ForegroundColor Cyan
  & $exe @common --watch
} else {
  & $exe @common --minify
  Write-Host "Built $output" -ForegroundColor Green
}
