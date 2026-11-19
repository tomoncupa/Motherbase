"""Builds Personal Design Toolkit.exe from the page parts.

    py -3 desktop/toolkit/build.py

1. Joins page/ into index.html (the toolkit page, with its document head).
2. Also writes toolwall.html, the same page without a head and under its
   artifact name, for republishing the claude.ai copy.
3. If Go is installed, embeds the icon and version info (go-winres) and builds
   ../Personal Design Toolkit.exe. Without Go it stops after step 2.
"""
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "page")
NAME = "Personal Design Toolkit"
SKELETON = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);'
            'padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,'
            '-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}'
            '</style></head><body>')


def read(name):
    with open(os.path.join(PAGE, name), encoding="utf-8") as f:
        return f.read()


def page():
    src = read("page.src.html")
    flow = "\n".join(read(n) for n in ("flow.js", "words.js", "summary.js"))
    prompt = json.dumps(read("prompt.md")).replace("</", "<\\/")
    out = src.replace("%%DATA%%", read("data.js")).replace("%%FLOW%%", flow).replace("%%PROMPT%%", prompt)
    if "%%" in out:
        sys.exit("A placeholder was left in the page.")
    return out


def write(path, text):
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def main():
    art = page()
    write(os.path.join(HERE, "toolwall.html"), art)
    exe_page = art.replace("<title>Pattern Toolwall</title>", "<title>" + NAME + "</title>", 1)
    exe_page = exe_page.replace("<h1>Pattern Toolwall</h1>", "<h1>" + NAME + "</h1>", 1)
    write(os.path.join(HERE, "index.html"), SKELETON + exe_page + "</body></html>")
    print("Wrote index.html and toolwall.html")

    go = shutil.which("go")
    if not go:
        print("Go is not installed, so the exe was not rebuilt.")
        return
    env = dict(os.environ, GOOS="windows", GOARCH="amd64", CGO_ENABLED="0")
    winres = shutil.which("go-winres")
    if winres:
        subprocess.run([winres, "make", "--arch", "amd64"], cwd=HERE, check=True)
    else:
        print("go-winres is not installed, so the exe gets no icon: go install github.com/tc-hib/go-winres@v0.3.3")
    out = os.path.join(os.path.dirname(HERE), NAME + ".exe")
    subprocess.run([go, "build", "-trimpath", "-ldflags", "-H windowsgui -s -w", "-o", out, "."],
                   cwd=HERE, env=env, check=True)
    print("Built " + out)


if __name__ == "__main__":
    main()
