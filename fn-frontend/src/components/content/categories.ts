import type { ArticleCategory } from '@/lib/api';

/** The five fixed civic categories, in reading order, with citizen-facing labels. */
export const CATEGORY_ORDER: ArticleCategory[] = [
  'voter_rights',
  'accreditation',
  'reporting',
  'malpractice',
  'civic_general',
];

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  voter_rights: 'Your rights',
  accreditation: 'Accreditation',
  reporting: 'Reporting',
  malpractice: 'Malpractice',
  civic_general: 'Civic basics',
};

export function categoryLabel(category: ArticleCategory): string {
  return CATEGORY_LABELS[category];
}
