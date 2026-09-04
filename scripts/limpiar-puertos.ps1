# Script para liberar puertos comunes de desarrollo (8080, 8081, 5173, 8025, 1025)
param (
    [int[]]$Puertos = @(8080, 8081, 5173, 8025, 1025)
)

Write-Host "Verificando puertos ocupados: $($Puertos -join ', ')..." -ForegroundColor Cyan

foreach ($puerto in $Puertos) {
    try {
        $conexiones = Get-NetTCPConnection -LocalPort $puerto -State Listen -ErrorAction SilentlyContinue
        if ($conexiones) {
            foreach ($conn in $conexiones) {
                $pidProc = $conn.OwningProcess
                $proc = Get-Process -Id $pidProc -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "Liberando puerto $puerto ocupado por proceso $($proc.ProcessName) (PID: $pidProc)..." -ForegroundColor Yellow
                    Stop-Process -Id $pidProc -Force -ErrorAction SilentlyContinue
                }
            }
        } else {
            Write-Host "Puerto $puerto libre." -ForegroundColor Green
        }
    } catch {
        Write-Warning "No se pudo verificar el puerto $puerto: $_"
    }
}
Write-Host "Verificación finalizada." -ForegroundColor Cyan
