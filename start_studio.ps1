$env:PYTHONIOENCODING="utf-8"
$env:PYTHONUTF8="1"

# Load .env if present
if (Test-Path ".env") {
    Get-Content .env | Where-Object { $_ -match "^([^#=]+)=(.*)$" } | ForEach-Object {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value)
    }
}

Write-Host "Starting LangGraph Dev Server on port 8000 with ACE Engine..." -ForegroundColor Cyan
uvx --from "langgraph-cli[inmem]" --with-editable . --python 3.11 langgraph dev --port 8000 --allow-blocking
