/* MUSCLE KEY 0.1.0, 2026-11-18. One key that joins every muscle list Tom has.

   Decision D3 (2026-11-18): one muscle-name key. Five lists named muscles
   their own way: the master list (shared/muscles.js, 27 muscles under 7
   headings), the home screen's body map (its own 13 parts), FORGE's older
   `ftag.mus` names (read through Muscles.OLD), the Automagic Calculator's
   10 muscle groups (fitness-plan.html, LIB and MUSC_ORDER) and AnaTOMy's
   muscles (data/muscles.json, 27 ids, and the body model's 66 muscles in
   data/newgen-muscles.json). This file says, for each of the 27, where it
   lands in every one of them. Names shown on screen do not change: `name`
   is the master list's name, exactly.

   Each row:
     name       the master list's name (Muscles.LIST)
     fma        the Foundational Model of Anatomy ID of that exact muscle,
                checked against Wikidata (property P1402) on 2026-11-18, or
                null when the entry is a group or a part with no FMA entry
                of its own, or when it could not be checked (`unverified`)
     part       FMA IDs of the named muscles it is part of, same check
     region     its heading in the master list
     home       the home screen body map's part it lights, or null (Neck and
                Cardio have no shape)
     automagic  the Automagic Calculator's group, or null
     anatomy    AnaTOMy data/muscles.json ids that roll up into it
     mesh       AnaTOMy data/newgen-muscles.json ids that roll up into it
   AnaTOMy and Automagic are read here, never edited from Motherbase. */
(function (g) {
  'use strict';
  if (g.MuscleKey) return;

  /* the home screen's body map: its parts, and the big ones, whose
     recovery window for a full day of work is 72 hours (48 for the rest) */
  var HOME_PARTS = ['chest', 'delts', 'traps', 'lats', 'lowback', 'biceps', 'triceps', 'forearms', 'core',
    'glutes', 'quads', 'hams', 'calves'];
  var HOME_BIG = { chest: 1, lats: 1, quads: 1, hams: 1, glutes: 1, lowback: 1 };
  var AUTOMAGIC = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

  /* [name, fma, part, region, home, automagic, anatomy, mesh, note] */
  var R = [
    ['Upper Chest', null, [9627], 'Chest', 'chest', 'Chest', ['pecClav'], ['pecClav'], 'clavicular head of pectoralis major'],
    ['Lower Chest', null, [9627], 'Chest', 'chest', 'Chest', ['pecStern'], ['pecStern', 'pecMinor'], 'sternal head of pectoralis major'],
    ['Lats', 13357, [], 'Back', 'lats', 'Back', ['lats'], ['lats', 'teresMajor'], 'latissimus dorsi'],
    ['Upper Back', null, [9626, 13379, 13380], 'Back', 'traps', 'Back', ['midTrap'], ['midTrap', 'rhomboid', 'rhomboidMin'], 'middle trapezius and rhomboids'],
    ['Upper Traps', null, [9626], 'Back', 'traps', 'Back', ['upperTrap'], ['upperTrap'], 'upper trapezius'],
    ['Lower Traps', null, [9626], 'Back', 'traps', 'Back', [], ['lowerTrap'], 'lower trapezius'],
    ['Lower Back', 71302, [], 'Back', 'lowback', 'Back', ['erectorSpinae'], ['erector'], 'erector spinae'],
    ['Front Delts', null, [32521], 'Shoulders', 'delts', 'Shoulders', ['antDelt'], ['antDelt'], 'anterior deltoid'],
    ['Side Delts', null, [32521], 'Shoulders', 'delts', 'Shoulders', ['latDelt'], ['latDelt'], 'lateral deltoid'],
    ['Rear Delts', null, [32521], 'Shoulders', 'delts', 'Shoulders', ['postDelt'], ['postDelt'], 'posterior deltoid'],
    ['Rotator Cuff', 37018, [9629, 32546, 32550, 13413], 'Shoulders', 'delts', 'Shoulders', ['rotatorCuff'],
      ['infraspinatus', 'supraspinatus', 'subscapularis', 'teresMinor'], 'rotator cuff'],
    /* unverified: Wikidata's biceps brachii carries no FMA ID */
    ['Biceps', null, [], 'Arms', 'biceps', 'Biceps', ['bicepsBrachii'], ['biceps', 'brachialis'], 'biceps brachii; unverified'],
    ['Triceps', 37688, [], 'Arms', 'triceps', 'Triceps', ['tricepsLong', 'tricepsShort'], ['tricepsLong', 'tricepsLat', 'tricepsMed', 'anconeus'], 'triceps brachii'],
    ['Forearm Flex.', null, [38459], 'Arms', 'forearms', null, ['gripFlexors'], ['flexors'], 'forearm flexors'],
    /* the brachioradialis is filed with the extensors, as the master list
       counts a hammer or reverse curl toward Forearm Ext. */
    ['Forearm Ext.', null, [38494, 38485], 'Arms', 'forearms', null, ['wristExtensors', 'brachioradialis'], ['extensors', 'brachioradialis'], 'forearm extensors and brachioradialis'],
    ['Abs', 9628, [], 'Trunk', 'core', 'Core', ['rectusAbdominis'], ['rectusAb', 'abLow', 'ab1', 'ab2', 'ab3'], 'rectus abdominis'],
    ['Obliques', null, [13335, 13891], 'Trunk', 'core', 'Core', ['obliques'], ['obliqueExt'], 'external and internal obliques'],
    ['Serratus', 13397, [], 'Trunk', 'core', 'Core', ['serratus'], ['serratus5', 'serratus6', 'serratus7', 'serratus8'], 'serratus anterior'],
    ['Quads', 22428, [], 'Lower body', 'quads', 'Quads', ['quads', 'rectusFemoris'], ['rectusFemoris', 'vastusLat', 'vastusMed', 'vastusInt'], 'quadriceps femoris'],
    ['Hamstrings', null, [], 'Lower body', 'hams', 'Hamstrings', ['hamstrings'], ['bicepsFem', 'semiT', 'semimem'], 'hamstrings, a group'],
    ['Glutes', null, [22314, 22315], 'Lower body', 'glutes', 'Glutes', ['glutMax', 'glutMed'], ['glutMax', 'glutMed', 'glutMin', 'tfl', 'piriformis', 'quadFem'], 'gluteus maximus, medius and the deep hip'],
    /* filed under Glutes in TRAIN and lit as glutes on the home screen */
    ['Adductors', null, [22443, 22441], 'Lower body', 'glutes', 'Glutes', ['adductorMagnus'], ['adductors', 'gracilis', 'pectineus'], 'hip adductors'],
    ['Calves', 51062, [22541, 22542], 'Lower body', 'calves', 'Calves', ['gastroc', 'soleus'], ['gastroMed', 'gastroLat', 'soleus', 'plantaris', 'popliteus', 'tibPost'], 'triceps surae'],
    ['Tibialis', 22532, [], 'Lower body', 'calves', 'Calves', [], ['tibAnt'], 'tibialis anterior'],
    ['Neck', null, [13407], 'Other', null, null, [], ['scm', 'scalenes'], 'neck muscles'],
    ['Cardio', null, [], 'Other', null, null, [], [], 'not a muscle']
  ];
  /* AnaTOMy body-model muscles none of the 27 holds */
  var MESH_UNMAPPED = ['sartorius', 'iliopsoas', 'coracobrach', 'fibularis'];

  var LIST = R.map(function (r) {
    return { name: r[0], fma: r[1], part: r[2], region: r[3], home: r[4], automagic: r[5], anatomy: r[6], mesh: r[7],
      note: r[8], unverified: /unverified/.test(r[8]) };
  });
  var BY = {};
  LIST.forEach(function (m) { BY[m.name] = m; });

  /* a muscle's row, old names read as the new through the master list's
     Muscles.OLD (FORGE's ftag.mus may still say "Forearm Flexors") */
  function get(name) { var o = (g.Muscles && g.Muscles.OLD) || {}; return BY[name] || BY[o[name]] || null; }
  /* muscle name -> home body part, every muscle that lights one */
  function homeMap() {
    var o = {};
    LIST.forEach(function (m) { if (m.home) o[m.name] = m.home; });
    return o;
  }
  /* AnaTOMy id (either file) -> muscle name */
  function fromAnatomy(id) {
    for (var i = 0; i < LIST.length; i++) if (LIST[i].anatomy.indexOf(id) >= 0 || LIST[i].mesh.indexOf(id) >= 0) return LIST[i].name;
    return null;
  }

  g.MuscleKey = { version: '0.1.0', LIST: LIST, get: get, homeMap: homeMap, fromAnatomy: fromAnatomy,
    HOME_PARTS: HOME_PARTS, HOME_BIG: HOME_BIG, AUTOMAGIC: AUTOMAGIC, MESH_UNMAPPED: MESH_UNMAPPED };
})(typeof window !== 'undefined' ? window : this);
