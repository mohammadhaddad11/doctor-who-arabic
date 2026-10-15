const warningData = require('./vulgarWarnings.json');

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
  return [
    { label: 'كلمات بذيئة', items: uniqueTerms(warnings?.words) },
    { label: 'أفعال بذيئة', items: uniqueTerms(warnings?.actions) }
  ].filter((section) => section.items.length > 0);
}

// Presentation only: stream descriptions use the existing tag-line helpers.
function appendVulgarWarnings(description, show, id) {
  const sections = buildWarningSections(getVulgarWarnings(show, id));
  const text = sections.map(({ label, items }) => `${label}: ${items.join('، ')}`).join('\n');
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
  return `<div class="content-warnings" dir="rtl" lang="ar">${sections.map(({ label, items }) =>
    `<p><strong>${label}:</strong> ${items.map((item) => `<bdi>${escapeHtml(item)}</bdi>`).join('، ')}</p>`
  ).join('')}</div>`;
}

module.exports = {
  appendVulgarWarnings,
  buildWarningSections,
  getVulgarWarnings,
  normalizeWarningTerm,
  renderVulgarWarnings
};
