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
