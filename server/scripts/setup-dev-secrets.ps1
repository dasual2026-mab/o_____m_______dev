# 개발용 프로젝트의 비밀 값을 만든다. 대표가 직접 돌린다.
# 값은 화면에 나오지 않고 저장소에도 남지 않는다.
#
# 하는 일
#   1. 키 아홉 가지와 앱 서버 접속 역할(svc_app)의 비밀번호를 무작위로 만든다.
#   2. svc_app이 로그인할 수 있게 하고 그 비밀번호를 건다.
#   3. Edge Functions 비밀 값 저장소에 넣는다.
#   4. 사본을 사용자 폴더의 om-dev-secrets.env에 남긴다. 비밀번호 관리 도구로 옮긴 뒤 지운다.
#
# 돌리는 곳: server 폴더
#   powershell -ExecutionPolicy Bypass -File scripts\setup-dev-secrets.ps1

$ErrorActionPreference = 'Stop'
$ref = (Get-Content supabase\.temp\project-ref -Raw).Trim()
if (-not $ref) { throw '먼저 supabase link를 돌리세요.' }
$cli = 'supabase@3.4.0'

function New-Secret {
  $bytes = New-Object byte[] 32
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

$backup = Join-Path $env:USERPROFILE 'om-dev-secrets.env'
if (Test-Path $backup) { throw "$backup 이 이미 있습니다. 앞서 만든 값을 덮어쓰지 않으려고 멈춥니다." }

$dbPassword = New-Secret
$values = [ordered]@{
  OM_ENV                 = 'dev'
  OM_MIN_VERSION         = '1.0.0'
  OM_DB_URL_APP          = "postgresql://svc_app.$($ref):$dbPassword@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"
  OM_KEY_SIGNING_CURRENT = '1'
  OM_KEY_SIGNING_1       = New-Secret
  OM_KEY_PSEUDONYM       = New-Secret
  OM_KEY_CI              = New-Secret
  OM_KEY_PHONE           = New-Secret
  OM_KEY_NONUSER         = New-Secret
  OM_KEY_PII_CURRENT     = '1'
  OM_KEY_PII_1           = New-Secret
  OM_KEY_LINK_CURRENT    = '1'
  OM_KEY_LINK_1          = New-Secret
  OM_KEY_MESSAGE_CURRENT = '1'
  OM_KEY_MESSAGE_1       = New-Secret
  OM_KEY_ARCHIVE_CURRENT = '1'
  OM_KEY_ARCHIVE_1       = New-Secret
}

$tmp = Join-Path $env:TEMP ("om-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory $tmp | Out-Null
try {
  Write-Host '1/3 svc_app의 로그인을 겁니다.'
  $sqlFile = Join-Path $tmp 'role.sql'
  [IO.File]::WriteAllText($sqlFile, "alter role svc_app login password '$dbPassword';")
  npx --yes $cli db query --remote --yes --file $sqlFile | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'svc_app 로그인을 걸지 못했습니다.' }

  Write-Host '2/3 Edge Functions 비밀 값에 넣습니다.'
  $envFile = Join-Path $tmp 'secrets.env'
  $lines = $values.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }
  [IO.File]::WriteAllLines($envFile, [string[]]$lines)
  npx --yes $cli secrets set --env-file $envFile --yes | Out-Null
  if ($LASTEXITCODE -ne 0) { throw '비밀 값을 넣지 못했습니다.' }

  Write-Host '3/3 사본을 남깁니다.'
  [IO.File]::WriteAllLines($backup, [string[]]$lines)
  Write-Host ''
  Write-Host "끝났습니다. 사본: $backup"
  Write-Host '이 파일을 비밀번호 관리 도구로 옮긴 뒤 지우세요. 대화창에 붙여 넣지 마세요.'
}
finally {
  Remove-Item -Recurse -Force $tmp
}
