/* ══════════════ SPEAK.exe, refining a take into content ══════════════
   Tom, 2026-11-16: "the option to directly go into refine and iteration
   mode from a fresh speak practice". The page (speak/index.html, possible
   content) posts mbrefine:{id, prompt}; this runs the bundled claude.exe on
   his subscription with no tools, his spoken voice and brand guide as the
   system prompt, and posts {mb:'refine', id, text} or {.., error} back.

   Nothing of his data goes in but the one take's words. The voice and brand
   files are read from tom-context on this PC each time, so an edit there is
   in the next refine. The helpers at the foot are ClaudeBridge.cs's, copied
   so SPEAK.exe does not compile the Main Menu's panel.                    */

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

static class Refine
{
    static readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };

    public static void Ask(string body, Action<string> log, Action<string> send)
    {
        Dictionary<string, object> m;
        try { m = json.DeserializeObject(body) as Dictionary<string, object>; } catch { return; }
        if (m == null) return;
        string id = Convert.ToString(m.ContainsKey("id") ? m["id"] : "");
        string prompt = Convert.ToString(m.ContainsKey("prompt") ? m["prompt"] : "");
        if (id == "" || prompt.Trim() == "") return;
        new Thread(() => send(json.Serialize(Run(id, prompt, log)))) { IsBackground = true }.Start();
    }

    static Dictionary<string, object> Run(string id, string prompt, Action<string> log)
    {
        var res = new Dictionary<string, object> { { "mb", "refine" }, { "id", id } };
        string exe = Exe();
        if (exe == null) { res["error"] = "The Claude program is not on this PC. Open the Claude desktop app once and try again."; return res; }
        string room = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Motherbase", "refine");
        Directory.CreateDirectory(room);
        string sys = Path.Combine(room, "SYSTEM.md");
        File.WriteAllText(sys, System_(), new UTF8Encoding(false));
        var args = new List<string> {
            "-p", "--strict-mcp-config", "--output-format", "json", "--tools", "",
            "--append-system-prompt-file", sys,
        };
        var psi = new ProcessStartInfo(exe, Join(args))
        {
            UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = room,
            RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8,
        };
        Clean(psi);
        string outText = "", errText = "";
        try
        {
            var p = Process.Start(psi);
            var errTask = p.StandardError.ReadToEndAsync();
            byte[] b = new UTF8Encoding(false).GetBytes(prompt);
            p.StandardInput.BaseStream.Write(b, 0, b.Length);
            p.StandardInput.Close();
            var outTask = p.StandardOutput.ReadToEndAsync();
            if (!p.WaitForExit(6 * 60 * 1000)) { try { p.Kill(); } catch { } }
            outText = outTask.Result; errText = errTask.Result;
        }
        catch (Exception x) { errText = x.Message; }
        Dictionary<string, object> r = null;
        try { r = json.DeserializeObject(outText.Trim()) as Dictionary<string, object>; } catch { }
        string text = r != null && r.ContainsKey("result") ? Convert.ToString(r["result"]) : "";
        bool bad = r != null && r.ContainsKey("is_error") && r["is_error"] is bool && (bool)r["is_error"];
        if (text.Trim() != "" && !bad) { res["text"] = text.Trim(); return res; }
        string said = text + " " + errText;
        log("refine: failed: " + (said.Length > 300 ? said.Substring(0, 300) : said));
        res["error"] = said.IndexOf("login", StringComparison.OrdinalIgnoreCase) >= 0 || said.IndexOf("authenticat", StringComparison.OrdinalIgnoreCase) >= 0
            ? "Claude is signed out on this PC. Open the Claude desktop app and sign in, then refine again."
            : "Claude didn't answer that one. Try REFINE again.";
        return res;
    }

    /* how Tom talks, and the brand rules, as they stand in tom-context today */
    static string System_()
    {
        string ctx = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Documents", "GitHub", "tom-context");
        var sb = new StringBuilder();
        sb.AppendLine("You turn Tom's spoken practice takes into content he will post. Tom is a premium fitness coach in Manila building a personal brand as a content creator and motivational speaker. Write the way he talks, not the way a copywriter writes. Reply with the draft only.");
        foreach (string f in new[] { "voice-spoken.md", "brand.md" })
        {
            string p = Path.Combine(ctx, f);
            if (!File.Exists(p)) continue;
            try { sb.AppendLine().AppendLine("# " + f).AppendLine(File.ReadAllText(p, Encoding.UTF8)); } catch { }
        }
        return sb.ToString();
    }

    /* ── ClaudeBridge.cs's helpers, copied ── */
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
}
