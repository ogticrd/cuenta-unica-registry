import { Dictionary } from '@/dictionaries';

type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, any>
    ?
        | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof any[]>> & string}`
        | `${Key}.${Exclude<keyof T[Key], keyof any[]> & string}`
    : never
  : never;

type PathImpl2<T> = PathImpl<T, keyof T> | keyof T;

type Path<T> = PathImpl2<T> extends string | keyof T ? PathImpl2<T> : keyof T;

export type LocalizedPath = Path<Dictionary>;

export function localizeString(
  dict: Dictionary,
  path: LocalizedPath | (string & {}),
): string {
  console.log(path);
  return path.split('.').reduce<any>((o, k) => o[k], dict);
}
