import getConfig from 'next/config';
import Cryptr from 'cryptr';

const DEFAULT_KEY = 'sf_d23424bdsdfkj@f42e@wdn5fgsdfdm**2asbn!d';
const { publicRuntimeConfig } = getConfig();
const NEXT_PUBLIC_CRYPTO_KEY =
  publicRuntimeConfig.NEXT_PUBLIC_CRYPTO_KEY || DEFAULT_KEY;

const cryptr = new Cryptr(NEXT_PUBLIC_CRYPTO_KEY, {
  pbkdf2Iterations: 10000,
  saltLength: 10,
});

export class Crypto {
  static encrypt(str: string): string {
    return cryptr.encrypt(str);
  }

  static decrypt(token: string): string {
    return cryptr.decrypt(token);
  }
}
