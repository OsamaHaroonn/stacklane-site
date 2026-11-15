# --------------------------------------------------------------
# l. JavaScript asset references
#
#   Every way a production script can point at a file, not just a
#   quoted ".js" literal: fetch, import/require, script injection,
#   .src / .href assignment, setAttribute, getAttribute, new URL(),
#   string concatenation and template literals.
#
#   Each hit is resolved from the base the code actually uses. A
#   reference that cannot be resolved statically is printed as
#   UNVERIFIED DYNAMIC REFERENCE instead of passing silently, and a
#   generated download filename is not treated as a missing asset.
# --------------------------------------------------------------
function Get-JsLiterals {
    param([string]$Text)
    $q = [char]39
    $d = [char]34
    $rx = "[" + $q + $d + "]([^" + $q + $d + "]{1,200})[" + $q + $d + "]"
    return @([regex]::Matches($Text, $rx) | ForEach-Object { $_.Groups[1].Value })
}

function Test-JsAssetExists {
    param([string]$Candidate, [string]$Root)
    if ([string]::IsNullOrWhiteSpace($Candidate)) { return $false }
    $full = $null
    try { $full = [System.IO.Path]::GetFullPath($Candidate) } catch { return $false }
    if (-not $full.StartsWith($Root, [System.StringComparison]::OrdinalIgnoreCase)) { return $false }
    if (Test-Path -LiteralPath $full -PathType Leaf) { return $true }
    if (Test-Path -LiteralPath $full -PathType Container) {
        return (Test-Path -LiteralPath (Join-Path $full 'index.html') -PathType Leaf)
    }
    if ([System.IO.Path]::GetExtension($full) -eq '') {
        if (Test-Path -LiteralPath ($full + '.html') -PathType Leaf) { return $true }
    }
    return $false
}

function Invoke-JsAssetScan {
    param([string]$Root)

    $bs   = [string][char]92
    $q    = [char]39
    $d    = [char]34
    $LIT  = "[" + $q + $d + "]([^" + $q + $d + "]+)[" + $q + $d + "]"
    $exts = 'js|mjs|json|svg|png|webp|jpg|jpeg|gif|ico|css|woff2?|ttf|otf|xml|txt|map|wasm|pdf|mp4|webm'

    $rxImport  = '(?:import\s*\(\s*|require\s*\(\s*|from\s+)' + $LIT
    $rxNewUrl  = 'new\s+URL\s*\(\s*'
    $rxFetch   = 'fetch\s*\(\s*'
    $rxSetAttr = 'setAttribute\s*\(\s*[' + $q + $d + '](?:src|href)[' + $q + $d + ']\s*,\s*' + $LIT
    $rxSrc     = '\.src\s*=\s*'
    $rxHref    = '\.href\s*=\s*'
    $rxGetAttr = 'getAttribute\s*\(\s*[' + $q + $d + ']src[' + $q + $d + ']'
    $rxScript  = 'createElement\s*\(\s*[' + $q + $d + ']script[' + $q + $d + ']'

    $patterns = [ordered]@{
        'fetch'        = 0
        'import'       = 0
        'element-src'  = 0
        'src-assign'   = 0
        'href-assign'  = 0
        'setAttribute' = 0
        'getAttribute' = 0
        'new URL'      = 0
        'concat'       = 0
        'template'     = 0
    }
    $resolved = New-Object System.Collections.ArrayList
    $unresolved = New-Object System.Collections.ArrayList
    $dynamic = New-Object System.Collections.ArrayList
    $runtime = New-Object System.Collections.ArrayList
    $ignored = New-Object System.Collections.ArrayList

    $files = @(Get-ChildItem -Path $Root -Recurse -File -Filter '*.js' -ErrorAction SilentlyContinue)
    $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd([char]92)
    $refs = 0

    foreach ($f in $files) {
        $rel = $f.FullName.Substring($rootFull.Length).TrimStart([char]92)
        $rel = $rel.Replace([string][char]92, '/')
        $jsDir = Split-Path $f.FullName -Parent
        $jsParent = Split-Path $jsDir -Parent
        $lines = @(Get-Content -Path $f.FullName -Encoding UTF8 -ErrorAction SilentlyContinue)
        $pendingScript = $false

        for ($i = 0; $i -lt $lines.Count; $i++) {
            $ln = $lines[$i]
            $n = $i + 1
            $trim = $ln.Trim()
            if ($trim.Length -eq 0) { continue }
            if ($trim.StartsWith('//') -or $trim.StartsWith('*') -or $trim.StartsWith('/*')) {
                if ($ln -match $rxScript) { $pendingScript = $true }
                continue
            }

            $kind = $null
            if     ($ln -match $rxImport)  { $kind = 'import' }
            elseif ($ln -match $rxNewUrl)  { $kind = 'new URL' }
            elseif ($ln -match $rxFetch)   { $kind = 'fetch' }
            elseif ($ln -match $rxSetAttr) { $kind = 'setAttribute' }
            elseif ($ln -match $rxSrc)     { if ($pendingScript) { $kind = 'element-src' } else { $kind = 'src-assign' } }
            elseif ($ln -match $rxHref)    { $kind = 'href-assign' }
            elseif ($ln -match $rxGetAttr) { $kind = 'getAttribute' }

            $isScript = ($ln -match $rxScript)

            if ($kind -ne $null) {
                $refs++
                $patterns[$kind] = $patterns[$kind] + 1
                if ($ln -match '\$\{') { $patterns['template'] = $patterns['template'] + 1 }
                elseif ($ln -match '\+') { $patterns['concat'] = $patterns['concat'] + 1 }

                $where = $rel + ':' + $n
                $lits = @(Get-JsLiterals $ln)

                if ($kind -eq 'getAttribute') {
                    [void]$dynamic.Add($where + '  getAttribute("src")  value comes from the runtime DOM, not a file in the bundle')
                }
                else {
                    $pathLits = @()
                    foreach ($l in $lits) {
                        if ($l -match ('^(https?:)?//')) { continue }
                        if ($l -match '^(data|blob|mailto|tel|javascript):') { continue }
                        if ($l.StartsWith('#')) { continue }
                        # "+ '.json'" and similar are fragments of a path built elsewhere
                        if ($l -match '^\.\w+$') { continue }
                        if ($l.Contains('/')) { $pathLits += $l; continue }
                        if ($l -match ('\.(' + $exts + ')$')) { $pathLits += $l }
                    }

                    if ($pathLits.Count -eq 0) {
                        if ($ln -match 'mailto:|tel:|javascript:') {
                            [void]$ignored.Add($where + '  ' + $trim)
                        }
                        elseif ($ln -match 'createObjectURL|Blob\s*\(|\.value\b|\burl\b|location\.') {
                            [void]$runtime.Add($where + '  ' + $trim)
                        }
                        else {
                            [void]$dynamic.Add($where + '  ' + $trim)
                        }
                    }
                    else {
                        foreach ($r in $pathLits) {
                            $isDynamic = ($ln -match '\+') -or ($ln -match '\$\{')
                            if ($isDynamic -and ($r.EndsWith('/') -or -not ($r -match ('\.(' + $exts + ')$')))) {
                                [void]$dynamic.Add($where + '  ' + $r + '  (built at runtime: ' + $trim + ')')
                                continue
                            }
                            $cands = New-Object System.Collections.ArrayList
                            if ($r.StartsWith('/')) {
                                [void]$cands.Add((Join-Path $rootFull ($r.TrimStart('/') -replace '/', $bs)))
                            }
                            else {
                                [void]$cands.Add((Join-Path $jsDir ($r -replace '/', $bs)))
                                if ($kind -eq 'new URL') {
                                    $clean = ($r -replace '^(\.\./)+', '') -replace '/', $bs
                                    [void]$cands.Add((Join-Path $jsParent $clean))
                                    [void]$cands.Add((Join-Path $rootFull $clean))
                                }
                            }
                            $ok = $false
                            foreach ($c in $cands) {
                                if (Test-JsAssetExists -Candidate $c -Root $rootFull) { $ok = $true; break }
                            }
                            if ($ok) { [void]$resolved.Add($where + '  ' + $kind + '  ' + $r) }
                            else     { [void]$unresolved.Add($where + '  ' + $kind + '  ' + $r) }
                        }
                    }
                }
            }

            if ($isScript) { $pendingScript = $true }
            elseif ($pendingScript) { $pendingScript = $false }
        }
    }

    return [pscustomobject]@{
        Files      = $files.Count
        Refs       = $refs
        Patterns   = $patterns
        Resolved   = $resolved
        Unresolved = $unresolved
        Dynamic    = $dynamic
        Runtime    = $runtime
        Ignored    = $ignored
    }
}

# Fixtures: prove the scanner catches what it is meant to catch, and that a
# download filename is not mistaken for an asset, before trusting its verdict
# on the real bundle.
function Test-JsAssetChecker {
    $tmp = Join-Path $env:TEMP ('stacklane-jsfix-' + [guid]::NewGuid().ToString('N'))
    $lines = New-Object System.Collections.ArrayList
    $ok = $false
    try {
        $files = @{}
        $files['assets/data/ok.json'] = '{}'
        $files['assets/vendor/ok.js'] = '// fixture'
        $files['assets/img/ok.png'] = 'x'
        $files['assets/x.css'] = '.a{color:#000}'
        $files['assets/tools/good.js'] = @(
            'fetch("/assets/data/ok.json");',
            'var s=document.createElement("script"); s.src="/assets/vendor/ok.js";',
            'var l=document.createElement("link"); l.href="../x.css";',
            'var i=new Image(); i.src="../img/ok.png";',
            'var u=new URL("i18n/" + lang + ".json", here).href;',
            'TK.download(blob, "qr-code.png");',
            'link.setAttribute("href", "/assets/x.css");'
        ) -join "`n"
        $files['assets/tools/broken.js'] = @(
            'var s=document.createElement("script"); s.src="../vendor/missing.js";',
            'fetch("data/missing.json");'
        ) -join "`n"

        foreach ($k in $files.Keys) {
            $p = Join-Path $tmp ($k -replace '/', [string][char]92)
            $dir = Split-Path $p -Parent
            if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
            Set-Content -Path $p -Value $files[$k] -Encoding UTF8
        }

        $r = Invoke-JsAssetScan -Root $tmp

        $unres = @($r.Unresolved)
        $hitJs = @($unres | Where-Object { $_ -match 'missing\.js$' }).Count
        $hitJson = @($unres | Where-Object { $_ -match 'missing\.json$' }).Count
        $falseFail = @($unres | Where-Object { $_ -match 'qr-code\.png' }).Count
        $dyn = @($r.Dynamic).Count
        $res = @($r.Resolved).Count

        [void]$lines.Add('FIXTURE files=2 refs=' + $r.Refs + ' resolved=' + $res + ' unresolved=' + $unres.Count + ' dynamic=' + $dyn + ' runtime=' + @($r.Runtime).Count + ' ignored=' + @($r.Ignored).Count)
        foreach ($u in $unres) { [void]$lines.Add('FIXTURE unresolved ' + $u) }
        foreach ($d in $r.Dynamic) { [void]$lines.Add('FIXTURE dynamic    ' + $d) }
        [void]$lines.Add('FIXTURE checks: missing-js=' + $hitJs + ' missing-json=' + $hitJson + ' qr-code-false-failure=' + $falseFail)

        $ok = ($hitJs -eq 1) -and ($hitJson -eq 1) -and ($falseFail -eq 0) -and ($dyn -ge 1) -and ($res -ge 4)
    }
    catch {
        [void]$lines.Add('FIXTURE error: ' + $_)
        $ok = $false
    }
    finally {
        if (Test-Path $tmp) { Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue }
    }
    return [pscustomobject]@{ Ok = $ok; Lines = $lines }
}

Log ""
Log "--- Step l: JS asset references ---"

$jsFixtures = Test-JsAssetChecker
foreach ($l in $jsFixtures.Lines) { Log $l }
Record -Name "JS asset fixtures" -Ok $jsFixtures.Ok -Detail ("planted: missing-js, missing-json, dynamic-locale, createElement, href/src, download-name")

$jsScan = Invoke-JsAssetScan -Root $PUBLIC

foreach ($k in $jsScan.Patterns.Keys) { Log ("JS pattern " + $k.PadRight(13) + " = " + $jsScan.Patterns[$k]) }
foreach ($u in $jsScan.Unresolved) { Log ("JS-UNRESOLVED " + $u) }
foreach ($d in $jsScan.Dynamic)    { Log ("UNVERIFIED DYNAMIC REFERENCE  " + $d) }

Log ("JS files scanned : " + $jsScan.Files)
Log ("JS refs checked  : " + $jsScan.Refs)
Log ("JS resolved      : " + @($jsScan.Resolved).Count)
Log ("JS unresolved    : " + @($jsScan.Unresolved).Count)
Log ("JS dynamic       : " + @($jsScan.Dynamic).Count)
Log ("JS runtime-only  : " + @($jsScan.Runtime).Count + " (object URLs and variables: no file to resolve)")
Log ("JS ignored       : " + @($jsScan.Ignored).Count + " (mailto/external/inline)")

Record -Name "JS asset refs" -Ok (@($jsScan.Unresolved).Count -eq 0) -Detail ("files=" + $jsScan.Files + " refs=" + $jsScan.Refs + " resolved=" + @($jsScan.Resolved).Count + " unresolved=" + @($jsScan.Unresolved).Count + " dynamic=" + @($jsScan.Dynamic).Count)

