const TORCHWOOD_ARABIC_SUBTITLE_DIRECTORIES = Object.freeze([
  'torchwood-subtitles/ar-staging',
  'torchwood-subtitles/ar',
  'torchwood-subtitles/ar-improved',
  'torchwood-subtitles/ar-clean'
]);

const BLOCKED_ARABIC_TERMS = Object.freeze([
  'شرموطة',
  'قحبة',
  'نيك'
]);

const EXPLICIT_ARABIC_PHRASES = Object.freeze([
  'يمارس الجنس',
  'ممارسة الجنس',
  'علاقة جنسية'
]);

const GRAPHIC_ANATOMY_TERMS = Object.freeze([
  'قضيب',
  'مهبل',
  'خصية'
]);

const MEDICAL_CONTEXT_TERMS = Object.freeze([
  'طبي',
  'طبية',
  'طبيب',
  'فحص',
  'تشخيص',
  'علاج',
  'جراحة',
  'مختبر'
]);

const ENGLISH_PROFANITY_TERMS = Object.freeze([
  'fuck',
  'fucking',
  'shit',
  'asshole',
  'bastard'
]);

module.exports = {
  BLOCKED_ARABIC_TERMS,
  ENGLISH_PROFANITY_TERMS,
  EXPLICIT_ARABIC_PHRASES,
  GRAPHIC_ANATOMY_TERMS,
  MAX_SUBTITLE_LINE_LENGTH: 52,
  MEDICAL_CONTEXT_TERMS,
  TORCHWOOD_ARABIC_SUBTITLE_DIRECTORIES
};
