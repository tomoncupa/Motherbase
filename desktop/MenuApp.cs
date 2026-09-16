/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• MAIN MENU â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   The suite as a Windows program. Tom, 2026-09-17: "No Only Status needs a
   stand alone widget. The Main Menu can be its own program."

   So there are two, and they are deliberately different shapes. STATUS.exe is
   a widget: small, on top, frameless, in a corner, in the way when it wants
   to be. This is the home screen and every app behind it, which the brief
   calls a desktop app, so it is an ordinary window: resizable, maximisable,
   snappable, with the title bar a window you resize actually needs. Closing
   it closes it.

   It shares STATUS.exe's store, on purpose. Same user data folder, so the
   two programs are two windows onto one set of rows rather than two copies
   that drift, and records.js already listens for another window writing so
   they stay in step live.

   Everything the two have in common is forty lines of WebView2 setup. The
   rest of the widget host does not apply here: no drag, no modes, no check
   in, no global hotkey, no tray. Keeping them apart is cheaper than one file
   that is two programs wearing a switch.                                    */

using System;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

class Menu : Form
{
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr h);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr h, int cmd);
    [DllImport("user32.dll")] static extern IntPtr FindWindowW(string cls, string win);
    [DllImport("user32.dll")] static extern short GetKeyState(int k);
    const int VK_MENU = 0x12;
    const int SW_RESTORE = 9;
    const string TITLE = "Motherbase";

    WebView2 web;
    string root, cfgPath, dataDir, pageUrl;

    static Mutex only;

    [STAThread]
    static void Main()
    {
        bool fresh;
        only = new Mutex(true, "Motherbase.MainMenu.App", out fresh);
        if (!fresh)
        {
            /* Opening it again brings the one he has, rather than a second. */
            IntPtr h = FindWindowW(null, TITLE);
            if (h != IntPtr.Zero) { ShowWindow(h, SW_RESTORE); SetForegroundWindow(h); }
            return;
        }
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        Application.Run(new Menu());
    }

    void Log(string s)
    {
        try
        {
            File.AppendAllText(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "menu-app.log"),
                DateTime.Now.ToString("HH:mm:ss") + "  " + s + "\r\n");
        }
        catch { }
    }

    public Menu()
    {
        root = Path.GetFullPath(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, ".."));
        cfgPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "menu-app.txt");
        /* THE SAME folder STATUS.exe uses. One store, two windows. */
        dataDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data");
        try { File.Delete(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "menu-app.log")); } catch { }

        string page = Path.Combine(root, "index.html");
        if (!File.Exists(page))
        {
            MessageBox.Show("Could not find the home screen at\n\n" + page +
                "\n\nThis program has to sit in the desktop folder inside Motherbase.",
                TITLE, MessageBoxButtons.OK, MessageBoxIcon.Error);
            Environment.Exit(1);
        }

        Text = TITLE;
        StartPosition = FormStartPosition.Manual;
        BackColor = Color.FromArgb(11, 14, 20);
        Icon = AppIcon();
        MinimumSize = new Size(720, 480);
        Restore();

        web = new WebView2();
        web.Dock = DockStyle.Fill;
        web.DefaultBackgroundColor = BackColor;
        web.CreationProperties = new CoreWebView2CreationProperties();
        web.CreationProperties.UserDataFolder = dataDir;
        pageUrl = new Uri(page).AbsoluteUri;
        web.CoreWebView2InitializationCompleted += Started;
        Controls.Add(web);
        web.EnsureCoreWebView2Async(null);
    }

    void Started(object sender, CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            MessageBox.Show("The web engine would not start.\n\n" +
                (e.InitializationException == null ? "" : e.InitializationException.Message),
                TITLE);
            Application.Exit();
            return;
        }
        Log("web engine started, opening " + pageUrl);
        var c = web.CoreWebView2;
        c.Settings.AreDefaultContextMenusEnabled = false;
        c.Settings.IsZoomControlEnabled = false;
        c.Settings.IsStatusBarEnabled = false;
        /* A link out of the suite belongs in his real browser. */
        c.NewWindowRequested += (s2, e2) =>
        {
            e2.Handled = true;
            try { System.Diagnostics.Process.Start(e2.Uri); } catch { }
        };
        c.NavigationCompleted += (s2, e2) =>
            Log("page loaded: " + (e2.IsSuccess ? "yes" : "NO, " + e2.WebErrorStatus));
        c.Navigate(pageUrl);

        /* â”€â”€ never a one way trip â”€â”€
           Tom, 2026-09-17: "same bug happens in other version, 1 way home
           layer loop." A window with no browser chrome has no Back, so any
           page that does not draw its own way out is a dead end. The mouse's
           back button and Alt+Left work here the way they do everywhere else,
           and Home always returns to the home screen whatever happened. */
        /* The browser's own keys stay ON in this program, unlike the widget
           where they are off, so Alt+Left goes back and the mouse's back
           button works the way it does everywhere else. Everything the suite
           navigates to with location.href leaves history behind it, so there
           is always something to go back to. */
        c.Settings.AreBrowserAcceleratorKeysEnabled = true;
    }

    Icon AppIcon()
    {
        try
        {
            string p = Path.Combine(root, "shared", "icons", "home.png");
            if (!File.Exists(p)) p = Path.Combine(root, "shared", "icons", "status.png");
            if (File.Exists(p)) using (var bmp = new Bitmap(p)) return Icon.FromHandle(bmp.GetHicon());
        }
        catch { }
        return SystemIcons.Application;
    }

    /* â”€â”€ where it was last time â”€â”€
       A desktop app that opens somewhere else every morning is a small daily
       annoyance, and remembering costs one line each way. */
    void Restore()
    {
        int x = int.MinValue, y = int.MinValue, w = 1180, h = 860;
        bool max = false;
        try
        {
            if (File.Exists(cfgPath))
                foreach (string line in File.ReadAllLines(cfgPath))
                {
                    int eq = line.IndexOf('=');
                    if (eq < 1) continue;
                    string k = line.Substring(0, eq).Trim(), v = line.Substring(eq + 1).Trim();
                    if (k == "max") max = (v == "1");
                    else if (k == "rect")
                    {
                        string[] p = v.Split(',');
                        if (p.Length == 4)
                        {
                            int.TryParse(p[0], out x); int.TryParse(p[1], out y);
                            int.TryParse(p[2], out w); int.TryParse(p[3], out h);
                        }
                    }
                }
        }
        catch { }

        var wa = Screen.PrimaryScreen.WorkingArea;
        if (w < 720) w = 1180;
        if (h < 480) h = 860;
        if (w > wa.Width) w = wa.Width;
        if (h > wa.Height) h = wa.Height;
        if (x == int.MinValue || x < wa.Left - 50 || x > wa.Right - 100) x = wa.Left + (wa.Width - w) / 2;
        if (y == int.MinValue || y < wa.Top - 10 || y > wa.Bottom - 80) y = wa.Top + (wa.Height - h) / 2;
        Bounds = new Rectangle(x, y, w, h);
        if (max) WindowState = FormWindowState.Maximized;
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        base.OnFormClosing(e);
        try
        {
            var r = WindowState == FormWindowState.Normal ? Bounds : RestoreBounds;
            File.WriteAllText(cfgPath,
                "# Motherbase. Delete this file to go back to the defaults.\r\n" +
                "rect=" + r.X + "," + r.Y + "," + r.Width + "," + r.Height + "\r\n" +
                "max=" + (WindowState == FormWindowState.Maximized ? "1" : "0") + "\r\n");
        }
        catch { }
    }
}
