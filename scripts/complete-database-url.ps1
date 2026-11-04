$ErrorActionPreference = 'Stop'
$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) '.env.local'
if (-not (Test-Path -LiteralPath $envPath)) { throw '.env.local was not found.' }
$lines = [System.Collections.Generic.List[string]]::new()
foreach ($line in [System.IO.File]::ReadAllLines($envPath)) { [void]$lines.Add($line) }
$matches = @(0..($lines.Count - 1) | Where-Object { $lines[$_] -match '^\s*postgres(?:ql)?://' })
if ($matches.Count -ne 1) { throw 'Expected exactly one standalone PostgreSQL URI in .env.local.' }
$index = $matches[0]
$value = $lines[$index].Trim()
if ($value -notmatch '\[[^\]]+\](?=@)') { throw 'The database password placeholder was not found in the URI.' }
$securePassword = Read-Host 'Database password (input is hidden)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ([string]::IsNullOrWhiteSpace($plainPassword)) { throw 'Password cannot be empty.' }
  $encodedPassword = [Uri]::EscapeDataString($plainPassword)
} finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
$value = [regex]::Replace($value, '\[[^\]]+\](?=@)', $encodedPassword)
$uri = $null
if (-not [Uri]::TryCreate($value, [UriKind]::Absolute, [ref]$uri)) { throw 'The resulting URI is invalid.' }
if ($uri.Host -notlike '*.pooler.supabase.com' -or $value -notmatch 'pcyvlhpjcvxokcbjardh') { throw 'The URI does not match this Supabase project.' }
$certificate = Join-Path (Split-Path -Parent $PSScriptRoot) 'certs/supabase-prod-ca-2021.crt'
if (-not (Test-Path -LiteralPath $certificate)) { throw 'The Supabase CA certificate is missing.' }
$builder = [UriBuilder]$value
$query = [System.Web.HttpUtility]::ParseQueryString($builder.Query)
$query.Set('sslmode', 'verify-full')
$query.Set('sslrootcert', (Resolve-Path -LiteralPath $certificate).Path)
$builder.Query = $query.ToString()
$value = $builder.Uri.AbsoluteUri
$lines[$index] = 'DATABASE_URL=' + $value
[System.IO.File]::WriteAllLines($envPath, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host 'DATABASE_URL saved locally. The password was not printed.'
