import type { ApplicationType } from './types';

export const defaultApplicationTypes: ApplicationType[] = [
  { value: 'ea', label: 'Early Action', deadline: 'Nov 1' },
  { value: 'ed', label: 'Early Decision', deadline: 'Nov 1' },
  { value: 'ed2', label: 'Early Decision II', deadline: 'Jan 1' },
  { value: 'rea', label: 'Restrictive Early Action', deadline: 'Nov 1' },
  { value: 'rd', label: 'Regular Decision', deadline: 'Jan 15' },
];
