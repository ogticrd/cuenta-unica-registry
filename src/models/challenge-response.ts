export class Challenge {
  id?: string;
  sign?: Sign;

  constructor(id?: string, sign?: Sign) {
    this.id = id;
    this.sign = sign;
  }

  getSignDescription(): SignDescription {
    if (
      !this.sign?.THUMB &&
      !this.sign?.INDEX &&
      !this.sign?.MIDDLE &&
      !this.sign?.RING &&
      !this.sign?.PINKY
    ) {
      return {
        text: 'Muestra tu mano cerrada',
        image: 'fist',
      };
    }

    if (
      this.sign?.THUMB &&
      !this.sign?.INDEX &&
      !this.sign?.MIDDLE &&
      !this.sign?.RING &&
      !this.sign?.PINKY
    ) {
      return {
        text: 'Muestra tu pulgar',
        image: 'thumb',
      };
    }

    if (
      !this.sign?.THUMB &&
      this.sign?.INDEX &&
      this.sign?.MIDDLE &&
      !this.sign?.RING &&
      !this.sign?.PINKY
    ) {
      return {
        text: 'Muestra dos dedos',
        image: 'two-fingers',
      };
    }

    if (
      this.sign?.THUMB &&
      this.sign?.INDEX &&
      this.sign?.MIDDLE &&
      !this.sign?.RING &&
      !this.sign?.PINKY
    ) {
      return {
        text: 'Muestra tres dedos',
        image: 'three-fingers',
      };
    }

    if (
      this.sign?.THUMB &&
      this.sign?.INDEX &&
      this.sign?.MIDDLE &&
      this.sign?.RING &&
      this.sign?.PINKY
    ) {
      return {
        text: 'Muestra tu mano abierta',
        image: 'open-hand',
      };
    }

    return {};
  }
}

export interface Sign {
  THUMB: boolean;
  INDEX: boolean;
  MIDDLE: boolean;
  RING: boolean;
  PINKY: boolean;
}

export interface SignDescription {
  text?: string;
  image?: string;
}
