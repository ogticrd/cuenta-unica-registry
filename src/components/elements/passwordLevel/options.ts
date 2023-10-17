import { Options, passwordStrength } from 'check-password-strength';

const options: Options<string> = [
  {
    id: 0,
    value: 'too-weak',
    minDiversity: 0,
    minLength: 0,
  },
  {
    id: 1,
    value: 'weak',
    minDiversity: 1,
    minLength: 6,
  },
  {
    id: 2,
    value: 'medium',
    minDiversity: 2,
    minLength: 8,
  },
  {
    id: 3,
    value: 'strong',
    minDiversity: 3,
    minLength: 10,
  },
  {
    id: 4,
    value: 'secure',
    minDiversity: 4,
    minLength: 12,
  },
];

export const getPasswordStrength = (password: string) =>
  passwordStrength(password, options);
