import type { LocalizedPath } from '@/common/helpers/localize-string';

export type State = {
  message: LocalizedPath | (string & {});
  meta?: Record<string, string>;
};
