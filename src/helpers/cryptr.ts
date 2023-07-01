import Cryptr from 'cryptr';

const CRYPTO_KEY = process.env.ENCRYPTION_KEY || 'default-secret-key';

const cryptr = new Cryptr(CRYPTO_KEY as string, {
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
