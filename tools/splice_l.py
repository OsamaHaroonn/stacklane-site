import io, os

bp = r"C:\Users\Osama Haroon\Documents\stacklane\qa\build.ps1"
sec = io.open(r"tools\jscheck_section.ps1", encoding="utf-8").read()

t = io.open(bp, encoding="utf-8").read()
start = t.index("# l. JS-referenced asset paths")
s = t.rindex("# -----", 0, start)
end = t.index("# m. Local server checks")
e = t.rindex("# -----", 0, end)

new = sec
t = t[:s] + new + t[e:]
io.open(bp, "w", encoding="utf-8", newline="\r\n").write(t)
print("build.ps1 rewritten:", len(t), "chars")
for k in ["Invoke-JsAssetScan", "Test-JsAssetChecker", "UNVERIFIED DYNAMIC REFERENCE", "JS asset fixtures", "JS asset refs"]:
    print("  contains %-30s %s" % (k, k in t))
print("  old jsRefPattern left:", t.count("jsRefPattern"))
