/* ══════════════ STATUS.exe, guessing a food from its name ══════════════
   Tom, 2026-11-16: "type food entries and then it will give me a best
   guess", "if I say SM Turon versus Andok's Turon", "apply more
   intelligence". A meal typed with a name and no numbers waits (`gs:
   'wait'` on the meal row). STATUS's page inside this program gathers the
   waiting ones and posts mbguess:{id, prompt}; this runs the bundled
   claude.exe on his subscription, with web search only, and hands back
   {mb:'guess', id, text} or {.., error} through window.foodGuessBack.

   Nothing of his goes in but the food names, when they were eaten, and his
   own earlier figures for the same names. The helpers at the foot are
   SpeakRefine.cs's, copied, so STATUS.exe stands alone.                  */

using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

static class FoodGuess
{
    static readonly JavaScriptSerializer json = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
    static int busy = 0;

    public static void Ask(string body, Action<string> log, Action<string> send)
    {
        Dictionary<string, object> m;
        try { m = json.DeserializeObject(body) as Dictionary<string, object>; } catch { return; }
        if (m == null) return;
        string id = Convert.ToString(m.ContainsKey("id") ? m["id"] : "");
        string prompt = Convert.ToString(m.ContainsKey("prompt") ? m["prompt"] : "");
        if (id == "" || prompt.Trim() == "") return;
        /* one at a time: the page asks again for whatever is still waiting */
        if (Interlocked.CompareExchange(ref busy, 1, 0) != 0)
        {
            send(json.Serialize(new Dictionary<string, object> { { "mb", "guess" }, { "id", id }, { "error", "busy" } }));
            return;
        }
        new Thread(() =>
        {
            try { send(json.Serialize(Run(id, prompt, log))); }
            finally { Interlocked.Exchange(ref busy, 0); }
        }) { IsBackground = true }.Start();
    }

    static Dictionary<string, object> Run(string id, string prompt, Action<string> log)
    {
        var res = new Dictionary<string, object> { { "mb", "guess" }, { "id", id } };
        string exe = Exe();
        if (exe == null) { res["error"] = "The Claude program is not on this PC."; return res; }
        string room = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Motherbase", "guess");
        Directory.CreateDirectory(room);
        string sys = Path.Combine(room, "SYSTEM.md");
        File.WriteAllText(sys, SYSTEM, new UTF8Encoding(false));
        var args = new List<string> {
            "-p", "--strict-mcp-config", "--output-format", "json",
            "--tools", "WebSearch", "--allowedTools", "WebSearch",
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
        log("guess: asking Claude");
        try
        {
            var p = Process.Start(psi);
            var errTask = p.StandardError.ReadToEndAsync();
            byte[] b = new UTF8Encoding(false).GetBytes(prompt);
            p.StandardInput.BaseStream.Write(b, 0, b.Length);
            p.StandardInput.Close();
            var outTask = p.StandardOutput.ReadToEndAsync();
            if (!p.WaitForExit(8 * 60 * 1000)) { try { p.Kill(); } catch { } }
            outText = outTask.Result; errText = errTask.Result;
        }
        catch (Exception x) { errText = x.Message; }
        Dictionary<string, object> r = null;
        try { r = json.DeserializeObject(outText.Trim()) as Dictionary<string, object>; } catch { }
        string text = r != null && r.ContainsKey("result") ? Convert.ToString(r["result"]) : "";
        bool bad = r != null && r.ContainsKey("is_error") && r["is_error"] is bool && (bool)r["is_error"];
        if (text.Trim() != "" && !bad) { res["text"] = text.Trim(); log("guess: answered"); return res; }
        string said = text + " " + errText;
        log("guess: failed: " + (said.Length > 300 ? said.Substring(0, 300) : said));
        res["error"] = said.IndexOf("login", StringComparison.OrdinalIgnoreCase) >= 0 || said.IndexOf("authenticat", StringComparison.OrdinalIgnoreCase) >= 0
            ? "signed out" : "no answer";
        return res;
    }

    const string SYSTEM =
        "You estimate the calories and macros of food a fitness coach in Manila, the Philippines, typed into his food log with no numbers.\n" +
        "Think like a dietitian who knows Filipino food, street food, carinderias, fast food chains and supermarket brands (SM, Robinsons, Puregold, 7-Eleven, Ministop, Jollibee, Mang Inasal, Andok's, Max's, Chowking and the rest).\n" +
        "For each item: work out what it most likely is, the usual portion as sold or served in Manila (one piece, one order, one cup of rice), how it is cooked (fried, sugar-coated, coconut milk), and add it up from its ingredients. Fried and sugared street food is denser than it looks: a turon is a whole saba banana, often jackfruit, a lumpia wrapper, deep fried and coated in caramelised brown sugar, roughly 200 to 300 kcal, not 80.\n" +
        "A brand or shop changes the portion and recipe: use what you know of that brand, and search the web when a brand's figure or portion would change your answer. Official figures are often missing or wrong; give your honest best estimate anyway.\n" +
        "If an amount is typed (2 pcs, 1 cup, 150 g, large), use it. If not, assume one usual serving.\n" +
        "His earlier figures for the same names, if given, are what he has logged before: stay consistent with them unless they are clearly wrong.\n" +
        "Reply with JSON only, no other words: an array, one object per item, in the same order, each {\"key\": the item's key, \"kcal\": best guess, \"lo\": low end, \"hi\": high end, \"p\": protein g, \"c\": carbs g, \"f\": fat g, \"serve\": the portion you assumed in a few words, \"why\": one short line}. lo and hi are a range you would bet on four times in five. Round kcal to 5 and grams to whole numbers.\n";

    /* ── SpeakRefine.cs's helpers, copied ── */
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
