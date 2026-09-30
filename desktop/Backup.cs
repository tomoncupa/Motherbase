/* ══════════════ BACKUP ══════════════
   Tom, 2026-09-30: "ok" to a nightly backup: once a day, a full copy of his
   whole store in a folder on the PC outside any repo, the last 30 kept, and
   a tested way to put one back.

   Why a program of its own and not STATUS.exe: STATUS.exe does not start
   with Windows on this PC (no Run key, no Startup shortcut, checked
   2026-09-30), and a backup that waits for him to open a widget is a backup
   that does not happen. This is started by Windows' Task Scheduler, once a
   day and at sign-in, runs unseen, and ends.

   Where the rows come from: the desktop programs' own store, desktop\data,
   the one STATUS.exe and the Main Menu share. It opens tools/backup.html
   there, which waits for every row to be in memory and for LIVE SYNC to
   catch up, then hands the whole store over in pieces. WebView2 lets two
   programs share one data folder, so it works whether STATUS.exe is open or
   not.

   The file is the home screen's "Back up everything" file, byte for byte in
   shape: {kind: 'motherbase-backup', app: '*', rows: [...]}. Any app's DATA,
   Restore, brings it back and MERGES: a row newer on the device is kept.

       Backup.exe                 today's copy, unless it already exists
       Backup.exe --force         a new copy even if today's exists
       Backup.exe --data <dir>    another store (a test one)
       Backup.exe --out <dir>     another folder
       Backup.exe --url <page>    another backup page (a local test server)

   Everything it did is a line in backup.log in the backup folder.        */

using System;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;
using Timer = System.Windows.Forms.Timer;

class Backup : Form
{
    const string HOSTED = "https://tomoncupa.github.io/Motherbase/";
    const int KEEP = 30;                          /* the last 30 days */
    const long FLOOR = 2L * 1024 * 1024 * 1024;   /* skip below 2 GB free: a full disk is worse than a missed night */
    const int CHUNK = 2 * 1024 * 1024;            /* characters read per call */
    static readonly Regex NAME = new Regex(@"^motherbase-all-\d{4}-\d{2}-\d{2}\.json$");

    WebView2 web;
    Timer poll;
    string dataDir, outDir, url, day, logPath;
    bool force;
    DateTime began = DateTime.Now;
    int exitCode = 1;

    static Mutex only;

    [STAThread]
    static int Main(string[] args)
    {
        bool fresh;
        only = new Mutex(true, "Motherbase.Backup", out fresh);
        if (!fresh) return 0;                     /* one at a time */
        Application.EnableVisualStyles();
        var b = new Backup(args);
        if (b.exitCode == 0) return 0;            /* nothing to do today */
        Application.Run(b);
        return b.exitCode;
    }

    static bool UseFolder()
    {
        return File.Exists(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "use-folder-copy.txt"));
    }

    Backup(string[] args)
    {
        string here = AppDomain.CurrentDomain.BaseDirectory;
        dataDir = Path.Combine(here, "data");
        outDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments),
                              "Backups", "Motherbase nightly");
        string root = Path.GetFullPath(Path.Combine(here, ".."));
        url = UseFolder() ? new Uri(Path.Combine(root, "tools", "backup.html")).AbsoluteUri
                          : HOSTED + "tools/backup.html";
        for (int i = 0; i < args.Length; i++)
        {
            if (args[i] == "--force") force = true;
            else if (args[i] == "--data" && i + 1 < args.Length) dataDir = args[++i];
            else if (args[i] == "--out" && i + 1 < args.Length) outDir = args[++i];
            else if (args[i] == "--url" && i + 1 < args.Length) url = args[++i];
        }
        day = DateTime.Now.ToString("yyyy-MM-dd");
        try { Directory.CreateDirectory(outDir); } catch { }
        logPath = Path.Combine(outDir, "backup.log");

        if (!force && File.Exists(Path.Combine(outDir, "motherbase-all-" + day + ".json")))
        { exitCode = 0; return; }
        try
        {
            long free = new DriveInfo(Path.GetPathRoot(Path.GetFullPath(outDir))).AvailableFreeSpace;
            if (free < FLOOR)
            {
                Log("SKIPPED  under 2 GB free on the disk (" + (free >> 20) + " MB)");
                exitCode = 0; return;
            }
        }
        catch { }

        /* Unseen: off the screen, not in the taskbar, never takes the focus.
           Kept "shown" rather than hidden, so the page counts as visible and
           its timers are not slowed to a crawl. */
        Text = "Motherbase backup";
        ShowInTaskbar = false;
        FormBorderStyle = FormBorderStyle.None;
        StartPosition = FormStartPosition.Manual;
        Location = new Point(-32000, -32000);
        Size = new Size(800, 600);
        Opacity = 0;

        web = new WebView2();
        web.Dock = DockStyle.Fill;
        web.CreationProperties = new CoreWebView2CreationProperties();
        web.CreationProperties.UserDataFolder = dataDir;
        web.CoreWebView2InitializationCompleted += Started;
        Controls.Add(web);
        web.EnsureCoreWebView2Async(null);
    }

    protected override bool ShowWithoutActivation { get { return true; } }

    void Log(string s)
    {
        try { File.AppendAllText(logPath, DateTime.Now.ToString("yyyy-MM-dd HH:mm") + "  " + s + "\r\n"); }
        catch { }
    }

    void Fail(string why)
    {
        Log("FAILED   " + why);
        exitCode = 1;
        Close();
    }

    void Started(object sender, CoreWebView2InitializationCompletedEventArgs e)
    {
        if (!e.IsSuccess)
        {
            Fail("the web engine would not start: " +
                 (e.InitializationException == null ? "" : e.InitializationException.Message));
            return;
        }
        var c = web.CoreWebView2;
        /* nothing it opens may open a window or leave the page */
        c.NewWindowRequested += (s2, e2) => { e2.Handled = true; };
        c.NavigationCompleted += (s2, e2) =>
        {
            if (!e2.IsSuccess) { Fail("the backup page did not load (" + e2.WebErrorStatus + "): " + url); return; }
            poll = new Timer();
            poll.Interval = 2000;
            poll.Tick += (s3, e3) => Ask();
            poll.Start();
        };
        c.Navigate(url);
    }

    /* ── is the page ready? ── */
    void Ask()
    {
        if ((DateTime.Now - began).TotalMinutes > 5) { poll.Stop(); Fail("the page was not ready after five minutes"); return; }
        web.CoreWebView2.ExecuteScriptAsync(
            "(function(){var B=window.MB_BACKUP;return B?JSON.stringify({s:B.state,n:B.rows,len:(B.json||'').length," +
            "why:B.why||'',synced:!!B.synced}):''})()").ContinueWith(t =>
        {
            string raw;
            try { raw = Unquote(t.Result); } catch { return; }
            BeginInvoke((Action)(() => Answer(raw)));
        });
    }

    bool reading;
    void Answer(string state)
    {
        if (reading || string.IsNullOrEmpty(state)) return;
        string s = Field(state, "s");
        if (s == "error") { poll.Stop(); Fail(Field(state, "why")); return; }
        if (s != "ready") return;
        reading = true;
        poll.Stop();
        int len, rows;
        int.TryParse(Field(state, "len"), out len);
        int.TryParse(Field(state, "n"), out rows);
        bool synced = state.Contains("\"synced\":true");
        string why = Field(state, "why");
        ReadAll(len, rows, synced, why);
    }

    /* ── read it over in pieces and write it ── */
    void ReadAll(int len, int rows, bool synced, string why)
    {
        string final = Path.Combine(outDir, "motherbase-all-" + day + ".json");
        string tmp = final + ".part";
        StreamWriter w;
        try { w = new StreamWriter(tmp, false, new UTF8Encoding(false)); }
        catch (Exception ex) { Fail("could not write " + tmp + ": " + ex.Message); return; }
        int at = 0;
        Action next = null;
        next = () =>
        {
            if (at >= len)
            {
                try
                {
                    w.Close();
                    if (File.Exists(final)) File.Delete(final);
                    File.Move(tmp, final);
                }
                catch (Exception ex) { Fail("could not finish " + final + ": " + ex.Message); return; }
                long bytes = new FileInfo(final).Length;
                Log("saved    " + Path.GetFileName(final) + ": " + rows.ToString("N0") + " rows, " +
                    (bytes / 1048576.0).ToString("0.0") + " MB, " +
                    (synced ? "live sync caught up first" : "NOT caught up with live sync: " + why));
                Prune();
                exitCode = 0;
                Close();
                return;
            }
            web.CoreWebView2.ExecuteScriptAsync("MB_BACKUP.json.substr(" + at + "," + CHUNK + ")").ContinueWith(t =>
            {
                string part;
                try { part = Unquote(t.Result); }
                catch (Exception ex) { BeginInvoke((Action)(() => { try { w.Close(); File.Delete(tmp); } catch { } Fail("a piece did not arrive: " + ex.Message); })); return; }
                BeginInvoke((Action)(() =>
                {
                    try { w.Write(part); }
                    catch (Exception ex) { try { w.Close(); File.Delete(tmp); } catch { } Fail("could not write: " + ex.Message); return; }
                    if (part.Length == 0) { try { w.Close(); File.Delete(tmp); } catch { } Fail("the page stopped handing rows over at " + at); return; }
                    at += part.Length;
                    next();
                }));
            });
        };
        next();
    }

    /* the last KEEP copies stay; only files this program names are ever removed */
    void Prune()
    {
        try
        {
            var all = Directory.GetFiles(outDir).Select(Path.GetFileName)
                .Where(n => NAME.IsMatch(n)).OrderByDescending(n => n, StringComparer.Ordinal).ToList();
            foreach (string n in all.Skip(KEEP))
            {
                File.Delete(Path.Combine(outDir, n));
                Log("removed  " + n + " (more than " + KEEP + " kept)");
            }
        }
        catch (Exception ex) { Log("could not tidy old copies: " + ex.Message); }
    }

    /* ── ExecuteScriptAsync hands back JSON: a string comes quoted and escaped ── */
    static string Unquote(string json)
    {
        if (json == null || json == "null") return "";
        if (json.Length < 2 || json[0] != '"') throw new FormatException("not a string: " + json.Substring(0, Math.Min(60, json.Length)));
        var sb = new StringBuilder(json.Length);
        for (int i = 1; i < json.Length - 1; i++)
        {
            char ch = json[i];
            if (ch != '\\') { sb.Append(ch); continue; }
            char n = json[++i];
            switch (n)
            {
                case '"': sb.Append('"'); break;
                case '\\': sb.Append('\\'); break;
                case '/': sb.Append('/'); break;
                case 'b': sb.Append('\b'); break;
                case 'f': sb.Append('\f'); break;
                case 'n': sb.Append('\n'); break;
                case 'r': sb.Append('\r'); break;
                case 't': sb.Append('\t'); break;
                case 'u': sb.Append((char)Convert.ToInt32(json.Substring(i + 1, 4), 16)); i += 4; break;
                default: sb.Append(n); break;
            }
        }
        return sb.ToString();
    }

    /* one field out of the small state object, which this program wrote the shape of */
    static string Field(string json, string key)
    {
        var m = Regex.Match(json, "\"" + key + "\":(\"((?:[^\"\\\\]|\\\\.)*)\"|[^,}]*)");
        if (!m.Success) return "";
        return m.Groups[2].Success && m.Groups[1].Value.StartsWith("\"") ? Regex.Unescape(m.Groups[2].Value) : m.Groups[1].Value;
    }
}
