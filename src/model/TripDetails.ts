import { InvalidTripInputException } from '../exceptions/InvalidTripInputException';

export class TripDetails {
  public from: string;
  public to: string;
  public when: Date;

  constructor(from: string, to: string, when: Date) {
    this.from = from;
    this.to = to;
    this.when = when;
  }

  haveValideTripDetails() {
    if (this.from.length === 0) {
      throw new InvalidTripInputException('Start city is invalid');
    }

    if (this.to.length === 0) {
      throw new InvalidTripInputException('Destination city is invalid');
    }

    if (
      this.when <
      new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        0,
        0,
        0
      )
    ) {
      throw new InvalidTripInputException('Date is invalid');
    }
  }
}
