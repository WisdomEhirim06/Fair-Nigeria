// The  questions types for the election rating
import type { RatingInput } from '@/lib/api';

export type QuestionKey = Extract<
  keyof RatingInput,
  'noIntimidation' | 'accreditationProper' | 'votingOrderly' | 'securityPresent' | 'witnessedMalpractice'
>;

export const RATING_QUESTIONS: { key: QuestionKey; question: string }[] = [
  { key: 'noIntimidation', question: 'Were you able to vote without intimidation?' },
  { key: 'accreditationProper', question: 'Was accreditation conducted properly at your polling unit?' },
  { key: 'votingOrderly', question: 'Did voting proceed in an orderly manner?' },
  { key: 'securityPresent', question: 'Was security personnel present at your polling unit?' },
  { key: 'witnessedMalpractice', question: 'Did you witness any form of electoral malpractice?' },
];
