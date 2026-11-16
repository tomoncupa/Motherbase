/* ══════════════ SPEAK.exe ══════════════
   Tom, 2026-11-10: "Speak app that also has an always on overlay widget, so
   I can start a mini practice whenever." 2026-11-16: "speak will primarily
   be a desktop app", then "I want speak to auto start, and I want it to be a
   tray icon. And if I click the tray icon, I can have the four buttons always
   available. Just give it a complete settings menu for the mini widget and
   for the full EXE app."

   So SPEAK.exe is a tray icon first. Starting with Windows it sits in the
   tray with no window. Clicking the icon pops the MINI WIDGET up beside it:
   the four buttons (SPEAK, FITNESS, OTHER, FREE SPEAK), growing for a take
   and shrinking back (the page says so: mbsize:big, small, wide). The FULL
   APP is the whole of SPEAK in an ordinary window. Two windows, one tray,
   one store. Both show SPEAK's own Settings, whose PROGRAM tab is this
   program's settings (the page posts mbset:key=value; every window is told
   the new values).

   Tom only. SPEAK is not in the client build, so this is not in Setup.exe.
   It shares STATUS.exe's and the Main Menu's store (desktop/data), so a take
   made here is in SPEAK everywhere at once.

   Windows' own title bar stays, coloured like the page (how-we-work: no
   white title bar), because it is what drags the window.                  */

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

/* ── the program: settings, the tray, the two windows ── */
static class App
{
    public const string TITLE = "SPEAK";
    public static readonly string Dir = AppDomain.CurrentDomain.BaseDirectory;
    static readonly string cfgPath = Path.Combine(Dir, "speak-app.txt");
    static readonly JavaScriptSerializer json = new JavaScriptSerializer();
    public static NotifyIcon Tray;
    public static Speak Full, Mini;
    public static bool Quitting;
    static Mutex only;
    static EventWaitHandle wake;
    static Control marshal;   /* no window: only the program's thread, for the second-start signal */

    /* every setting, with its default; a line in speak-app.txt wins */
    public static readonly Dictionary<string, string> Cfg = new Dictionary<string, string> {
        { "hidden", "1" },     /* starting with Windows, sit in the tray with no window */
        { "click", "mini" },   /* a click on the tray icon opens: mini or full */
        { "miniTop", "1" },    /* the mini widget stays on top of other windows */
        { "miniAway", "0" },   /* the mini widget tucks away when you click elsewhere */
        { "miniPlace", "tray" },/* the mini widget pops up by the tray, or where you left it */
        { "fullTop", "0" },    /* the full app stays on top of other windows */
        { "close", "tray" },   /* the full app's close button: tray or quit */
        { "at", "" }, { "full", "" },
    };
    public static bool On(string k) { return Cfg.ContainsKey(k) && Cfg[k] == "1"; }

    [STAThread]
    static void Main(string[] args)
    {
        bool fresh;
        only = new Mutex(true, "Motherbase.Speak.App", out fresh);
        wake = new EventWaitHandle(false, EventResetMode.AutoReset, "Motherbase.Speak.Show");
        if (!fresh) { wake.Set(); return; }   /* the one already running opens its full app */
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        try { File.Delete(Path.Combine(Dir, "speak-app.log")); } catch { }
        Load();
        bool boot = Array.IndexOf(args, "--tray") >= 0;
        marshal = new Control();
        IntPtr made = marshal.Handle;
        MakeTray();
        /* first run: Start with Windows on, in the tray */
        if (!Cfg.ContainsKey("bootSet")) { SetBoot(true); Cfg["bootSet"] = "1"; Save(); }
        else if (GetBoot()) SetBoot(true);   /* keeps the --tray in the Run key */
        if (Array.IndexOf(args, "--mini") >= 0) ShowMini(true);
        else if (!(boot && On("hidden"))) ShowFull();
        new Thread(() => { while (true) { wake.WaitOne(); try { marshal.BeginInvoke((Action)ShowFull); } catch { } } }) { IsBackground = true }.Start();
        Application.Run(new ApplicationContext());
    }

    public static void Log(string s)
    {
        try { File.AppendAllText(Path.Combine(Dir, "speak-app.log"), DateTime.Now.ToString("HH:mm:ss") + "  " + s + "\r\n"); } catch { }
    }

    static void MakeTray()
    {
        Tray = new NotifyIcon { Icon = Hosted.OwnIcon(), Text = TITLE, Visible = true };
        var menu = new ContextMenuStrip();
        menu.Items.Add("Mini widget", null, (s, e) => ShowMini(true));
        menu.Items.Add("Open SPEAK", null, (s, e) => ShowFull());
        menu.Items.Add("Free speak", null, (s, e) => { ShowFull(); Full.Run("openFree()"); });
        menu.Items.Add("Drill menu", null, (s, e) => { ShowFull(); Full.Run("openMenu()"); });
        menu.Items.Add("Settings", null, (s, e) => { ShowFull(); Full.Run("openSettings()"); });
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Quit SPEAK", null, (s, e) => Quit());
        Tray.ContextMenuStrip = menu;
        Tray.MouseClick += (s, e) =>
        {
            if (e.Button != MouseButtons.Left) return;
            if (Cfg["click"] == "full") ShowFull(); else ShowMini(false);
        };
    }

    public static void ShowFull()
    {
        if (Full == null || Full.IsDisposed) Full = new Speak(false);
        Full.Bring();
    }
    /* a tray click toggles the widget; the menu always shows it */
    public static void ShowMini(bool always)
    {
        if (Mini == null || Mini.IsDisposed) Mini = new Speak(true);
        if (!always && Mini.Visible && Form.ActiveForm == Mini) { Mini.Hide(); return; }
        Mini.PlaceMini();
        Mini.Bring();
    }

    public static void Quit()
    {
        Quitting = true;
        Save();
        if (Tray != null) { Tray.Visible = false; Tray.Dispose(); }
        if (Full != null && !Full.IsDisposed) Full.Close();
        if (Mini != null && !Mini.IsDisposed) Mini.Close();
        Application.Exit();
    }

    /* the page's PROGRAM tab: one setting changed */
    public static void Set(string k, string v)
    {
        if (k == "boot") { SetBoot(v == "1"); }
        else if (Cfg.ContainsKey(k) && k != "at" && k != "full") Cfg[k] = v;
        else return;
        Save();
        if (Full != null && !Full.IsDisposed) Full.Apply();
        if (Mini != null && !Mini.IsDisposed) Mini.Apply();
        Tell();
    }
    /* what the page shows on its PROGRAM tab */
    public static string State(bool mini)
    {
        var d = new Dictionary<string, object>();
        foreach (var kv in Cfg) if (kv.Key != "at" && kv.Key != "full" && kv.Key != "bootSet") d[kv.Key] = kv.Value;
        d["boot"] = GetBoot() ? "1" : "0";
        d["win"] = mini ? "mini" : "full";
        return json.Serialize(d);
    }
    public static void Tell()
    {
        if (Full != null && !Full.IsDisposed) Full.Post("{\"mb\":\"exe\",\"cfg\":" + State(false) + "}");
        if (Mini != null && !Mini.IsDisposed) Mini.Post("{\"mb\":\"exe\",\"cfg\":" + State(true) + "}");
    }

    static void Load()
    {
        try
        {
            if (!File.Exists(cfgPath)) return;
            foreach (string line in File.ReadAllLines(cfgPath))
            {
                int eq = line.IndexOf('=');
                if (eq < 1 || line.StartsWith("#")) continue;
                string k = line.Substring(0, eq).Trim(), v = line.Substring(eq + 1).Trim();
                if (k == "boot") Cfg["bootSet"] = "1";
                else if (k == "mini") continue;   /* the old single-window switch */
                else Cfg[k] = v;
            }
        }
        catch { }
    }
    public static void Save()
    {
        try
        {
            var sb = new System.Text.StringBuilder("# SPEAK.exe. Delete this file to go back to the defaults.\r\n");
            foreach (var kv in Cfg) if (kv.Value != "") sb.Append(kv.Key + "=" + kv.Value + "\r\n");
            File.WriteAllText(cfgPath, sb.ToString());
        }
        catch { }
    }

    const string RUN_KEY = @"Software\Microsoft\Windows\CurrentVersion\Run";
    const string RUN_NAME = "Motherbase SPEAK";
    public static bool GetBoot()
    {
        try { using (var k = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(RUN_KEY)) return k != null && k.GetValue(RUN_NAME) != null; }
        catch { return false; }
    }
    public static void SetBoot(bool on)
    {
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(RUN_KEY))
            {
                if (on) k.SetValue(RUN_NAME, "\"" + Application.ExecutablePath + "\" --tray");
                else if (k.GetValue(RUN_NAME) != null) k.DeleteValue(RUN_NAME);
            }
        }
        catch (Exception ex) { Log("could not change start with Windows: " + ex.Message); }
    }
}

/* ── one window: the full app, or the mini widget ── */
class Speak : Form
{
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int val, int size);
    const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20, DWMWA_BORDER_COLOR = 34, DWMWA_CAPTION_COLOR = 35, DWMWA_TEXT_COLOR = 36;

    /* the widget's sizes, inside the frame */
    static readonly Size SMALL = new Size(300, 282), BIG = new Size(440, 760), WIDE = new Size(1000, 820);
    Size bigAs = Size.Empty;
    bool big;
    readonly bool mini;
    readonly WebView2 web;
    readonly string pageUrl;

    static bool UseFolder() { return File.Exists(Path.Combine(App.Dir, "use-folder-copy.txt")); }

    public Speak(bool mini)
    {
        this.mini = mini;
        Text = mini ? "SPEAK mini" : App.TITLE;
        StartPosition = FormStartPosition.Manual;
        BackColor = Color.FromArgb(0x08, 0x0B, 0x10);
        Icon = Hosted.OwnIcon();
        if (mini) { FormBorderStyle = FormBorderStyle.FixedSingle; MaximizeBox = false; MinimizeBox = false; ShowInTaskbar = false; ClientSize = SMALL; }
        else { FormBorderStyle = FormBorderStyle.Sizable; MaximizeBox = true; Bounds = FullRect(); }
        Apply();

        string page = Path.Combine(Path.GetFullPath(Path.Combine(App.Dir, "..")), "speak", "index.html");
        string q = mini ? "?widget=1&boot=0" : "?boot=0";
        pageUrl = UseFolder() ? new Uri(page).AbsoluteUri + q : Hosted.Url + "speak/index.html" + q + "&fresh=1";
        web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = BackColor };
        web.CreationProperties = new CoreWebView2CreationProperties { UserDataFolder = Path.Combine(App.Dir, "data") };
        web.CoreWebView2InitializationCompleted += Started;
        Controls.Add(web);
        web.EnsureCoreWebView2Async(null);
        if (mini) Deactivate += (s, e) => { if (App.On("miniAway") && !big && Visible) Hide(); };
    }

    /* the settings that change how this window sits */
    public void Apply()
    {
        TopMost = mini ? App.On("miniTop") : App.On("fullTop");
    }

    public void Bring()
    {
        if (!Visible) Show();
        if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
        Activate();
    }
    public void Run(string js)
    {
        try { if (web.CoreWebView2 != null) web.CoreWebView2.ExecuteScriptAsync(js); else pending = js; } catch { }
    }
    string pending;
    public void Post(string j)
    {
        try { if (web.CoreWebView2 != null) web.CoreWebView2.PostWebMessageAsJson(j); } catch { }
    }

    static Rectangle FullRect()
    {
        Rectangle r = Rectangle.Empty;
        string[] f = (App.Cfg.ContainsKey("full") ? App.Cfg["full"] : "").Split(',');
        int x, y, w, h;
        if (f.Length == 4 && int.TryParse(f[0], out x) && int.TryParse(f[1], out y) && int.TryParse(f[2], out w) && int.TryParse(f[3], out h) && w > 200 && h > 200)
            r = new Rectangle(x, y, w, h);
        bool seen = false;
        foreach (var sc in Screen.AllScreens) if (!r.IsEmpty && sc.WorkingArea.IntersectsWith(r)) seen = true;
        if (r.IsEmpty || !seen)
        {
            var wa = Screen.PrimaryScreen.WorkingArea;
            int w2 = Math.Min(1100, wa.Width - 40), h2 = Math.Min(860, wa.Height - 40);
            r = new Rectangle(wa.Left + (wa.Width - w2) / 2, wa.Top + (wa.Height - h2) / 2, w2, h2);
        }
        return r;
    }

    /* the widget pops up by the tray, bottom right, or where he left it */
    public void PlaceMini()
    {
        if (big) return;
        var wa = Screen.PrimaryScreen.WorkingArea;
        Size s = SizeFromClientSize(SMALL);
        int x = wa.Right - s.Width - 12, y = wa.Bottom - s.Height - 12;
        if (App.Cfg["miniPlace"] == "left")
        {
            string[] p = App.Cfg["at"].Split(',');
            int ax, ay;
            if (p.Length == 2 && int.TryParse(p[0], out ax) && int.TryParse(p[1], out ay))
                foreach (var sc in Screen.AllScreens) if (sc.WorkingArea.Contains(new Rectangle(ax, ay, 80, 40))) { x = ax; y = ay; }
        }
        ClientSize = SMALL;
        Location = new Point(x, y);
    }

    void Started(object sender, CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            MessageBox.Show("The web engine would not start.\n\n" + (e.InitializationException == null ? "" : e.InitializationException.Message), App.TITLE);
            return;
        }
        App.Log((mini ? "mini" : "full") + ": web engine started, opening " + pageUrl);
        var c = web.CoreWebView2;
        c.Settings.AreDefaultContextMenusEnabled = false;
        c.Settings.IsZoomControlEnabled = false;
        c.Settings.IsStatusBarEnabled = false;
        c.Settings.AreBrowserAcceleratorKeysEnabled = false;
        /* the microphone and the camera, without asking every time: these windows only ever show SPEAK */
        c.PermissionRequested += (s2, e2) =>
        {
            if (e2.PermissionKind == CoreWebView2PermissionKind.Microphone || e2.PermissionKind == CoreWebView2PermissionKind.Camera)
                e2.State = CoreWebView2PermissionState.Allow;
        };
        c.NewWindowRequested += (s2, e2) => { e2.Handled = true; try { System.Diagnostics.Process.Start(e2.Uri); } catch { } };
        c.NavigationCompleted += (s2, e2) =>
        {
            App.Log((mini ? "mini" : "full") + ": page loaded: " + (e2.IsSuccess ? "yes" : "NO, " + e2.WebErrorStatus));
            if (pending != null) { string js = pending; pending = null; Run(js); }
        };
        Caption(c);
        c.WebMessageReceived += Message;
        /* tells the page Claude can rewrite a take here, and what this program's settings are */
        c.AddScriptToExecuteOnDocumentCreatedAsync("window.MB_REFINE=1;window.MB_HEAR=1;window.MB_EXE=" + App.State(mini) + ";");
        c.Navigate(pageUrl);
    }

    void Message(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string m;
        try { m = e.TryGetWebMessageAsString(); } catch { return; }
        if (m == null) return;
        if (m.StartsWith("mbsize:")) { if (!mini) return; if (m == "mbsize:big") Grow(BIG); else if (m == "mbsize:small") Grow(SMALL); else if (m == "mbsize:wide") Grow(WIDE); }
        else if (m.StartsWith("mbrefine:")) Refine.Ask(m.Substring(9), App.Log, s => BeginInvoke((Action)(() => Post(s))));
        else if (m.StartsWith("mbhear:")) Refine.Hear(m.Substring(7), App.Log, s => BeginInvoke((Action)(() => Post(s))));
        else if (m.StartsWith("mbset:"))
        {
            string kv = m.Substring(6); int eq = kv.IndexOf('=');
            if (eq > 0) App.Set(kv.Substring(0, eq), kv.Substring(eq + 1));
        }
        else if (m == "mbopen:full") { if (mini) Hide(); App.ShowFull(); }
        else if (m == "mbopen:mini") App.ShowMini(true);
        else if (m.StartsWith("mbcap:"))
        {
            string[] p = m.Substring(6).Split(',');
            int r, g, b;
            if (p.Length == 3 && int.TryParse(p[0], out r) && int.TryParse(p[1], out g) && int.TryParse(p[2], out b)) PaintBar(Color.FromArgb(r, g, b));
        }
    }

    /* ── the widget's sizes ── Big keeps the same top left corner where it
       fits, and moves just enough to stay on the screen where it does not.
       Back to small, it goes back where it was. */
    Point home;
    void Grow(Size to)
    {
        bool on = to != SMALL;
        if (on == big && (!on || to == bigAs)) return;
        if (on)
        {
            if (!big) home = Location;
            bigAs = to;
            var wa = Screen.FromControl(this).WorkingArea;
            Size want = SizeFromClientSize(new Size(Math.Min(to.Width, wa.Width - 40), Math.Min(to.Height, wa.Height - 60)));
            int x = Math.Max(wa.Left, Math.Min(Left, wa.Right - want.Width));
            int y = Math.Max(wa.Top, Math.Min(Top, wa.Bottom - want.Height));
            big = true;
            Bounds = new Rectangle(x, y, want.Width, want.Height);
            if (!Visible) Show();
            Activate();
        }
        else
        {
            big = false;
            ClientSize = SMALL;
            Location = home;
        }
    }

    protected override void OnMove(EventArgs e)
    {
        base.OnMove(e);
        if (!IsHandleCreated || WindowState != FormWindowState.Normal) return;
        if (mini && !big && Visible) App.Cfg["at"] = Left + "," + Top;
        if (!mini) App.Cfg["full"] = Left + "," + Top + "," + Width + "," + Height;
    }
    protected override void OnResizeEnd(EventArgs e)
    {
        base.OnResizeEnd(e);
        if (!mini && WindowState == FormWindowState.Normal) { App.Cfg["full"] = Left + "," + Top + "," + Width + "," + Height; App.Save(); }
        if (mini) App.Save();
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        /* the widget always tucks away; the full app tucks into the tray or
           quits, as the PROGRAM tab says; Windows shutting down closes it */
        if (!App.Quitting && e.CloseReason == CloseReason.UserClosing)
        {
            if (mini || App.Cfg["close"] != "quit") { e.Cancel = true; App.Save(); Hide(); return; }
            e.Cancel = true; App.Quit(); return;
        }
        base.OnFormClosing(e);
    }

    /* ── the title bar wears the page ── (as MenuApp.cs) */
    void Caption(CoreWebView2 c)
    {
        c.AddScriptToExecuteOnDocumentCreatedAsync(
            "(function(){if(window.top!==window||!window.chrome||!chrome.webview)return;var last='',cv,cx;" +
            "function px(col){try{if(!cx){cv=document.createElement('canvas');cv.width=cv.height=1;cx=cv.getContext('2d',{willReadFrequently:true});}" +
            "cx.clearRect(0,0,1,1);cx.fillStyle='#000';cx.fillStyle=col;cx.fillRect(0,0,1,1);var d=cx.getImageData(0,0,1,1).data;return d[3]>200?d[0]+','+d[1]+','+d[2]:'';}catch(e){return '';}}" +
            "function tick(){try{var el=document.elementFromPoint(Math.floor(innerWidth/2),1),v='';" +
            "while(el&&!v){var b=getComputedStyle(el).backgroundColor;if(b&&b!=='transparent'&&!/,\\s*0\\)$|\\/\\s*0\\)$/.test(b))v=px(b);el=el.parentElement;}" +
            "if(!v&&document.body)v=px(getComputedStyle(document.body).backgroundColor);" +
            "if(v&&v!==last){last=v;chrome.webview.postMessage('mbcap:'+v);}}catch(e){}}" +
            "addEventListener('load',tick);setInterval(tick,1000);setTimeout(tick,50);})();");
    }
    void PaintBar(Color bg)
    {
        bool dark = (bg.R * 299 + bg.G * 587 + bg.B * 114) / 1000 < 128;
        Color fg = dark ? Color.FromArgb(0x7F, 0x93, 0xA8) : Color.FromArgb(0x3A, 0x40, 0x48);
        int on = dark ? 1 : 0, cap = Ref(bg), txt = Ref(fg);
        try
        {
            DwmSetWindowAttribute(Handle, DWMWA_USE_IMMERSIVE_DARK_MODE, ref on, 4);
            DwmSetWindowAttribute(Handle, DWMWA_CAPTION_COLOR, ref cap, 4);
            DwmSetWindowAttribute(Handle, DWMWA_BORDER_COLOR, ref cap, 4);
            DwmSetWindowAttribute(Handle, DWMWA_TEXT_COLOR, ref txt, 4);
        }
        catch { }
    }
    static int Ref(Color c) { return c.R | (c.G << 8) | (c.B << 16); }
    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        PaintBar(Color.FromArgb(0x08, 0x0B, 0x10));
    }
}
