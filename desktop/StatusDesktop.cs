/* ══════════════ STATUS Desktop tracker ══════════════
   The launcher. It is not the app: STATUS is still one HTML file, and this
   opens it in a Chrome window with no browser chrome, using Tom's ordinary
   Chrome profile so the data in it is the data he already has. Point a
   separate browser at it and you get a second, empty STATUS. That is the
   whole reason this is a launcher and not a standalone program.

   It does the three things a web page is not allowed to do for itself:

     · keeps the window above everything else
     · resizes it down to the strip when the page asks
     · catches Ctrl+B while another program is in front

   It cannot see inside the page, and the page cannot move its own window,
   so the two talk through the window title. The page puts a word on the
   end of its title, this reads it twice a second and acts on it. The page
   wipes the word a second later. Three words: small, big, show.

   Built by build.ps1 with the C# compiler that ships inside Windows, so
   there is nothing to install and nothing to download.                    */

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;

class Launcher : Form
{
    /* ── the Windows calls ── */
    [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint vk);
    [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h, int id);
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint f);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowTextW(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassNameW(IntPtr h, StringBuilder s, int n);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr p);
    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    delegate bool EnumProc(IntPtr h, IntPtr p);
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }

    static readonly IntPtr TOPMOST = new IntPtr(-1);
    static readonly IntPtr NOTOPMOST = new IntPtr(-2);
    const uint SWP_NOSIZE = 0x0001, SWP_NOMOVE = 0x0002, SWP_NOACTIVATE = 0x0010, SWP_SHOWWINDOW = 0x0040;
    const int SW_RESTORE = 9;
    const int WM_HOTKEY = 0x0312;
    const int HOTKEY_ID = 0xB01;
    const uint MOD_ALT = 0x1, MOD_CONTROL = 0x2, MOD_SHIFT = 0x4;

    /* The title the page sets. Matching on the front of it, because the
       instruction word is stuck on the end. */
    const string TITLE = "STATUS Desktop tracker";
    /* The strip, in pixels. Chrome keeps its own slim title bar on an app
       window, so this is a little taller than the strip the page draws. */
    const int SMALL_W = 470, SMALL_H = 118;

    string root;                 /* the Motherbase folder */
    string cfgPath;
    IntPtr win = IntPtr.Zero;    /* the STATUS window, once it exists */
    bool onTop = true;
    bool small = false;
    RECT bigRect;                /* where it was before it went small */
    bool haveBig = false;
    string hotkey = "ctrl+b";
    NotifyIcon tray;
    Timer poll, tap;
    MenuItem miTop;

    [STAThread]
    static void Main()
    {
        Application.EnableVisualStyles();
        Application.Run(new Launcher());
    }

    public Launcher()
    {
        root = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
        cfgPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "launcher.txt");
        ShowInTaskbar = false;
        WindowState = FormWindowState.Minimized;
        CreateHandle();
        try { File.Delete(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "launcher.log")); } catch { }
        LoadCfg();

        string page = Path.Combine(root, "status", "index.html");
        if (!File.Exists(page))
        {
            MessageBox.Show("Could not find STATUS at\n\n" + page +
                "\n\nThis program has to sit in the desktop folder inside Motherbase.",
                TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.Exit(1);
        }

        string chrome = FindChrome();
        if (chrome == null)
        {
            MessageBox.Show("Could not find Chrome.\n\nSTATUS Desktop tracker opens STATUS in " +
                "Chrome on purpose, so that it uses the data you already have.",
                TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.Exit(1);
        }

        BuildTray();
        RegisterTheHotkey();

        string url = new Uri(page).AbsoluteUri + "?desktop=1";
        try { Process.Start(chrome, "--app=" + url); }
        catch (Exception e)
        {
            MessageBox.Show("Chrome would not start.\n\n" + e.Message, TITLE);
            Environment.Exit(1);
        }

        poll = new Timer();
        poll.Interval = 500;
        poll.Tick += (s, e) => Poll();
        poll.Start();
    }

    /* a form that is never shown */
    protected override void SetVisibleCore(bool value) { base.SetVisibleCore(false); }

    /* ── settings, one line each, next to the exe ── */
    void LoadCfg()
    {
        try
        {
            if (!File.Exists(cfgPath)) return;
            foreach (string line in File.ReadAllLines(cfgPath))
            {
                int eq = line.IndexOf('=');
                if (eq < 1) continue;
                string k = line.Substring(0, eq).Trim(), v = line.Substring(eq + 1).Trim();
                if (k == "hotkey") hotkey = v.ToLowerInvariant();
                if (k == "ontop") onTop = (v != "0");
            }
        }
        catch { }
    }

    void SaveCfg()
    {
        try
        {
            File.WriteAllText(cfgPath,
                "# STATUS Desktop tracker. Delete this file to go back to the defaults.\r\n" +
                "hotkey=" + hotkey + "\r\n" +
                "ontop=" + (onTop ? "1" : "0") + "\r\n");
        }
        catch { }
    }

    /* ── Chrome, wherever it is ── */
    static string FindChrome()
    {
        string local = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string[] guesses = {
            @"C:\Program Files\Google\Chrome\Application\chrome.exe",
            @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            Path.Combine(local, @"Google\Chrome\Application\chrome.exe"),
        };
        foreach (string g in guesses) if (File.Exists(g)) return g;
        try
        {
            using (var k = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(
                @"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"))
            {
                if (k != null)
                {
                    string p = k.GetValue("") as string;
                    if (p != null && File.Exists(p)) return p;
                }
            }
        }
        catch { }
        return null;
    }

    /* ── the tray ── */
    void BuildTray()
    {
        var menu = new ContextMenu();
        menu.MenuItems.Add(new MenuItem("Open STATUS", (s, e) => Raise()));
        menu.MenuItems.Add("-");
        miTop = new MenuItem("Always on top", (s, e) =>
        {
            onTop = !onTop;
            miTop.Checked = onTop;
            SaveCfg();
            if (IsWindow(win))
                SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, 0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        });
        miTop.Checked = onTop;
        menu.MenuItems.Add(miTop);

        /* Ctrl+B is bold in every program that has bold. Taking it here takes
           it everywhere, so the other two are one click away. */
        var keys = new MenuItem("Bullet hotkey");
        string[] opts = { "ctrl+b", "ctrl+alt+b", "ctrl+shift+b" };
        string[] names = { "Ctrl+B", "Ctrl+Alt+B", "Ctrl+Shift+B" };
        for (int i = 0; i < opts.Length; i++)
        {
            string opt = opts[i];
            var mi = new MenuItem(names[i]);
            mi.Checked = (hotkey == opt);
            mi.Click += (s, e) =>
            {
                hotkey = opt;
                SaveCfg();
                foreach (MenuItem sib in keys.MenuItems) sib.Checked = (sib == mi);
                RegisterTheHotkey();
            };
            keys.MenuItems.Add(mi);
        }
        menu.MenuItems.Add(keys);
        menu.MenuItems.Add("-");
        menu.MenuItems.Add(new MenuItem("Quit", (s, e) => Quit()));

        tray = new NotifyIcon();
        tray.Icon = TrayIcon();
        tray.Text = TITLE;
        tray.ContextMenu = menu;
        tray.Visible = true;
        tray.DoubleClick += (s, e) => Raise();
    }

    Icon TrayIcon()
    {
        try
        {
            string p = Path.Combine(root, "shared", "icons", "status.png");
            if (File.Exists(p))
                using (var bmp = new Bitmap(p)) return Icon.FromHandle(bmp.GetHicon());
        }
        catch { }
        return SystemIcons.Application;
    }

    /* A few lines next to the exe saying what happened. Windows refuses a
       hotkey another program already owns and there is nothing on screen to
       say so, which is exactly the kind of silent failure that wastes an
       afternoon. Starts fresh every run, so it never grows. */
    void Log(string s)
    {
        try
        {
            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "launcher.log"),
                DateTime.Now.ToString("HH:mm:ss") + "  " + s + "\r\n");
        }
        catch { }
    }

    void RegisterTheHotkey()
    {
        UnregisterHotKey(Handle, HOTKEY_ID);
        uint mod = MOD_CONTROL;
        if (hotkey.Contains("alt")) mod |= MOD_ALT;
        if (hotkey.Contains("shift")) mod |= MOD_SHIFT;
        bool ok = RegisterHotKey(Handle, HOTKEY_ID, mod, (uint)Keys.B);
        if (!ok)
        {
            Log("could not take " + hotkey + " — another program already has it");
            if (tray != null)
                tray.ShowBalloonTip(6000, TITLE,
                    "Another program already uses " + hotkey.ToUpperInvariant().Replace("+", "+") +
                    ". Pick a different one from the tray menu.", ToolTipIcon.Warning);
        }
        else Log("hotkey " + hotkey + " registered");
    }

    /* ── finding the window ── */
    static string TextOf(IntPtr h)
    {
        var sb = new StringBuilder(512);
        GetWindowTextW(h, sb, sb.Capacity);
        return sb.ToString();
    }

    static string ClassOf(IntPtr h)
    {
        var sb = new StringBuilder(128);
        GetClassNameW(h, sb, sb.Capacity);
        return sb.ToString();
    }

    static IntPtr Find()
    {
        IntPtr hit = IntPtr.Zero;
        EnumWindows((h, p) =>
        {
            if (!IsWindowVisible(h)) return true;
            if (ClassOf(h).IndexOf("Chrome_WidgetWin", StringComparison.Ordinal) != 0) return true;
            if (!TextOf(h).StartsWith(TITLE, StringComparison.Ordinal)) return true;
            /* Chrome puts up little helper windows of the same class that
               borrow the page's title: a 160x28 one turned up in testing and
               got everything aimed at it, so the real window was never raised
               and never sat on top. Anything this small is not the app. */
            RECT r;
            if (!GetWindowRect(h, out r)) return true;
            if (r.R - r.L < 240 || r.B - r.T < 80) return true;
            hit = h;
            return false;
        }, IntPtr.Zero);
        return hit;
    }

    /* ── twice a second ── */
    void Poll()
    {
        if (!IsWindow(win)) { win = Find(); haveBig = false; }
        if (!IsWindow(win)) return;

        if (onTop)
            SetWindowPos(win, TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);

        string t = TextOf(win);
        int dot = t.IndexOf('\u00b7');
        if (dot < 0) return;
        string word = t.Substring(dot + 1).Trim();

        if (word == "small") GoSmall();
        else if (word == "big") GoBig();
        else if (word == "show") Raise();
    }

    void GoSmall()
    {
        if (small || !IsWindow(win)) return;
        RECT r;
        if (GetWindowRect(win, out r)) { bigRect = r; haveBig = true; }
        small = true;
        var wa = Screen.PrimaryScreen.WorkingArea;
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST,
            wa.Right - SMALL_W - 24, wa.Top + 24, SMALL_W, SMALL_H, SWP_SHOWWINDOW | SWP_NOACTIVATE);
    }

    void GoBig()
    {
        if (!small || !IsWindow(win)) return;
        small = false;
        int x, y, w, h;
        if (haveBig)
        {
            x = bigRect.L; y = bigRect.T;
            w = bigRect.R - bigRect.L; h = bigRect.B - bigRect.T;
        }
        else
        {
            var wa = Screen.PrimaryScreen.WorkingArea;
            w = Math.Min(1180, wa.Width - 120); h = Math.Min(900, wa.Height - 120);
            x = wa.Left + (wa.Width - w) / 2; y = wa.Top + (wa.Height - h) / 2;
        }
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, x, y, w, h, SWP_SHOWWINDOW | SWP_NOACTIVATE);
    }

    /* ── bringing it to the front ──
       Windows refuses SetForegroundWindow to a program that is not already in
       front, unless it borrows the input state of the window that is. That is
       what the attach is for. Without it a check in behind a full screen
       window flashes in the taskbar and never appears.                      */
    void Raise()
    {
        if (!IsWindow(win)) { win = Find(); }
        if (!IsWindow(win)) return;
        if (IsIconic(win)) ShowWindow(win, SW_RESTORE);

        IntPtr fore = GetForegroundWindow();
        uint dummy;
        uint me = GetCurrentThreadId();
        uint other = GetWindowThreadProcessId(fore, out dummy);
        if (other != 0 && other != me) AttachThreadInput(other, me, true);
        SetForegroundWindow(win);
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, 0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_SHOWWINDOW);
        if (other != 0 && other != me) AttachThreadInput(other, me, false);
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_HOTKEY && m.WParam.ToInt32() == HOTKEY_ID)
        {
            Log("hotkey pressed, window " + (IsWindow(win) ? "found" : "MISSING"));
            Raise();
            /* The page is what opens the bullet sheet, so the key has to land
               in the page. Give the window a moment to actually be in front
               first, or the keystroke goes wherever the focus still was. */
            if (tap != null) { tap.Stop(); tap.Dispose(); }
            tap = new Timer();
            tap.Interval = 180;
            tap.Tick += (s, e) =>
            {
                tap.Stop();
                /* The hotkey has to come off before we type it, or Windows
                   hands our own keystroke straight back to us as another
                   hotkey and the two go round for ever. Found by pressing
                   Ctrl+B once and watching it never stop. */
                UnregisterHotKey(Handle, HOTKEY_ID);
                try { SendKeys.SendWait("^b"); Log("typed Ctrl+B into the page"); }
                catch (Exception ex) { Log("could not type it: " + ex.Message); }
                RegisterTheHotkey();
            };
            tap.Start();
            return;
        }
        base.WndProc(ref m);
    }

    void Quit()
    {
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
        Application.Exit();
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
        base.OnFormClosed(e);
    }
}
