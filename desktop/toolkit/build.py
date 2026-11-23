"""Builds Personal Design Toolkit.exe, LOADOUT on its own.

    py -3 desktop/toolkit/build.py

LOADOUT (loadout/index.html) is the only source since 2026-11-24. This copies
it and the shared files it loads into app/ (gitignored), then, with Go and
go-winres installed, embeds the icon and builds ../Personal Design Toolkit.exe,
which writes app/ to the PC and opens loadout/index.html?solo=1. Not a build
step for the suite: Motherbase runs LOADOUT straight from its folder.
"""
import glob
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
APP = os.path.join(HERE, "app")
NAME = "Personal Design Toolkit"


def main():
    if os.path.isdir(APP):
        shutil.rmtree(APP)
    os.makedirs(os.path.join(APP, "loadout"))
    for f in ("index.html", "manifest.json", "icon-192.png"):
        shutil.copy(os.path.join(REPO, "loadout", f), os.path.join(APP, "loadout", f))
    sh = os.path.join(APP, "shared")
    os.makedirs(sh)
    for f in glob.glob(os.path.join(REPO, "shared", "*.js")) + glob.glob(os.path.join(REPO, "shared", "*.json")):
        shutil.copy(f, sh)
    shutil.copytree(os.path.join(REPO, "shared", "fonts"), os.path.join(sh, "fonts"))
    print("Copied LOADOUT and the shared files into app/")

    go = shutil.which("go")
    if not go:
        sys.exit("Go is not installed, so the exe was not rebuilt.")
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
