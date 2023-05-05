import {
  ApiException,
  DiscountCard,
  InvalidTripInputException,
  TripRequest,
} from './model/trip.request';

export class TrainTicketEstimator {
  async estimate(trainDetails: TripRequest): Promise<number> {
    if (trainDetails.passengers.length === 0) {
      return 0;
    }

    this.validateTrainDetailsInput(trainDetails);

    // TODO USE THIS LINE AT THE END
    const priceFromApi = await this.fetchApiPrice(trainDetails);

    if (priceFromApi === -1) {
      throw new ApiException();
    }

    const passengers = trainDetails.passengers;
    let totalPrice = 0;
    let temporaryPrice = priceFromApi;
    for (let i = 0; i < passengers.length; i++) {
      if (passengers[i].age < 0) {
        throw new InvalidTripInputException('Age is invalid');
      }
      if (passengers[i].age < 1) {
        temporaryPrice = 0;
      }
      // Seniors
      else if (passengers[i].age <= 17) {
        temporaryPrice = priceFromApi * 0.6;
      } else if (passengers[i].age >= 70) {
        temporaryPrice = priceFromApi * 0.8;
        if (passengers[i].discounts.includes(DiscountCard.Senior)) {
          temporaryPrice -= priceFromApi * 0.2;
        }
      } else {
        temporaryPrice = priceFromApi * 1.2;
      }

      const today = new Date();
      if (
        trainDetails.details.when.getTime() >=
        today.setDate(today.getDate() + 30)
      ) {
        temporaryPrice -= priceFromApi * 0.2;
      } else if (
        trainDetails.details.when.getTime() >
        today.setDate(today.getDate() - 30 + 5)
      ) {
        const diff = Math.abs(
          trainDetails.details.when.getTime() - new Date().getTime()
        );
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));

        temporaryPrice += (20 - diffDays) * 0.02 * priceFromApi; // I tried. it works. I don't know why.
      } else {
        temporaryPrice += priceFromApi;
      }

      if (passengers[i].age > 0 && passengers[i].age < 4) {
        temporaryPrice = 9;
      }

      if (passengers[i].discounts.includes(DiscountCard.TrainStroke)) {
        temporaryPrice = 1;
      }

      totalPrice += temporaryPrice;
      temporaryPrice = priceFromApi;
    }

    if (passengers.length == 2) {
      let couple = false;
      let minor = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.Couple)) {
          couple = true;
        }
        if (passengers[i].age < 18) {
          minor = true;
        }
      }
      if (couple && !minor) {
        totalPrice -= priceFromApi * 0.2 * 2;
      }
    }

    if (passengers.length == 1) {
      let couple = false;
      let minor = false;
      for (let i = 0; i < passengers.length; i++) {
        if (passengers[i].discounts.includes(DiscountCard.HalfCouple)) {
          couple = true;
        }
        if (passengers[i].age < 18) {
          minor = true;
        }
      }
      if (couple && !minor) {
        totalPrice -= priceFromApi * 0.1;
      }
    }

    return totalPrice;
  }

  private validateTrainDetailsInput(trainDetails: TripRequest) {
    if (trainDetails.details.from.trim().length === 0) {
      throw new InvalidTripInputException('Start city is invalid');
    }

    if (trainDetails.details.to.trim().length === 0) {
      throw new InvalidTripInputException('Destination city is invalid');
    }

    if (
      trainDetails.details.when <
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

  async fetchApiPrice(trainDetails: TripRequest): Promise<number> {
    return (
      (
        await (
          await fetch(
            `https://sncf.com/api/train/estimate/price?from=${trainDetails.details.from}&to=${trainDetails.details.to}&date=${trainDetails.details.when}`
          )
        ).json()
      )?.price || -1
    );
  }
}
