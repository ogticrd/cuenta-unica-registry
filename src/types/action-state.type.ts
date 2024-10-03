import { LocalizedPath } from '@/common/helpers';

export type State = {
  message: LocalizedPath | (string & {});
  meta?: Record<string, string>;
};
