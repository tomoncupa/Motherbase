/* ══════════════ STATUS ══════════════
   The standalone app. Tom, 2026-09-17: "I think the chrome environment is
   too limiting", after the title bar came back for the fourth time.

   Every bug of the last three days was the same bug: the window belonged to
   Chrome, and Chrome kept taking it back. Its title bar returned on its own,
   the page got clipped underneath it, the window could be closed out from
   under the app, and the two could only talk by writing words into the
   window title. None of those are fixable from outside a window you do not
   own, which is why they kept coming back.

   This owns the window. Same STATUS, one HTML file, unchanged: it runs
   inside Microsoft's WebView2, which is the same engine Edge and Chrome use
   and is already installed on Windows. So the app is still the file in
   status/, still opens in a browser on its own, and this is only the frame
   around it.

   What that buys, and none of it was reachable before:

     · no title bar, ever, because we never ask for one
     · the window is exactly the page, and cannot be clipped by furniture
     · the check in is a real interruption: centre screen, in front, focused
     · the page and the host talk by passing messages, not through the title
     · Ctrl+B calls the page's own function rather than typing a keystroke
       at it and hoping the focus landed
     · closing it is quitting it, so it cannot sit there switched off

   Its data is its own, the way any program's is, and it fills from the sync
   code the same way a second device would.

   Built by build.ps1 with the C# compiler inside Windows. The three files in
   lib/ are Microsoft's WebView2 package, kept here so there is nothing to
   install.                                                                 */

using System;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Timer = System.Windows.Forms.Timer;

class App : Form
{
    [DllImport("user32.dll")] static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint vk);
    [DllImport("user32.dll")] static extern bool UnregisterHotKey(IntPtr h, int id);
    [DllImport("user32.dll")] static extern bool ReleaseCapture();
    [DllImport("user32.dll")] static extern IntPtr SendMessage(IntPtr h, int msg, IntPtr w, IntPtr l);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
    [DllImport("user32.dll")] static extern bool AttachThreadInput(uint a, uint b, bool attach);
    [DllImport("kernel32.dll")] static extern uint GetCurrentThreadId();
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int val, int size);

    const int WM_HOTKEY = 0x0312, WM_NCLBUTTONDOWN = 0x00A1, HTCAPTION = 2;
    const int HOTKEY_ID = 0xB01;
    const uint MOD_ALT = 0x1, MOD_CONTROL = 0x2, MOD_SHIFT = 0x4, MOD_WIN = 0x8;
    const int DWMWA_WINDOW_CORNER_PREFERENCE = 33, DWMWCP_ROUND = 2;

    WebView2 web;
    NotifyIcon tray;
    MenuItem miTop;
    string root, cfgPath, dataDir;
    bool onTop = true;
    string hotkey = "ctrl+b";
    string mode = "widget";
    int posX = int.MinValue, posY = int.MinValue;   /* where he left the widget */
    bool ready;
    string said = "";        /* each kind of request logged once, not every time */
    string pageUrl;

    /* A few lines beside the program saying what happened, so a thing that
       goes quiet can be asked why instead of guessed at. Fresh every run. */
    void Log(string s)
    {
        try
        {
            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "status-app.log"),
                DateTime.Now.ToString("HH:mm:ss") + "  " + s + "\r\n");
        }
        catch { }
    }

    static Mutex only;

    [STAThread]
    static void Main()
    {
        bool fresh;
        only = new Mutex(true, "Motherbase.STATUS.App", out fresh);
        if (!fresh) return;          /* one copy; the running one is the app */
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new App());
    }

    public App()
    {
        root = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
        cfgPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "status-app.txt");
        /* Its own store, beside the program, so it is obvious where it lives
           and a reinstall does not lose it. */
        dataDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
        try { File.Delete(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "status-app.log")); } catch { }
        LoadCfg();

        string page = Path.Combine(root, "status", "index.html");
        if (!File.Exists(page))
        {
            MessageBox.Show("Could not find STATUS at\n\n" + page +
                "\n\nThis program has to sit in the desktop folder inside Motherbase.",
                "STATUS", MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.Exit(1);
        }

        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        ShowInTaskbar = true;
        Text = "STATUS";
        TopMost = onTop;
        BackColor = Color.FromArgb(11, 14, 20);   /* the theme's page colour, so
                                                      the first paint is not white */
        ClientSize = new Size(320, 170);
        PlaceWidget();

        BuildTray();
        RegisterTheHotkey();

        web = new WebView2();
        web.Dock = DockStyle.Fill;
        web.DefaultBackgroundColor = BackColor;
        web.CreationProperties = new CoreWebView2CreationProperties();
        web.CreationProperties.UserDataFolder = dataDir;
        pageUrl = new Uri(page).AbsoluteUri + "?desktop=1&host=app";
        web.CoreWebView2InitializationCompleted += Started;
        Controls.Add(web);
        /* Navigating after the engine is up, rather than setting Source
           before it exists. */
        web.EnsureCoreWebView2Async(null);

        Shown += (s, e) => Round();
    }

    void Started(object sender, CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            MessageBox.Show("The web engine would not start.\n\n" +
                (e.InitializationException == null ? "" : e.InitializationException.Message) +
                "\n\nWebView2 comes with Windows. If this keeps happening, install " +
                "the Microsoft Edge WebView2 Runtime.", "STATUS");
            Application.Exit();
            return;
        }
        ready = true;
        Log("web engine started");
        Log("opening " + pageUrl);
        var c = web.CoreWebView2;
        c.Settings.AreDefaultContextMenusEnabled = false;
        c.Settings.IsZoomControlEnabled = false;
        c.Settings.AreBrowserAcceleratorKeysEnabled = false;
        c.Settings.IsStatusBarEnabled = false;
        c.WebMessageReceived += Message;
        c.NavigationCompleted += (s2, e2) =>
        {
            Log("page loaded: " + (e2.IsSuccess ? "yes" : "NO, " + e2.WebErrorStatus));
            if (!e2.IsSuccess) return;
            foreach (string a in Environment.GetCommandLineArgs())
                if (a == "--checkin") { var t2 = new Timer(); t2.Interval = 1500;
                    t2.Tick += (s3, e3) => { t2.Stop(); AskNow(); }; t2.Start(); }
            /* Ask the page what it can see, so a silent handshake can be told
               apart from a page that never ran. */
            c.ExecuteScriptAsync(
                "JSON.stringify({host: !!(window.chrome&&window.chrome.webview), " +
                "desk: (typeof DESK!=='undefined')&&DESK, " +
                "small: (typeof deskSmall!=='undefined')&&deskSmall, " +
                "setting: (typeof S!=='undefined')?S.get('desk.small','unset'):'no S', " +
                "rows: (typeof Rec!=='undefined')?Rec.count('field'):-1, " +
                "err: window.__deskErr || null})")
             .ContinueWith(t => { try { Log("page says: " + t.Result); } catch { } });
        };
        /* A link to anywhere else opens in his real browser, not in here. */
        c.NewWindowRequested += (s2, e2) =>
        {
            e2.Handled = true;
            try { System.Diagnostics.Process.Start(e2.Uri); } catch { }
        };
        c.Navigate(pageUrl);
    }

    /* ── what the page asks for ──
       A proper channel at last. The page says what it wants to be and how big
       it needs to be, in a message, instead of writing words into the window
       title and hoping something was reading. */
    void Message(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string raw;
        try { raw = e.TryGetWebMessageAsString(); }
        catch { return; }
        if (string.IsNullOrEmpty(raw)) return;
        Log("page asked for: " + raw);

        string[] bits = raw.Split('|');
        string verb = bits[0];

        if (verb == "drag")
        {
            /* We own the window, so dragging is the real thing Windows does
               for a title bar, minus the title bar. */
            ReleaseCapture();
            /* This runs Windows' own move loop and does not return until he
               lets go. The web view never sees the mouse come back up, so
               without handing it the focus again the next press is eaten
               re-activating the window and the widget feels stuck. */
            SendMessage(Handle, WM_NCLBUTTONDOWN, new IntPtr(HTCAPTION), IntPtr.Zero);
            if (mode == "widget") { posX = Left; posY = Top; SaveCfg(); }
            Activate();
            if (ready) web.Focus();
            /* Handing the focus back was not enough: the drag still went stiff
               until Tom maximised and minimised, which told us what does work.
               A resize is what puts the web view's input back, so this does the
               smallest one there is. */
            Jog();
            return;
        }
        if (verb == "quit") { Quit(); return; }

        int w = 0, h = 0;
        if (bits.Length >= 3)
        {
            int.TryParse(bits[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out w);
            int.TryParse(bits[2], NumberStyles.Integer, CultureInfo.InvariantCulture, out h);
        }
        if (w < 120 || h < 60) return;

        if (verb == "widget") { mode = "widget"; ClientSize = new Size(w, h); PlaceWidget(); Round(); }
        else if (verb == "app")
        {
            /* Opening the whole app used to throw the window into the middle
               of the screen, which is not where he was looking. It grows from
               where the widget already is, and only moves as far as it must
               to stay on the screen. */
            mode = "app";
            int right = Left + Width, top = Top;
            ClientSize = new Size(w, h);
            KeepCorner(right, top);
            Round();
        }
        else if (verb == "checkin")
        {
            /* ── intrusive on purpose ──
               Tom: "I also want the check in prompt to be intrusive and
               prominent." A panel in a 320px box in the corner is neither. It
               goes to the middle of the screen, in front of whatever he is
               doing, with the focus, so answering it is the path of least
               resistance rather than something to notice and come back to. */
            mode = "checkin";
            ClientSize = new Size(w, h);
            Centre();
            Round();
            Front();
            try { System.Media.SystemSounds.Exclamation.Play(); } catch { }
        }
    }

    /* Asking on demand. Also how the interruption gets tested without waiting
       an hour for the timer: STATUS.exe --checkin fires one as soon as the
       page is up. */
    void AskNow()
    {
        if (!ready) return;
        web.CoreWebView2.ExecuteScriptAsync(
            "window.deskAsk && (deskPanel='', deskAsking=false, deskAsk())");
    }

    void PlaceWidget()
    {
        var wa = Screen.PrimaryScreen.WorkingArea;
        int x = posX != int.MinValue ? posX : wa.Right - Width - 24;
        int y = posY != int.MinValue ? posY : wa.Top + 24;
        if (x < wa.Left - 40 || x > wa.Right - 80) x = wa.Right - Width - 24;
        if (y < wa.Top - 10 || y > wa.Bottom - 40) y = wa.Top + 24;
        Location = new Point(x, y);
    }

    /* One resize, one pixel, there and back. Nothing else reliably wakes the
       web view's input up after Windows' move loop has had it. */
    void Jog()
    {
        var was = ClientSize;
        ClientSize = new Size(was.Width, was.Height + 1);
        ClientSize = was;
    }

    /* ── the chevron never moves ──
       Tom, 2026-09-17: "I want the resize button to never change location,
       let the max view clip through the bottom of the screen if needed." It
       lives in the window's top right corner, so keeping THAT corner still
       keeps the button still, whatever size the window becomes. The bottom is
       deliberately not clamped: he would rather the app ran off the screen
       than have the button jump. */
    void KeepCorner(int right, int top)
    {
        var wa = Screen.FromPoint(new Point(right - 20, top + 20)).WorkingArea;
        int x = right - Width;
        if (x < wa.Left) x = wa.Left;
        if (top < wa.Top) top = wa.Top;
        Location = new Point(x, top);
    }

    void Centre()
    {
        /* The screen the pointer is on, not "the primary one". On two
           monitors the primary is often not the one he is working on, and an
           interruption that lands on the other screen is not an
           interruption. */
        var wa = Screen.FromPoint(Cursor.Position).WorkingArea;
        Location = new Point(wa.Left + (wa.Width - Width) / 2,
                             wa.Top + (wa.Height - Height) / 3);
        Log("centred on the screen at " + wa.Left + "," + wa.Top + " " +
            wa.Width + "x" + wa.Height + " -> " + Left + "," + Top + " size " + Width + "x" + Height);
    }

    void Round()
    {
        int pref = DWMWCP_ROUND;
        try { DwmSetWindowAttribute(Handle, DWMWA_WINDOW_CORNER_PREFERENCE, ref pref, 4); }
        catch { }
    }

    /* Windows will not hand the front to a program that is not already there
       unless it borrows the input state of the one that is. */
    void Front()
    {
        if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
        Show();
        IntPtr fore = GetForegroundWindow();
        uint pid, me = GetCurrentThreadId();
        uint other = GetWindowThreadProcessId(fore, out pid);
        if (other != 0 && other != me) AttachThreadInput(other, me, true);
        TopMost = true;
        BringToFront();
        Activate();
        SetForegroundWindow(Handle);
        if (other != 0 && other != me) AttachThreadInput(other, me, false);
        TopMost = onTop;
        if (ready) web.Focus();
        Log("brought to the front: " + (GetForegroundWindow() == Handle ? "yes" : "no"));
    }

    /* ── the widget remembers where he put it ── */
    protected override void OnResizeEnd(EventArgs e)
    {
        base.OnResizeEnd(e);
        if (mode == "widget") { posX = Left; posY = Top; SaveCfg(); }
    }

    protected override void OnMove(EventArgs e)
    {
        base.OnMove(e);
        if (mode == "widget" && ready) { posX = Left; posY = Top; }
    }

    /* ── settings, one line each, beside the program ── */
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
                else if (k == "ontop") onTop = (v != "0");
                else if (k == "pos")
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
                "# STATUS. Delete this file to go back to the defaults.\r\n" +
                "hotkey=" + hotkey + "\r\n" +
                "ontop=" + (onTop ? "1" : "0") + "\r\n" +
                (posX == int.MinValue ? "" : "pos=" + posX + "," + posY + "\r\n"));
        }
        catch { }
    }

    void BuildTray()
    {
        var menu = new ContextMenu();
        menu.MenuItems.Add(new MenuItem("Open STATUS", (s, e) => Front()));
        menu.MenuItems.Add(new MenuItem("Check in now", (s, e) => AskNow()));
        menu.MenuItems.Add("-");
        miTop = new MenuItem("Always on top", (s, e) =>
        {
            onTop = !onTop; miTop.Checked = onTop; TopMost = onTop; SaveCfg();
        });
        miTop.Checked = onTop;
        menu.MenuItems.Add(miTop);

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
                hotkey = box.Chosen; SaveCfg(); RegisterTheHotkey(); MarkKeys(keys);
            }
        };
        keys.MenuItems.Add(custom);
        menu.MenuItems.Add(keys);
        menu.MenuItems.Add("-");
        menu.MenuItems.Add(new MenuItem("Quit", (s, e) => Quit()));

        tray = new NotifyIcon();
        tray.Icon = TrayIcon();
        tray.Text = "STATUS";
        tray.ContextMenu = menu;
        tray.Visible = true;
        tray.DoubleClick += (s, e) => Front();
        MarkKeys(keys);
    }

    void MarkKeys(MenuItem keys)
    {
        bool known = false;
        foreach (MenuItem mi in keys.MenuItems)
        {
            if (mi.Text == "-" || mi.Text.StartsWith("Choose")) continue;
            mi.Checked = string.Equals(Pretty(hotkey), mi.Text, StringComparison.OrdinalIgnoreCase);
            if (mi.Checked) known = true;
        }
        foreach (MenuItem mi in keys.MenuItems)
        {
            if (!mi.Text.StartsWith("Choose")) continue;
            mi.Text = known ? "Choose my own..." : "Choose my own...  (" + Pretty(hotkey) + ")";
            mi.Checked = !known;
        }
    }

    Icon TrayIcon()
    {
        try
        {
            string p = Path.Combine(root, "shared", "icons", "status.png");
            if (File.Exists(p)) using (var bmp = new Bitmap(p)) return Icon.FromHandle(bmp.GetHicon());
        }
        catch { }
        return SystemIcons.Application;
    }

    public static bool ParseHotkey(string s, out uint mod, out uint vk)
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
        try { vk = (uint)(Keys)Enum.Parse(typeof(Keys), key, true); return vk != 0; }
        catch { return false; }
    }

    public static string Pretty(string s)
    {
        var bits = new System.Collections.Generic.List<string>();
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
        if (!ParseHotkey(hotkey, out mod, out vk)) { hotkey = "ctrl+b"; ParseHotkey(hotkey, out mod, out vk); }
        if (!RegisterHotKey(Handle, HOTKEY_ID, mod, vk) && tray != null)
            tray.ShowBalloonTip(6000, "STATUS",
                "Another program already uses " + Pretty(hotkey) +
                ". Pick a different one from the tray menu.", ToolTipIcon.Warning);
    }

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_HOTKEY && m.WParam.ToInt32() == HOTKEY_ID)
        {
            Front();
            /* Calling the page's own function, rather than typing a keystroke
               at the window and trusting the focus to have landed. */
            if (ready) web.CoreWebView2.ExecuteScriptAsync("window.deskBullet && deskBullet()");
            return;
        }
        base.WndProc(ref m);
    }

    /* Closing the window used to leave the launcher running with nothing to
       do, which is how a whole day went by with no check ins. Closing is
       quitting now, and the tray is where it lives while it is not in front. */
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        base.OnFormClosing(e);
        SaveCfg();
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
    }

    void Quit()
    {
        SaveCfg();
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        if (tray != null) { tray.Visible = false; tray.Dispose(); }
        Application.Exit();
    }
}
