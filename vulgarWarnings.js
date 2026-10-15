const warningData = require('./vulgarWarnings.json');

// English display equivalents for reviewed Arabic subtitle evidence. Keep the
// original terms in the audit data so every warning remains traceable.
const ENGLISH_TERMS = Object.freeze({
  'عاهرة': 'whore',
  'كعاهرة': 'whore',
  'العاهرة': 'whore',
  'فاجرة': 'whore',
  'للفاجرات': 'whores',
  'الأوغاد': 'bastards',
  'وغد': 'bastard',
  'علاقة جنسية': 'sexual relationship',
  'تبا': 'damn',
  'اللعنة': 'damn',
  'سحقا': 'damn',
  'جنسي': 'sexy',
  'بالجنس': 'sex',
  'الجنس': 'sex',
  'الجنسي': 'sexual',
  'قضيب': 'penis',
  'مضاجعتي': 'have sex with me',
  'تقبيل حميم مع أصوات متعة': 'sensual kissing with sounds of pleasure'
});

function normalizeWarningTerm(value) {
  return value.normalize('NFC').replace(/[\u064b-\u065f\u0670]/g, '').toLowerCase();
}

function uniqueTerms(values) {
  const seen = new Set();
  return (Array.isArray(values) ? values : []).filter((value) => {
    if (typeof value !== 'string' || !value.trim()) {
      return false;
    }
    const key = normalizeWarningTerm(value.trim());
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  }).map((value) => value.trim());
}

function getVulgarWarnings(show, id) {
  const entry = warningData[show]?.[id];
  return { words: uniqueTerms(entry?.words), actions: uniqueTerms(entry?.actions) };
}

function buildWarningSections(warnings) {
  const englishTerms = (values) => uniqueTerms(uniqueTerms(values).map((value) =>
    ENGLISH_TERMS[normalizeWarningTerm(value)] || value
  ));
  return [
    { label: 'Vulgar words', items: englishTerms(warnings?.words) },
    { label: 'Sexual actions', items: englishTerms(warnings?.actions) }
  ].filter((section) => section.items.length > 0);
}

// Presentation only: stream descriptions use the existing tag-line helpers.
function appendVulgarWarnings(description, show, id) {
  const sections = buildWarningSections(getVulgarWarnings(show, id));
  // Brackets remain unambiguous even in clients that collapse newlines.
  const text = sections.map(({ label, items }) => `[${label}: ${items.join(', ')}]`).join('\n');
  return text ? [description, text].filter(Boolean).join('\n\n') : description;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

function renderVulgarWarnings(show, id) {
  const sections = buildWarningSections(getVulgarWarnings(show, id));
  if (!sections.length) {
    return '';
  }
  return `<div class="content-warnings" dir="ltr" lang="en">${sections.map(({ label, items }) =>
    `<p>[<strong>${label}:</strong> ${items.map((item) => escapeHtml(item)).join(', ')}]</p>`
  ).join('')}</div>`;
}

module.exports = {
  appendVulgarWarnings,
  buildWarningSections,
  getVulgarWarnings,
  normalizeWarningTerm,
  renderVulgarWarnings
};
