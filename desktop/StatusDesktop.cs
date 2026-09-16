/* ══════════════ STATUS Desktop tracker ══════════════
   The launcher. It is not the app: STATUS is still one HTML file, and this
   opens it in a Chrome window with no browser chrome, using Tom's ordinary
   Chrome profile so the data in it is the data he already has. Point a
   separate browser at it and you get a second, empty STATUS. That is the
   whole reason this is a launcher and not a standalone program.

   It does the three things a web page is not allowed to do for itself:

     · keeps the window above everything else
     · sizes it to the widget, rounds its corners and takes its border off
     · catches Ctrl+B while another program is in front

   It cannot see inside the page, and the page cannot move its own window,
   so the two talk through the window title. The page puts a word on the
   end of its title and this reads it twice a second. The title is a state
   rather than a message: the page keeps saying what it wants to be, so the
   two agree no matter when this found the window. `small 320x170` while the
   widget is up, carrying the size the page measured itself at, and `show` to
   be brought to the front.

   Built by build.ps1 with the C# compiler that ships inside Windows, so
   there is nothing to install and nothing to download.                    */

using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
/* System.Threading has a Timer of its own, and every Timer in here is the
   Windows Forms one, which ticks on the UI thread. */
using Timer = System.Windows.Forms.Timer;

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
    [DllImport("user32.dll")] static extern bool GetClientRect(IntPtr h, out RECT r);
    [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr h, int i);
    [DllImport("user32.dll")] static extern int SetWindowLong(IntPtr h, int i, int v);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);
    [DllImport("user32.dll")] static extern bool GetCursorPos(out POINT p);
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int val, int size);
    delegate bool EnumProc(IntPtr h, IntPtr p);
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }
    [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }

    static readonly IntPtr TOPMOST = new IntPtr(-1);
    static readonly IntPtr NOTOPMOST = new IntPtr(-2);
    const uint SWP_NOSIZE = 0x0001, SWP_NOMOVE = 0x0002, SWP_NOACTIVATE = 0x0010,
               SWP_FRAMECHANGED = 0x0020, SWP_SHOWWINDOW = 0x0040;
    const int GWL_STYLE = -16;
    const int WS_CAPTION = 0x00C00000, WS_THICKFRAME = 0x00040000;
    const int VK_LBUTTON = 0x01;
    /* Windows 11 draws a square hairline border on a window with no frame,
       and squares its corners. Tom: "What is this ugly grey border, round the
       corners a bit". These two attributes are the only way to reach either,
       because the window is Chrome's and not ours. On Windows 10 the calls
       return an error code and nothing changes, which is the right outcome. */
    const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
    const int DWMWA_BORDER_COLOR = 34;
    const int DWMWCP_DEFAULT = 0, DWMWCP_ROUND = 2;
    const int DWMWA_COLOR_NONE = unchecked((int)0xFFFFFFFE);
    const int DWMWA_COLOR_DEFAULT = unchecked((int)0xFFFFFFFF);
    const int SW_RESTORE = 9;
    const int WM_HOTKEY = 0x0312;
    const int HOTKEY_ID = 0xB01;
    const uint MOD_ALT = 0x1, MOD_CONTROL = 0x2, MOD_SHIFT = 0x4, MOD_WIN = 0x8;

    /* The title the page sets. Matching on the front of it, because the
       instruction word is stuck on the end. */
    const string TITLE = "STATUS Desktop tracker";
    /* Mini mode takes Chrome's title bar off, so the window IS the widget and
       nothing else. Tom, 2026-09-16: "I don't like how the window can be
       bigger than the actual app interface."

       The same thought applies to the whole app, which lays out in a 620px
       column: opened at 1905 wide it was a narrow strip of content with six
       hundred pixels of empty either side. Its window is sized to the
       interface now rather than to whatever Chrome felt like.

       The widget's size is not decided here at all. The page measures what
       it has drawn and puts it in the title, and this matches it, so the
       window is exactly the box and a layout change in STATUS never needs
       this program rebuilt. These are only the fallback for the moment
       before the first title arrives. */
    int smallW = 320, smallH = 170;
    const int BIG_W = 660, BIG_H = 920;

    string root;                 /* the Motherbase folder */
    string cfgPath;
    IntPtr win = IntPtr.Zero;    /* the STATUS window, once it exists */
    bool onTop = true;
    bool small = false;
    bool shown = false;          /* already answered this "show" */
    bool softLogged = false;     /* whether Windows took the rounded corners */
    bool everHad = false;        /* a window has existed at least once */
    int missing = 0;             /* polls in a row with no window */
    string chrome;
    int savedStyle = 0;          /* the frame, while it is off */
    int posX = int.MinValue, posY = int.MinValue;   /* where he put the widget */
    string hotkey = "ctrl+b";
    NotifyIcon tray;
    Timer poll, tap, drag;
    MenuItem miTop;

    static readonly Regex SIZE = new Regex(@"\u00b7 small (\d{2,4})x(\d{2,4})");

    /* dragging the widget, which has no title bar to drag by */
    bool dragOn, dragArmed, wasDown;
    int grabX, grabY, anchorX, anchorY;

    static Mutex only;

    [STAThread]
    static void Main()
    {
        /* One copy at a time. Starting a second was not harmless: the new one
           runs RepairOrphans, which cannot tell a window left behind by a
           launcher that died from the widget a launcher that is ALIVE is
           holding, so it put the title bar back on the running widget. The
           window stayed the same height, the bar took 31px off the bottom,
           and the controls were cut in half. That is what Tom photographed.

           So a second launch does what he meant by it: brings the widget he
           already has to the front. */
        bool fresh;
        only = new Mutex(true, "Motherbase.STATUSDesktopTracker", out fresh);
        if (!fresh)
        {
            RaiseExisting();
            return;
        }
        Application.EnableVisualStyles();
        Application.Run(new Launcher());
    }

    static void RaiseExisting()
    {
        IntPtr h = Find();
        if (h == IntPtr.Zero) return;
        if (IsIconic(h)) ShowWindow(h, SW_RESTORE);
        SetForegroundWindow(h);
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

        chrome = FindChrome();
        if (chrome == null)
        {
            MessageBox.Show("Could not find Chrome.\n\nSTATUS Desktop tracker opens STATUS in " +
                "Chrome on purpose, so that it uses the data you already have.",
                TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.Exit(1);
        }

        BuildTray();
        RegisterTheHotkey();
        RepairOrphans();

        pageUrl = new Uri(page).AbsoluteUri + "?desktop=1";
        if (!OpenPage())
        {
            MessageBox.Show("Chrome would not start.", TITLE);
            Environment.Exit(1);
        }

        poll = new Timer();
        poll.Interval = 500;
        poll.Tick += (s, e) => Poll();
        poll.Start();

        /* fast, because it is following a cursor, and stopped whenever the
           widget is not up */
        drag = new Timer();
        drag.Interval = 15;
        drag.Tick += (s, e) => DragTick();
    }

    string pageUrl;

    bool OpenPage()
    {
        try { Process.Start(chrome, "--app=" + pageUrl); return true; }
        catch (Exception e) { Log("could not start Chrome: " + e.Message); return false; }
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
                if (k == "pos")
                {
                    string[] xy = v.Split(',');
                    int px, py;
                    if (xy.Length == 2 && int.TryParse(xy[0], out px) && int.TryParse(xy[1], out py))
                    { posX = px; posY = py; }
                }
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
                "ontop=" + (onTop ? "1" : "0") + "\r\n" +
                (posX == int.MinValue ? "" : "pos=" + posX + "," + posY + "\r\n"));
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
        menu.MenuItems.Add(new MenuItem("Open STATUS", (s, e) =>
        {
            if (!IsWindow(win) && !IsWindow(Find())) OpenPage();
            else Raise();
        }));
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
        var keys = new MenuItem("Bullet shortcut");
        string[] opts = { "ctrl+b", "ctrl+alt+b", "ctrl+shift+b" };
        string[] names = { "Ctrl+B", "Ctrl+Alt+B", "Ctrl+Shift+B" };
        for (int i = 0; i < opts.Length; i++)
        {
            string opt = opts[i];
            var mi = new MenuItem(names[i]);
            mi.Click += (s, e) => { hotkey = opt; SaveCfg(); RegisterTheHotkey(); MarkKeys(keys); };
            keys.MenuItems.Add(mi);
        }
        keys.MenuItems.Add("-");
        var custom = new MenuItem("Choose my own...");
        custom.Click += (s, e) =>
        {
            using (var box = new KeyBox(hotkey))
            {
                if (box.ShowDialog() != DialogResult.OK || box.Chosen == null) return;
                hotkey = box.Chosen;
                SaveCfg();
                RegisterTheHotkey();
                MarkKeys(keys);
            }
        };
        keys.MenuItems.Add(custom);
        menu.MenuItems.Add(keys);
        MarkKeys(keys);
        menu.MenuItems.Add("-");
        menu.MenuItems.Add(new MenuItem("Quit", (s, e) => Quit()));

        tray = new NotifyIcon();
        tray.Icon = TrayIcon();
        tray.Text = TITLE + " \u2014 starting";
        tray.ContextMenu = menu;
        tray.Visible = true;
        tray.DoubleClick += (s, e) => Raise();
    }

    /* A tick beside whichever one is in use, and the one he typed himself
       shown by name rather than as "Custom". */
    void MarkKeys(MenuItem keys)
    {
        bool known = false;
        foreach (MenuItem mi in keys.MenuItems)
        {
            if (mi.Text == "-" || mi.Text.StartsWith("Choose")) continue;
            mi.Checked = string.Equals(PrettyHotkey(hotkey), mi.Text, StringComparison.OrdinalIgnoreCase);
            if (mi.Checked) known = true;
        }
        foreach (MenuItem mi in keys.MenuItems)
        {
            if (!mi.Text.StartsWith("Choose")) continue;
            mi.Text = known ? "Choose my own..." : "Choose my own...  (" + PrettyHotkey(hotkey) + ")";
            mi.Checked = !known;
        }
    }

    /* What the tray icon says when you hover it. A thing whose whole job is
       to be there has to be able to say whether it is. */
    void Tip(string state)
    {
        if (tray == null) return;
        string s = TITLE + " \u2014 " + state;
        if (s.Length > 62) s = s.Substring(0, 62);
        tray.Text = s;
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

    /* "ctrl+shift+k" both ways, so the setting is a line he could read. */
    static bool ParseHotkey(string s, out uint mod, out uint vk)
    {
        mod = 0; vk = 0;
        string key = null;
        foreach (string raw in (s ?? "").ToLowerInvariant().Split('+'))
        {
            string p = raw.Trim();
            if (p.Length == 0) continue;
            if (p == "ctrl" || p == "control") mod |= MOD_CONTROL;
            else if (p == "alt") mod |= MOD_ALT;
            else if (p == "shift") mod |= MOD_SHIFT;
            else if (p == "win" || p == "windows") mod |= MOD_WIN;
            else key = p;
        }
        if (key == null || mod == 0) return false;
        try
        {
            Keys k = (Keys)Enum.Parse(typeof(Keys), key, true);
            vk = (uint)k;
            return vk != 0;
        }
        catch { return false; }
    }

    static string PrettyHotkey(string s)
    {
        var bits = new List<string>();
        string key = null;
        foreach (string raw in (s ?? "").ToLowerInvariant().Split('+'))
        {
            string p = raw.Trim();
            if (p.Length == 0) continue;
            if (p == "ctrl" || p == "control") bits.Add("Ctrl");
            else if (p == "alt") bits.Add("Alt");
            else if (p == "shift") bits.Add("Shift");
            else if (p == "win" || p == "windows") bits.Add("Win");
            else key = p.Length == 1 ? p.ToUpperInvariant() : char.ToUpperInvariant(p[0]) + p.Substring(1);
        }
        if (key != null) bits.Add(key);
        return string.Join("+", bits.ToArray());
    }

    void RegisterTheHotkey()
    {
        UnregisterHotKey(Handle, HOTKEY_ID);
        uint mod, vk;
        if (!ParseHotkey(hotkey, out mod, out vk))
        {
            hotkey = "ctrl+b";
            ParseHotkey(hotkey, out mod, out vk);
        }
        bool ok = RegisterHotKey(Handle, HOTKEY_ID, mod, vk);
        if (!ok)
        {
            Log("could not take " + hotkey + ", another program already has it");
            if (tray != null)
                tray.ShowBalloonTip(6000, TITLE,
                    "Another program already uses " + PrettyHotkey(hotkey) +
                    ". Pick a different one from the tray menu.", ToolTipIcon.Warning);
        }
        else Log("hotkey " + PrettyHotkey(hotkey) + " registered");
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

    /* ── a window left frameless by a run that was killed ──
       Quitting from the tray puts the frame back. Being killed outright, by
       Task Manager or a crash, does not run any of that, and what is left on
       screen is a strip with no title bar, no close button and nothing to
       drag. Alt+F4 still closes it, but nobody should have to know that.
       So: anything found frameless at startup gets its frame back. */
    void RepairOrphans()
    {
        foreach (IntPtr h in FindAll())
        {
            int st = GetWindowLong(h, GWL_STYLE);
            if ((st & WS_CAPTION) == WS_CAPTION) continue;
            SetWindowLong(h, GWL_STYLE, st | WS_CAPTION | WS_THICKFRAME);
            SetWindowPos(h, NOTOPMOST, 0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED);
            Log("put the frame back on a window left over from a run that was killed");
        }
    }

    static List<IntPtr> FindAll()
    {
        var all = new List<IntPtr>();
        EnumWindows((h, p) =>
        {
            if (!IsWindowVisible(h)) return true;
            if (ClassOf(h).IndexOf("Chrome_WidgetWin", StringComparison.Ordinal) != 0) return true;
            if (!TextOf(h).StartsWith(TITLE, StringComparison.Ordinal)) return true;
            RECT rr;
            if (!GetWindowRect(h, out rr)) return true;
            if (rr.R - rr.L < 240 || rr.B - rr.T < 40) return true;
            all.Add(h);
            return true;
        }, IntPtr.Zero);
        return all;
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
            /* The width is what tells the app apart from Chrome's little
               helper windows. The height cannot help: the widget is 56 tall
               on purpose, so a floor of 80 here would lose the window the
               moment Mini mode was up. */
            if (r.R - r.L < 240 || r.B - r.T < 40) return true;
            hit = h;
            return false;
        }, IntPtr.Zero);
        return hit;
    }

    /* ── twice a second ──
       The title is a state, not a message, so this compares rather than
       reacts: whatever the page says it wants to be, make it that. A word
       that arrived before this had found the window is not lost, and a
       window knocked out of shape by anything else comes back. */
    void Poll()
    {
        if (!IsWindow(win))
        {
            win = Find();
            if (IsWindow(win)) { small = false; savedStyle = 0; }
        }
        if (!IsWindow(win))
        {
            /* ── the thing that made it useless ──
               The check in timer lives in the page, because that is where the
               settings and the rows are. So a closed window is not a cosmetic
               problem: it is the whole app silently switched off, with a tray
               icon still sitting there looking alive. It ran a full day like
               that and Tom got nothing.

               Three seconds of grace, because a window being replaced blinks,
               then open it again. Every thirty seconds after that if it still
               has not come back. */
            if (everHad)
            {
                missing++;
                if (missing == 6 || (missing > 6 && missing % 60 == 0))
                {
                    Log("the window was gone, opening it again");
                    Tip("reopening the widget");
                    OpenPage();
                }
            }
            return;
        }
        if (!everHad || missing > 0) Tip("widget open");
        everHad = true; missing = 0;

        if (onTop)
            SetWindowPos(win, TOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);

        /* Chrome owns this window and can put its own frame back when it
           repaints. Thirty pixels of title bar on a three hundred pixel
           widget is most of a row, so this holds the frame off rather than
           taking it away once and hoping it stays away. savedStyle keeps the
           original, so quitting still puts the real frame back. */
        if (small)
        {
            int st = GetWindowLong(win, GWL_STYLE);
            if ((st & (WS_CAPTION | WS_THICKFRAME)) != 0)
            {
                SetWindowLong(win, GWL_STYLE, st & ~(WS_CAPTION | WS_THICKFRAME));
                SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, 0, 0, 0, 0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED);
                Soften(true);
                Refit();
                Log("a frame came back on the widget and was taken off again");
            }
        }

        string t = TextOf(win);
        bool wantSmall = t.IndexOf("\u00b7 small", StringComparison.Ordinal) > -1;
        bool wantShow = t.IndexOf("\u00b7 show", StringComparison.Ordinal) > -1;

        /* The page says how big it wants to be, every time it draws. Opening
           the question makes the widget taller and closing it shrinks it back
           without a word from here. */
        Match m = SIZE.Match(t);
        if (m.Success)
        {
            int w = int.Parse(m.Groups[1].Value), h = int.Parse(m.Groups[2].Value);
            if (w != smallW || h != smallH)
            {
                smallW = w; smallH = h;
                if (small) Refit();
            }
        }

        if (wantSmall && !small) GoSmall();
        else if (!wantSmall && small) GoBig();

        /* once per asking, not once per poll, or it takes the focus three
           times over while the word is still up */
        if (wantShow && !shown) { shown = true; Raise(); }
        else if (!wantShow) shown = false;
    }

    /* ── the widget ──
       The title bar and the resize edge come off, so what is on screen is the
       strip and nothing around it. It goes back where he last left it. */
    void GoSmall()
    {
        if (small || !IsWindow(win)) return;
        small = true;

        savedStyle = GetWindowLong(win, GWL_STYLE);
        SetWindowLong(win, GWL_STYLE, savedStyle & ~(WS_CAPTION | WS_THICKFRAME));

        var wa = Screen.PrimaryScreen.WorkingArea;
        int x = posX != int.MinValue ? posX : wa.Right - smallW - 24;
        int y = posY != int.MinValue ? posY : wa.Top + 24;
        /* if the screen changed since last time, put it back on it */
        if (x < wa.Left || x > wa.Right - 80) x = wa.Right - smallW - 24;
        if (y < wa.Top || y > wa.Bottom - 40) y = wa.Top + 24;

        /* The style change lands first, so the client rect measured next is
           the one this window is actually going to have. */
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, 0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED);
        SetClient(x, y, smallW, smallH);
        Soften(true);
        if (drag != null) drag.Start();
    }

    /* Same corner, same place, new height. Used when the widget turns into
       the question and back. */
    void Refit()
    {
        if (!small || !IsWindow(win)) return;
        RECT r;
        if (!GetWindowRect(win, out r)) return;
        SetClient(r.L, r.T, smallW, smallH);
        Soften(true);
    }

    /* ── size what is INSIDE the window, not the window ──
       The page measures the box it drew, so that number is a client size. It
       was being applied to the outer window, so anything Windows put round
       the edge came out of the page instead of being added to it: a title bar
       that reappeared for any reason ate 31px off the bottom and cut the
       controls in half. Measuring the difference and adding it back means the
       page gets the height it asked for whether there is a frame or not, so
       this cannot clip again even if every other guard fails. */
    void SetClient(int x, int y, int w, int h)
    {
        if (!IsWindow(win)) return;
        RECT wr, cr;
        if (!GetWindowRect(win, out wr) || !GetClientRect(win, out cr))
        {
            SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, x, y, w, h,
                SWP_SHOWWINDOW | SWP_NOACTIVATE | SWP_FRAMECHANGED);
            return;
        }
        int padW = (wr.R - wr.L) - (cr.R - cr.L);
        int padH = (wr.B - wr.T) - (cr.B - cr.T);
        if (padW < 0) padW = 0;
        if (padH < 0) padH = 0;
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, x, y, w + padW, h + padH,
            SWP_SHOWWINDOW | SWP_NOACTIVATE | SWP_FRAMECHANGED);
    }

    /* Rounded corners and no hairline border while it is the widget; back to
       whatever Chrome wants when it is the whole app. */
    void Soften(bool on)
    {
        if (!IsWindow(win)) return;
        int corner = on ? DWMWCP_ROUND : DWMWCP_DEFAULT;
        int border = on ? DWMWA_COLOR_NONE : DWMWA_COLOR_DEFAULT;
        try
        {
            int a = DwmSetWindowAttribute(win, DWMWA_WINDOW_CORNER_PREFERENCE, ref corner, 4);
            int b = DwmSetWindowAttribute(win, DWMWA_BORDER_COLOR, ref border, 4);
            /* Said once, because "it should be rounded" and "Windows accepted
               the request" are different claims and only one is checkable
               from here. 0 is S_OK; anything else means this build of Windows
               does not have the attribute and the corners stay square. */
            if (!softLogged)
            {
                softLogged = true;
                Log("rounded corners: " + (a == 0 ? "accepted" : "refused, hresult " + a) +
                    "; border off: " + (b == 0 ? "accepted" : "refused, hresult " + b));
            }
        }
        catch (Exception ex) { Log("could not soften the window: " + ex.Message); }
    }

    void GoBig()
    {
        if (!small || !IsWindow(win)) return;
        small = false;
        if (drag != null) drag.Stop();
        dragOn = dragArmed = wasDown = false;
        Soften(false);
        RestoreFrame();

        var wa = Screen.PrimaryScreen.WorkingArea;
        int w = Math.Min(BIG_W, wa.Width - 80), h = Math.Min(BIG_H, wa.Height - 80);
        int x = wa.Left + (wa.Width - w) / 2, y = wa.Top + (wa.Height - h) / 2;
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, x, y, w, h,
            SWP_SHOWWINDOW | SWP_NOACTIVATE | SWP_FRAMECHANGED);
    }

    /* Always put the frame back. A window left borderless by a launcher that
       died would have no way to be closed or moved. */
    void RestoreFrame()
    {
        if (savedStyle == 0 || !IsWindow(win)) return;
        SetWindowLong(win, GWL_STYLE, savedStyle);
        savedStyle = 0;
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, 0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE | SWP_FRAMECHANGED);
    }

    /* ── moving the widget ──
       It has no title bar left to drag by, so this does it: while Mini mode
       is up, a press that STARTS on the widget and then travels more than a
       few pixels moves the window with the cursor. The few pixels of slack
       are what keep a click on + a click, instead of a one pixel drag that
       swallows it. Only runs while the widget is up. */
    void DragTick()
    {
        if (!small || !IsWindow(win)) { dragOn = dragArmed = wasDown = false; return; }

        bool down = (GetAsyncKeyState(VK_LBUTTON) & 0x8000) != 0;
        if (!down)
        {
            if (dragOn) SaveCfg();          /* remember where he put it */
            dragOn = dragArmed = wasDown = false;
            return;
        }

        POINT c;
        RECT r;
        if (!GetCursorPos(out c) || !GetWindowRect(win, out r)) return;

        if (!wasDown)
        {
            wasDown = true;
            if (c.X >= r.L && c.X < r.R && c.Y >= r.T && c.Y < r.B)
            {
                dragArmed = true;
                anchorX = c.X; anchorY = c.Y;
                grabX = c.X - r.L; grabY = c.Y - r.T;
            }
            return;
        }
        if (!dragArmed) return;
        if (!dragOn)
        {
            if (Math.Abs(c.X - anchorX) + Math.Abs(c.Y - anchorY) < 5) return;
            dragOn = true;
        }
        posX = c.X - grabX; posY = c.Y - grabY;
        SetWindowPos(win, onTop ? TOPMOST : NOTOPMOST, posX, posY, 0, 0,
            SWP_NOSIZE | SWP_NOACTIVATE);
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
                /* The page listens for Ctrl+B, so that is what gets typed, no
                   matter which keys he chose to summon it with. */
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
        RestoreFrame();
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
        Application.Exit();
    }

    protected override void OnFormClosed(FormClosedEventArgs e)
    {
        RestoreFrame();
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
        base.OnFormClosed(e);
    }
}


/* ── "press the keys you want" ──
   Tom: "Give me a setting to program my own shortcut." A list of three was
   not a setting, it was three guesses. This takes whatever he presses, as
   long as it has a Ctrl, Alt, Shift or Windows in it, because Windows will
   not give a bare letter to a program that is not in front. */
class KeyBox : Form
{
    public string Chosen;
    Label shown;
    Button use;

    public KeyBox(string current)
    {
        Text = "Bullet shortcut";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false; MinimizeBox = false; ShowInTaskbar = false;
        ClientSize = new Size(380, 172);
        KeyPreview = true;

        var tell = new Label
        {
            Text = "Press the keys you want to use for writing a bullet.\r\n" +
                   "It has to include Ctrl, Alt, Shift or the Windows key.",
            Bounds = new Rectangle(20, 16, 340, 40),
        };
        shown = new Label
        {
            Text = PrettyOf(current),
            Bounds = new Rectangle(20, 62, 340, 44),
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font(FontFamily.GenericSansSerif, 15, FontStyle.Bold),
            BorderStyle = BorderStyle.FixedSingle,
        };
        use = new Button { Text = "Use it", Bounds = new Rectangle(196, 122, 80, 30), DialogResult = DialogResult.OK };
        var no = new Button { Text = "Cancel", Bounds = new Rectangle(284, 122, 80, 30), DialogResult = DialogResult.Cancel };
        Controls.Add(tell); Controls.Add(shown); Controls.Add(use); Controls.Add(no);
        AcceptButton = use; CancelButton = no;
        Chosen = current;
        KeyDown += Caught;
    }

    static string PrettyOf(string s)
    {
        var bits = new List<string>();
        string key = null;
        foreach (string raw in (s ?? "").ToLowerInvariant().Split('+'))
        {
            string p = raw.Trim();
            if (p.Length == 0) continue;
            if (p == "ctrl") bits.Add("Ctrl");
            else if (p == "alt") bits.Add("Alt");
            else if (p == "shift") bits.Add("Shift");
            else if (p == "win") bits.Add("Win");
            else key = p.Length == 1 ? p.ToUpperInvariant() : char.ToUpperInvariant(p[0]) + p.Substring(1);
        }
        if (key != null) bits.Add(key);
        return string.Join("+", bits.ToArray());
    }

    void Caught(object sender, KeyEventArgs e)
    {
        Keys k = e.KeyCode;
        /* the modifiers on their own are not a shortcut yet */
        if (k == Keys.ControlKey || k == Keys.Menu || k == Keys.ShiftKey ||
            k == Keys.LWin || k == Keys.RWin || k == Keys.None) return;
        e.Handled = true; e.SuppressKeyPress = true;

        var bits = new List<string>();
        if (e.Control) bits.Add("ctrl");
        if (e.Alt) bits.Add("alt");
        if (e.Shift) bits.Add("shift");
        if (bits.Count == 0)
        {
            shown.Text = "Add Ctrl, Alt or Shift";
            use.Enabled = false;
            return;
        }
        bits.Add(k.ToString().ToLowerInvariant());
        Chosen = string.Join("+", bits.ToArray());
        shown.Text = PrettyOf(Chosen);
        use.Enabled = true;
    }
}
