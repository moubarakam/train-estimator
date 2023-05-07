import { InvalidTripInputException } from '../exceptions/InvalidTripInputException';

export class TripDetails {
  public from = '';
  public to = '';
  public when = new Date();

  constructor(from: string, to: string, when: Date) {
    this.from = from.trim();
    this.to = to.trim();
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
        new Date().getDay(),
        0,
        0,
        0
      )
    ) {
      throw new InvalidTripInputException('Date is invalid');
    }
  }
}
