/* ══════════════ WHICH ADDRESS ══════════════
   Tom, 2026-10-27: "a neat, convenient package so I can give someone a
   desktop copy of main menu as well as the status widget." The two addresses
   are never mixed (root brief): his copy opens tomoncupa.github.io/Motherbase,
   anyone else's opens the client copy. So the address is a file beside the
   program, address.txt, which Setup.exe writes; with no file it is his.

   Compiled into STATUS.exe and Main Menu.exe both, so they cannot disagree. */

using System;
using System.Drawing;
using System.IO;
using System.Windows.Forms;

static class Hosted
{
    public const string MINE = "https://tomoncupa.github.io/Motherbase/";
    public static readonly string Url = Read();

    /* a copy given to someone else: no Claude panel, the client address */
    public static bool Client { get { return Url != MINE; } }

    static string Read()
    {
        try
        {
            string p = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "address.txt");
            if (File.Exists(p))
                foreach (string line in File.ReadAllLines(p))
                {
                    string s = line.Trim();
                    if (s.Length == 0 || s.StartsWith("#")) continue;
                    bool ok = s.StartsWith("https://") || s.StartsWith("http://127.0.0.1") || s.StartsWith("http://localhost");
                    if (ok) return s.EndsWith("/") ? s : s + "/";
                }
        }
        catch { }
        return MINE;
    }

    /* The icon built into the exe, for a copy with no repo beside it. */
    public static Icon OwnIcon()
    {
        try { return Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
        catch { return SystemIcons.Application; }
    }
}
