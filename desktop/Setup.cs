/* ══════════════ SETUP.EXE ══════════════
   Tom, 2026-10-27: "a neat, convenient package so I can give someone a
   desktop copy of main menu as well as the status widget", with a setup that
   first asks whether they are already in the system.

   One file to send. Everything it installs is inside it (the build embeds
   STATUS.exe, Main Menu.exe, Microsoft's three WebView2 files and
   setup.html), so there is nothing to unzip and nothing to download.

   It asks the one question, installs into the person's own AppData (no admin
   prompt), makes the shortcuts, adds Motherbase to Settings, Apps so it can
   be removed like anything else, and opens the Main Menu on the setup page
   (SetupPage.cs, setup.html), which does the rest with the suite's own store.

   The copy it installs opens the client address, never Tom's (address.txt).
   `Setup.exe --address <url>` installs one pointed elsewhere, for testing.
   `Setup.exe /uninstall` is what Settings, Apps runs.                       */

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

class SetupApp : Form
{
    const string CLIENT = "https://tomoncupa.github.io/Mainmenu-client/";
    const string NAME = "Motherbase";
    const string UNINSTALL_KEY = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Motherbase";
    const string RUN_KEY = @"Software\Microsoft\Windows\CurrentVersion\Run";
    const string RUN_NAME = "Motherbase STATUS";
    static readonly string[] FILES = {
        "STATUS.exe", "Main Menu.exe", "Microsoft.Web.WebView2.Core.dll",
        "Microsoft.Web.WebView2.WinForms.dll", "WebView2Loader.dll", "setup.html" };

    [DllImport("dwmapi.dll")] static extern int DwmSetWindowAttribute(IntPtr h, int attr, ref int val, int size);

    /* Block */
    static readonly Color BG = Color.FromArgb(0x08, 0x0B, 0x10), PANEL = Color.FromArgb(0x0E, 0x14, 0x1D),
        RAISED = Color.FromArgb(0x13, 0x1B, 0x26), LINE = Color.FromArgb(0x2B, 0x3A, 0x4D),
        INK = Color.FromArgb(0xDB, 0xE7, 0xF0), MUT = Color.FromArgb(0x7F, 0x93, 0xA8),
        GOLD = Color.FromArgb(0xF0, 0xB3, 0x23), BAD = Color.FromArgb(0xFF, 0x6B, 0x81);

    /* `--dir <folder>` installs there with no shortcuts and no Settings, Apps
       entry: a test on a PC that already has Tom's own STATUS shortcut. */
    static string testDir = null;
    static string InstallDir
    {
        get { return testDir ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", NAME); }
    }

    static string address = CLIENT;

    [STAThread]
    static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "/uninstall") { Uninstall(); return; }
            if (args[i] == "--address" && i + 1 < args.Length) address = args[++i];
            if (args[i] == "--dir" && i + 1 < args.Length) testDir = Path.GetFullPath(args[++i]);
        }
        Application.Run(new SetupApp());
    }

    Label status;
    Choice yes, no;
    Button fix;
    Font head, body, small;

    SetupApp()
    {
        head = Pick(new[] { "Chakra Petch", "Segoe UI Semibold" }, 17f, FontStyle.Regular);
        body = Pick(new[] { "IBM Plex Sans", "Segoe UI" }, 11f, FontStyle.Regular);
        small = Pick(new[] { "IBM Plex Sans", "Segoe UI" }, 9f, FontStyle.Regular);

        Text = "Motherbase setup";
        Icon = OwnIcon();
        BackColor = BG;
        ForeColor = INK;
        FormBorderStyle = FormBorderStyle.FixedSingle;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;
        AutoScaleMode = AutoScaleMode.Dpi;
        ClientSize = new Size(560, 420);

        var brand = Lbl("MOTHERBASE", Pick(new[] { "Chakra Petch", "Segoe UI Semibold" }, 9f, FontStyle.Bold), GOLD, 32, 28, 496, 20);
        var q = Lbl("Have you used Motherbase before?", head, INK, 32, 56, 496, 36);
        var sub = Lbl("On your phone or on another computer.", body, MUT, 32, 96, 496, 24);

        yes = new Choice("Yes, I already use it", "Sign in, and everything you have comes across.", head, body);
        yes.SetBounds(32, 140, 496, 76);
        yes.Click += (s, e) => Go("existing");
        no = new Choice("No, this is my first time", "Set up STATUS and the rest in a few steps.", head, body);
        no.SetBounds(32, 228, 496, 76);
        no.Click += (s, e) => Go("new");

        status = Lbl("", body, MUT, 32, 320, 496, 44);
        fix = new Button();
        fix.Text = "GET WEBVIEW2";
        fix.FlatStyle = FlatStyle.Flat;
        fix.FlatAppearance.BorderColor = GOLD;
        fix.ForeColor = GOLD;
        fix.BackColor = PANEL;
        fix.Font = small;
        fix.SetBounds(32, 362, 160, 44);
        fix.Visible = false;
        fix.Click += (s, e) => { try { Process.Start("https://go.microsoft.com/fwlink/p/?LinkId=2124703"); } catch { } };

        var foot = Lbl("Installs for you only, in " + InstallDir + ". Remove it from Settings, Apps.", small, MUT, 32, 372, 496, 36);

        Controls.AddRange(new Control[] { brand, q, sub, yes, no, status, fix, foot });
        foot.Name = "foot";
    }

    static Font Pick(string[] families, float size, FontStyle style)
    {
        foreach (string f in families)
        {
            try
            {
                var ff = new FontFamily(f);
                if (ff.Name == f) return new Font(ff, size, style);
            }
            catch { }
        }
        return new Font(FontFamily.GenericSansSerif, size, style);
    }

    Label Lbl(string text, Font f, Color c, int x, int y, int w, int h)
    {
        var l = new Label();
        l.Text = text; l.Font = f; l.ForeColor = c; l.BackColor = BG;
        l.SetBounds(x, y, w, h);
        return l;
    }

    static Icon OwnIcon()
    {
        try { return Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        catch { return SystemIcons.Application; }
    }

    /* Windows' own bar, dressed in Block (how-we-work: no white title bar) */
    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        int on = 1, cap = Ref(BG), txt = Ref(MUT);
        try
        {
            DwmSetWindowAttribute(Handle, 20, ref on, 4);
            DwmSetWindowAttribute(Handle, 35, ref cap, 4);
            DwmSetWindowAttribute(Handle, 34, ref cap, 4);
            DwmSetWindowAttribute(Handle, 36, ref txt, 4);
        }
        catch { }
    }
    static int Ref(Color c) { return c.R | (c.G << 8) | (c.B << 16); }

    void Say(string text, bool bad)
    {
        status.Text = text;
        status.ForeColor = bad ? BAD : MUT;
        Controls["foot"].Visible = !bad;
        status.Refresh();
    }

    void Go(string mode)
    {
        yes.Enabled = no.Enabled = false;
        Cursor = Cursors.WaitCursor;
        Say("Installing…", false);
        try
        {
            if (!HasWebView2())
            {
                Say("This computer needs Microsoft's WebView2 first. Get it, then open this setup again.", true);
                fix.Visible = true;
                Cursor = Cursors.Default;
                yes.Enabled = no.Enabled = true;
                return;
            }
            Install();
            Say("Opening Motherbase…", false);
            Process.Start(new ProcessStartInfo(Path.Combine(InstallDir, "Main Menu.exe"), "--setup " + mode)
                { WorkingDirectory = InstallDir, UseShellExecute = false });
            Close();
        }
        catch (Exception ex)
        {
            Say("Setup stopped: " + ex.Message, true);
            Cursor = Cursors.Default;
            yes.Enabled = no.Enabled = true;
        }
    }

    /* The Evergreen runtime registers itself here, machine-wide or per user. */
    static bool HasWebView2()
    {
        const string ID = @"\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}";
        string[] places = { @"SOFTWARE\WOW6432Node" + ID, @"SOFTWARE" + ID };
        foreach (var hive in new[] { Microsoft.Win32.Registry.LocalMachine, Microsoft.Win32.Registry.CurrentUser })
            foreach (string p in places)
            {
                try
                {
                    using (var k = hive.OpenSubKey(p))
                    {
                        var v = k == null ? null : k.GetValue("pv") as string;
                        if (!string.IsNullOrEmpty(v) && v != "0.0.0.0") return true;
                    }
                }
                catch { }
            }
        return false;
    }

    static void StopRunning()
    {
        string dir = InstallDir.TrimEnd('\\') + "\\";
        foreach (string n in new[] { "STATUS", "Main Menu" })
            foreach (var p in Process.GetProcessesByName(n))
            {
                try
                {
                    if (!p.MainModule.FileName.StartsWith(dir, StringComparison.OrdinalIgnoreCase)) continue;
                    p.CloseMainWindow();
                    if (!p.WaitForExit(4000)) { p.Kill(); p.WaitForExit(2000); }
                }
                catch { }
            }
    }

    void Install()
    {
        string dir = InstallDir;
        Directory.CreateDirectory(dir);
        StopRunning();
        var me = Assembly.GetExecutingAssembly();
        foreach (string f in FILES)
        {
            string to = Path.Combine(dir, f);
            /* a file Windows still holds can be renamed, not overwritten */
            if (File.Exists(to))
            {
                try { File.Delete(to); }
                catch { string old = to + ".old"; try { File.Delete(old); } catch { } File.Move(to, old); }
            }
            using (var src = me.GetManifestResourceStream(f))
            {
                if (src == null) throw new Exception(f + " is missing from this setup file");
                using (var dst = File.Create(to)) src.CopyTo(dst);
            }
        }
        File.WriteAllText(Path.Combine(dir, "address.txt"),
            "# Which copy of Motherbase these programs open.\r\n" + address + "\r\n");

        /* itself, so Settings, Apps can remove it later */
        string self = Path.Combine(dir, "Setup.exe");
        if (!string.Equals(Path.GetFullPath(Application.ExecutablePath), self, StringComparison.OrdinalIgnoreCase))
            File.Copy(Application.ExecutablePath, self, true);

        string menu = Path.Combine(dir, "Main Menu.exe"), widget = Path.Combine(dir, "STATUS.exe");
        if (testDir != null) return;
        string desk = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        string start = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), NAME);
        Directory.CreateDirectory(start);
        Link(Path.Combine(desk, "Motherbase.lnk"), menu, "Every app in one window");
        Link(Path.Combine(desk, "STATUS.lnk"), widget, "The STATUS widget");
        Link(Path.Combine(start, "Motherbase.lnk"), menu, "Every app in one window");
        Link(Path.Combine(start, "STATUS.lnk"), widget, "The STATUS widget");

        using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(UNINSTALL_KEY))
        {
            k.SetValue("DisplayName", "Motherbase");
            k.SetValue("DisplayIcon", menu);
            k.SetValue("Publisher", "Personal Protagonist");
            k.SetValue("InstallLocation", dir);
            k.SetValue("UninstallString", "\"" + self + "\" /uninstall");
            k.SetValue("NoModify", 1);
            k.SetValue("NoRepair", 1);
        }
    }

    /* A shortcut through Windows' own scripting object; nothing to reference. */
    static void Link(string lnk, string target, string what)
    {
        Type t = Type.GetTypeFromProgID("WScript.Shell");
        object sh = Activator.CreateInstance(t);
        object sc = t.InvokeMember("CreateShortcut", BindingFlags.InvokeMethod, null, sh, new object[] { lnk });
        Type st = sc.GetType();
        st.InvokeMember("TargetPath", BindingFlags.SetProperty, null, sc, new object[] { target });
        st.InvokeMember("WorkingDirectory", BindingFlags.SetProperty, null, sc, new object[] { Path.GetDirectoryName(target) });
        st.InvokeMember("Description", BindingFlags.SetProperty, null, sc, new object[] { what });
        st.InvokeMember("Save", BindingFlags.InvokeMethod, null, sc, null);
        Marshal.FinalReleaseComObject(sc);
        Marshal.FinalReleaseComObject(sh);
    }

    static void Uninstall()
    {
        if (MessageBox.Show("Remove Motherbase from this computer?\n\nAnything you synced stays in your account.",
                "Motherbase", MessageBoxButtons.YesNo, MessageBoxIcon.Question) != DialogResult.Yes) return;
        bool wipe = MessageBox.Show("Also delete what is stored on this computer?\n\nChoose No to keep it for a reinstall.",
                "Motherbase", MessageBoxButtons.YesNo, MessageBoxIcon.Question) == DialogResult.Yes;
        StopRunning();
        string dir = InstallDir;
        string desk = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        string start = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), NAME);
        foreach (string p in new[] { Path.Combine(desk, "Motherbase.lnk"), Path.Combine(desk, "STATUS.lnk") })
            try { File.Delete(p); } catch { }
        try { Directory.Delete(start, true); } catch { }
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.OpenSubKey(RUN_KEY, true))
                if (k != null && ((k.GetValue(RUN_NAME) as string) ?? "").IndexOf(dir, StringComparison.OrdinalIgnoreCase) >= 0) k.DeleteValue(RUN_NAME);
        }
        catch { }
        try { Microsoft.Win32.Registry.CurrentUser.DeleteSubKeyTree(UNINSTALL_KEY, false); } catch { }

        foreach (string f in Directory.Exists(dir) ? Directory.GetFiles(dir) : new string[0])
        {
            if (string.Equals(f, Application.ExecutablePath, StringComparison.OrdinalIgnoreCase)) continue;
            if (!wipe && Path.GetFileName(f).EndsWith(".txt") && Path.GetFileName(f) != "address.txt") continue;
            try { File.Delete(f); } catch { }
        }
        /* This program cannot delete itself while it runs, so a hidden command
           does it a moment after it closes. */
        string what = wipe ? "rmdir /s /q \"" + dir + "\"" : "del /f /q \"" + Application.ExecutablePath + "\"";
        try
        {
            Process.Start(new ProcessStartInfo("cmd.exe", "/c ping -n 3 127.0.0.1 >nul & " + what)
                { CreateNoWindow = true, WindowStyle = ProcessWindowStyle.Hidden, UseShellExecute = false });
        }
        catch { }
        MessageBox.Show(wipe ? "Motherbase is removed." : "Motherbase is removed. What was stored here is kept for a reinstall.",
            "Motherbase", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
}

/* One of the two answers: a panel with a title and one line under it, the
   border gold under the mouse. 76px tall, past the 44px floor. */
class Choice : Control
{
    readonly string title, line;
    readonly Font tf, lf;
    bool over;

    public Choice(string title, string line, Font tf, Font lf)
    {
        this.title = title; this.line = line;
        this.tf = new Font(tf.FontFamily, 12f, FontStyle.Regular); this.lf = lf;
        SetStyle(ControlStyles.AllPaintingInWmPaint | ControlStyles.UserPaint | ControlStyles.OptimizedDoubleBuffer | ControlStyles.ResizeRedraw, true);
        Cursor = Cursors.Hand;
        TabStop = true;
    }

    protected override void OnMouseEnter(EventArgs e) { over = true; Invalidate(); base.OnMouseEnter(e); }
    protected override void OnMouseLeave(EventArgs e) { over = false; Invalidate(); base.OnMouseLeave(e); }
    protected override void OnEnabledChanged(EventArgs e) { Invalidate(); base.OnEnabledChanged(e); }
    protected override void OnKeyDown(KeyEventArgs e)
    {
        if (e.KeyCode == Keys.Enter || e.KeyCode == Keys.Space) OnClick(EventArgs.Empty);
        base.OnKeyDown(e);
    }
    protected override void OnGotFocus(EventArgs e) { Invalidate(); base.OnGotFocus(e); }
    protected override void OnLostFocus(EventArgs e) { Invalidate(); base.OnLostFocus(e); }

    protected override void OnPaint(PaintEventArgs e)
    {
        var g = e.Graphics;
        g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.ClearTypeGridFit;
        g.Clear(Color.FromArgb(0x08, 0x0B, 0x10));
        var r = new Rectangle(0, 0, Width - 1, Height - 1);
        using (var path = Round(r, 6))
        using (var fill = new SolidBrush(over && Enabled ? Color.FromArgb(0x13, 0x1B, 0x26) : Color.FromArgb(0x0E, 0x14, 0x1D)))
        using (var pen = new Pen((over || Focused) && Enabled ? Color.FromArgb(0xF0, 0xB3, 0x23) : Color.FromArgb(0x2B, 0x3A, 0x4D)))
        {
            g.FillPath(fill, path);
            g.DrawPath(pen, path);
        }
        Color ink = Enabled ? Color.FromArgb(0xDB, 0xE7, 0xF0) : Color.FromArgb(0x7F, 0x93, 0xA8);
        TextRenderer.DrawText(g, title, tf, new Point(20, 14), ink, TextFormatFlags.NoPadding);
        TextRenderer.DrawText(g, line, lf, new Point(20, 44), Color.FromArgb(0x7F, 0x93, 0xA8), TextFormatFlags.NoPadding);
    }

    static System.Drawing.Drawing2D.GraphicsPath Round(Rectangle r, int rad)
    {
        var p = new System.Drawing.Drawing2D.GraphicsPath();
        int d = rad * 2;
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }
}
