import { TripRequest } from './model/trip.request';
import { TripDetails } from './model/TripDetails';
import { IPassenger } from './model/interface/IPassenger';
import { TrainTicketEstimator } from './train-estimator';
import { DiscountCard } from './utils/tripCostCalculate';

describe('TrainTicketEstimator ==> Rules of the trade', () => {
  let estimator: TrainTicketEstimator;
  let passengers: IPassenger[];

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    passengers = [{ age: 30, discounts: [] }];
  });
  it('should return 0 when no passengers', async () => {
    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: new Date() } as TripDetails,
      []
    );
    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(0);
  });

  it('should throw InvalidTripInputException when start city is invalid', async () => {
    const tripRequest: TripRequest = new TripRequest(
      { from: '', to: 'Lyon', when: new Date() } as TripDetails,
      passengers
    );
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Start city is invalid'
    );
  });

  it('should throw InvalidTripInputException when destination city is invalid', async () => {
    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: '', when: new Date() } as TripDetails,
      passengers
    );
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Destination city is invalid'
    );
  });

  it('should throw InvalidTripInputException when date is invalid', async () => {
    const date = new Date(2022, 1, 1);
    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: date } as TripDetails,
      passengers
    );
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Date is invalid'
    );
  });
  it('should throw ApiException when API return -1', async () => {
    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: new Date() } as TripDetails,
      passengers
    );
    jest.spyOn(estimator, 'fetchApiPrice').mockReturnValue(Promise.resolve(-1));
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Api error'
    );
  });
  it('should throw ApiException when API return -1', async () => {
    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: new Date() } as TripDetails,
      [{ age: -2, discounts: [] }]
    );
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(100));
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Age is invalid'
    );
  });
});

describe('TrainTicketEstimator ===> Date of trip', () => {
  let estimator: TrainTicketEstimator;
  let passengers: IPassenger[];
  const apiMockPrice = 100;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    passengers = [{ age: 30, discounts: [] }];
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(apiMockPrice));
  });

  it('30 days before the trip, we apply -20% discount (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 35);

    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: date } as TripDetails,
      passengers
    );

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(100);
  });

  it('We apply 2% increase per day for 25 days (so -18% at 29 days from the departure date) (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 29);

    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: date } as TripDetails,
      passengers
    );

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(102);
  });

  it('We apply 2% increase per day for 25 days (so 0% at 20 days from the departure date) (+20% for adult passenger)', async () => {
    const date = new Date();
    const theResholdDays = 20;
    date.setDate(date.getDate() + theResholdDays);

    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: date } as TripDetails,
      passengers
    );

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(120);
  });

  it('Within 5 days of travel, the fare doubles. These rules only apply to adult passengers (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);

    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: date } as TripDetails,
      passengers
    );

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(220);
  });

  it('Within 5 days of travel, the fare doubles. These rules do not apply to fixed price tickets', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);

    const tripRequest: TripRequest = new TripRequest(
      { from: 'Paris', to: 'Lyon', when: date } as TripDetails,
      [{ age: 2, discounts: [] }]
    );

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(9);
  });
});

describe('TrainTicketEstimator ==> Passengers type', () => {
  let estimator: TrainTicketEstimator;
  let date: Date;
  let TripDetails: TripDetails;
  const apiMockPrice = 100;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    date = new Date();
    const theResholdDays = 20;
    date.setDate(date.getDate() + theResholdDays);
    TripDetails = { from: 'Paris', to: 'Lyon', when: date } as TripDetails;
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(apiMockPrice));
  });

  it('If the passenger is less than one year old on the date of travel, it is free (at the same time, it will not have a seat assigned)', async () => {
    const tripRequest: TripRequest = new TripRequest(TripDetails, [
      { age: 0, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(0);
  });

  it('If the passenger is 3 years old or less, it is a fixed rate of 9 euros', async () => {
    const tripRequest: TripRequest = new TripRequest(TripDetails, [
      { age: 2, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(9);
  });

  it('Up to 18 years old, there is a 40% discount on the basic rate', async () => {
    const tripRequest: TripRequest = new TripRequest(TripDetails, [
      { age: 16, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(60);
  });

  it('In all other cases, it is +20% (for a single adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(TripDetails, [
      { age: 30, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(120);
  });

  it('If the passenger is a senior citizen (>= 70 years old), then he/she gets a 20% discount', async () => {
    const tripRequest: TripRequest = new TripRequest(TripDetails, [
      { age: 72, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(80);
  });

  it('Up to the age of 18, there is a 40% discount on the basic rate.', async () => {
    const tripRequest: TripRequest = new TripRequest(TripDetails, [
      { age: 16, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(60);
  });
});

describe('TrainTicketEstimator ==> Discount cards', () => {
  let estimator: TrainTicketEstimator;
  let date: Date;
  let tripDetails: TripDetails;
  const apiMockPrice = 100;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    date = new Date();
    const theResholdDays = 20;
    date.setDate(date.getDate() + theResholdDays);
    tripDetails = new TripDetails('Paris', 'Lyon', date);
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(apiMockPrice));
  });
  it('TrainStroke staff card: all tickets are 1 euro', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [DiscountCard.TrainStroke] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(1);
  });
  it('Senior Card: valid only if the user is over 70 years old. 20% additional discount (-20% for senior passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 72, discounts: [DiscountCard.Senior] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(60);
  });

  it('Couple Card valid (2 adult passengers). -20% on the ticket of each of these passengers. (+20% for each adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [DiscountCard.Couple] },
      { age: 30, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(100 + 100);
  });

  it('Couple Card valid (2 adult passengers). -20% on the ticket of each of these passengers. (+20% for each adult passenger) Valid only once!', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [DiscountCard.Couple] },
      { age: 30, discounts: [DiscountCard.Couple] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(100 + 100);
  });

  it('should not apply the Couple discount for two child passengers (-40% for each minor (Up to 18 years old))', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 16, discounts: [] },
      { age: 10, discounts: [DiscountCard.Couple] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(60 + 60);
  });

  it('Mid-couple card: valid only if the trip involves 1 adult passenger. 10% discount on the trip. (+20% for adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [DiscountCard.HalfCouple] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(110);
  });

  it('should not apply the HalfCouple discount for one child passenger. (-40% for each minor (Up to 18 years old))', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 16, discounts: [DiscountCard.HalfCouple] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(60);
  });
});

describe('New feature ==> 6 hours before departure', () => {
  let estimator: TrainTicketEstimator;
  let date: Date;
  let tripDetails: TripDetails;
  const apiMockPrice = 100;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    date = new Date();
    date.setHours(date.getHours() + 5);
    tripDetails = new TripDetails('Paris', 'Lyon', date);
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(apiMockPrice));
  });
  it('6 hours before departure, we apply a 20% discount on the ticket price (+20% for adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(100);
  });
});

describe('New features ==> The family card', () => {
  let estimator: TrainTicketEstimator;
  let date: Date;
  let tripDetails: TripDetails;
  const apiMockPrice = 100;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    date = new Date();
    const theResholdDays = 20;
    date.setDate(date.getDate() + theResholdDays);
    tripDetails = new TripDetails('Paris', 'Lyon', date);
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(apiMockPrice));
  });

  it('The family card should not be applied if the first name of the card holder is not defined (+20% for each adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [] },
      { age: 35, discounts: [DiscountCard.FamilyCard] },
      { age: 37, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(120 + 120 + 120);
  });
  it('The family card should not be applied if the first names of the passengers are not defined (+20% for each adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [] },
      { age: 35, discounts: [DiscountCard.FamilyCard] },
      { age: 37, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(120 + 120 + 120);
  });
  it('The family card should not be applied if the first name of the card holder is not defined (+20% for each adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [], lastName: 'Dupont' },
      { age: 35, discounts: [DiscountCard.FamilyCard] },
      { age: 37, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(120 + 120 + 120);
  });
  it('If a passenger has a family card, all passengers with the same last name receive a 30% discount (+20% for each adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 30, discounts: [], lastName: 'Dupont' },
      { age: 35, discounts: [DiscountCard.FamilyCard], lastName: 'Dupont' },
      { age: 37, discounts: [] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(90 + 90 + 120);
  });
  it('The family card cannot be combined with other discounts. (+20% for each adult passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      { age: 47, discounts: [DiscountCard.FamilyCard], lastName: 'Dupont' },
      { age: 35, discounts: [DiscountCard.Couple], lastName: 'Dupont' },
      { age: 37, discounts: [DiscountCard.HalfCouple] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(90 + 90 + 120);
  });
  it('The family card cannot be combined with other discounts. (+20% for each adult passenger) (-20% for each senior passenger)', async () => {
    const tripRequest: TripRequest = new TripRequest(tripDetails, [
      {
        age: 77,
        discounts: [DiscountCard.FamilyCard, DiscountCard.Senior],
        lastName: 'Dupont',
      },
      { age: 35, discounts: [], lastName: 'Dupont' },
      { age: 37, discounts: [DiscountCard.HalfCouple] },
    ]);

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(50 + 90 + 120);
  });
});
