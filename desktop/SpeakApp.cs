/* ══════════════ SPEAK.exe ══════════════
   Tom, 2026-11-10: "Speak app that also has an always on overlay widget, so
   I can start a mini practice whenever." He chose its own PC widget over a
   button on STATUS.

   A small window on top of everything with one button, TABLE TOPIC. Press
   it and the window grows for the take and its numbers, then shrinks back
   to where it was. The page decides the size and says so by message
   (speak/index.html, the widget): mbsize:big, mbsize:small.

   Tom only. SPEAK is not in the client build, so this is not in Setup.exe.
   It shares STATUS.exe's and the Main Menu's store (desktop/data), so a take
   made here is in SPEAK everywhere at once.

   Windows' own title bar stays, coloured like the page (how-we-work: no
   white title bar), because it is what drags the window. Its menu, a right
   click on the bar, holds "Start with Windows", on from the first open.   */

using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

class Speak : Form
{
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern IntPtr FindWindowW(string cls, string win);
    [DllImport("user32.dll")] static extern IntPtr GetSystemMenu(IntPtr h, bool revert);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern bool AppendMenuW(IntPtr m, int flags, int id, string text);
    [DllImport("user32.dll")] static extern int CheckMenuItem(IntPtr m, int id, int flags);
    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int val, int size);
    const int DWMWA_USE_IMMERSIVE_DARK_MODE = 20, DWMWA_BORDER_COLOR = 34,
              DWMWA_CAPTION_COLOR = 35, DWMWA_TEXT_COLOR = 36;
    const int SW_RESTORE = 9, WM_SYSCOMMAND = 0x112, MF_SEPARATOR = 0x800, MF_STRING = 0,
              MF_CHECKED = 8, MF_UNCHECKED = 0, ID_BOOT = 0x1F10;
    const string TITLE = "SPEAK";

    /* the page's two sizes, inside the frame */
    static readonly Size SMALL = new Size(300, 116), BIG = new Size(440, 760);

    WebView2 web;
    string root, cfgPath, dataDir, pageUrl;
    Point home = new Point(int.MinValue, int.MinValue);   /* where the small window sits */
    bool big, bootSet;

    static Mutex only;

    static bool UseFolder()
    {
        return File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "use-folder-copy.txt"));
    }

    [STAThread]
    static void Main()
    {
        bool fresh;
        only = new Mutex(true, "Motherbase.Speak.App", out fresh);
        if (!fresh)
        {
            IntPtr h = FindWindowW(null, TITLE);
            if (h != IntPtr.Zero) { ShowWindow(h, SW_RESTORE); SetForegroundWindow(h); }
            return;
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new Speak());
    }

    void Log(string s)
    {
        try
        {
            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "speak-app.log"),
                DateTime.Now.ToString("HH:mm:ss") + "  " + s + "\r\n");
        }
        catch { }
    }

    public Speak()
    {
        root = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
        cfgPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "speak-app.txt");
        dataDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
        try { File.Delete(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "speak-app.log")); } catch { }
        LoadCfg();

        string page = Path.Combine(root, "speak", "index.html");
        Text = TITLE;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        StartPosition = FormStartPosition.Manual;
        TopMost = true;
        BackColor = Color.FromArgb(0x08, 0x0B, 0x10);
        Icon = Hosted.OwnIcon();
        ClientSize = SMALL;
        Place();

        web = new WebView2();
        web.Dock = DockStyle.Fill;
        web.DefaultBackgroundColor = BackColor;
        web.CreationProperties = new CoreWebView2CreationProperties();
        web.CreationProperties.UserDataFolder = dataDir;
        pageUrl = UseFolder() ? new Uri(page).AbsoluteUri + "?widget=1&boot=0"
                              : Hosted.Url + "speak/index.html?widget=1&boot=0&fresh=1";
        web.CoreWebView2InitializationCompleted += Started;
        Controls.Add(web);
        web.EnsureCoreWebView2Async(null);

        /* Start with Windows is on from the first open, because an overlay
           that has to be remembered each morning is not always on. */
        if (!bootSet) { SetBoot(true); bootSet = true; SaveCfg(); }
    }

    void Started(object sender, CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            MessageBox.Show("The web engine would not start.\n\n" +
                (e.InitializationException == null ? "" : e.InitializationException.Message), TITLE);
            Application.Exit();
            return;
        }
        Log("web engine started, opening " + pageUrl);
        var c = web.CoreWebView2;
        c.Settings.AreDefaultContextMenusEnabled = false;
        c.Settings.IsZoomControlEnabled = false;
        c.Settings.IsStatusBarEnabled = false;
        c.Settings.AreBrowserAcceleratorKeysEnabled = false;
        /* the microphone, and the camera for the EYES drills, without asking
           every time: this window only ever shows SPEAK */
        c.PermissionRequested += (s2, e2) =>
        {
            if (e2.PermissionKind == CoreWebView2PermissionKind.Microphone ||
                e2.PermissionKind == CoreWebView2PermissionKind.Camera)
                e2.State = CoreWebView2PermissionState.Allow;
        };
        c.NewWindowRequested += (s2, e2) =>
        {
            e2.Handled = true;
            try { System.Diagnostics.Process.Start(e2.Uri); } catch { }
        };
        c.NavigationCompleted += (s2, e2) =>
            Log("page loaded: " + (e2.IsSuccess ? "yes" : "NO, " + e2.WebErrorStatus));
        Caption(c);
        c.WebMessageReceived += Message;
        c.Navigate(pageUrl);
    }

    void Message(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string m;
        try { m = e.TryGetWebMessageAsString(); } catch { return; }
        if (m == null) return;
        if (m == "mbsize:big") Grow(true);
        else if (m == "mbsize:small") Grow(false);
        else if (m.StartsWith("mbcap:"))
        {
            string[] p = m.Substring(6).Split(',');
            int r, g, b;
            if (p.Length == 3 && int.TryParse(p[0], out r) && int.TryParse(p[1], out g) && int.TryParse(p[2], out b))
                PaintBar(Color.FromArgb(r, g, b));
        }
    }

    /* ── two sizes ──
       Small sits where he put it. Big keeps the same top left corner where
       it fits, and moves just enough to stay on the screen where it does
       not. Back to small, it goes home, wherever big had to move to. */
    void Grow(bool on)
    {
        if (on == big) return;
        if (WindowState == FormWindowState.Minimized) WindowState = FormWindowState.Normal;
        if (on)
        {
            home = Location;
            var wa = Screen.FromControl(this).WorkingArea;
            Size want = SizeFromClientSize(new Size(BIG.Width, Math.Min(BIG.Height, wa.Height - 60)));
            int x = Math.Max(wa.Left, Math.Min(Left, wa.Right - want.Width));
            int y = Math.Max(wa.Top, Math.Min(Top, wa.Bottom - want.Height));
            big = true;
            Bounds = new Rectangle(x, y, want.Width, want.Height);
            Activate();
        }
        else
        {
            big = false;
            ClientSize = SMALL;
            Location = home;
            SaveCfg();
        }
    }

    void Place()
    {
        var wa = Screen.PrimaryScreen.WorkingArea;
        Size s = SizeFromClientSize(SMALL);
        int x = home.X, y = home.Y;
        bool seen = false;
        foreach (var sc in Screen.AllScreens)
            if (sc.WorkingArea.Contains(new Rectangle(x, y, 80, 40))) seen = true;
        if (home.X == int.MinValue || !seen) { x = wa.Right - s.Width - 16; y = wa.Bottom - s.Height - 16; }
        Location = new Point(x, y);
        home = Location;
    }

    protected override void OnMove(EventArgs e)
    {
        base.OnMove(e);
        if (!big && WindowState == FormWindowState.Normal && IsHandleCreated) home = Location;
    }

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
                if (k == "boot") bootSet = true;
                else if (k == "at")
                {
                    string[] p = v.Split(',');
                    int x, y;
                    if (p.Length == 2 && int.TryParse(p[0], out x) && int.TryParse(p[1], out y)) home = new Point(x, y);
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
                "# SPEAK.exe. Delete this file to go back to the defaults.\r\n" +
                "at=" + home.X + "," + home.Y + "\r\n" +
                "boot=" + (GetBoot() ? "1" : "0") + "\r\n");
        }
        catch { }
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        base.OnFormClosing(e);
        SaveCfg();
    }

    /* ── start with Windows, in the title bar's own menu ── */
    const string RUN_KEY = @"Software\Microsoft\Windows\CurrentVersion\Run";
    const string RUN_NAME = "Motherbase SPEAK";
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

    protected override void WndProc(ref Message m)
    {
        if (m.Msg == WM_SYSCOMMAND && ((int)m.WParam & 0xFFF0) == ID_BOOT)
        {
            bool on = !GetBoot();
            SetBoot(on);
            CheckMenuItem(GetSystemMenu(Handle, false), ID_BOOT, on ? MF_CHECKED : MF_UNCHECKED);
            SaveCfg();
            return;
        }
        base.WndProc(ref m);
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
        IntPtr sm = GetSystemMenu(Handle, false);
        AppendMenuW(sm, MF_SEPARATOR, 0, null);
        AppendMenuW(sm, MF_STRING | (GetBoot() || !bootSet ? MF_CHECKED : MF_UNCHECKED), ID_BOOT, "Start with Windows");
    }
}
