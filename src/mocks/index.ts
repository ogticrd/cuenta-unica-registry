import { createServer } from 'miragejs';
import { pwnedPassword } from 'hibp';

import { Crypto } from '@/helpers';

export const startApiMocks = () => {
  createServer({
    routes() {
      this.get('/api/citizens/:cedula', (schema, request) => {
        const { validated } = request.queryParams;
        const { cedula: id } = request.params;

        if (validated) {
          return {
            names: 'JOHN',
            id,
            firstSurname: 'DOE',
            secondSurname: 'DOE',
            gender: 'M',
            birthDate: '1990-01-01',
          };
        }

        return { name: 'JOHN', id };
      });

      this.get('/api/iam/:cedula', (schema, request) => {
        return {
          exists: false,
          status: 200,
        };
      });

      this.post('/api/recaptcha', () => {
        return {
          isHuman: true,
          message: 'Thank you human',
          status: 200,
        };
      });

      this.get('/api/pwned/:password', async (schema, request) => {
        const { password } = request.params;

        const passwordKey = Array.isArray(password) ? password[0] : password;

        try {
          const data = await pwnedPassword(Crypto.decrypt(passwordKey));
          return {
            data,
            status: 200,
          };
        } catch (error) {
          return {
            status: 500,
          };
        }
      });
    },
  });
};
