import { IPassenger } from '../model/interface/IPassenger';
import { TripDetails } from '../model/TripDetails';
import { InvalidTripInputException } from '../exceptions/InvalidTripInputException';

export enum DiscountCard {
  Senior = 'Senior',
  TrainStroke = 'TrainStroke',
  Couple = 'Couple',
  HalfCouple = 'HalfCouple',
}

export function calculateTripCostWithoutDiscount(
  passengers: IPassenger[],
  details: TripDetails,
  priceFromApi: number
) {
  let totalPrice = 0;
  for (const passenger of passengers) {
    if (passenger.age < 0) {
      throw new InvalidTripInputException('Age is invalid');
    }

    const temporaryPrice = calculateTemporaryPrice(
      passenger.age,
      passenger.discounts,
      priceFromApi,
      details.when
    );
    totalPrice += temporaryPrice;
  }

  return totalPrice;
}

function calculateTemporaryPrice(
  age: number,
  discounts: DiscountCard[],
  priceFromApi: number,
  when: Date
): number {
  let temporaryPrice: number;

  if (age < 1) {
    temporaryPrice = 0;
  } else if (age <= 18) {
    temporaryPrice = priceFromApi * 0.6;
  } else if (age >= 70) {
    temporaryPrice = priceFromApi * 0.8;
    if (discounts.includes(DiscountCard.Senior)) {
      temporaryPrice -= priceFromApi * 0.2;
    }
  } else {
    temporaryPrice = priceFromApi * 1.2;
  }

  const today = new Date();
  if (when.getTime() >= today.setDate(today.getDate() + 30)) {
    temporaryPrice -= priceFromApi * 0.2;
  } else if (when.getTime() > today.setDate(today.getDate() - 30 + 5)) {
    const MS_PER_DAY = 1000 * 3600 * 24;
    const theResholdDays = 20;
    const timeDifference = Math.abs(when.getTime() - new Date().getTime());
    const daysDifference = Math.ceil(timeDifference / MS_PER_DAY);
    temporaryPrice += (theResholdDays - daysDifference) * 0.02 * priceFromApi;
  } else {
    temporaryPrice += priceFromApi;
  }

  if (age > 0 && age < 4) {
    temporaryPrice = 9;
  }

  if (discounts.includes(DiscountCard.TrainStroke)) {
    temporaryPrice = 1;
  }

  return temporaryPrice;
}

export function applyDiscountCard(
  passengers: IPassenger[],
  totalPrice: number,
  priceFromApi: number
): number {
  const numberOfAdults = passengers.filter((p) => p.age >= 18).length;
  const hasCoupleDiscount = passengers.some((p) =>
    p.discounts.includes(DiscountCard.Couple)
  );

  const hasHalfCoupleDiscount = passengers[0]?.discounts.includes(
    DiscountCard.HalfCouple
  );

  if (numberOfAdults > 1 && hasCoupleDiscount) {
    totalPrice -= priceFromApi * 0.2 * numberOfAdults;
  } else if (numberOfAdults === 1 && hasHalfCoupleDiscount) {
    totalPrice -= priceFromApi * 0.1;
  }

  return totalPrice;
}
