// Personal Design Toolkit: LOADOUT on its own, for a computer without Motherbase.
// The program carries loadout/index.html and the shared files it loads. On each
// start they are written to %LOCALAPPDATA%\Personal Design Toolkit\app\ and
// loadout/index.html?solo=1 is opened in Microsoft Edge (or Chrome) as an app
// window with a private profile, so entries saved in it stay on this computer
// between sessions. The profile is the one the old toolkit used, so its saved
// work is still there and LOADOUT moves it into its rows on the first open.
package main

import (
	"embed"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

//go:embed all:app
var files embed.FS

func main() {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	root := filepath.Join(base, "Personal Design Toolkit")
	appDir := filepath.Join(root, "app")
	profile := filepath.Join(root, "profile")
	err := fs.WalkDir(files, "app", func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		dst := filepath.Join(root, filepath.FromSlash(p))
		if d.IsDir() {
			return os.MkdirAll(dst, 0o755)
		}
		b, err := files.ReadFile(p)
		if err != nil {
			return err
		}
		return os.WriteFile(dst, b, 0o644)
	})
	if err != nil {
		fail("Could not write the toolkit to " + appDir + ".\n\n" + err.Error())
		return
	}
	_ = os.MkdirAll(profile, 0o755)
	file := filepath.Join(appDir, "loadout", "index.html")
	url := "file:///" + strings.ReplaceAll(file, `\`, "/") + "?solo=1"

	for _, b := range browsers() {
		if _, err := os.Stat(b); err != nil {
			continue
		}
		cmd := exec.Command(b,
			"--app="+url,
			"--user-data-dir="+profile,
			"--window-size=1400,900",
			"--no-first-run",
			"--no-default-browser-check",
			"--disable-features=msImplicitSignin,msEdgeSidebarV2",
		)
		cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
		if cmd.Start() == nil {
			return
		}
	}
	// No Edge or Chrome found: hand the page to the default browser.
	cmd := exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if cmd.Start() != nil {
		fail("Could not open a browser. Open this file yourself:\n\n" + file)
	}
}

func browsers() []string {
	var out []string
	for _, env := range []string{"ProgramFiles(x86)", "ProgramFiles", "LOCALAPPDATA"} {
		dir := os.Getenv(env)
		if dir == "" {
			continue
		}
		out = append(out,
			filepath.Join(dir, `Microsoft\Edge\Application\msedge.exe`),
			filepath.Join(dir, `Google\Chrome\Application\chrome.exe`),
		)
	}
	return out
}

func fail(msg string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	box := user32.NewProc("MessageBoxW")
	t, _ := syscall.UTF16PtrFromString(msg)
	c, _ := syscall.UTF16PtrFromString("Personal Design Toolkit")
	box.Call(0, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), 0x10)
}
