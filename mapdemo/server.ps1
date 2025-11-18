param($Port = 3000)

$IndexPage = 'index.html'
$urlRoot = "http://localhost:$Port/"
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

    $row = -1
    $col = -1
    $geodata = "[${row},${col}]"

    $fullPath = [IO.Path]::Combine($parentPath, $path)
    $content = [byte[]]@()
    switch ($path) {

      'pad/00' { $row = 0; $col = 0; $geodata = "[${row},${col}]" }
      'pad/01' { $row = 0; $col = 1; $geodata = "[${row},${col}]" }
      'pad/02' { $row = 0; $col = 2; $geodata = "[${row},${col}]" }
      'pad/03' { $row = 0; $col = 3; $geodata = "[${row},${col}]" }
      'pad/04' { $row = 0; $col = 4; $geodata = "[${row},${col}]" }
      'pad/05' { $row = 0; $col = 5; $geodata = "[${row},${col}]" }
      'pad/06' { $row = 0; $col = 6; $geodata = "[${row},${col}]" }
      'pad/07' { $row = 0; $col = 7; $geodata = "[${row},${col}]" }

      'pad/10' { $row = 1; $col = 0; $geodata = "[${row},${col}]" }
      'pad/11' { $row = 1; $col = 1; $geodata = "[${row},${col}]" }
      'pad/12' { $row = 1; $col = 2; $geodata = "[${row},${col}]" }
      'pad/13' { $row = 1; $col = 3; $geodata = "[${row},${col}]" }
      'pad/14' { $row = 1; $col = 4; $geodata = "[${row},${col}]" }
      'pad/15' { $row = 1; $col = 5; $geodata = "[${row},${col}]" }
      'pad/16' { $row = 1; $col = 6; $geodata = "[${row},${col}]" }
      'pad/17' { $row = 1; $col = 7; $geodata = "[${row},${col}]" }  

      'pad/20' { $row = 2; $col = 0; $geodata = "[${row},${col}]" }
      'pad/21' { $row = 2; $col = 1; $geodata = "[${row},${col}]" }
      'pad/22' { $row = 2; $col = 2; $geodata = "[${row},${col}]" }
      'pad/23' { $row = 2; $col = 3; $geodata = "[${row},${col}]" }
      'pad/24' { $row = 2; $col = 4; $geodata = "[${row},${col}]" }
      'pad/25' { $row = 2; $col = 5; $geodata = "[${row},${col}]" }
      'pad/26' { $row = 2; $col = 6; $geodata = "[${row},${col}]" }
      'pad/27' { $row = 2; $col = 7; $geodata = "[${row},${col}]" }  

      'pad/30' { $row = 3; $col = 0; $geodata = "[${row},${col}]" }
      'pad/31' { $row = 3; $col = 1; $geodata = "[${row},${col}]" }
      'pad/32' { $row = 3; $col = 2; $geodata = "[${row},${col}]" }
      'pad/33' { $row = 3; $col = 3; $geodata = "[${row},${col}]" }
      'pad/34' { $row = 3; $col = 4; $geodata = "[${row},${col}]" }
      'pad/35' { $row = 3; $col = 5; $geodata = "[${row},${col}]" }
      'pad/36' { $row = 3; $col = 6; $geodata = "[${row},${col}]" }
      'pad/37' { $row = 3; $col = 7; $geodata = "[${row},${col}]" }  

      'pad/40' { $row = 4; $col = 0; $geodata = "[${row},${col}]" }
      'pad/41' { $row = 4; $col = 1; $geodata = "[${row},${col}]" }
      'pad/42' { $row = 4; $col = 2; $geodata = "[${row},${col}]" }
      'pad/43' { $row = 4; $col = 3; $geodata = "[${row},${col}]" }
      'pad/44' { $row = 4; $col = 4; $geodata = "[${row},${col}]" }
      'pad/45' { $row = 4; $col = 5; $geodata = "[${row},${col}]" }
      'pad/46' { $row = 4; $col = 6; $geodata = "[${row},${col}]" }
      'pad/47' { $row = 4; $col = 7; $geodata = "[${row},${col}]" }  

      'pad/50' { $row = 5; $col = 0; $geodata = "[${row},${col}]" }
      'pad/51' { $row = 5; $col = 1; $geodata = "[${row},${col}]" }
      'pad/52' { $row = 5; $col = 2; $geodata = "[${row},${col}]" }
      'pad/53' { $row = 5; $col = 3; $geodata = "[${row},${col}]" }
      'pad/54' { $row = 5; $col = 4; $geodata = "[${row},${col}]" }
      'pad/55' { $row = 5; $col = 5; $geodata = "[${row},${col}]" }
      'pad/56' { $row = 5; $col = 6; $geodata = "[${row},${col}]" }
      'pad/57' { $row = 5; $col = 7; $geodata = "[${row},${col}]" }  

      'geodata'{ $content = [System.Text.Encoding]::UTF8.GetBytes($geodata) }

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
