export class Passenger {
  constructor(readonly age: number, readonly discounts: DiscountCard[]) {}
}
export class TripRequest {
  details: TripDetails;
  passengers: Passenger[];
  constructor(details: TripDetails, passengers: Passenger[]) {
    this.details = details;
    this.passengers = passengers;
  }

  calculateAllPassengersPrice(priceFromApi: number) {
    let totalPrice = 0;
    let temporaryPrice = priceFromApi;
    for (let i = 0; i < this.passengers.length; i++) {
      if (this.passengers[i].age < 0) {
        throw new InvalidTripInputException('Age is invalid');
      }
      if (this.passengers[i].age < 1) {
        temporaryPrice = 0;
      }

      // Seniors
      else if (this.passengers[i].age <= 17) {
        temporaryPrice = priceFromApi * 0.6;
      } else if (this.passengers[i].age >= 70) {
        temporaryPrice = priceFromApi * 0.8;
        if (this.passengers[i].discounts.includes(DiscountCard.Senior)) {
          temporaryPrice -= priceFromApi * 0.2;
        }
      } else {
        temporaryPrice = priceFromApi * 1.2;
      }

      const today = new Date();
      if (this.details.when.getTime() >= today.setDate(today.getDate() + 30)) {
        temporaryPrice -= priceFromApi * 0.2;
      } else if (
        this.details.when.getTime() > today.setDate(today.getDate() - 30 + 5)
      ) {
        const diff = Math.abs(
          this.details.when.getTime() - new Date().getTime()
        );
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

        temporaryPrice += (20 - diffDays) * 0.02 * priceFromApi; // I tried. it works. I don't know why.
      } else {
        temporaryPrice += priceFromApi;
      }

      if (this.passengers[i].age > 0 && this.passengers[i].age < 4) {
        temporaryPrice = 9;
      }

      if (this.passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
        temporaryPrice = 1;
      }

      totalPrice += temporaryPrice;
      temporaryPrice = priceFromApi;
    }
    return totalPrice;
  }

  getPassengersDiscounts(totalPrice: number, priceFromApi: number) {
    const adultesCount = this.passengers.filter(
      (passenger) => passenger.age >= 18
    );
    const coupleDiscounts = this.passengers.filter((passenger) =>
      passenger.discounts.includes(DiscountCard.Couple)
    );
    if (adultesCount.length > 1 && coupleDiscounts.length >= 1) {
      totalPrice -= priceFromApi * 0.2 * adultesCount.length;
    } else if (
      adultesCount.length == 1 &&
      this.passengers[0].discounts.includes(DiscountCard.HalfCouple)
    ) {
      totalPrice -= priceFromApi * 0.1;
    }
    return totalPrice;
  }
}

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

export class InvalidTripInputException extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class ApiException extends Error {
  constructor() {
    super('Api error');
  }
}

export class ApiSNCF {
  public from = '';
  public to = '';
  public when = new Date();

  constructor(requestDetails: TripDetails) {
    this.from = requestDetails.from.trim();
    this.to = requestDetails.to.trim();
    this.when = requestDetails.when;
  }

  async fetchApiSNCF(): Promise<number> {
    return (
      (
        await (
          await fetch(
            `https://sncf.com/api/train/estimate/price?from=${this.from}&to=${this.to}&date=${this.when}`
          )
        ).json()
      )?.price || -1
    );
  }
}

export enum DiscountCard {
  Senior = 'Senior',
  TrainStroke = 'TrainStroke',
  Couple = 'Couple',
  HalfCouple = 'HalfCouple',
}
