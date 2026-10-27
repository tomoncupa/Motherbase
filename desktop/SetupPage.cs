/* ══════════════ FIRST-RUN SETUP ══════════════
   Tom, 2026-10-27: a quick setup "that asks them whether they're currently in
   the system already or this is their first time", and runs them through
   STATUS and the rest. Setup.exe asks the question and installs; this is the
   second half, inside the Main Menu, where the web engine already is.

   The page is setup.html beside the program, served at
   <the site's origin>/mb-desktop-setup.html. Same origin as the suite, so it
   reads and writes the very store the apps use and Google's sign-in accepts
   it; outside the suite's own folder, so the offline cache never answers for
   it. Nothing about it is on the hosted site.

   It asks the window for the three things a page cannot do itself: write
   STATUS.exe's shortcut and always-on-top into status-app.txt, put STATUS in
   Windows' start-up list, and start STATUS when it is done.                */

using System;
using System.Diagnostics;
using System.IO;
using Microsoft.Web.WebView2.Core;

class Setup
{
    const string PAGE = "/mb-desktop-setup.html";
    const string RUN_KEY = @"Software\Microsoft\Windows\CurrentVersion\Run";
    const string RUN_NAME = "Motherbase STATUS";   /* the same name STATUS.exe uses */

    readonly CoreWebView2 web;
    readonly string hosted, origin;
    readonly Action<string> log;

    public Setup(CoreWebView2 web, string hosted, Action<string> log)
    {
        this.web = web; this.hosted = hosted; this.log = log;
        origin = Origin(hosted);
    }

    static string Origin(string hosted) { return new Uri(hosted).GetLeftPart(UriPartial.Authority); }

    public static string Url(string hosted, string mode)
    {
        return Origin(hosted) + PAGE + "?mode=" + mode + "&base=" + Uri.EscapeDataString(new Uri(hosted).AbsolutePath);
    }

    static string Dir { get { return AppDomain.CurrentDomain.BaseDirectory; } }

    public void Attach()
    {
        string file = Path.Combine(Dir, "setup.html");
        if (!File.Exists(file)) return;
        web.AddWebResourceRequestedFilter(origin + PAGE + "*", CoreWebView2WebResourceContext.Document);
        web.WebResourceRequested += (s, e) =>
        {
            try
            {
                var bytes = File.ReadAllBytes(file);
                e.Response = web.Environment.CreateWebResourceResponse(new MemoryStream(bytes), 200, "OK",
                    "Content-Type: text/html; charset=utf-8\r\nCache-Control: no-store");
            }
            catch (Exception ex) { log("setup page could not be served: " + ex.Message); }
        };
        web.WebMessageReceived += Message;
    }

    void Message(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        string m;
        try { m = e.TryGetWebMessageAsString(); } catch { return; }
        if (m == null || !m.StartsWith("mbsetup:")) return;
        /* only the setup page may ask */
        if (!(e.Source ?? "").StartsWith(origin + PAGE)) return;
        string[] bits = m.Substring(8).Split('|');
        log("setup asked for: " + m);

        if (bits[0] == "prefs" && bits.Length >= 4)
        {
            WritePrefs(bits[1], bits[2] == "1");
            Boot(bits[3] == "1");
        }
        else if (bits[0] == "done")
        {
            try
            {
                string exe = Path.Combine(Dir, "STATUS.exe");
                if (File.Exists(exe)) Process.Start(exe);
            }
            catch (Exception ex) { log("could not start STATUS: " + ex.Message); }
            web.Navigate(hosted + "?fresh=1");
        }
    }

    /* status-app.txt as STATUS.exe writes it, keeping where the widget was */
    void WritePrefs(string hotkey, bool onTop)
    {
        string cfg = Path.Combine(Dir, "status-app.txt"), pos = "";
        try
        {
            if (File.Exists(cfg))
                foreach (string line in File.ReadAllLines(cfg))
                    if (line.StartsWith("pos=")) pos = line + "\r\n";
            hotkey = hotkey.ToLowerInvariant();
            if (hotkey.IndexOf('+') < 1) hotkey = "ctrl+b";
            File.WriteAllText(cfg,
                "# STATUS. Delete this file to go back to the defaults.\r\n" +
                "hotkey=" + hotkey + "\r\n" +
                "ontop=" + (onTop ? "1" : "0") + "\r\n" + pos);
        }
        catch (Exception ex) { log("could not write status-app.txt: " + ex.Message); }
    }

    void Boot(bool on)
    {
        try
        {
            using (var k = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(RUN_KEY))
            {
                if (on) k.SetValue(RUN_NAME, "\"" + Path.Combine(Dir, "STATUS.exe") + "\"");
                /* only ours: the same name may start another copy */
                else if (((k.GetValue(RUN_NAME) as string) ?? "").IndexOf(Dir.TrimEnd('\\'),StringComparison.OrdinalIgnoreCase) >= 0) k.DeleteValue(RUN_NAME);
            }
        }
        catch (Exception ex) { log("could not change start with Windows: " + ex.Message); }
    }
}
