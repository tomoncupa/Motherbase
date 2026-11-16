/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• STATUS â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

     Â· no title bar, ever, because we never ask for one
     Â· the window is exactly the page, and cannot be clipped by furniture
     Â· the check in is a real interruption: centre screen, in front, focused
     Â· the page and the host talk by passing messages, not through the title
     Â· Ctrl+B calls the page's own function rather than typing a keystroke
       at it and hoping the focus landed
     Â· closing it is quitting it, so it cannot sit there switched off

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
    [DllImport("user32.dll")] static extern bool GetCursorPos(out POINT p);
    [DllImport("user32.dll")] static extern short GetAsyncKeyState(int k);
    [StructLayout(LayoutKind.Sequential)] struct POINT { public int X, Y; }
    [DllImport("user32.dll")] static extern bool GetLastInputInfo(ref LASTINPUTINFO p);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
    [StructLayout(LayoutKind.Sequential)] struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }

    const int WM_HOTKEY = 0x0312;
    const int WM_MOUSEACTIVATE = 0x0021, MA_ACTIVATE = 1;
    const int VK_LBUTTON = 0x01;
    const int HOTKEY_ID = 0xB01;
    const uint MOD_ALT = 0x1, MOD_CONTROL = 0x2, MOD_SHIFT = 0x4, MOD_WIN = 0x8;
    const int DWMWA_WINDOW_CORNER_PREFERENCE = 33, DWMWCP_ROUND = 2, DWMWCP_DONOTROUND = 1;

    WebView2 web;
    MenuItem miTop;
    /* ── hosted first ──
       Tom, 2026-09-23: every device opens the hosted copy and joins by LIVE
       SYNC, and these programs are devices too. A page opened from the folder
       cannot sign in with Google, so the folder copy is now the exception:
       a file named use-folder-copy.txt beside the program switches BOTH
       programs back, because they share one store and must never split. The
       folder copy's rows stay in the data folder under its own address. */
    static readonly string HOSTED = Hosted.Url;
    static bool UseFolder()
    {
        return File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "use-folder-copy.txt"));
    }
    /* Google's sign-in window has to open in here, where the page that asked
       for it can hear the answer. Every other new window goes to his browser. */
    static bool SignInWindow(string uri)
    {
        try
        {
            string h = new Uri(uri).Host.ToLowerInvariant();
            return h == "accounts.google.com" || h.EndsWith(".firebaseapp.com");
        }
        catch { return false; }
    }

    string root, cfgPath, dataDir;
    bool onTop = true;
    string hotkey = "ctrl+b";
    string mode = "widget";
    int posX = int.MinValue, posY = int.MinValue;   /* where he left the widget */
    bool ready;
    string pageUrl;
    Timer dragT;             /* follows the cursor while he is moving the window */
    Timer senseT;            /* tells the page what Windows can see, every 5 seconds */
    MenuItem keysMenu;
    System.Collections.Generic.Dictionary<uint, string[]> procNames =
        new System.Collections.Generic.Dictionary<uint, string[]>();
    bool dragging;
    int grabX, grabY;
    ContextMenu winMenu;     /* the right click menu, what the tray icon's menu was */
    bool trayOn;             /* Settings, DESKTOP, Tray icon: off unless he turns it on */
    NotifyIcon tray;
    Rectangle wideBack;      /* where the window was before Settings took the screen */
    string wideMode;
    /* The whole app resizes from any edge, keeping its shape, and everything in
       it grows with it (Tom, 2026-11-16: "It should scale with it ... from cell
       phone size ... as big as to occupy the entire vertical resolution. But it
       stays within the same ratio the whole time."). `zoom` is how much bigger
       than the phone size the page asked for; 1 is the smallest. */
    double zoom = 1;
    Size appBase = new Size(390, 844);
    const int GRIP = 6;
    /* where the whole app was put when it opened, and its corner before a
       status check took the screen, so going back lands where he left it */
    Point appPlaced = new Point(int.MinValue, 0);
    int backRight = int.MinValue, backTop;

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
        only = new Mutex(true, "Motherbase.STATUS.App" + (Hosted.Client ? ".client" : ""), out fresh);
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
        Updater.Start(Log);

        string page = Path.Combine(root, "status", "index.html");
        if (UseFolder() && !File.Exists(page))
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
        Icon = TrayIcon();   /* the running window's taskbar button reads this,
                                not the exe's; unset it is Windows' stock squares */
        TopMost = onTop;
        BackColor = Color.FromArgb(11, 14, 20);   /* the theme's page colour, so
                                                      the first paint is not white */
        ClientSize = new Size(320, 170);
        PlaceWidget();

        BuildMenu();
        Tray(trayOn);
        RegisterTheHotkey();

        dragT = new Timer();
        dragT.Interval = 12;
        dragT.Tick += (s, e) => DragTick();

        senseT = new Timer();
        senseT.Interval = 5000;
        senseT.Tick += (s, e) => Sense();
        senseT.Start();

        ov = new Overlay();
        ovT = new Timer();
        ovT.Interval = 1000;
        ovT.Tick += (s, e) => OvTick();
        ovT.Start();

        web = new WebView2();
        web.Dock = DockStyle.Fill;
        web.DefaultBackgroundColor = BackColor;
        web.CreationProperties = new CoreWebView2CreationProperties();
        web.CreationProperties.UserDataFolder = dataDir;
        /* No fresh=1 (Tom, 2026-11-16: "Status takes way too long to open...
           why can't we open the last saved copy and then in the background have
           it update"). fresh=1 (2026-10-05) sent the page and every script to
           the network first, each waiting up to 3 s (sw.js SLOW_MS) before the
           kept copy answered, and one of GitHub's four addresses never answers
           from his ISP: first paint 6.2 s. The kept copy opens at once; sw.js
           fetches new copies in the background, mobile.js reopens an untouched
           page onto new code, and STATUS reloads itself onto a newer version
           when idle (its desktop block), so a push still arrives. */
        pageUrl = UseFolder() ? new Uri(page).AbsoluteUri + "?desktop=1&host=app"
                              : HOSTED + "status/index.html?desktop=1&host=app";
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
        /* Tom, 2026-10-18: a right click on the window offers the menu the
           tray icon had, Always on top first. Only where the page did not take the
           right click for a menu of its own. */
        c.AddScriptToExecuteOnDocumentCreatedAsync(
            "addEventListener('contextmenu', function (e) { if (e.defaultPrevented) return; e.preventDefault();" +
            " try { chrome.webview.postMessage('menu'); } catch (x) {} });");
        /* ── this program is STATUS ──
           Its Home button used to navigate the widget's own window to the home
           screen, and the window was then stranded: the home screen has none
           of STATUS's desktop code, so nothing could size it, shrink it or get
           back. Seen at 03:16 on 2026-09-17, a 390x844 window showing the
           dock with no way out of it.

           The home screen is its own program now, so Home opens that and this
           window stays what it is. */
        c.NavigationStarting += (s2, e2) =>
        {
            if (e2.Uri.StartsWith(pageUrl.Split('?')[0], StringComparison.OrdinalIgnoreCase)) return;
            e2.Cancel = true;
            Log("stayed put rather than leaving STATUS for " + e2.Uri);
            OpenMenu();
        };
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
            if (SignInWindow(e2.Uri)) return;
            e2.Handled = true;
            try { System.Diagnostics.Process.Start(e2.Uri); } catch { }
        };
        c.Navigate(pageUrl);
    }

    /* â”€â”€ what the page asks for â”€â”€
       A proper channel at last. The page says what it wants to be and how big
       it needs to be, in a message, instead of writing words into the window
       title and hoping something was reading. */
    void Message(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string raw;
        try { raw = e.TryGetWebMessageAsString(); }
        catch { return; }
        if (string.IsNullOrEmpty(raw)) return;
        /* the overlay's picture is a long line of base64, never logged */
        if (raw.StartsWith("ovimg|")) { OvImage(raw); return; }
        /* a food typed with no numbers, guessed by Claude (FoodGuess.cs) */
        if (raw.StartsWith("mbguess:")) { FoodGuess.Ask(raw.Substring(8), Log, s => BeginInvoke((Action)(() => { try { web.CoreWebView2.ExecuteScriptAsync("window.foodGuessBack&&foodGuessBack(" + s + ")"); } catch { } }))); return; }
        Log("page asked for: " + raw);

        string[] bits = raw.Split('|');
        string verb = bits[0];

        if (verb == "drag")
        {
            /* â”€â”€ moving the window without handing Windows the mouse â”€â”€
               This used to be WM_NCLBUTTONDOWN with HTCAPTION, which runs
               Windows' own modal move loop. That loop takes the mouse for its
               whole duration and eats the button coming back up, so the web
               view was left believing a button was still held and every press
               after it went nowhere. Handing the focus back did not fix it and
               nor did a resize; the loop itself was the problem.

               So the move is ours: note where on the window he grabbed, then
               follow the cursor on a timer until the button is released. The
               page keeps receiving its own mouse events throughout, including
               the one that ends the drag. */
            POINT c0;
            if (!GetCursorPos(out c0)) return;
            grabX = c0.X - Left; grabY = c0.Y - Top;
            dragging = true;
            dragT.Start();
            return;
        }
        if (verb == "quit") { Quit(); return; }
        /* Tom, 2026-11-13: the status check can come as a red dot rather
           than the whole screen (STATUS Settings, DESKTOP, How it comes).
           `due|1` puts a red dot on the taskbar button,
           `due|0` takes it off. The page decides when; this only paints. */
        if (verb == "due") { string d = bits.Length > 1 ? bits[1] : "0"; Due(d != "0", d == "2"); return; }
        if (verb == "menu") { if (winMenu != null) winMenu.Show(this, PointToClient(Cursor.Position)); return; }
        /* The program's settings live in STATUS's own Settings, DESKTOP, THE
           PROGRAM, since the tray icon went (STATUS 1.0.102, Tom: the tray
           holds SPEAK alone). The right click menu still has them too. */
        if (verb == "keybox") { ChooseKey(); return; }
        if (verb == "top")
        {
            onTop = bits.Length > 1 && bits[1] == "1";
            Pin(onTop); if (miTop != null) miTop.Checked = onTop; SaveCfg();
            Sense();   /* the page's switch reads it back at once */
            return;
        }
        if (verb == "hotkey")
        {
            uint m2, v2;
            if (bits.Length > 1 && ParseHotkey(bits[1], out m2, out v2))
            {
                hotkey = bits[1].ToLowerInvariant(); SaveCfg(); RegisterTheHotkey();
                if (keysMenu != null) MarkKeys(keysMenu);
                Sense();
            }
            return;
        }
        if (verb == "boot") { SetBoot(bits.Length > 1 && bits[1] == "1"); Sense(); return; }
        /* Tom, 2026-11-16: "Make the status tray icon toggleable in desktop
           settings." Off by default: the tray holds SPEAK alone. */
        if (verb == "tray") { trayOn = bits.Length > 1 && bits[1] == "1"; Tray(trayOn); SaveCfg(); Sense(); return; }
        /* Settings takes the whole screen it is on while it is open, and the
           window goes back where it was after (Tom, 2026-11-16: "take
           advantage of all the desktop real estate ... don't limit it to the
           current status size window"). */
        if (verb == "wide") { Wide(bits.Length > 1 && bits[1] == "1"); return; }
        /* `ov|show|pos|top`: the S-rank overlay's choices, from Settings, DESKTOP */
        if (verb == "ov")
        {
            ovShow = bits.Length > 1 && bits[1] == "1";
            if (bits.Length > 2) ovPos = bits[2];
            if (bits.Length > 3) ovTop = bits[3];
            ovCovered = false;
            OvPlace(true);
            return;
        }

        int w = 0, h = 0;
        if (bits.Length >= 3)
        {
            int.TryParse(bits[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out w);
            int.TryParse(bits[2], NumberStyles.Integer, CultureInfo.InvariantCulture, out h);
        }
        /* `takeover` carries no size worth having: it fills the screen. Every
           other verb is a size and a size under this is a misread message. */
        if (verb != "takeover" && (w < 120 || h < 60)) return;

        if (verb == "widget")
        {
            /* Tom, 2026-10-18: "it repositions itself if I move the big view
               and back." The widget went back to where it was before the app
               opened, wherever the app had been moved to. Back from an app he
               moved, it shrinks into the app's top right corner, where the
               chevron is, and stays there. */
            bool moved = mode == "app" && Location != appPlaced;
            int right = Left + Width, top = Top;
            mode = "widget"; Unzoom(); ClientSize = new Size(w, h);
            if (moved) { KeepCorner(right, top); posX = Left; posY = Top; SaveCfg(); }
            else PlaceWidget();
            Round();
        }
        else if (verb == "app")
        {
            /* Opening the whole app used to throw the window into the middle
               of the screen, which is not where he was looking. It grows from
               where the widget already is, and only moves as far as it must
               to stay on the screen. */
            int right = Left + Width, top = Top;
            if (mode == "checkin" && backRight != int.MinValue) { right = backRight; top = backTop; }
            backRight = int.MinValue;
            mode = "app";
            appBase = new Size(w, h);
            ZoomTo(zoom);
            ClientSize = AppSize();
            KeepCorner(right, top);
            appPlaced = Location;
            Round();
        }
        else if (verb == "checkin" || verb == "takeover")
        {
            /* â”€â”€ intrusive on purpose â”€â”€
               Tom: "I also want the check in prompt to be intrusive and
               prominent", and then, on 2026-09-17: "I want the notif to be
               HUGE and IMMEDIATE. Our tools are made to consider people at
               their lowest selves - it should never go away until answered."

               `checkin` centred a box on the screen, which is the first half
               of that and not the second. `takeover` is the whole screen: the
               window becomes the monitor the pointer is on, corners square,
               in front, with the focus. The page has no close button on it,
               so the only way back to the desktop is to answer.

               Nothing here remembers the size it was: the page says
               `widget` again the moment the check is answered, and that is
               what puts the window back where it was. */
            if (verb == "takeover")
            {
                /* Once. Tom, 2026-09-17: "Just have the Status Check pop up
                   once and then I'll always answer it when im back in my
                   desk." Already being the check means the screen was already
                   taken, and taking it again is a grab at a desk he is not
                   sitting at. The page sends one fixed message for the same
                   reason; this is the half that holds if anything ever sends
                   a second. */
                if (mode == "checkin") return;
                if (mode == "app") { backRight = Left + Width; backTop = Top; }
                if (mode == "wide") { backRight = wideBack.Right; backTop = wideBack.Top; Pin(onTop); }
                mode = "checkin";
                Unzoom();
                var scr = Screen.FromPoint(Cursor.Position).Bounds;
                Square();
                Bounds = scr;
                Front();
                Log("took the screen at " + scr.Left + "," + scr.Top + " " + scr.Width + "x" + scr.Height);
            }
            else
            {
                /* The red dot's check: he pressed for it, so a box in the
                   middle, no sound, and back where he was after. */
                if (mode == "checkin") return;
                if (mode == "app") { backRight = Left + Width; backTop = Top; }
                mode = "checkin";
                Unzoom();
                ClientSize = new Size(w, h);
                Centre();
                Round();
                Front();
                OvPlace(true);
                return;
            }
            try { System.Media.SystemSounds.Exclamation.Play(); } catch { }
        }
        OvPlace(true);   /* out of the way of a check, back after it, aside for the app */
    }

    /* ── the S-rank overlay ──
       Tom, 2026-11-16: "always on top, by default on the upper right side,
       and it doesn't really get in the way too much. Not really a window,
       more like just an overlay that doesn't get interacted with." The page
       draws the picture (STATUS 1.0.101, `ovDraw`); this only places it: a
       corner of the main screen's work area, moved aside when the STATUS
       window sits in that corner, hidden while a status check has the
       screen. Clicks pass through it and it never takes the focus. */
    Overlay ov;
    bool ovShow = true, ovCovered;
    string ovPos = "tr", ovTop = "always";
    Timer ovT;

    void OvImage(string raw)
    {
        if (ov == null) return;
        string[] p = raw.Split(new char[] { '|' }, 4);
        int w = 0, h = 0;
        if (p.Length == 4) { int.TryParse(p[1], out w); int.TryParse(p[2], out h); }
        if (w < 1 || h < 1 || p[3].Length == 0) { ov.SetImage(null); OvPlace(true); return; }
        try
        {
            byte[] png = Convert.FromBase64String(p[3]);
            using (var ms = new MemoryStream(png))
            using (var b0 = new Bitmap(ms))
                ov.SetImage(new Bitmap(b0));
        }
        catch (Exception ex) { Log("overlay picture did not read: " + ex.Message); return; }
        OvPlace(true);
    }

    /* `raise` puts it back on top; moving with the widget only moves it. */
    void OvPlace(bool raise)
    {
        if (ov == null) return;
        bool want = ovShow && ov.HasImage && mode != "checkin" && mode != "wide" && !ovCovered;
        if (!want) { ov.Appear(false); return; }
        Size s = ov.ImageSize;
        var wa = Screen.PrimaryScreen.WorkingArea;
        const int M = 16, GAP = 12;
        bool right = ovPos == "tr" || ovPos == "br", bottom = ovPos == "bl" || ovPos == "br";
        int x = right ? wa.Right - s.Width - M : wa.Left + M;
        int y = bottom ? wa.Bottom - s.Height - M : wa.Top + M;
        /* never over the STATUS window: beside it first, so the corner's edge
           stays the edge; above or below it when there is no room beside */
        if (Visible && WindowState != FormWindowState.Minimized)
        {
            var me = Rectangle.Inflate(Bounds, GAP, GAP);
            if (me.IntersectsWith(new Rectangle(x, y, s.Width, s.Height)))
            {
                int nx = right ? Left - GAP - s.Width : Right + GAP;
                /* beside it, level with its top or bottom edge */
                if (nx >= wa.Left && nx + s.Width <= wa.Right)
                {
                    x = nx;
                    y = bottom ? Math.Min(Bottom, wa.Bottom) - s.Height : Math.Max(Top, wa.Top);
                }
                else y = bottom ? Top - GAP - s.Height : Bottom + GAP;
            }
        }
        ov.Draw(x, y);
        if (raise) { ov.Appear(true); ov.Z(ovTop != "never"); }
    }

    /* Once a second: Always keeps it on top of windows that put themselves
       on top later; Not over full screen hides it while the window in front
       fills the screen it is on (a game, a video) or Windows says a full
       screen program or a presentation is running. */
    void OvTick()
    {
        if (ov == null || !ovShow || !ov.HasImage) return;
        if (ovTop == "full")
        {
            bool cov = FullScreenInFront();
            if (cov != ovCovered) { ovCovered = cov; OvPlace(true); }
            else if (!cov && ov.Up) ov.Z(true);
        }
        else if (ovTop == "always" && ov.Up) ov.Z(true);
    }

    [DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr h, out RECT r);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
    [DllImport("shell32.dll")] static extern int SHQueryUserNotificationState(out int state);
    [StructLayout(LayoutKind.Sequential)] struct RECT { public int L, T, R, B; }

    bool FullScreenInFront()
    {
        int st;
        try { if (SHQueryUserNotificationState(out st) == 0 && (st == 3 || st == 4)) return true; } catch { }
        IntPtr fg = GetForegroundWindow();
        if (fg == IntPtr.Zero || fg == Handle || fg == ov.Handle) return false;
        var cls = new StringBuilder(64);
        GetClassName(fg, cls, cls.Capacity);
        string c = cls.ToString();
        if (c == "Progman" || c == "WorkerW" || c == "Shell_TrayWnd" || c == "Shell_SecondaryTrayWnd") return false;
        RECT r;
        if (!GetWindowRect(fg, out r)) return false;
        var scr = Screen.FromHandle(fg);
        if (!scr.Primary) return false;   /* the overlay is on the main screen */
        var b = scr.Bounds;
        return r.L <= b.Left && r.T <= b.Top && r.R >= b.Right && r.B >= b.Bottom;
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

    /* ── what Windows can see, handed to the page ──
       Every 5 seconds: how long since the keyboard or mouse was last touched,
       and which program is in front. The page decides everything else — when
       a status check may go up, and what counts as screen time — so changing
       that never needs this rebuilt. A window's title is passed along and
       never kept here; the page keeps only a site name worked out from it. */
    void Sense()
    {
        if (!ready) return;
        var li = new LASTINPUTINFO();
        li.cbSize = (uint)Marshal.SizeOf(li);
        long idle = 0;
        /* Unsigned and unchecked, so the subtraction survives the tick count
           wrapping, which it does every 49 days on a machine never turned off. */
        if (GetLastInputInfo(ref li)) idle = unchecked((uint)Environment.TickCount - li.dwTime) / 1000;

        string exe = "", app = "", title = "";
        IntPtr fg = GetForegroundWindow();
        if (fg == Handle) { exe = "status"; app = "STATUS"; }
        else if (fg != IntPtr.Zero)
        {
            uint pid;
            GetWindowThreadProcessId(fg, out pid);
            string[] n = ProcName(pid);
            exe = n[0]; app = n[1];
            var sb = new StringBuilder(512);
            GetWindowText(fg, sb, sb.Capacity);
            title = sb.ToString();
        }
        string js = "window.deskHost&&deskHost({idle:" + idle +
            ",exe:" + Js(exe) + ",app:" + Js(app) + ",title:" + Js(title) +
            ",top:" + (onTop ? 1 : 0) + ",key:" + Js(Pretty(hotkey)) +
            ",boot:" + (GetBoot() ? 1 : 0) + ",tray:" + (trayOn ? 1 : 0) + "})";
        try { web.CoreWebView2.ExecuteScriptAsync(js); } catch { }
    }

    /* The program's own name for itself ("CapCut", "Google Chrome") where it
       gives one, its file name where it does not. Remembered per process. */
    string[] ProcName(uint pid)
    {
        string[] n;
        if (procNames.TryGetValue(pid, out n)) return n;
        string exe = "", app = "";
        try
        {
            var p = System.Diagnostics.Process.GetProcessById((int)pid);
            exe = p.ProcessName;
            try { app = p.MainModule.FileVersionInfo.FileDescription; } catch { }
        }
        catch { }
        if (string.IsNullOrEmpty(app)) app = exe;
        n = new string[] { exe.ToLowerInvariant(), app.Trim() };
        if (procNames.Count > 500) procNames.Clear();
        procNames[pid] = n;
        return n;
    }

    static string Js(string s)
    {
        var sb = new StringBuilder("\"");
        foreach (char ch in s ?? "")
        {
            if (ch == '"' || ch == '\\') sb.Append('\\').Append(ch);
            else if (ch < 0x20 || ch == (char)0x2028 || ch == (char)0x2029 || ch == '<' || ch == '>')
                sb.Append("\\u").Append(((int)ch).ToString("x4"));
            else sb.Append(ch);
        }
        return sb.Append('"').ToString();
    }

    /* ── start with Windows ──
       One line under the current user's Run key, which is what the Startup
       folder does without needing a shortcut made. Off is the line removed. */
    const string RUN_KEY = @"Software\Microsoft\Windows\CurrentVersion\Run";
    const string RUN_NAME = "Motherbase STATUS";
    bool GetBoot()
    {
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(RUN_KEY))
                return k != null && k.GetValue(RUN_NAME) != null;
        }
        catch { return false; }
    }
    void SetBoot(bool on)
    {
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(RUN_KEY))
            {
                if (on) k.SetValue(RUN_NAME, "\"" + Application.ExecutablePath + "\"");
                else if (k.GetValue(RUN_NAME) != null) k.DeleteValue(RUN_NAME);
            }
            Log("start with Windows: " + (on ? "on" : "off"));
        }
        catch (Exception ex) { Log("could not change start with Windows: " + ex.Message); }
    }

    /* The home screen is its own program. Starting it twice does nothing, so
       this is safe to call whenever he presses Home. */
    void OpenMenu()
    {
        try
        {
            string exe = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Main Menu.exe");
            if (File.Exists(exe)) System.Diagnostics.Process.Start(exe);
        }
        catch (Exception ex) { Log("could not open the Main Menu: " + ex.Message); }
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

    void DragTick()
    {
        if (!dragging) { dragT.Stop(); return; }
        if ((GetAsyncKeyState(VK_LBUTTON) & 0x8000) == 0)
        {
            dragging = false;
            dragT.Stop();
            if (mode == "widget") { posX = Left; posY = Top; SaveCfg(); }
            return;
        }
        POINT c;
        if (!GetCursorPos(out c)) return;
        Location = new Point(c.X - grabX, c.Y - grabY);
    }

    /* â”€â”€ the chevron never moves â”€â”€
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

    /* A window that is the whole screen with rounded corners shows four
       notches of desktop through them. */
    void Square()
    {
        int pref = DWMWCP_DONOTROUND;
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

    /* â”€â”€ the widget remembers where he put it â”€â”€ */
    protected override void OnResizeEnd(EventArgs e)
    {
        base.OnResizeEnd(e);
        if (mode == "widget") { posX = Left; posY = Top; SaveCfg(); }
        if (mode == "app") { SaveCfg(); Log("app window " + Width + "x" + Height + ", zoom " + zoom.ToString("0.###", CultureInfo.InvariantCulture)); }
    }

    protected override void OnMove(EventArgs e)
    {
        base.OnMove(e);
        if (mode == "widget" && ready) { posX = Left; posY = Top; }
        OvPlace(false);
    }

    protected override void OnResize(EventArgs e)
    {
        base.OnResize(e);
        OvPlace(false);
    }

    /* â”€â”€ settings, one line each, beside the program â”€â”€ */
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
                else if (k == "tray") trayOn = (v == "1");
                else if (k == "zoom") { double z; if (double.TryParse(v, NumberStyles.Float, CultureInfo.InvariantCulture, out z) && z >= 1 && z < 10) zoom = z; }
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
                "tray=" + (trayOn ? "1" : "0") + "\r\n" +
                "zoom=" + zoom.ToString("0.###", CultureInfo.InvariantCulture) + "\r\n" +
                (posX == int.MinValue ? "" : "pos=" + posX + "," + posY + "\r\n"));
        }
        catch { }
    }

    /* ── no tray icon ──
       Tom, 2026-11-16: the tray holds SPEAK alone; STATUS, the Main Menu and
       OUTER HEAVEN live on the taskbar. What the tray icon's menu did is in
       Settings, DESKTOP, THE PROGRAM, and on a right click on the window. */
    void BuildMenu()
    {
        var menu = new ContextMenu();
        menu.MenuItems.Add(new MenuItem("Open STATUS", (s, e) => Front()));
        menu.MenuItems.Add(new MenuItem("Check in now", (s, e) => AskNow()));
        menu.MenuItems.Add("-");
        miTop = new MenuItem("Always on top", (s, e) =>
        {
            onTop = !onTop; miTop.Checked = onTop; Pin(onTop); SaveCfg(); Sense();
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
        custom.Click += (s, e) => ChooseKey();
        keys.MenuItems.Add(custom);
        menu.MenuItems.Add(keys);
        keysMenu = keys;
        menu.MenuItems.Add("-");
        menu.MenuItems.Add(new MenuItem("Quit", (s, e) => Quit()));

        winMenu = menu;
        MarkKeys(keys);
    }

    /* The tray icon, when he wants it: the right click menu on it, and a
       double click brings STATUS to the front. */
    void Tray(bool on)
    {
        if (!on) { if (tray != null) { tray.Visible = false; tray.Dispose(); tray = null; } return; }
        if (tray != null) return;
        tray = new NotifyIcon();
        tray.Icon = plainIcon ?? Icon;
        tray.Text = "STATUS";
        tray.ContextMenu = winMenu;
        tray.DoubleClick += (s, e) => Front();
        tray.Visible = true;
        Log("tray icon on");
    }

    double ZoomMax()
    {
        var wa = Screen.FromRectangle(Bounds).WorkingArea;
        return Math.Max(1, (wa.Height - 2.0 * GRIP) / appBase.Height);
    }
    Size AppSize()
    {
        return new Size((int)Math.Round(appBase.Width * zoom) + 2 * GRIP, (int)Math.Round(appBase.Height * zoom) + 2 * GRIP);
    }
    void ZoomTo(double z)
    {
        zoom = Math.Max(1, Math.Min(ZoomMax(), z));
        Padding = new Padding(GRIP);
        try { web.ZoomFactor = zoom; } catch { }
    }
    /* the widget, the status check and Settings are drawn at their own size */
    void Unzoom()
    {
        Padding = new Padding(0);
        try { web.ZoomFactor = 1; } catch { }
    }

    void Wide(bool on)
    {
        if (on)
        {
            if (mode == "wide" || mode == "checkin") return;
            wideBack = Bounds; wideMode = mode; mode = "wide";
            Unzoom();
            var wa = Screen.FromRectangle(Bounds).WorkingArea;
            /* Always on top is for the widget and the status check, never
               Settings (Tom, 2026-11-16): it sits with his other windows. */
            Pin(false);
            /* A big window in the middle of the screen, the desktop showing
               round it. The whole screen was "a bit inconvenient" (Tom,
               2026-11-16, asking for a middle ground). */
            int ww = Math.Min((int)(wa.Width * 0.8), 1760), wh = Math.Min((int)(wa.Height * 0.9), 960);
            Bounds = new Rectangle(wa.Left + (wa.Width - ww) / 2, wa.Top + (wa.Height - wh) / 2, ww, wh);
            Round();
            Front();
            OvPlace(true);
            Log("settings opened at " + Left + "," + Top + " " + Width + "x" + Height);
        }
        else
        {
            if (mode != "wide") return;
            mode = wideMode ?? "app";
            if (mode == "app") ZoomTo(zoom);
            Bounds = wideBack;
            Pin(onTop);
            Round();
            OvPlace(true);
            Log("settings gave the screen back");
        }
    }

    /* Always on top, said so Windows takes it from a program that is not in
       front: the form's own TopMost asks without SWP_NOACTIVATE and was
       ignored when Settings turned it back on (watched 2026-11-16). */
    [DllImport("user32.dll", SetLastError = true)] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint f);
    void Pin(bool top)
    {
        TopMost = top;
        bool ok = SetWindowPos(Handle, new IntPtr(top ? -1 : -2), 0, 0, 0, 0, 0x1 | 0x2 | 0x10);
        Log("always on top " + (top ? "on" : "off") + ": " + (ok ? "ok" : "refused " + Marshal.GetLastWin32Error()) +
            ", now " + (((long)GetWindowLongPtr(Handle, -20) & 8) != 0 ? "on top" : "not on top"));
    }
    [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW")] static extern IntPtr GetWindowLongPtr(IntPtr h, int i);

    void ChooseKey()
    {
        using (var box = new KeyBox(hotkey))
        {
            if (box.ShowDialog(this) != DialogResult.OK || box.Chosen == null) return;
            hotkey = box.Chosen; SaveCfg(); RegisterTheHotkey();
            if (keysMenu != null) MarkKeys(keysMenu);
            Sense();
        }
    }

    /* ── a Windows notification with no tray icon that stays ──
       A notification has to come from a tray icon, so one is put there for
       the length of the notification and taken away after: 12 seconds, or
       as soon as it is clicked or closed. Clicking it runs `then`. */
    NotifyIcon note;
    Timer noteT;
    void Notify(string text, ToolTipIcon kind, Action then)
    {
        NoteGone();
        note = new NotifyIcon();
        note.Icon = plainIcon ?? Icon;
        note.Text = "STATUS";
        note.Visible = true;
        note.BalloonTipClicked += (s, e) => { NoteGone(); if (then != null) then(); };
        note.BalloonTipClosed += (s, e) => NoteGone();
        note.ShowBalloonTip(10000, "STATUS", text, kind);
        noteT = new Timer();
        noteT.Interval = 12000;
        noteT.Tick += (s, e) => NoteGone();
        noteT.Start();
    }
    void NoteGone()
    {
        if (noteT != null) { noteT.Stop(); noteT.Dispose(); noteT = null; }
        if (note != null) { note.Visible = false; note.Dispose(); note = null; }
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

    /* ── the red dot ── */
    Icon plainIcon, dotIcon;
    void Due(bool on, bool pop)
    {
        if (plainIcon == null) plainIcon = Icon;
        if (on && dotIcon == null) dotIcon = DotIcon(plainIcon);
        Icon use = on ? dotIcon : plainIcon;
        if (use == null) return;
        Icon = use;
        /* `due|2`: one small Windows notification as
           well (Tom, 2026-11-13, "also offer a small pop up from here").
           Clicking it opens the check, the same as the widget's button. */
        if (on && pop)
            Notify("A status check is waiting. Click to answer it.", ToolTipIcon.None, () =>
            {
                if (!ready) return;
                try { web.CoreWebView2.ExecuteScriptAsync("typeof deskDot !== 'undefined' && deskDot && deskDotOpen()"); } catch { }
            });
        if (!on) NoteGone();
        Log(on ? (pop ? "red dot on, pop up" : "red dot on") : "red dot off");
    }
    static Icon DotIcon(Icon from)
    {
        try
        {
            using (var bmp = new Bitmap(64, 64))
            using (var g = Graphics.FromImage(bmp))
            {
                g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
                g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
                using (var src = from.ToBitmap()) g.DrawImage(src, 0, 0, 64, 64);
                /* bottom right, ringed in the page colour so it reads on any taskbar */
                using (var ring = new SolidBrush(Color.FromArgb(8, 11, 16))) g.FillEllipse(ring, 30, 30, 34, 34);
                using (var red = new SolidBrush(Color.FromArgb(232, 64, 64))) g.FillEllipse(red, 34, 34, 26, 26);
                return Icon.FromHandle(bmp.GetHicon());
            }
        }
        catch { return null; }
    }

    Icon TrayIcon()
    {
        try
        {
            string p = Path.Combine(root, "shared", "icons", "status.png");
            if (File.Exists(p)) using (var bmp = new Bitmap(p)) return Icon.FromHandle(bmp.GetHicon());
        }
        catch { }
        return Hosted.OwnIcon();
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
        if (!RegisterHotKey(Handle, HOTKEY_ID, mod, vk))
            Notify("Another program already uses " + Pretty(hotkey) +
                ". Pick a different one in STATUS Settings, DESKTOP.", ToolTipIcon.Warning, null);
    }

    protected override void WndProc(ref Message m)
    {
        /* ── the click that only woke the window up ──
           When the widget is not the window in front, Windows asks what to do
           with the click that is about to land on it, and the default answer
           throws that click away once the window is focused. So the first
           press after looking at anything else moved nothing, and the second
           worked, which is most of what "hard to drag" was. MA_ACTIVATE says
           focus it AND let the click through. */
        if (m.Msg == WM_MOUSEACTIVATE) { m.Result = new IntPtr(MA_ACTIVATE); return; }

        if (m.Msg == 0x84 && mode == "app")   /* WM_NCHITTEST: the strip round the page resizes */
        {
            long lp = m.LParam.ToInt64();
            Point c = PointToClient(new Point((short)(lp & 0xFFFF), (short)((lp >> 16) & 0xFFFF)));
            const int CORNER = 20;
            bool l = c.X < GRIP, r = c.X >= ClientSize.Width - GRIP, t = c.Y < GRIP, b = c.Y >= ClientSize.Height - GRIP;
            bool nl = c.X < CORNER, nr = c.X >= ClientSize.Width - CORNER, nt = c.Y < CORNER, nb = c.Y >= ClientSize.Height - CORNER;
            int hit = 0;
            if ((t && nl) || (l && nt)) hit = 13;
            else if ((t && nr) || (r && nt)) hit = 14;
            else if ((b && nl) || (l && nb)) hit = 16;
            else if ((b && nr) || (r && nb)) hit = 17;
            else if (l) hit = 10; else if (r) hit = 11; else if (t) hit = 12; else if (b) hit = 15;
            if (hit != 0) { m.Result = new IntPtr(hit); return; }
        }
        if (m.Msg == 0x214 && mode == "app")  /* WM_SIZING: same shape, phone size to the screen's height */
        {
            var rc = (RECT)Marshal.PtrToStructure(m.LParam, typeof(RECT));
            int edge = m.WParam.ToInt32();
            /* a press on the edge that has not moved yet changes nothing */
            if (rc.R - rc.L == Width && rc.B - rc.T == Height) { m.Result = new IntPtr(1); return; }
            double w = rc.R - rc.L - 2 * GRIP, h = rc.B - rc.T - 2 * GRIP;
            bool vertical = edge == 3 || edge == 6;
            double z = vertical ? h / appBase.Height : w / appBase.Width;
            /* never past the top or bottom of the screen it is on */
            var wa = Screen.FromPoint(new Point((rc.L + rc.R) / 2, (rc.T + rc.B) / 2)).WorkingArea;
            bool fromTop = edge == 3 || edge == 4 || edge == 5;
            double room = (fromTop ? rc.B - wa.Top : wa.Bottom - rc.T) - 2.0 * GRIP;
            z = Math.Min(z, room / appBase.Height);
            ZoomTo(z);
            Size s2 = AppSize();
            /* the right edge holds still unless he is dragging the left one, so the chevron stays put */
            if (edge == 1 || edge == 4 || edge == 7 || vertical) rc.L = rc.R - s2.Width; else rc.R = rc.L + s2.Width;
            if (edge == 3 || edge == 4 || edge == 5) rc.T = rc.B - s2.Height; else rc.B = rc.T + s2.Height;
            Marshal.StructureToPtr(rc, m.LParam, false);
            m.Result = new IntPtr(1);
            return;
        }

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
       quitting now. */
    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        base.OnFormClosing(e);
        SaveCfg();
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        NoteGone();
        Tray(false);
    }

    void Quit()
    {
        SaveCfg();
        try { UnregisterHotKey(Handle, HOTKEY_ID); } catch { }
        NoteGone();
        Tray(false);
        Application.Exit();
    }
}

/* ── the overlay's window ──
   A picture on the screen and nothing else: layered (its own pixels carry
   their see-through), transparent to the mouse, a tool window so it has no
   taskbar button and no Alt+Tab entry, and never activated, so it cannot
   take the focus from what he is typing in. */
class Overlay : Form
{
    [DllImport("user32.dll")] static extern bool UpdateLayeredWindow(IntPtr h, IntPtr dst, ref PT at, ref SZ size, IntPtr src, ref PT from, int key, ref BLEND blend, int flags);
    [DllImport("user32.dll")] static extern IntPtr GetDC(IntPtr h);
    [DllImport("user32.dll")] static extern int ReleaseDC(IntPtr h, IntPtr dc);
    [DllImport("gdi32.dll")] static extern IntPtr CreateCompatibleDC(IntPtr dc);
    [DllImport("gdi32.dll")] static extern bool DeleteDC(IntPtr dc);
    [DllImport("gdi32.dll")] static extern IntPtr SelectObject(IntPtr dc, IntPtr o);
    [DllImport("gdi32.dll")] static extern bool DeleteObject(IntPtr o);
    [DllImport("user32.dll")] static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int cx, int cy, uint f);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [StructLayout(LayoutKind.Sequential)] struct PT { public int X, Y; }
    [StructLayout(LayoutKind.Sequential)] struct SZ { public int W, H; }
    [StructLayout(LayoutKind.Sequential, Pack = 1)] struct BLEND { public byte Op, Flags, Alpha, Format; }

    const int WS_EX_LAYERED = 0x80000, WS_EX_TRANSPARENT = 0x20, WS_EX_TOOLWINDOW = 0x80, WS_EX_NOACTIVATE = 0x8000000;
    const int WM_MOUSEACTIVATE = 0x21, MA_NOACTIVATE = 3, WM_NCHITTEST = 0x84, HTTRANSPARENT = -1;
    const uint SWP_NOSIZE = 0x1, SWP_NOMOVE = 0x2, SWP_NOACTIVATE = 0x10;
    static readonly IntPtr TOPMOST = new IntPtr(-1), NOTOPMOST = new IntPtr(-2);

    Bitmap img;
    bool up;
    public bool Up { get { return up; } }
    public bool HasImage { get { return img != null; } }
    public Size ImageSize { get { return img == null ? Size.Empty : img.Size; } }

    public Overlay()
    {
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        StartPosition = FormStartPosition.Manual;
        Text = "STATUS overlay";
        IntPtr unused = Handle;   /* made now, shown only once there is a picture */
    }

    protected override bool ShowWithoutActivation { get { return true; } }
    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.ExStyle |= WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE;
            return cp;
        }
    }
    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_MOUSEACTIVATE) { m.Result = new IntPtr(MA_NOACTIVATE); return; }
        if (m.Msg == WM_NCHITTEST) { m.Result = new IntPtr(HTTRANSPARENT); return; }
        base.WndProc(ref m);
    }

    public void SetImage(Bitmap b)
    {
        if (img != null) img.Dispose();
        img = b;
    }

    /* the picture, with its own alpha, at x,y */
    public void Draw(int x, int y)
    {
        if (img == null) return;
        IntPtr scr = GetDC(IntPtr.Zero), mem = CreateCompatibleDC(scr), hb = IntPtr.Zero, old = IntPtr.Zero;
        try
        {
            hb = img.GetHbitmap(Color.FromArgb(0));   /* premultiplied, as layering wants */
            old = SelectObject(mem, hb);
            var size = new SZ { W = img.Width, H = img.Height };
            var from = new PT();
            var at = new PT { X = x, Y = y };
            var blend = new BLEND { Op = 0, Flags = 0, Alpha = 255, Format = 1 };
            UpdateLayeredWindow(Handle, scr, ref at, ref size, mem, ref from, 0, ref blend, 2);
        }
        finally
        {
            ReleaseDC(IntPtr.Zero, scr);
            if (hb != IntPtr.Zero) { SelectObject(mem, old); DeleteObject(hb); }
            DeleteDC(mem);
        }
    }

    public void Appear(bool on)
    {
        if (on == up) return;
        up = on;
        ShowWindow(Handle, on ? 4 : 0);   /* SW_SHOWNOACTIVATE, SW_HIDE */
    }

    /* on top of every window, or in among them */
    public void Z(bool top)
    {
        SetWindowPos(Handle, top ? TOPMOST : NOTOPMOST, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
    }
}
