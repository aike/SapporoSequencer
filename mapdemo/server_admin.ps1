# 以下のショートカットを作成し、右クリック→管理者権限で実行する
# C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy RemoteSigned -File D:\src\js\SapporoSequencer\mapdemo\server_admin.ps1

param($Port = 80)

$IndexPage = 'index.html'
$hostIP = [Net.Dns]::GetHostAddresses('').IPAddressToString[1]
$urlRoot = "http://${hostIp}:$Port/"
$parentPath = $pwd

$listener = New-Object Net.HttpListener
$listener.Prefixes.add($urlRoot)

try{
  "start server... "|oh
  $urlRoot |oh
  try {
    $listener.Start()
  } finally {
    start ($urlRoot + $IndexPage)
  }

  $row = -1
  $col = -1
  $geodata = "[${col},${row}]"

  while ($true){
    $ctx = $listener.GetContext()
    if (-not $ctx.Request.isLocal) {
      continue
    }

    $req = $ctx.Request
    $res = $ctx.Response

    ($url = $req.RawUrl)|oh
    $path = $url.TrimStart('/').split("?")[0]
    if (!$path) {
      $path = $IndexPage
    }

    $fullPath = [IO.Path]::Combine($parentPath, $path)
    $content = [byte[]]@()
    switch ($path) {

      'pad/00' { $row = 0*2; $col = 0; $geodata = "[${col},${row}]" }
      'pad/01' { $row = 0*2; $col = 1; $geodata = "[${col},${row}]" }
      'pad/02' { $row = 0*2; $col = 2; $geodata = "[${col},${row}]" }
      'pad/03' { $row = 0*2; $col = 3; $geodata = "[${col},${row}]" }
      'pad/04' { $row = 0*2; $col = 4; $geodata = "[${col},${row}]" }
      'pad/05' { $row = 0*2; $col = 5; $geodata = "[${col},${row}]" }
      'pad/06' { $row = 0*2; $col = 6; $geodata = "[${col},${row}]" }
      'pad/07' { $row = 0*2; $col = 7; $geodata = "[${col},${row}]" }

      'pad/10' { $row = 1*2; $col = 0; $geodata = "[${col},${row}]" }
      'pad/11' { $row = 1*2; $col = 1; $geodata = "[${col},${row}]" }
      'pad/12' { $row = 1*2; $col = 2; $geodata = "[${col},${row}]" }
      'pad/13' { $row = 1*2; $col = 3; $geodata = "[${col},${row}]" }
      'pad/14' { $row = 1*2; $col = 4; $geodata = "[${col},${row}]" }
      'pad/15' { $row = 1*2; $col = 5; $geodata = "[${col},${row}]" }
      'pad/16' { $row = 1*2; $col = 6; $geodata = "[${col},${row}]" }
      'pad/17' { $row = 1*2; $col = 7; $geodata = "[${col},${row}]" }  

      'pad/20' { $row = 2*2; $col = 0; $geodata = "[${col},${row}]" }
      'pad/21' { $row = 2*2; $col = 1; $geodata = "[${col},${row}]" }
      'pad/22' { $row = 2*2; $col = 2; $geodata = "[${col},${row}]" }
      'pad/23' { $row = 2*2; $col = 3; $geodata = "[${col},${row}]" }
      'pad/24' { $row = 2*2; $col = 4; $geodata = "[${col},${row}]" }
      'pad/25' { $row = 2*2; $col = 5; $geodata = "[${col},${row}]" }
      'pad/26' { $row = 2*2; $col = 6; $geodata = "[${col},${row}]" }
      'pad/27' { $row = 2*2; $col = 7; $geodata = "[${col},${row}]" }  

      'pad/30' { $row = 3*2; $col = 0; $geodata = "[${col},${row}]" }
      'pad/31' { $row = 3*2; $col = 1; $geodata = "[${col},${row}]" }
      'pad/32' { $row = 3*2; $col = 2; $geodata = "[${col},${row}]" }
      'pad/33' { $row = 3*2; $col = 3; $geodata = "[${col},${row}]" }
      'pad/34' { $row = 3*2; $col = 4; $geodata = "[${col},${row}]" }
      'pad/35' { $row = 3*2; $col = 5; $geodata = "[${col},${row}]" }
      'pad/36' { $row = 3*2; $col = 6; $geodata = "[${col},${row}]" }
      'pad/37' { $row = 3*2; $col = 7; $geodata = "[${col},${row}]" }  

      'pad/40' { $row = 4*2; $col = 0; $geodata = "[${col},${row}]" }
      'pad/41' { $row = 4*2; $col = 1; $geodata = "[${col},${row}]" }
      'pad/42' { $row = 4*2; $col = 2; $geodata = "[${col},${row}]" }
      'pad/43' { $row = 4*2; $col = 3; $geodata = "[${col},${row}]" }
      'pad/44' { $row = 4*2; $col = 4; $geodata = "[${col},${row}]" }
      'pad/45' { $row = 4*2; $col = 5; $geodata = "[${col},${row}]" }
      'pad/46' { $row = 4*2; $col = 6; $geodata = "[${col},${row}]" }
      'pad/47' { $row = 4*2; $col = 7; $geodata = "[${col},${row}]" }  

      'pad/50' { $row = 5*2; $col = 0; $geodata = "[${col},${row}]" }
      'pad/51' { $row = 5*2; $col = 1; $geodata = "[${col},${row}]" }
      'pad/52' { $row = 5*2; $col = 2; $geodata = "[${col},${row}]" }
      'pad/53' { $row = 5*2; $col = 3; $geodata = "[${col},${row}]" }
      'pad/54' { $row = 5*2; $col = 4; $geodata = "[${col},${row}]" }
      'pad/55' { $row = 5*2; $col = 5; $geodata = "[${col},${row}]" }
      'pad/56' { $row = 5*2; $col = 6; $geodata = "[${col},${row}]" }
      'pad/57' { $row = 5*2; $col = 7; $geodata = "[${col},${row}]" }  

      'geodata'{ 
        $content = [System.Text.Encoding]::UTF8.GetBytes($geodata) 
      }

      Default {
        if ([IO.File]::Exists($fullPath)) {
          $content = [IO.File]::ReadAllBytes($fullPath)
        } else {
          $res.StatusCode = 404
        }
      }
    }

    $res.OutputStream.Write($content, 0, $content.Length)
    $res.Close()
  }
} finally {
  $listener.Dispose()
}
pause
