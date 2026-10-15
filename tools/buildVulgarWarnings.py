#!/usr/bin/env python3
"""Rebuild the reviewed warning snapshot from the local subtitle audit corpus.

First run: --inventory /path/to/inventory.json (show, id, title, english, arabic).
Subsequent runs use the source inventory in audit/vulgar-warning-evidence.json.
Requires the English audit cache and original Torchwood source subtitles locally.
This offline tool never edits subtitles or media configuration.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENGLISH = re.compile(
    r'(?<![\w])(?:what the hell|how the hell|who the hell|where the hell|why the hell|'
    r'go to hell|bloody hell|screw you|kiss my ass|pain in the arse|up yours|'
    r'sex(?:ual(?:ly|ity)?|y|ier|iest)?|shag(?:s|ged|ging)?|blow[- ]?jobs?|hand[- ]?jobs?|'
    r'orgasm(?:s|ic)?|erection(?:s)?|penis(?:es)?|vagina(?:s|l)?|testicles?|testicular|'
    r'boobs?|tits|nipples?|breasts?|virgin(?:s|ity)?|masturbat(?:e|es|ed|ing|ion)|'
    r'wank(?:s|er|ers|ing|ed)?|porn(?:ography|ographic)?|prostitut(?:e|es|ion)|'
    r'sluts?|whores?|brothels?|fuck(?:s|ed|er|ers|ing|head|wit|wits)?|'
    r'motherfuck(?:er|ers|ing)?|shit(?:s|ty|ting|ted|head)?|bullshit|bitch(?:es|y|ing)?|'
    r'bastards?|arse(?:s|hole|holes)?|assholes?|bollocks|bugger(?:s|ed|ing)?|twats?|'
    r'pricks?|cunts?|damn(?:ed|ing)?|dammit|goddamn(?:ed|it)?|'
    r'bloody|crap|sod(?:s|ding)?|ass(?:es)?|dick(?:s|head)?|cock(?:s)?|balls|'
    r'screw(?:ed|ing)?|piss(?:ed|ing)?|boner|horny|semen|sperm|scrotum|clitoris|'
    r'condom(?:s)?|intercourse|f\*{2,}k(?:ing)?|sh\*t|b\*tch)(?![\w])', re.I)
ARABIC = re.compile(
    r'(?<![\w])(?:ت[\u064b-\u065f]*ب[\u064b-\u065f]*ا|تب[\u064b-\u065f]*اً?|'
    r'سحق[\u064b-\u065f]*ا|اللعنة|وغد(?:ة)?|الأوغاد|اوغاد|سافل(?:ة)?|'
    r'ك?عاهر(?:ة|ات)?|العاهرة|فاجرة|للفاجرات|مومس|مضاجع(?:ة|ته|تها|تي)|(?:ال)?جنسي(?:ة|ا|اً)?|'
    r'ب?الجنس|'
    r'ممارسة الجنس|مارس(?:ت|تم|وا)? الجنس|علاقة جنسية|قضيب|'
    r'خصيت(?:ه|اه|ان|ين)|استمناء)(?![\w])')

# Reviewed cue-specific exclusions: neutral anatomy, gender/species, religion,
# literal curses, surnames, equipment, and non-vulgar uses of ambiguous words.
EXCLUSIONS = {
    ('doctorWho', 'S01E01', 'breast'): {436},
    ('doctorWho', 'S02E09', 'virgin'): {164},
    ('doctorWho', 'S02E13', 'sex'): {49},
    ('doctorWho', 'S04E02', 'virgin'): {84},
    ('doctorWho', 'S04E02', 'virgins'): {85},
    ('doctorWho', 'S05E18', 'virgin'): {815},
    ('doctorWho', 'S05E18', 'ass'): {571},
    ('doctorWho', 'S07E30', 'dick'): {468},
    ('doctorWho', 'S08E04', 'breast'): {418},
    ('doctorWho', 'S10E07', 'dick'): {475},
    ('doctorWho', 'S10E11', 'virgin'): {43},
    ('doctorWho', 'S10E14', 'virgin'): {777},
    ('doctorWho', 'S10E14', 'sex'): {450},
    ('doctorWho', 'S13E09', 'dick'): {655},
    ('doctorWho', 'S16E01', 'sperm'): {657},
    ('doctorWho', 'S16E07', 'breast'): {729},
    ('torchwood', 'S01E06', 'sex'): {29},
    ('torchwood', 'S01E07', 'virgin'): {10},
    ('torchwood', 'S03E04', 'virgins'): {34},
    ('torchwood', 'S04E09', 'damned'): {391},
}
LITERAL_CURSES = {'S01E11', 'S01E15', 'S03E05', 'S06E07'}


def normalize(value):
    return re.sub('[\u064b-\u065f\u0670]', '', unicodedata.normalize('NFC', value)).casefold()


def cues(source):
    text = (ROOT / source).read_text(encoding='utf-8-sig').replace('\r', '')
    pattern = r'(?:^|\n)(\d+)\n(\d\d:\d\d:\d\d[,.]\d{3})\s*-->[^\n]+\n([\s\S]*?)(?=\n\d+\n\d\d:\d\d:\d\d[,.]\d{3}\s*-->|\Z)'
    return [dict(cue=int(m[1]), time=m[2], text=re.sub(r'<[^>]+>', '', m[3]).strip())
            for m in re.finditer(pattern, text)]


def spoken(text):
    text = re.sub(r'\([^)]*\)|\[[^]]*\]', ' ', text)
    text = re.sub(r'(?m)^\s*-?\s*[A-Z][A-Z ]{1,25}:', ' ', text)
    return re.sub(r'\s+', ' ', text).strip()


def qualifies(entry, cue, match, language, line):
    word = normalize(match[0])
    show, episode = entry['show'], entry['id']
    if cue['cue'] in EXCLUSIONS.get((show, episode, word), set()):
        return False
    if language == 'arabic':
        if word in {'الجنس', 'بالجنس'}:
            return (show, episode, cue['cue']) in {
                ('doctorWho', 'S10E12', 200), ('torchwood', 'S02E01', 378),
                ('torchwood', 'S02E01', 606), ('torchwood', 'S02E01', 620),
                ('torchwood', 'S04E02', 234)}
        if word == 'جنسي' and not (show == 'doctorWho' and episode == 'S06E09'):
            return False  # All other reviewed occurrences mean "my species".
        if word == 'الجنسي' and show == 'doctorWho':
            return False  # Food sexism, not sexual dialogue.
        if word == 'قضيب' and not (show == 'torchwood' and episode == 'S04E03'):
            return False  # Gravity/ion/refraction rods.
        if word == 'اللعنة' and show == 'doctorWho' and episode in LITERAL_CURSES:
            return False
        if word == 'وغد':
            tail = normalize(line[match.start():])
            if tail.startswith('وغدا') and not re.search(r'(?:تكن|كان|تكون)\s+$', line[:match.start()]):
                return False  # "and tomorrow", including diacritic variants.
        return True
    if word.startswith('prick'):
        return bool(re.search(r'(?:you|a|little|such a|what a|small) prick', line, re.I))
    if word in {'cock', 'cocks'}:
        return show == 'torchwood' and episode == 'S02E09' and cue['cue'] == 37
    if word == 'balls':
        return (show, episode, cue['cue']) in {('doctorWho', 'S14E04', 379), ('torchwood', 'S01E13', 410)}
    if word.startswith('screw'):
        return bool(re.search(r'\bscrew(?:ed|ing)? (?:you|all night|any passing alien|all those other women)', line, re.I))
    if word.startswith('piss'):
        # Keep vulgar idioms; neutral bodily functions/intoxication are outside scope.
        return bool(re.search(r'\bpiss(?:ed|ing)?(?:-| )(?:off|about|around|me around|system)|piece of piss|piss poor', line, re.I))
    if word == 'bloody' and re.search(r'bloody-minded', line, re.I):
        return False
    return True


def build(inventory):
    data = {'version': 1, 'doctorWho': {}, 'torchwood': {}, 'movies': {}}
    reviewed = []
    for original in inventory:
        entry = {k: original[k] for k in ['show', 'id', 'title', 'edit'] if k in original}
        entry.update(sources={}, wordEvidence=[], actionEvidence=[])
        seen = set()
        for language in ['english', 'arabic']:
            source = original.get(language)
            if not source:
                continue
            if entry['show'] == 'torchwood' and language == 'arabic':
                folder = 'ar-clean' if entry.get('edit') == 'clean-cut' else 'ar-improved'
                source = f'torchwood-subtitles/{folder}/{Path(source).name}'
            entry['sources'][language] = {'path': source, 'sha256': hashlib.sha256((ROOT / source).read_bytes()).hexdigest()}
            for cue in cues(source):
                line = spoken(cue['text'])
                for match in (ENGLISH if language == 'english' else ARABIC).finditer(line):
                    key = normalize(match[0])
                    if key in seen or not qualifies(entry, cue, match, language, line):
                        continue
                    seen.add(key)
                    entry['wordEvidence'].append({'word': match[0].casefold() if language == 'english' else match[0],
                                                  'language': language, 'cue': cue['cue'], 'time': cue['time']})
                # Only this reviewed caption explicitly identifies sensual kissing.
                # Generic kisses, moans, requests and accounts of past sex cannot
                # establish a sexual action in the current playable scene.
                if (entry['show'], entry['id'], language, cue['cue']) == ('doctorWho', 'S05E14', 'english', 654):
                    assert cue['text'] == '(KISSING AND SIGHS OF PLEASURE)'
                    entry['actionEvidence'].append({'action': 'تقبيل حميم مع أصوات متعة', 'language': language,
                                                    'cue': cue['cue'], 'time': cue['time'], 'basis': 'explicit-subtitle-direction'})
        entry['actionReview'] = 'confirmed-direction' if entry['actionEvidence'] else 'no-confirmed-sexual-action-in-available-evidence'
        reviewed.append(entry)
        words = [e['word'] for e in entry['wordEvidence']]
        actions = [e['action'] for e in entry['actionEvidence']]
        if words or actions:
            data[entry['show']][entry['id']] = {'words': words, 'actions': actions}
    evidence = {'version': 1, 'scope': 'Vulgar/sexual words and evidence-backed sexual actions only',
                'actionPolicy': 'Dialogue-only sexual references, ordinary/family kisses, pain/monster moans and removed scenes do not establish a current sexual action. Missing confirmation is not an assertion that a video contains no sexual actions.',
                'entries': reviewed}
    for filename, value in [('vulgarWarnings.json', data), ('audit/vulgar-warning-evidence.json', evidence)]:
        (ROOT / filename).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(dict(audited=len(reviewed), changed=sum(len(data[s]) for s in ['doctorWho', 'torchwood', 'movies']),
               withActions=sum(bool(e['actionEvidence']) for e in reviewed),
               byShow=dict(Counter(e['show'] for e in reviewed if e['wordEvidence'] or e['actionEvidence']))))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory', type=Path)
    args = parser.parse_args()
    if args.inventory:
        inventory = json.loads(args.inventory.read_text())
    else:
        entries = json.loads((ROOT / 'audit/vulgar-warning-evidence.json').read_text())['entries']
        inventory = [{**e, **{lang: e['sources'].get(lang, {}).get('path') for lang in ['english', 'arabic']}} for e in entries]
    build(inventory)
