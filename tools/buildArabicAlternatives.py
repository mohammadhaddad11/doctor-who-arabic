#!/usr/bin/env python3
import io
import json
import os
import re
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AR_DIR = ROOT / 'ar'
AR_ALT_DIR = ROOT / 'ar-alt'
EN_DIR = ROOT / '.subtitle-audit-cache' / 'english'
OUTPUT_INDEX = ROOT / 'arabicSubtitleAlternatives.json'
OUTPUT_AUDIT = ROOT / 'audit' / 'arabic-alternatives-audit.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0',
    'Accept-Language': 'en-US,en;q=0.9',
}

PACKS = [
    {'name': 's01_bluray', 'url': 'https://subf2m.co/subtitles/doctor-who-first-season/arabic/839862/download', 'season': 1},
    {'name': 's01_oldpack', 'url': 'https://subf2m.co/subtitles/doctor-who-first-season/arabic/404653/download', 'season': 1},
    {'name': 's01_born_again_single', 'url': 'https://subf2m.co/subtitles/doctor-who-first-season/arabic/442499/download', 'season': 1},
    {'name': 's01_christmas_invasion_single', 'url': 'https://subf2m.co/subtitles/doctor-who--second-season/arabic/405868/download', 'season': 1},
    {'name': 's02_bluray', 'url': 'https://subf2m.co/subtitles/doctor-who--second-season/arabic/1205140/download', 'season': 2},
    {'name': 's03_bluray', 'url': 'https://subf2m.co/subtitles/doctor-who-third-season/arabic/1207716/download', 'season': 3},
    {'name': 's04_bluray', 'url': 'https://subf2m.co/subtitles/doctor-who-fourth-season/arabic/1209582/download', 'season': 4},
    {'name': 's05_bluray', 'url': 'https://subf2m.co/subtitles/doctor-who-fifth-season/arabic/856619/download', 'season': 5},
    {'name': 's08_full', 'url': 'https://subf2m.co/subtitles/doctor-who-eighth-season/arabic/1015853/download', 'season': 8},
    {'name': 's10_bluray', 'url': 'https://subf2m.co/subtitles/doctor-who-tenth-season/arabic/1611835/download', 'season': 10},
    {'name': 's11_amzn', 'url': 'https://subf2m.co/subtitles/doctor-who-eleventh-season/arabic/1896985/download', 'season': 11},
]


def load_episode_data():
    raw = subprocess.check_output(
        ['node', '-e', 'console.log(JSON.stringify(require("./episodeData")))'],
        cwd=ROOT,
        text=True,
    )
    return json.loads(raw)


def english_filename(episode):
    return episode['subtitleUrl'].split('/')[-1]


def primary_arabic_filename(episode):
    return english_filename(episode).replace('.srt', '.ar.srt')


def normalize_title(value):
    value = value.lower()
    value = re.sub(r'\(special\)|\(minisode\)|\(prequel\)|\(animated series\)', ' ', value)
    value = value.replace('&', ' and ')
    value = re.sub(r"[’']", '', value)
    value = re.sub(r'\bpart one\b', 'part 1', value)
    value = re.sub(r'\bpart two\b', 'part 2', value)
    value = re.sub(r'[^a-z0-9]+', ' ', value).strip()
    return re.sub(r'\s+', ' ', value)


def title_key_from_filename(name):
    base = Path(name).name
    base = re.sub(r'\.(srt|ass|ssa)$', '', base, flags=re.I)
    base = re.sub(r'\.ar$', '', base, flags=re.I)
    base = re.sub(r'doctor\s*who', ' ', base, flags=re.I)
    base = re.sub(r'\b(19|20)\d{2}\b', ' ', base)
    base = re.sub(r's\d{1,2}e\d{1,2}', ' ', base, flags=re.I)
    base = re.sub(r'\d{1,2}x\d{2}', ' ', base, flags=re.I)
    base = re.sub(r'\b(480p|720p|1080p|2160p|bluray|blu ray|web dl|webrip|hdtv|x264|x265|hevc|ctrlhd|shortbrehd|publichd|fov|mtb|tla|river|angelic|affinity|eci|ntb|mixed|amzn|psa|rarbg|m00tv|encodeking|netflix|nf|ar)\b', ' ', base, flags=re.I)
    base = base.replace('_', ' ').replace('.', ' ').replace('-', ' ')
    return normalize_title(base)


def broadcast_number_from_filename(name):
    match = re.search(r's(\d{1,2})e(\d{1,2})', name, flags=re.I)
    if match:
        return int(match.group(2))
    match = re.search(r'ep(\d{1,2})', name, flags=re.I)
    if match:
        return int(match.group(1))
    return None


def decode_text(data):
    for enc in ('utf-8-sig', 'utf-8', 'cp1256', 'windows-1256', 'latin1'):
        try:
            return data.decode(enc)
        except Exception:
            continue
    return data.decode('utf-8', 'ignore')


def parse_srt(text):
    text = text.replace('\r', '').replace('\ufeff', '').strip()
    cues = []
    for block in re.split(r'\n{2,}', text):
        lines = block.split('\n')
        idx = 1 if lines and lines[0].strip().isdigit() else 0
        if idx >= len(lines) or '-->' not in lines[idx]:
            continue
        start_raw, end_raw = [part.strip() for part in lines[idx].split('-->')]
        def to_ms(value):
            m = re.match(r'(\d+):(\d+):(\d+)[,.](\d+)', value)
            if not m:
                return None
            hh, mm, ss, ms = map(int, m.groups())
            return ((hh * 60 + mm) * 60 + ss) * 1000 + ms
        start = to_ms(start_raw)
        end = to_ms(end_raw)
        if start is None or end is None or end <= start:
            continue
        cues.append({'start': start, 'end': end, 'text': ' '.join(lines[idx + 1:]).strip()})
    return cues


def dialogue_starts(cues, lang):
    out = []
    for cue in cues:
        text = cue['text'].strip()
        if not text:
            continue
        if lang == 'en' and re.match(r'^[#(♪]', text):
            continue
        if lang == 'ar' and re.match(r'^[#♪]', text):
            continue
        out.append(cue['start'])
    return sorted(out)


def quantiles(values, count=64):
    if not values:
      return []
    result = []
    for i in range(count):
        frac = (i + 1) / (count + 1)
        idx = frac * (len(values) - 1)
        lo = int(idx)
        hi = min(len(values) - 1, lo + 1)
        weight = idx - lo
        result.append(values[lo] * (1 - weight) + values[hi] * weight)
    return result


def fit_line(xs, ys):
    n = min(len(xs), len(ys))
    if n == 0:
        return 1.0, 0.0
    xs = xs[:n]
    ys = ys[:n]
    mx = sum(xs) / n
    my = sum(ys) / n
    num = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    den = sum((x - mx) ** 2 for x in xs)
    slope = 1.0 if den == 0 else num / den
    intercept = my - slope * mx
    return slope, intercept


def median(values):
    if not values:
        return 0.0
    values = sorted(values)
    mid = len(values) // 2
    return values[mid] if len(values) % 2 else (values[mid - 1] + values[mid]) / 2


def verify_candidate(en_cues, ar_cues):
    en_starts = dialogue_starts(en_cues, 'en')
    ar_starts = dialogue_starts(ar_cues, 'ar')
    if len(en_starts) < 50 or len(ar_starts) < 50:
        return None

    eq = quantiles(en_starts)
    aq = quantiles(ar_starts)
    slope, intercept = fit_line(aq, eq)
    residuals = [abs(intercept + slope * x - y) for x, y in zip(aq, eq)]
    med = median(residuals)
    early = intercept + (slope - 1.0) * aq[max(0, int(len(aq) * 0.1))]
    middle = intercept + (slope - 1.0) * aq[max(0, int(len(aq) * 0.5))]
    late = intercept + (slope - 1.0) * aq[max(0, int(len(aq) * 0.9) - 1)]

    if med > 9000 or slope < 0.99 or slope > 1.01:
        return None

    transformed = []
    for cue in ar_cues:
        start = max(0, intercept + slope * cue['start'])
        end = max(start + 100, intercept + slope * cue['end'])
        transformed.append({**cue, 'start': start, 'end': end})

    return {
        'slope': slope,
        'interceptMs': intercept,
        'residualMedianMs': med,
        'earlyOffsetMs': early,
        'middleOffsetMs': middle,
        'lateOffsetMs': late,
        'cues': transformed,
    }


def format_ms(value):
    value = max(0, round(value))
    hh = value // 3600000
    mm = (value % 3600000) // 60000
    ss = (value % 60000) // 1000
    ms = value % 1000
    return f'{hh:02d}:{mm:02d}:{ss:02d},{ms:03d}'


def stringify_srt(cues):
    parts = []
    for idx, cue in enumerate(cues, start=1):
        parts.append('\n'.join([
            str(idx),
            f"{format_ms(cue['start'])} --> {format_ms(cue['end'])}",
            cue['text']
        ]))
    return '\ufeff' + '\n\n'.join(parts) + '\n'


def fetch_zip(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return zipfile.ZipFile(io.BytesIO(resp.read()))


def main():
    episodes = load_episode_data()
    title_to_episode = {}
    broadcast_by_season = {}
    for episode in episodes:
        if not episode.get('subtitleUrl'):
            continue
        key = normalize_title(episode['title'])
        title_to_episode.setdefault(key, []).append(episode)
        if all(token not in episode['title'] for token in ['(Special)', '(Minisode)', '(Prequel)', '(Animated Series)']):
            broadcast_by_season.setdefault(episode['season'], []).append(episode)

    if AR_ALT_DIR.exists():
        for existing in AR_ALT_DIR.glob('*.srt'):
            existing.unlink()
    AR_ALT_DIR.mkdir(exist_ok=True)
    (ROOT / 'audit').mkdir(exist_ok=True)

    alt_index = {}
    audit_rows = []
    accepted = 0
    rejected = 0

    for pack in PACKS:
        archive = fetch_zip(pack['url'])
        for name in archive.namelist():
            if not name.lower().endswith('.srt'):
                continue
            title_key = title_key_from_filename(name)
            candidates = title_to_episode.get(title_key, []) if title_key else []
            if len(candidates) != 1:
                broadcast_number = broadcast_number_from_filename(name)
                season_entries = broadcast_by_season.get(pack['season'], [])
                if broadcast_number and 1 <= broadcast_number <= len(season_entries):
                    candidates = [season_entries[broadcast_number - 1]]
            if len(candidates) != 1:
                rejected += 1
                audit_rows.append({'pack': pack['name'], 'source': name, 'status': 'rejected', 'reason': f'title_match_{len(candidates)}'})
                continue

            episode = candidates[0]
            primary_name = primary_arabic_filename(episode)
            primary_path = AR_DIR / primary_name
            if not primary_path.exists():
                rejected += 1
                audit_rows.append({'pack': pack['name'], 'source': name, 'status': 'rejected', 'reason': 'missing_primary'})
                continue

            primary_text = decode_text(primary_path.read_bytes())
            alt_text = decode_text(archive.read(name))
            if primary_text.replace('\r', '').strip() == alt_text.replace('\r', '').replace('\ufeff', '').strip():
                rejected += 1
                audit_rows.append({'pack': pack['name'], 'source': name, 'status': 'rejected', 'reason': 'duplicate_text'})
                continue

            en_path = EN_DIR / english_filename(episode)
            en_cues = parse_srt(decode_text(en_path.read_bytes()))
            alt_cues = parse_srt(alt_text)
            verification = verify_candidate(en_cues, alt_cues)
            if not verification:
                rejected += 1
                audit_rows.append({'pack': pack['name'], 'source': name, 'status': 'rejected', 'reason': 'timing_verification_failed'})
                continue

            alt_filename = primary_name.replace('.ar.srt', '.alt1.ar.srt')
            alt_path = AR_ALT_DIR / alt_filename
            alt_path.write_text(stringify_srt(verification['cues']), encoding='utf-8')
            alt_index.setdefault(primary_name, []).append({
                'filename': alt_filename,
                'label': 'Arabic Alt',
                'status': 'verified',
                'source': pack['name'],
                'episode': episode['title'],
                'canonicalId': f"S{episode['season']:02d}E{episode['episode']:02d}",
                'verification': {
                    'slope': verification['slope'],
                    'interceptMs': verification['interceptMs'],
                    'residualMedianMs': verification['residualMedianMs'],
                }
            })
            accepted += 1
            audit_rows.append({'pack': pack['name'], 'source': name, 'status': 'accepted', 'episode': episode['title'], 'canonicalId': f"S{episode['season']:02d}E{episode['episode']:02d}", 'alt': alt_filename})

    OUTPUT_INDEX.write_text(json.dumps(alt_index, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    OUTPUT_AUDIT.write_text(json.dumps({
        'generatedAt': __import__('datetime').datetime.utcnow().isoformat() + 'Z',
        'accepted': accepted,
        'rejected': rejected,
        'packs': [pack['name'] for pack in PACKS],
        'rows': audit_rows,
    }, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print(json.dumps({'accepted': accepted, 'rejected': rejected, 'episodesWithAlt': len(alt_index)}, indent=2))


if __name__ == '__main__':
    main()
