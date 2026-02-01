
export enum TestMode {
  EN_TO_JP = 'EN_TO_JP',
  JP_TO_EN = 'JP_TO_EN'
}

export interface WordPair {
  id: number;
  en: string;
  jp: string;
}

export interface TestResult {
  correct: number;
  total: number;
  rank: string;
  score: number;
}
