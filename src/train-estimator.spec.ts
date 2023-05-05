import { TrainTicketEstimator } from './train-estimator';
describe('TrainTicketEstimator ==> Rules of the trade', () => {
  let estimator: TrainTicketEstimator;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
  });
  it('should return 0 when no passengers', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: new Date() },
      passengers: [],
    };
    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(0);
  });

  it('should throw InvalidTripInputException when start city is invalid', async () => {
    const tripRequest = {
      details: { from: '', to: 'Lyon', when: new Date() },
      passengers: [{ age: 30, discounts: [] }],
    };
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Start city is invalid'
    );
  });

  it('should throw InvalidTripInputException when destination city is invalid', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: '', when: new Date() },
      passengers: [{ age: 30, discounts: [] }],
    };
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Destination city is invalid'
    );
  });

  it('should throw InvalidTripInputException when date is invalid', async () => {
    const date = new Date();
    date.setDate(date.getDate() - 1);

    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 30, discounts: [] }],
    };
    await expect(estimator.estimate(tripRequest)).rejects.toThrowError(
      'Date is invalid'
    );
  });
});

describe('TrainTicketEstimator ===> Date of trip', () => {
  let estimator: TrainTicketEstimator;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(100));
  });

  it('30 days before the trip, we apply -20% discount (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 30, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(100);
  });

  it('We apply 2% increase per day for 25 days (so -18% at 29 days from the departure date) (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 29);
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 30, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(102);
  });

  it('We apply 2% increase per day for 25 days (so 0% at 20 days from the departure date) (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 20);
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 30, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(120);
  });

  it('Within 5 days of travel, the fare doubles. These rules only apply to adult passengers (+20% for adult passenger)', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 30, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(220);
  });

  it('Within 5 days of travel, the fare doubles. These rules do not apply to fixed price tickets', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 2, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(9);
  });
  it('Within 5 days of travel, the fare doubles. These rules do not apply to fixed price tickets', async () => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 2, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toEqual(9);
  });
});

describe('TrainTicketEstimator ==> Passengers type', () => {
  let estimator: TrainTicketEstimator;
  let date: Date;

  beforeEach(() => {
    estimator = new TrainTicketEstimator();
    date = new Date();
    date.setDate(date.getDate() + 20);
    jest
      .spyOn(estimator, 'fetchApiPrice')
      .mockReturnValue(Promise.resolve(100));
  });

  it('If the passenger is less than one year old on the date of travel, it is free (at the same time, it will not have a seat assigned)', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 0, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(0);
  });

  it('If the passenger is 3 years old or less, it is a fixed rate of 9 euros', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 2, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);
    expect(price).toBe(9);
  });

  it('Up to 18 years old, there is a 40% discount on the basic rate', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 16, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(60);
  });

  it('In all other cases, it is +20% (for a single adult passenger)', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 30, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(120);
  });

  it('If the passenger is a senior citizen (>= 70 years old), then he/she gets a 20% discount', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 72, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(80);
  });

  it('Up to the age of 18, there is a 40% discount on the basic rate.', async () => {
    const tripRequest = {
      details: { from: 'Paris', to: 'Lyon', when: date },
      passengers: [{ age: 16, discounts: [] }],
    };

    const price = await estimator.estimate(tripRequest);

    expect(price).toEqual(60);
  });
});
