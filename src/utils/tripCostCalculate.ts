import { IPassenger } from '../model/interface/IPassenger';
import { TripDetails } from '../model/TripDetails';
import { InvalidTripInputException } from '../exceptions/InvalidTripInputException';

export enum DiscountCard {
  Senior = 'Senior',
  TrainStroke = 'TrainStroke',
  Couple = 'Couple',
  HalfCouple = 'HalfCouple',
  FamilyCard = 'FamilyCard',
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
  _discounts: DiscountCard[],
  priceFromApi: number,
  when: Date
): number {
  let temporaryPrice: number;

  if (age <= 18) {
    temporaryPrice = priceFromApi * 0.6;
  } else if (age >= 70) {
    temporaryPrice = priceFromApi * 0.8;
  } else {
    temporaryPrice = priceFromApi * 1.2;
  }

  const today = new Date();
  const MS_PER_DAY = 1000 * 3600 * 24;
  const theResholdDays = 20;

  const timeDifference = Math.abs(when.getTime() - new Date().getTime());
  const daysDifference = Math.ceil(timeDifference / MS_PER_DAY);

  if (when.getTime() >= today.setDate(today.getDate() + 30)) {
    temporaryPrice -= priceFromApi * 0.2;
  } else if (when.getTime() > today.setDate(today.getDate() - 30 + 5)) {
    temporaryPrice += (theResholdDays - daysDifference) * 0.02 * priceFromApi;
  } else if (when.getTime() <= today.setHours(today.getHours() - 6)) {
    temporaryPrice -= priceFromApi * 0.2;
  } else {
    temporaryPrice += priceFromApi;
  }

  if (age < 1) {
    temporaryPrice = 0;
  } else if (age < 4) {
    temporaryPrice = 9;
  }

  return temporaryPrice;
}

export function applyDiscountCard(
  passengers: IPassenger[],
  totalPrice: number,
  priceFromApi: number
): number {
  const familyCardHolderLastName = passengers.find((passenger) =>
    passenger.discounts.includes(DiscountCard.FamilyCard)
  )?.lastName;

  if (familyCardHolderLastName !== undefined) {
    for (const passenger of passengers) {
      if (passenger.lastName === familyCardHolderLastName)
        totalPrice -= priceFromApi * 0.3;
    }
  } else {
    const numberOfAdults = passengers.filter(
      (passenger) => passenger.age > 18
    ).length;
    const hasCoupleDiscount = passengers.some((passenger) =>
      passenger.discounts.includes(DiscountCard.Couple)
    );

    if (numberOfAdults === 1) {
      if (passengers[0].discounts.includes(DiscountCard.HalfCouple))
        totalPrice -= priceFromApi * 0.1;
    } else {
      if (hasCoupleDiscount) totalPrice -= priceFromApi * 0.2 * numberOfAdults;
    }

    for (const passenger of passengers) {
      if (passenger.discounts.includes(DiscountCard.Senior)) {
        if (passenger.age >= 70) totalPrice -= priceFromApi * 0.2;
      }
      if (passenger.discounts.includes(DiscountCard.TrainStroke)) {
        totalPrice = 1;
      }
    }
  }
  return totalPrice;
}
