/* "Press the keys you want."

   Tom, 2026-09-16: "Give me a setting to program my own shortcut." A list of
   three was not a setting, it was three guesses. This takes whatever he
   presses, as long as it carries a Ctrl, Alt or Shift, because Windows will
   not hand a bare letter to a program that is not in front. */

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Windows.Forms;

class KeyBox : Form
{
    public string Chosen;
    Label shown;
    Button use;

    public KeyBox(string current)
    {
        Text = "Bullet shortcut";
        FormBorderStyle = FormBorderStyle.FixedDialog;
        StartPosition = FormStartPosition.CenterScreen;
        MaximizeBox = false; MinimizeBox = false; ShowInTaskbar = false;
        ClientSize = new Size(380, 172);
        KeyPreview = true;

        var tell = new Label
        {
            Text = "Press the keys you want to use for writing a bullet.\r\n" +
                   "It has to include Ctrl, Alt or Shift.",
            Bounds = new Rectangle(20, 16, 340, 40),
        };
        shown = new Label
        {
            Text = PrettyOf(current),
            Bounds = new Rectangle(20, 62, 340, 44),
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font(FontFamily.GenericSansSerif, 15, FontStyle.Bold),
            BorderStyle = BorderStyle.FixedSingle,
        };
        use = new Button { Text = "Use it", Bounds = new Rectangle(196, 122, 80, 30), DialogResult = DialogResult.OK };
        var no = new Button { Text = "Cancel", Bounds = new Rectangle(284, 122, 80, 30), DialogResult = DialogResult.Cancel };
        Controls.Add(tell); Controls.Add(shown); Controls.Add(use); Controls.Add(no);
        AcceptButton = use; CancelButton = no;
        Chosen = current;
        KeyDown += Caught;
    }

    public static string PrettyOf(string s)
    {
        var bits = new List<string>();
        string key = null;
        foreach (string raw in (s ?? "").ToLowerInvariant().Split('+'))
        {
            string p = raw.Trim();
            if (p.Length == 0) continue;
            if (p == "ctrl") bits.Add("Ctrl");
            else if (p == "alt") bits.Add("Alt");
            else if (p == "shift") bits.Add("Shift");
            else if (p == "win") bits.Add("Win");
            else key = p.Length == 1 ? p.ToUpperInvariant() : char.ToUpperInvariant(p[0]) + p.Substring(1);
        }
        if (key != null) bits.Add(key);
        return string.Join("+", bits.ToArray());
    }

    void Caught(object sender, KeyEventArgs e)
    {
        Keys k = e.KeyCode;
        if (k == Keys.ControlKey || k == Keys.Menu || k == Keys.ShiftKey ||
            k == Keys.LWin || k == Keys.RWin || k == Keys.None) return;
        e.Handled = true; e.SuppressKeyPress = true;

        var bits = new List<string>();
        if (e.Control) bits.Add("ctrl");
        if (e.Alt) bits.Add("alt");
        if (e.Shift) bits.Add("shift");
        if (bits.Count == 0) { shown.Text = "Add Ctrl, Alt or Shift"; use.Enabled = false; return; }
        bits.Add(k.ToString().ToLowerInvariant());
        Chosen = string.Join("+", bits.ToArray());
        shown.Text = PrettyOf(Chosen);
        use.Enabled = true;
    }
}
