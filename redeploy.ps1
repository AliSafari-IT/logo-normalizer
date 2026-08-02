# redeploy.ps1 — one-shot redeploy of logo-normalizer to the VPS (asafarim.be/apps/logo-normalizer)
# Archives the repo, uploads it, rebuilds the Docker image remotely, and verifies the site.
# Requires: passwordless SSH configured as `ssh vps`.

$ErrorActionPreference = 'Stop'
$RepoDir   = $PSScriptRoot
$RepoName  = 'logo-normalizer'
$Archive   = Join-Path $env:TEMP "$RepoName.tar.gz"
$RemoteDir = "/var/repos/$RepoName"

function Invoke-Step([string]$Label, [scriptblock]$Action) {
    Write-Host "`n=== $Label ===" -ForegroundColor Cyan
    & $Action
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: $Label (exit $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

try {
    Invoke-Step '1/5 Creating source archive' {
        tar -czf $Archive --exclude=node_modules --exclude=.next --exclude=.git -C $RepoDir .
    }

    Invoke-Step '2/5 Uploading to VPS' {
        scp $Archive "vps:/tmp/"
    }

    Invoke-Step '3/5 Extracting and rebuilding on VPS' {
        ssh vps "tar -xzf /tmp/$RepoName.tar.gz -C $RemoteDir && rm /tmp/$RepoName.tar.gz && cd $RemoteDir && docker compose up -d --build"
    }

    # Scoped cleanup: only THIS project's dangling images + build cache unused for 7+ days.
    Invoke-Step '4/5 Pruning stale Docker layers' {
        ssh vps "docker image prune -f --filter label=com.docker.compose.project=$RepoName; docker builder prune -f --filter until=168h 2>&1 | tail -1; df -h / | tail -1"
    }

    Invoke-Step '5/5 Verifying site' {
        ssh vps "echo -n 'logo-normalizer: '; curl -s -o /dev/null -w '%{http_code}\n' https://asafarim.be/apps/logo-normalizer"
    }

    Write-Host "`nRedeploy complete: https://asafarim.be/apps/logo-normalizer" -ForegroundColor Green
}
finally {
    if (Test-Path $Archive) { Remove-Item $Archive -Force }
}
