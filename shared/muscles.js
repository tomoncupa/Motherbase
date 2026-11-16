/* MUSCLES 0.1.0, 2026-11-16. The master list: which muscles a movement trains, and how much.

   Tom, 2026-11-16: split Back into its parts, count every lift toward each
   muscle it trains, "intelligently pre populate it", and catch the
   nicknames so a movement someone types already lands somewhere.

   A share is how much one hard set of the movement counts as a set for that
   muscle, 0 to 1. Shares do not add up to 1: a chin up is a full set for the
   biceps and nearly one for the lats. 1 and 0.5 are the steps a 2025
   meta-regression (Pelland et al., Sports Medicine) found fit muscle growth
   best for main and helping muscles; every other step is judgement from
   muscle-activity studies, not measured growth. Tom set the chin up himself:
   Biceps 1, Lats 0.8.

   One rule for the whole suite (root brief, Known traps: a fact shown in two
   places is read by one rule). TRAIN, FORGE and COACH ask `Muscles.of(name)`.
   A person's own correction for one lift lives on that lift's row and wins
   over this list; this list never knows one person's movements.

   Rules are tried in order and the first match wins, so a specific name sits
   above the general one it contains: "Rear Delt Row" above rows, "Straight
   Arm Pushdown" above pushdowns, "Deadlift Row" above both. Names are matched
   after `norm`, which lowercases, drops punctuation and spells out the gym
   shorthand (DB, RDL, SLDL, OHP...). Pure: no store, no page. */
(function (g) {
  'use strict';
  if (g.Muscles) return;

  /* The groups, in the order a list shows them, each under its region. */
  var GROUPS = [
    ['Chest', ['Upper Chest', 'Lower Chest']],
    ['Back', ['Lats', 'Upper Back', 'Upper Traps', 'Lower Traps', 'Lower Back']],
    ['Shoulders', ['Front Delts', 'Side Delts', 'Rear Delts', 'Rotator Cuff']],
    ['Arms', ['Biceps', 'Triceps', 'Forearm Flexors', 'Forearm Extensors']],
    ['Core', ['Abs', 'Obliques', 'Serratus']],
    ['Legs', ['Quads', 'Hamstrings', 'Glutes', 'Adductors', 'Calves']],
    ['Other', ['Cardio']]
  ];
  var LIST = [], REGION = {};
  GROUPS.forEach(function (r) { r[1].forEach(function (m) { LIST.push(m); REGION[m] = r[0]; }); });

  /* Gym shorthand, spelled out. Whole words only. */
  var SHORT = [
    [/\bdbs?\b/g, 'dumbbell'], [/\bbb\b/g, 'barbell'], [/\bkbs?\b/g, 'kettlebell'],
    [/\bez\b/g, 'ez'], [/\bsm\b/g, 'smith'], [/\bhs\b/g, 'hammer strength'],
    [/\bohp\b/g, 'overhead press'], [/\bsl ?rdl\b/g, 'single leg romanian deadlift'],
    [/\brdls?\b/g, 'romanian deadlift'], [/\bsldls?\b/g, 'stiff leg deadlift'],
    [/\bdls?\b/g, 'deadlift'], [/\bcgbp\b/g, 'close grip bench press'],
    [/\bbss\b/g, 'bulgarian split squat'], [/\bghrs?\b/g, 'glute ham raise'],
    [/\bhlrs?\b/g, 'hanging leg raise'], [/\bssb\b/g, 'safety bar squat'],
    [/\bsa\b/g, 'single arm'], [/\bsl\b/g, 'single leg'], [/\bcg\b/g, 'close grip'],
    [/\bwg\b/g, 'wide grip'], [/\bng\b/g, 'neutral grip'], [/\bbw\b/g, 'bodyweight'],
    [/\btris?\b/g, 'tricep'], [/\bbis?\b/g, 'bicep'], [/\bexts?\b/g, 'extension'],
    [/\brev\b/g, 'reverse'], [/\bincl?\b/g, 'incline'], [/\binc\b/g, 'incline'], [/\bdecl\b/g, 'decline'],
    [/\basstd\b/g, 'assisted'], [/\bt bar\b/g, 'tbar'], [/\bpull ?downs?\b/g, 'pulldown'],
    [/\bpull ?ups?\b/g, 'pullup'], [/\bchin ?ups?\b/g, 'chinup'], [/\bpush ?ups?\b/g, 'pushup'],
    [/\bsit ?ups?\b/g, 'situp'], [/\bpush ?downs?\b/g, 'pushdown'], [/\bflyes?\b/g, 'fly'],
    [/\bflys\b/g, 'fly'], [/\bhyper ?extensions?\b/g, 'hyperextension'],
    [/\baussie\b/g, 'australian'], [/\bscap\b/g, 'scapular'], [/\blats\b/g, 'lat'],
    [/\braises\b/g, 'raise'], [/\bcurls\b/g, 'curl'], [/\browss?\b/g, 'row'],
    [/\bsquats\b/g, 'squat'], [/\blunges\b/g, 'lunge'], [/\bdips\b/g, 'dip'],
    [/\bshrugs\b/g, 'shrug'], [/\bpresses\b/g, 'press'], [/\bextensions\b/g, 'extension']
  ];
  function norm(name) {
    var s = ' ' + String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
    SHORT.forEach(function (p) { s = s.replace(p[0], p[1]); });
    return s.replace(/\s+/g, ' ').trim();
  }

  /* [name, pattern, match, shares]. `pattern` is FORGE's movement pattern
     word, for reading only. Shares name groups from LIST. */
  var R = [
    /* ── combinations and traps for the rules below ── */
    ['Rowing machine', 'cardio', /rowing machine|\berg\b|concept 2|row erg/, { Cardio: 1 }],
    ['Deadlift row', 'pull-h', /deadlift row/, { 'Upper Back': 1, Lats: 0.75, 'Lower Back': 0.5, Biceps: 0.5, Hamstrings: 0.25 }],
    ['Upright row to press', 'press-v', /upright row to press/, { 'Side Delts': 1, 'Front Delts': 0.75, 'Upper Traps': 0.5, Triceps: 0.25 }],
    ['Upright row', 'pull-v', /upright row|high pull/, { 'Side Delts': 1, 'Upper Traps': 0.75, Biceps: 0.25 }],
    ['Overhead tricep extension', 'iso', /overhead.*(tricep|extension)|tricep.*overhead|french press|skull/, { Triceps: 1 }],
    ['Pull apart', 'pull-h', /pull apart/, { 'Rear Delts': 1, 'Upper Back': 0.75 }],
    ['Straight-arm pulldown', 'pull-v', /straight arm|lat prayer/, { Lats: 1, Triceps: 0.25 }],
    ['Pullover machine', 'pull-v', /pullover machine|machine pullover|nautilus pullover/, { Lats: 1, Triceps: 0.25 }],
    ['Dumbbell pullover', 'pull-v', /pullover/, { Lats: 0.75, 'Lower Chest': 0.75, Triceps: 0.25 }],
    ['Rear delt row', 'pull-h', /rear delt.*row|row.*rear delt/, { 'Rear Delts': 1, 'Upper Back': 0.75 }],
    ['Kelso shrug', 'pull-h', /kelso|scapular retraction|scapular row/, { 'Upper Back': 1 }],
    ['Scapular pull up', 'pull-v', /scapular (pullup|pull|depression)/, { 'Lower Traps': 1, Lats: 0.5 }],
    ['Stair climber', 'cardio', /stair|stepmill|step mill|climber/, { Cardio: 1 }],
    ['Climbing', 'pull-v', /^climb|rope climb|climbing|boulder/, { Lats: 1, 'Forearm Flexors': 1, Biceps: 0.75, 'Upper Back': 0.5 }],

    /* ── hinges, before rows: "Bb Row Machine SLDL" is a stiff-leg deadlift ── */
    ['Rack pull', 'hinge', /rack pull|block pull/, { 'Lower Back': 1, Glutes: 0.75, 'Upper Traps': 0.5, Hamstrings: 0.25, 'Forearm Flexors': 0.25 }],
    ['Single-leg RDL', 'hinge', /single leg (romanian|stiff)|b stance|kickstand/, { Hamstrings: 1, Glutes: 0.75, 'Lower Back': 0.25 }],
    ['Romanian deadlift', 'hinge', /romanian/, { Hamstrings: 1, Glutes: 0.75, 'Lower Back': 0.5 }],
    ['Stiff-leg deadlift', 'hinge', /stiff|straight leg deadlift/, { Hamstrings: 1, Glutes: 0.75, 'Lower Back': 0.75 }],
    ['Sumo deadlift', 'hinge', /sumo deadlift/, { Glutes: 1, Quads: 0.75, Adductors: 0.75, 'Lower Back': 0.75, Hamstrings: 0.5 }],
    ['Trap bar deadlift', 'hinge', /(trap|hex) bar deadlift|^(?!.*row).*(trap|hex) bar/, { Glutes: 1, Quads: 0.75, 'Lower Back': 0.75, Hamstrings: 0.5, 'Upper Traps': 0.25 }],
    ['Deadlift', 'hinge', /deadlift/, { 'Lower Back': 1, Glutes: 0.75, Hamstrings: 0.5, Quads: 0.5, 'Upper Traps': 0.25, 'Forearm Flexors': 0.25 }],

    /* ── vertical pulls ── */
    ['Neutral grip chin up', 'pull-v', /(neutral|parallel|hammer) grip (chinup|pullup)|(neutral|parallel) (chinup|pullup)/, { Lats: 1, Biceps: 0.75, 'Forearm Extensors': 0.25, 'Upper Back': 0.5 }],
    ['Chin up', 'pull-v', /chinup|supinated pullup|underhand pullup/, { Biceps: 1, Lats: 0.8, 'Upper Back': 0.5, 'Lower Traps': 0.25, 'Forearm Flexors': 0.25 }],
    ['Pull up', 'pull-v', /pullup|muscle up/, { Lats: 1, 'Upper Back': 0.5, Biceps: 0.5, 'Lower Traps': 0.5, 'Rear Delts': 0.25 }],
    ['Underhand pulldown', 'pull-v', /(underhand|reverse grip|supinated).*pulldown/, { Lats: 1, Biceps: 0.75, 'Upper Back': 0.5 }],
    ['Lat pulldown', 'pull-v', /pulldown/, { Lats: 1, 'Upper Back': 0.5, Biceps: 0.5, 'Rear Delts': 0.25 }],

    /* ── horizontal pulls ── */
    ['Inverted row', 'pull-h', /australian|inverted row|bodyweight row|ring row|trx row/, { 'Upper Back': 1, Lats: 0.75, Biceps: 0.5, 'Rear Delts': 0.5 }],
    ['Underhand row', 'pull-h', /(underhand|reverse grip|supinated|yates).* row|(underhand|reverse grip) row/, { Lats: 1, 'Upper Back': 0.75, Biceps: 0.75, 'Lower Back': 0.25 }],
    ['High row', 'pull-h', /high (cable )?row|wide (grip )?(cable |seated |bent over )?row|face height row/, { 'Upper Back': 1, 'Rear Delts': 0.75, Biceps: 0.5, Lats: 0.25 }],
    ['Low row', 'pull-h', /low (cable )?row|low row machine/, { Lats: 1, 'Upper Back': 0.75, Biceps: 0.5, 'Rear Delts': 0.25 }],
    ['One-arm row', 'pull-h', /(one|single) arm.* row|dumbbell row|kroc|meadows/, { Lats: 1, 'Upper Back': 0.75, Biceps: 0.5, 'Rear Delts': 0.25 }],
    ['Bent-over row', 'pull-h', /barbell row|bent (over )?row|pendlay|trap bar row|helms|seal row(?!.*chest)/, { 'Upper Back': 1, Lats: 0.75, 'Rear Delts': 0.5, Biceps: 0.5, 'Lower Back': 0.5 }],
    ['Supported row', 'pull-h', /row|tbar/, { 'Upper Back': 1, Lats: 0.75, 'Rear Delts': 0.5, Biceps: 0.5 }],

    /* ── rear delts, traps, cuff ── */
    ['Face pull', 'pull-h', /face pull/, { 'Rear Delts': 1, 'Upper Back': 0.75, 'Rotator Cuff': 0.5, 'Lower Traps': 0.25 }],
    ['Scaption', 'iso', /scaption/, { 'Side Delts': 1, 'Front Delts': 0.5, 'Lower Traps': 0.25 }],
    ['Rear delt fly', 'iso', /rear delt|rear lateral|reverse (pec deck|fly)|bent over (lateral|raise)/, { 'Rear Delts': 1, 'Upper Back': 0.5 }],
    ['External rotation', 'iso', /external rotat|internal rotat|cuban|rotator/, { 'Rotator Cuff': 1, 'Rear Delts': 0.25 }],
    ['Y raise', 'iso', /\by raise|prone y|lower trap|\bi y t\b|ytw/, { 'Lower Traps': 1, 'Rear Delts': 0.5 }],
    ['Shrug', 'iso', /shrug/, { 'Upper Traps': 1, 'Forearm Flexors': 0.25 }],
    ['Carry', 'carry', /farmer|suitcase carry|carry|yoke/, { 'Forearm Flexors': 1, 'Upper Traps': 0.75, Obliques: 0.5, Abs: 0.25 }],

    /* ── other hinges ── */
    ['Good morning', 'hinge', /good ?morning/, { Hamstrings: 1, 'Lower Back': 0.75, Glutes: 0.5 }],
    ['Reverse hyper', 'hinge', /reverse hyper/, { Glutes: 1, Hamstrings: 0.75, 'Lower Back': 0.5 }],
    ['Back extension', 'hinge', /hyperextension|back extension|roman chair|45 degree|superman|jefferson/, { 'Lower Back': 1, Glutes: 0.75, Hamstrings: 0.5 }],
    ['Glute ham raise', 'hinge', /glute ham|nordic/, { Hamstrings: 1, Glutes: 0.25 }],
    ['Pull through', 'hinge', /pull through|kettlebell swing|\bswing/, { Glutes: 1, Hamstrings: 0.75, 'Lower Back': 0.5 }],
    ['Olympic lift', 'hinge', /clean|snatch|jerk/, { Glutes: 1, Quads: 0.75, 'Upper Traps': 0.75, Hamstrings: 0.5, 'Lower Back': 0.5 }],

    /* ── glutes and hips (hip thrust before curls: "Leg Curl Machine Hip Thrust") ── */
    ['Hip thrust', 'hinge', /hip thrust|glute bridge|barbell bridge|glute drive|frog pump/, { Glutes: 1, Hamstrings: 0.25, Quads: 0.25 }],
    ['Glute kickback', 'iso', /glute kickback|cable kickback|donkey kick|glute isolator|glute swoop/, { Glutes: 1, Hamstrings: 0.25 }],
    ['Hip abduction', 'iso', /abduct|clam|band walk|glute med/, { Glutes: 1 }],
    ['Hip adduction', 'iso', /adduct|copenhagen/, { Adductors: 1 }],

    /* ── knee-dominant legs (calves first: "Leg Press Calf Raise") ── */
    ['Calf raise', 'iso', /calf|calves/, { Calves: 1 }],
    ['Wall sit', 'squat', /wall sit/, { Quads: 1 }],
    ['Sissy squat', 'squat', /sissy/, { Quads: 1 }],
    ['Front squat', 'squat', /front squat|goblet|zercher|hack squat|pendulum|belt squat|v squat|smith (machine )?squat/, { Quads: 1, Glutes: 0.5, Adductors: 0.25 }],
    ['Split squat', 'lunge', /split squat|bulgarian|lunge|step ?up/, { Quads: 1, Glutes: 0.75, Adductors: 0.5 }],
    ['Squat', 'squat', /squat/, { Quads: 1, Glutes: 0.75, Adductors: 0.5, 'Lower Back': 0.25 }],
    ['Leg press', 'squat', /leg press/, { Quads: 1, Glutes: 0.5, Adductors: 0.5 }],
    ['Leg extension', 'iso', /leg extension|quad extension/, { Quads: 1 }],
    ['Leg curl', 'iso', /leg curl|hamstring curl/, { Hamstrings: 1 }],
    ['Jump', 'plyo', /jump|bound|hop/, { Quads: 1, Glutes: 0.5, Calves: 0.5 }],

    /* ── presses (no curl ever lands here: "Vertical Bench Curl", "Decline Curl") ── */
    ['Close-grip bench', 'press-h', /close grip.*(bench|press)|tricep grip|jm press/, { Triceps: 1, 'Lower Chest': 0.5, 'Front Delts': 0.25 }],
    ['Incline fly', 'iso', /^(?!.*curl).*incline.*fly|low to high/, { 'Upper Chest': 1, 'Lower Chest': 0.5 }],
    ['Incline press', 'press-h', /^(?!.*curl).*incline/, { 'Upper Chest': 1, 'Front Delts': 0.5, Triceps: 0.5 }],
    ['Tricep dip', 'press-v', /bench dip|dip machine|seated dip|tricep.*dip|dip.*tricep/, { Triceps: 1, 'Lower Chest': 0.5, 'Front Delts': 0.25 }],
    ['Dip', 'press-v', /\bdip/, { 'Lower Chest': 1, Triceps: 0.75, 'Front Delts': 0.5 }],
    ['Decline fly', 'iso', /decline.*fly|high to low/, { 'Lower Chest': 1 }],
    ['Decline press', 'press-h', /decline.*(press|bench|pushup|chess|chest)/, { 'Lower Chest': 1, Triceps: 0.5, 'Front Delts': 0.25 }],
    ['Chest fly', 'iso', /fly|pec deck|crossover|svend|plate press/, { 'Lower Chest': 1, 'Upper Chest': 0.5 }],
    ['Landmine press', 'press-v', /landmine press/, { 'Front Delts': 1, 'Upper Chest': 0.5, Triceps: 0.5 }],
    ['Push press', 'press-v', /push press|jerk/, { 'Front Delts': 1, Triceps: 0.5, 'Side Delts': 0.5, Quads: 0.25 }],
    ['Overhead press', 'press-v', /overhead|military|shoulder press|arnold|behind the neck|log press|z press|^(seated |standing )?(dumbbell )?press$|dumbbell press (standing|seated|machine)|(seated|standing) dumbbell press|one arm standing dumbbell press|smith machine overhead/, { 'Front Delts': 1, 'Side Delts': 0.5, Triceps: 0.5, 'Upper Chest': 0.25 }],
    ['Push up plus', 'press-h', /pushup plus|scapular pushup|serratus|landmine punch/, { Serratus: 1 }],
    ['Bench press', 'press-h', /^(?!.*curl).*(bench|chest|floor press|pushup|press up|pec press)/, { 'Lower Chest': 1, 'Upper Chest': 0.5, Triceps: 0.5, 'Front Delts': 0.5 }],

    /* ── raises ── */
    ['Front raise', 'iso', /front raise|front dumbbell raise|plate raise/, { 'Front Delts': 1, 'Upper Chest': 0.25 }],
    ['Lateral raise', 'iso', /lateral|side raise|lu raise/, { 'Side Delts': 1, 'Upper Traps': 0.25 }],

    /* ── core (before grip: "Hanging Leg Raise" is not a hang) ── */
    ['Rollout', 'core', /rollout|ab wheel/, { Abs: 1, Lats: 0.25 }],
    ['Oblique work', 'core', /oblique|side bend|side plank|twist|wood ?chop|pallof|rotation|windmill/, { Obliques: 1, Abs: 0.25 }],
    ['Ab work', 'core', /crunch|situp|leg raise|knee raise|v up|dragon flag|hollow|plank|\bl sit|toes to bar|\bab\b|abs\b|abdominal|vacuum/, { Abs: 1 }],

    /* ── arms ── */
    ['Reverse wrist curl', 'iso', /reverse wrist|wrist extension/, { 'Forearm Extensors': 1 }],
    ['Reverse curl', 'iso', /reverse (grip |cable )?curl|zottman/, { 'Forearm Extensors': 1, Biceps: 0.5 }],
    ['Wrist curl', 'iso', /wrist|forearm|gripper|hand grip|grip trainer|finger curl|dead hang|^hang$|bar hang/, { 'Forearm Flexors': 1 }],
    ['Hammer curl', 'iso', /hammer (curl|bicep)|bicep hammer|arm blaster hammer|cross body|neutral curl|rope curl/, { Biceps: 1, 'Forearm Extensors': 0.5 }],
    ['Bicep curl', 'iso', /curl|\bbicep/, { Biceps: 1, 'Forearm Flexors': 0.25 }],
    ['Tricep extension', 'iso', /tricep|pushdown|pressdown|kickback|tate|extension/, { Triceps: 1 }],

    /* ── cardio ── */
    ['Cardio', 'cardio', /run|bike|cycl|treadmill|elliptical|swim|jump rope|skip|walk|hike|sprint|erg\b|rowing machine|assault|airdyne/, { Cardio: 1 }]
  ];
  var RULES = R.map(function (r) { return { name: r[0], pat: r[1], re: r[2], share: r[3] }; });

  /* What a movement trains: the first rule its name matches, or null. The
     main muscle is its biggest share; a tie goes to the one written first. */
  function of(name) {
    var s = norm(name);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(s)) {
        var sh = RULES[i].share, main = null;
        Object.keys(sh).forEach(function (m) { if (main == null || sh[m] > sh[main]) main = m; });
        return { rule: RULES[i].name, pat: RULES[i].pat, share: sh, main: main };
      }
    }
    return null;
  }

  g.Muscles = { version: '0.1.0', LIST: LIST, REGION: REGION, GROUPS: GROUPS, RULES: RULES, norm: norm, of: of };
})(typeof window !== 'undefined' ? window : this);
