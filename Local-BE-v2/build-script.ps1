write-output "Building the Agent.."
set-location companion
write-output "Stopping any running instances of Nexus.."
dotnet run --stop
Start-Sleep 5

Write-Output "Compiling the nexus companion exe file..."
dotnet publish -c Release -r win-x64 --self-contained `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -p:OutputType=Exe `
    -o ./dist
set-location ..

if (Test-Path "./companion/dist/nexus.exe") {
    Copy-Item "./companion/dist/nexus.exe" -Destination "./nexus.exe" -Force
}

