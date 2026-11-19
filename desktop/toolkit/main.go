// Personal Design Toolkit: opens the toolkit in its own window.
// The page is carried inside this program. On each start it is written to
// %LOCALAPPDATA%\Personal Design Toolkit\app\index.html and opened in Microsoft
// Edge (or Chrome) as an app window with a private profile, so entries saved
// in the toolkit stay on this computer between sessions.
package main

import (
	_ "embed"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

//go:embed index.html
var page []byte

func main() {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	root := filepath.Join(base, "Personal Design Toolkit")
	appDir := filepath.Join(root, "app")
	profile := filepath.Join(root, "profile")
	if err := os.MkdirAll(appDir, 0o755); err != nil {
		fail("Could not create the folder " + appDir + ".\n\n" + err.Error())
		return
	}
	_ = os.MkdirAll(profile, 0o755)
	file := filepath.Join(appDir, "index.html")
	if err := os.WriteFile(file, page, 0o644); err != nil {
		fail("Could not write the toolkit to " + file + ".\n\n" + err.Error())
		return
	}
	url := "file:///" + strings.ReplaceAll(file, `\`, "/")

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
