/* ══════════════ CLAUDE, inside the Main Menu ══════════════
   Tom, 2026-10-04: "possible to add a claude interface in my motherbase.exe?",
   then "A and B": ask about his own data, and log things by talking.

   The page draws the panel (shared/claude.js) and owns every row: it hands
   over a copy of the store as files, and it applies whatever Claude says to
   write, each with an Undo. This side only runs Claude. It is the bundled
   claude.exe the desktop app ships, on his subscription, the same one OUTER
   HEAVEN runs, allowed Read, Grep and Glob inside one folder that holds the
   copy and nothing else. No paid key, no network of its own.

   The rows are his health and money, so the folder is in his own AppData
   (%LOCALAPPDATA%\Motherbase\claude), never inside the repo.

   The conversation lives here, not in the page, because every app the window
   opens is a new page: the panel asks for it again on each one. A reply that
   lands while a page is loading is not lost either, since the next page asks
   and applies any write still marked new. */

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;

class ClaudeBridge
{
    readonly Form form;
    readonly CoreWebView2 web;
    readonly string origin;
    readonly Action<string> log;
    readonly string room;
    readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = int.MaxValue, RecursionLimit = 200 };

    /* what survives the window moving between apps */
    readonly List<Dictionary<string, object>> msgs = new List<Dictionary<string, object>>();
    string session = "";
    bool open = false;
    Process running;
    string runningId;

    static readonly Regex AUTH = new Regex(
        @"failed to authenticate|not logged in|please run /login|run /login|invalid api key|oauth|" +
        @"authentication[_ ]error|unauthori[sz]ed|\b401\b|not signed in|sign in again|log in again",
        RegexOptions.IgnoreCase);

    public ClaudeBridge(Form form, CoreWebView2 web, string origin, Action<string> log)
    {
        this.form = form; this.web = web; this.origin = origin; this.log = log;
        room = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Motherbase", "claude");
    }

    /* Every suite page gets the panel's script; nothing else does. The page
       URL is checked in the page as well, so Google's sign-in window, which
       opens in here, never draws it. */
    public void Attach()
    {
        string o = json.Serialize(origin);
        web.AddScriptToExecuteOnDocumentCreatedAsync(
            "(function(){var O=" + o + ";if(window.top!==window||location.href.indexOf(O)!==0)return;" +
            "function go(){if(document.getElementById('mb-claude-js'))return;var s=document.createElement('script');" +
            "s.id='mb-claude-js';s.src=O+'shared/claude.js';(document.head||document.documentElement).appendChild(s);}" +
            "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();})();");
        web.WebMessageReceived += Received;
    }

    void Received(object sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        /* only the suite may run Claude */
        if (e.Source == null || e.Source.IndexOf(origin, StringComparison.OrdinalIgnoreCase) != 0) return;
        Dictionary<string, object> m;
        try { m = json.DeserializeObject(e.TryGetWebMessageAsString()) as Dictionary<string, object>; }
        catch { return; }
        if (m == null || Str(m, "mb") != "claude") return;
        string op = Str(m, "op");
        try
        {
            if (op == "hello") Send(State());
            else if (op == "open") { open = Bool(m, "open"); }
            else if (op == "new") { if (runningId == null) { msgs.Clear(); session = ""; } Send(State()); }
            else if (op == "ask") Ask(m);
            else if (op == "stop") Stop();
            else if (op == "mark") Mark(m);
            else if (op == "login") Login();
        }
        catch (Exception x) { log("claude: " + op + " failed: " + x.Message); }
    }

    Dictionary<string, object> State()
    {
        return new Dictionary<string, object> {
            { "mb", "claude" }, { "op", "state" }, { "open", open }, { "busy", runningId != null },
            { "msgs", msgs }, { "found", Exe() != null },
        };
    }

    void Send(Dictionary<string, object> m)
    {
        string s = json.Serialize(m);
        Action go = () => { try { web.PostWebMessageAsJson(s); } catch { } };
        if (form.InvokeRequired) form.BeginInvoke(go); else go();
    }

    /* ── asking ── */
    void Ask(Dictionary<string, object> m)
    {
        if (runningId != null) return;
        string text = Str(m, "text").Trim();
        if (text == "") return;
        string exe = Exe();
        var mine = new Dictionary<string, object> { { "who", "me" }, { "text", text }, { "t", Now() } };
        msgs.Add(mine);
        if (exe == null)
        {
            Reply(null, "I can't find the Claude program on this PC. It comes with the Claude desktop app; open that once and try again.", null, "missing");
            return;
        }

        Directory.CreateDirectory(room);
        /* a fresh copy replaces the old one whole, so a type that is gone is gone */
        var files = m.ContainsKey("files") ? m["files"] as Dictionary<string, object> : null;
        if (files != null && files.Count > 0)
        {
            string rows = Path.Combine(room, "rows");
            if (Directory.Exists(rows)) foreach (string f in Directory.GetFiles(rows)) try { File.Delete(f); } catch { }
            Directory.CreateDirectory(rows);
            foreach (var kv in files)
            {
                string name = Path.GetFileName(kv.Key);
                if (name == "" || name != kv.Key.Replace("rows/", "")) continue;
                string dest = kv.Key.StartsWith("rows/") ? Path.Combine(rows, name) : Path.Combine(room, name);
                File.WriteAllText(dest, Convert.ToString(kv.Value), new UTF8Encoding(false));
            }
        }
        File.WriteAllText(Path.Combine(room, "SYSTEM.md"), Str(m, "system"), new UTF8Encoding(false));

        string id = Guid.NewGuid().ToString("N");
        runningId = id;
        var args = new List<string> {
            "-p", "--strict-mcp-config", "--output-format", "json",
            "--tools", "Read,Grep,Glob", "--allowedTools", "Read,Grep,Glob",
            "--append-system-prompt-file", Path.Combine(room, "SYSTEM.md"),
        };
        string model = Str(m, "model");
        if (model != "") { args.Add("--model"); args.Add(model); }
        string schema = Str(m, "schema");
        if (schema != "") { args.Add("--json-schema"); args.Add(schema); }
        if (session != "") { args.Add("--resume"); args.Add(session); }

        var psi = new ProcessStartInfo(exe, Join(args))
        {
            UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = room,
            RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8,
        };
        Clean(psi);
        Send(State());
        string prompt = Str(m, "prompt");
        new Thread(() => Run(id, psi, prompt)) { IsBackground = true }.Start();
    }

    void Run(string id, ProcessStartInfo psi, string prompt)
    {
        string outText = "", errText = "";
        int code = -1;
        try
        {
            var p = Process.Start(psi);
            running = p;
            var errTask = p.StandardError.ReadToEndAsync();
            byte[] b = new UTF8Encoding(false).GetBytes(prompt);
            p.StandardInput.BaseStream.Write(b, 0, b.Length);
            p.StandardInput.Close();
            var outTask = p.StandardOutput.ReadToEndAsync();
            if (!p.WaitForExit(6 * 60 * 1000)) { try { p.Kill(); } catch { } }
            outText = outTask.Result; errText = errTask.Result;
            code = p.HasExited ? p.ExitCode : -1;
        }
        catch (Exception x) { errText = x.Message; }
        /* the conversation is only ever touched on the window's own thread */
        form.BeginInvoke((Action)(() => Done(id, outText, errText, code)));
    }

    void Done(string id, string outText, string errText, int code)
    {
        if (runningId != id) return;          /* stopped: Stop() already answered */
        running = null;
        runningId = null;

        Dictionary<string, object> res = null;
        try { res = json.DeserializeObject(outText.Trim()) as Dictionary<string, object>; } catch { }
        if (res != null && res.ContainsKey("session_id")) session = Convert.ToString(res["session_id"]);

        var so = res != null && res.ContainsKey("structured_output") ? res["structured_output"] as Dictionary<string, object> : null;
        if (so != null && !Bool(res, "is_error"))
        {
            Reply(Str(so, "reply"), null, so.ContainsKey("writes") ? so["writes"] as IList : null, null);
            return;
        }
        string said = (res != null ? Str(res, "result") : "") + "\n" + errText + "\n" + (res == null ? outText : "");
        log("claude: failed, code " + code + ": " + Short(said));
        if (AUTH.IsMatch(said))
            Reply(null, "Claude is signed out on this PC. Press SIGN IN, sign in on the Claude website, then ask again.", null, "signin");
        else if (res != null && Str(res, "result") != "" && so == null && !Bool(res, "is_error"))
            Reply(Str(res, "result"), null, null, null);
        else
            Reply(null, "Claude didn't answer that one. " + Short(said), null, "failed");
    }

    void Reply(string text, string error, IList writes, string kind)
    {
        var w = new ArrayList();
        if (writes != null)
            foreach (var o in writes)
            {
                var d = o as Dictionary<string, object>;
                if (d == null) continue;
                d["state"] = "new";
                w.Add(d);
            }
        var msg = new Dictionary<string, object> { { "who", "claude" }, { "t", Now() }, { "writes", w } };
        if (text != null) msg["text"] = text;
        if (error != null) { msg["error"] = error; msg["kind"] = kind; }
        msgs.Add(msg);
        Send(State());
    }

    void Stop()
    {
        if (runningId == null) return;
        var p = running;
        runningId = null;
        running = null;
        if (p != null) try { p.Kill(); } catch { }
        msgs.Add(new Dictionary<string, object> { { "who", "claude" }, { "t", Now() }, { "error", "Stopped." }, { "kind", "stopped" }, { "writes", new ArrayList() } });
        Send(State());
    }

    /* the page applied a write, failed one, or undid one */
    void Mark(Dictionary<string, object> m)
    {
        int i = Int(m, "msg"), j = Int(m, "write");
        if (i < 0 || i >= msgs.Count) return;
        var w = msgs[i].ContainsKey("writes") ? msgs[i]["writes"] as IList : null;
        if (w == null || j < 0 || j >= w.Count) return;
        var d = w[j] as Dictionary<string, object>;
        var to = m.ContainsKey("w") ? m["w"] as Dictionary<string, object> : null;
        if (d == null || to == null) return;
        foreach (var kv in to) d[kv.Key] = kv.Value;
    }

    /* Claude's own sign-in, in its own window, the way CLIP and OUTER HEAVEN do it */
    void Login()
    {
        string exe = Exe();
        if (exe == null) return;
        var psi = new ProcessStartInfo(exe, "auth login --claudeai") { UseShellExecute = false, CreateNoWindow = false };
        Clean(psi);
        try { Process.Start(psi); } catch (Exception x) { log("claude: sign in failed to open: " + x.Message); }
    }

    /* ── helpers ── */

    /* The newest bundled CLI. Since 2.1.286 it sits one folder deeper, under
       a hash: claude-code\<version>\<hash>\claude.exe. Both are looked for. */
    static string Exe()
    {
        string root = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Claude", "claude-code");
        if (!Directory.Exists(root)) return null;
        string best = null; Version bestV = new Version(0, 0);
        foreach (string dir in Directory.GetDirectories(root))
        {
            Version v;
            if (!Version.TryParse(Path.GetFileName(dir), out v)) continue;
            string exe = Path.Combine(dir, "claude.exe");
            if (!File.Exists(exe))
            {
                exe = null;
                foreach (string sub in Directory.GetDirectories(dir))
                    if (File.Exists(Path.Combine(sub, "claude.exe"))) { exe = Path.Combine(sub, "claude.exe"); break; }
            }
            if (exe != null && v > bestV) { best = exe; bestV = v; }
        }
        return best;
    }

    /* A Claude session that started this window leaves variables that point
       claude.exe at that session's sign-in; his own is the one wanted. */
    static void Clean(ProcessStartInfo psi)
    {
        var drop = new List<string>();
        foreach (DictionaryEntry kv in psi.EnvironmentVariables)
        {
            string k = Convert.ToString(kv.Key).ToUpperInvariant();
            if (k.StartsWith("CLAUDE") || k == "ANTHROPIC_BASE_URL" || k == "USE_LOCAL_OAUTH" || k == "USE_STAGING_OAUTH")
                drop.Add(Convert.ToString(kv.Key));
        }
        foreach (string k in drop) psi.EnvironmentVariables.Remove(k);
    }

    /* Windows' own rules for one command line, so a schema full of quotes arrives whole */
    static string Join(List<string> args)
    {
        var sb = new StringBuilder();
        foreach (string a in args)
        {
            if (sb.Length > 0) sb.Append(' ');
            if (a.Length > 0 && a.IndexOfAny(new[] { ' ', '\t', '"', '\n' }) < 0) { sb.Append(a); continue; }
            sb.Append('"');
            int slashes = 0;
            foreach (char c in a)
            {
                if (c == '\\') { slashes++; continue; }
                if (c == '"') { sb.Append('\\', slashes * 2 + 1); sb.Append('"'); }
                else { sb.Append('\\', slashes); sb.Append(c); }
                slashes = 0;
            }
            sb.Append('\\', slashes * 2);
            sb.Append('"');
        }
        return sb.ToString();
    }

    static string Short(string s)
    {
        s = Regex.Replace(s ?? "", @"sk-[A-Za-z0-9_-]{8,}", "[hidden]");
        s = Regex.Replace(s, @"\s+", " ").Trim();
        return s.Length > 200 ? s.Substring(0, 200) : s;
    }
    static long Now() { return (long)(DateTime.UtcNow - new DateTime(1970, 1, 1)).TotalMilliseconds; }
    static string Str(Dictionary<string, object> m, string k) { object v; return m.TryGetValue(k, out v) && v != null ? Convert.ToString(v) : ""; }
    static bool Bool(Dictionary<string, object> m, string k) { object v; return m.TryGetValue(k, out v) && v is bool && (bool)v; }
    static int Int(Dictionary<string, object> m, string k) { object v; try { return m.TryGetValue(k, out v) ? Convert.ToInt32(v) : -1; } catch { return -1; } }
}
