export class Validations {
  static luhnCheck(cedula: string): boolean {
    const arr = (cedula + '')
      .split('')
      .reverse()
      .map((x) => parseInt(x));

    const lastDigit = arr.splice(0, 1)[0];

    let sum = arr.reduce(
      (acc, val, i) =>
        i % 2 !== 0 ? acc + val : acc + (val * 2 > 9 ? val * 2 - 9 : val * 2),
      0
    );

    sum += lastDigit;

    return sum % 10 === 0;
  }
}
