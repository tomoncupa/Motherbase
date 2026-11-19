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
        /* the page names the model per job (SPEAK 1.0.55, Tom: "How can we
           optimize speak to minimize Claude usage?"): only these aliases, so
           nothing the page sends can become another argument */
        string model = Convert.ToString(m.ContainsKey("model") ? m["model"] : "");
        if (model != "haiku" && model != "sonnet") model = "";
        new Thread(() => send(json.Serialize(Run(id, prompt, log, model)))) { IsBackground = true }.Start();
    }

    static Dictionary<string, object> Run(string id, string prompt, Action<string> log, string model)
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
        if (model != "") { args.Add("--model"); args.Add(model); }
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

    /* ── the transcript, written on this PC (SPEAK 1.0.33) ──
       WebView2, the engine inside SPEAK.exe, has no speech-to-text of its
       own, so a take made here came back with no transcript (Tom,
       2026-11-16: "why was there no transcript?"). The page posts the take's
       recording as mbhear:{id, ext, b64}; this saves it and runs CLIP's own
       transcriber (faster-whisper, in CLIP's Python) on it, and posts back
       {mb:'hear', id, text, chunks:[...], words:[[word, start, end, sure]]} or {.., error}. */
    public static void Hear(string body, Action<string> log, Action<string> send)
    {
        Dictionary<string, object> m;
        try { m = json.DeserializeObject(body) as Dictionary<string, object>; } catch { return; }
        if (m == null) return;
        string id = Convert.ToString(m.ContainsKey("id") ? m["id"] : "");
        string ext = Convert.ToString(m.ContainsKey("ext") ? m["ext"] : "webm");
        string b64 = Convert.ToString(m.ContainsKey("b64") ? m["b64"] : "");
        if (id == "" || b64 == "") return;
        new Thread(() => send(json.Serialize(HearRun(id, ext, b64, log)))) { IsBackground = true }.Start();
    }

    static Dictionary<string, object> HearRun(string id, string ext, string b64, Action<string> log)
    {
        var res = new Dictionary<string, object> { { "mb", "hear" }, { "id", id } };
        string tools = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", "CLIP", "tools");
        string py = Path.Combine(tools, "venv", "Scripts", "python.exe");
        if (!File.Exists(py)) { res["error"] = "CLIP's transcriber is not on this PC, so no transcript."; return res; }
        string room = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Motherbase", "hear");
        Directory.CreateDirectory(room);
        string safe = new string(Array.FindAll(id.ToCharArray(), ch => char.IsLetterOrDigit(ch) || ch == '-'));
        if (safe == "") safe = "take";
        string clip = Path.Combine(room, safe + "." + (ext == "mp4" ? "mp4" : "webm"));
        try { File.WriteAllBytes(clip, Convert.FromBase64String(b64)); }
        catch (Exception x) { res["error"] = "Could not save the recording to hear it: " + x.Message; return res; }
        return HearFile(id, clip, log);
    }

    /* runs CLIP's transcriber on one saved recording, then deletes it */
    static Dictionary<string, object> HearFile(string id, string clip, Action<string> log)
    {
        var res = new Dictionary<string, object> { { "mb", "hear" }, { "id", id } };
        string tools = Tools(), py = Path.Combine(tools, "venv", "Scripts", "python.exe");
        if (!File.Exists(py)) { res["error"] = "CLIP's transcriber is not on this PC, so no transcript."; return res; }
        string room = Path.GetDirectoryName(clip);
        string outDir = Path.Combine(room, Path.GetFileNameWithoutExtension(clip));
        string script = Path.Combine(room, "hear.py");
        try
        {
            File.WriteAllText(script,
                "import sys, os, json\n" +
                "tools, video, out = sys.argv[1], sys.argv[2], sys.argv[3]\n" +
                "sys.path.insert(0, tools)\n" +
                "import engine\n" +
                "engine.transcribe(video, 'fast', out_dir=out)\n" +
                "with open(os.path.join(out, 'words.json'), encoding='utf-8') as f: d = json.load(f)\n" +
                "segs = [s.get('text', '').strip() for s in d.get('segments') or [] if s.get('text', '').strip()]\n" +
                "ws = [[w.get('word', '').strip(), round(w.get('start') or 0, 2), round(w.get('end') or 0, 2), w.get('prob')] for s in d.get('segments') or [] for w in s.get('words') or [] if w.get('word', '').strip()]\n" +
                "sys.stdout.write(json.dumps({'chunks': segs, 'words': ws[:3000]}))\n", new UTF8Encoding(false));
        }
        catch (Exception x) { res["error"] = "Could not save the recording to hear it: " + x.Message; return res; }
        var psi = new ProcessStartInfo(py, Join(new List<string> { script, tools, clip, outDir }))
        {
            UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = tools,
            RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true,
            StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8,
        };
        string outText = "", errText = "";
        try
        {
            var p = Process.Start(psi);
            p.StandardInput.Close();
            var errTask = p.StandardError.ReadToEndAsync();
            var outTask = p.StandardOutput.ReadToEndAsync();
            if (!p.WaitForExit(10 * 60 * 1000)) { try { p.Kill(); } catch { } }
            outText = outTask.Result; errText = errTask.Result;
        }
        catch (Exception x) { errText = x.Message; }
        try { File.Delete(clip); } catch { }
        if (!Parse(outText, res))
        {
            log("hear: failed: " + (errText.Length > 400 ? errText.Substring(errText.Length - 400) : errText));
            res["error"] = "The transcriber did not finish this one.";
        }
        return res;
    }

    static string Tools() { return Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads", "CLIP", "tools"); }
    static string Room()
    {
        string r = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Motherbase", "hear");
        Directory.CreateDirectory(r);
        return r;
    }

    /* the transcriber's last {"chunks": .., "words": ..} line, into res */
    static bool Parse(string outText, Dictionary<string, object> res)
    {
        int brace = outText.LastIndexOf("{\"chunks\"");
        Dictionary<string, object> r = null;
        if (brace >= 0) try { r = json.DeserializeObject(outText.Substring(brace)) as Dictionary<string, object>; } catch { }
        var chunks = r != null && r.ContainsKey("chunks") ? r["chunks"] as System.Collections.IList : null;
        if (chunks == null || chunks.Count == 0) return false;
        var list = new List<string>();
        foreach (var c in chunks) list.Add(Convert.ToString(c));
        res["chunks"] = list;
        res["text"] = string.Join(" ", list);
        if (r.ContainsKey("words") && r["words"] is System.Collections.IList) res["words"] = r["words"];
        return true;
    }

    /* ── listening while he talks (SPEAK 1.0.51) ──
       Tom, 2026-11-18: "why can't it start transcription in parallel with
       while I'm talking?" The page posts mblive:{op:'start', lid, ext} as the
       take starts, which starts CLIP's Python with the speech model loading
       at once. Every 25 seconds or so {op:'part', lid, b64, from, to} adds the
       new piece of the recording to one file here and asks for the sound
       between from and to (seconds) to be written while he keeps talking.
       {op:'end', lid, id, b64, from} adds the last piece, writes it, and posts
       {mb:'hear', id, ..} exactly as Hear does. If the live run failed, the
       whole file is written the old way. {op:'drop'} ends a cancelled take. */
    class LiveRun
    {
        public Process P; public string File;
        public StringBuilder Out = new StringBuilder(), Err = new StringBuilder();
        public ManualResetEvent Done = new ManualResetEvent(false);
    }
    static readonly Dictionary<string, LiveRun> lives = new Dictionary<string, LiveRun>();

    public static void Live(string body, Action<string> log, Action<string> send)
    {
        Dictionary<string, object> m;
        try { m = json.DeserializeObject(body) as Dictionary<string, object>; } catch { return; }
        if (m == null) return;
        Func<string, string> S = k => Convert.ToString(m.ContainsKey(k) ? m[k] : "");
        string op = S("op");
        string safe = new string(Array.FindAll(S("lid").ToCharArray(), ch => char.IsLetterOrDigit(ch)));
        if (safe == "") return;
        LiveRun run;
        lock (lives) lives.TryGetValue(safe, out run);
        if (op == "start")
        {
            if (run != null) return;
            run = new LiveRun { File = Path.Combine(Room(), safe + "." + (S("ext") == "mp4" ? "mp4" : "webm")) };
            try { File.WriteAllBytes(run.File, new byte[0]); } catch { return; }
            string tools = Tools(), py = Path.Combine(tools, "venv", "Scripts", "python.exe");
            string script = Path.Combine(Room(), "hearlive.py");
            try
            {
                if (File.Exists(py))
                {
                    File.WriteAllText(script, LIVE_PY, new UTF8Encoding(false));
                    var psi = new ProcessStartInfo(py, Join(new List<string> { script, tools }))
                    {
                        UseShellExecute = false, CreateNoWindow = true, WorkingDirectory = tools,
                        RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true,
                        StandardOutputEncoding = Encoding.UTF8, StandardErrorEncoding = Encoding.UTF8,
                    };
                    var rp = run;
                    rp.P = Process.Start(psi);
                    rp.P.StandardInput.AutoFlush = true;
                    rp.P.OutputDataReceived += (o, e) => { if (e.Data == null) rp.Done.Set(); else lock (rp.Out) rp.Out.AppendLine(e.Data); };
                    rp.P.ErrorDataReceived += (o, e) => { if (e.Data != null) lock (rp.Err) { if (rp.Err.Length < 20000) rp.Err.AppendLine(e.Data); } };
                    rp.P.BeginOutputReadLine(); rp.P.BeginErrorReadLine();
                }
            }
            catch (Exception x) { log("hear live: could not start: " + x.Message); run.P = null; }
            lock (lives) lives[safe] = run;
            return;
        }
        if (run == null) return;
        string b64 = S("b64");
        if (b64 != "")
            try { using (var f = new FileStream(run.File, FileMode.Append, FileAccess.Write)) { var b = Convert.FromBase64String(b64); f.Write(b, 0, b.Length); } }
            catch (Exception x) { log("hear live: could not add to the recording: " + x.Message); }
        Action<object> tell = o => { try { if (run.P != null && !run.P.HasExited) run.P.StandardInput.WriteLine(json.Serialize(o)); } catch { } };
        if (op == "part")
            tell(new Dictionary<string, object> { { "op", "part" }, { "path", run.File }, { "from", m["from"] }, { "to", m["to"] } });
        else if (op == "drop")
        {
            lock (lives) lives.Remove(safe);
            try { if (run.P != null && !run.P.HasExited) run.P.Kill(); } catch { }
            try { File.Delete(run.File); } catch { }
        }
        else if (op == "end")
        {
            lock (lives) lives.Remove(safe);
            string id = S("id");
            tell(new Dictionary<string, object> { { "op", "end" }, { "path", run.File }, { "from", m["from"] } });
            new Thread(() =>
            {
                var res = new Dictionary<string, object> { { "mb", "hear" }, { "id", id } };
                bool ok = false;
                if (run.P != null)
                {
                    try { run.P.StandardInput.Close(); } catch { }
                    if (!run.Done.WaitOne(10 * 60 * 1000)) try { run.P.Kill(); } catch { }
                    try { run.P.WaitForExit(5000); } catch { }
                    string o; lock (run.Out) o = run.Out.ToString();
                    ok = Parse(o, res);
                    if (!ok) { string er; lock (run.Err) er = run.Err.ToString(); log("hear live: failed, writing the whole take: " + (er.Length > 400 ? er.Substring(er.Length - 400) : er)); }
                }
                if (ok) { try { File.Delete(run.File); } catch { } }
                else res = HearFile(id, run.File, log);
                send(json.Serialize(res));
            }) { IsBackground = true }.Start();
        }
    }

    /* the live transcriber: the model loads first, then each piece is written
       as it arrives, its word times moved to where the piece starts */
    const string LIVE_PY = @"import sys, os, json, subprocess, tempfile
tools = sys.argv[1]
sys.path.insert(0, tools)
import engine, common
model = engine.model_for('fast')
prompt = 'Umm, so, uh, let me think, like, hmm. Okay, I, I mean, you know, erm, here is the thing.' if common.settings().get('transcribe_fillers', True) else None
segs, words = [], []
def hear(path, a, b):
    fd, wav = tempfile.mkstemp(suffix='.wav')
    os.close(fd)
    try:
        cmd = [common.FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', '-i', path, '-ss', str(a)]
        if b is not None: cmd += ['-t', str(max(0.1, b - a))]
        cmd += ['-vn', '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', wav]
        if subprocess.run(cmd, capture_output=True).returncode != 0: return
        raw, info = model.transcribe(wav, language='en', word_timestamps=True, beam_size=model._clip_beam, vad_filter=True, initial_prompt=prompt)
        for s in raw:
            t = (s.text or '').strip()
            if t: segs.append(t)
            for w in s.words or []:
                if (w.word or '').strip(): words.append([w.word.strip(), round(w.start + a, 2), round(w.end + a, 2), round(getattr(w, 'probability', 0) or 0, 3)])
    finally:
        try: os.remove(wav)
        except OSError: pass
# .NET writes a byte-order mark before its first line on stdin, which made
# json.loads skip the first piece of every take; read bytes and drop it
for raw in sys.stdin.buffer:
    line = raw.decode('utf-8', 'ignore').lstrip(chr(0xfeff))
    try: m = json.loads(line)
    except ValueError: continue
    if m.get('op') == 'part': hear(m['path'], float(m['from']), float(m['to']))
    elif m.get('op') == 'end':
        hear(m['path'], float(m['from']), None)
        break
sys.stdout.write(json.dumps({'chunks': segs, 'words': words[:3000]}) + '\n')
sys.stdout.flush()
";

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
