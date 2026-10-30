/* ══════════════ UPDATES ══════════════
   Tom, 2026-10-28: "Build A", the programs update themselves. The pages
   inside them always came from the site; the programs around them (the
   window, the widget, the tray, the shortcut key) did not, so a copy given
   to someone stayed on whatever build they were sent.

   Only a copy Setup installed checks, never Tom's own. Half a minute after
   it opens, and every six hours after that, it reads desktop/update.txt on
   the site it opens (the client build writes it: the fingerprint of the
   newest Motherbase Setup.exe). Its own Setup.exe beside it is the one that
   installed it, so a different fingerprint is a newer build. It downloads
   that Setup into update\, checks the fingerprint, and runs it with
   `--update`, which swaps the files without closing anything. What is
   running keeps running; the next open is the new build.

   Never in the way: it runs off the window's thread, nothing waits on it,
   and any failure (no connection, a half download) leaves the copy as it
   is until the next check. STATUS.exe and Main Menu.exe both carry it, and
   one lock between them means only one checks at a time.                  */

using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Threading;

static class Updater
{
    const int FIRST = 30 * 1000, EVERY = 6 * 60 * 60 * 1000;
    const long MOST = 50L * 1024 * 1024;
    static Timer timer;

    public static void Start(Action<string> log)
    {
        if (!Hosted.Client) return;
        if (!File.Exists(Path.Combine(Dir, "Setup.exe"))) return;   /* not a Setup install */
        timer = new Timer(_ => Check(log), null, FIRST, EVERY);
    }

    static string Dir { get { return AppDomain.CurrentDomain.BaseDirectory; } }

    static void Check(Action<string> log)
    {
        Mutex m = null;
        bool mine = false;
        try
        {
            m = new Mutex(false, "Motherbase.Update.client");
            try { mine = m.WaitOne(0); } catch (AbandonedMutexException) { mine = true; }
            if (!mine) return;

            ServicePointManager.SecurityProtocol |= (SecurityProtocolType)3072;   /* TLS 1.2 */
            string bust = "?t=" + DateTime.UtcNow.Ticks;   /* past the site's ten-minute cache */
            string info;
            using (var wc = new WebClient()) info = wc.DownloadString(Hosted.Url + "desktop/update.txt" + bust);

            string want = null;
            long size = 0;
            foreach (string raw in info.Split('\n'))
            {
                string line = raw.Trim();
                if (line.StartsWith("sha256=")) want = line.Substring(7).ToLowerInvariant();
                if (line.StartsWith("size=")) long.TryParse(line.Substring(5), out size);
            }
            /* what the last update left: the files that were running then,
               and the setup it ran. Whatever is still in use stays. */
            string upd = Path.Combine(Dir, "update");
            foreach (string old in Directory.GetFiles(Dir, "*.old")) try { File.Delete(old); } catch { }
            try { Directory.Delete(upd, true); } catch { }

            if (want == null || want.Length != 64 || size <= 0 || size > MOST) return;
            if (want == Sha(Path.Combine(Dir, "Setup.exe"))) return;

            Directory.CreateDirectory(upd);
            string file = Path.Combine(upd, "Setup.exe");
            using (var wc = new WebClient()) wc.DownloadFile(Hosted.Url + "desktop/Motherbase%20Setup.exe" + bust, file);
            if (Sha(file) != want)
            {
                log("update: the download did not match, not used");
                try { File.Delete(file); } catch { }
                return;
            }

            log("update: installing " + want.Substring(0, 8));
            var p = Process.Start(new ProcessStartInfo(file, "--update \"" + Dir.TrimEnd('\\') + "\"")
                { UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = upd });
            if (!p.WaitForExit(120000)) { log("update: still running after two minutes"); return; }
            log(p.ExitCode == 0 ? "update: done, the next open is the new build" : "update: failed, exit " + p.ExitCode);
        }
        catch (Exception ex) { log("update: " + ex.Message); }
        finally
        {
            if (mine) try { m.ReleaseMutex(); } catch { }
            if (m != null) m.Dispose();
        }
    }

    static string Sha(string path)
    {
        try
        {
            using (var s = File.OpenRead(path))
            using (var h = SHA256.Create())
                return BitConverter.ToString(h.ComputeHash(s)).Replace("-", "").ToLowerInvariant();
        }
        catch { return ""; }
    }
}
