import { TripRequest } from './model/trip.request';
import { ApiException } from './exceptions/ApiException';
import { TripDetails } from './model/TripDetails';
export class TrainTicketEstimator {
  async estimate(tripRequest: TripRequest): Promise<number> {
    if (tripRequest.passengers.length === 0) {
      return 0;
    }

    const details = new TripDetails(
      tripRequest.details.from,
      tripRequest.details.to,
      tripRequest.details.when
    );
    details.haveValideTripDetails();

    // TODO USE THIS LINE AT THE END
    const priceFromApi = await this.fetchApiPrice(details);

    if (priceFromApi === -1) {
      throw new ApiException();
    }

    let totalPrice = tripRequest.getTripCost(priceFromApi);
    totalPrice = tripRequest.getPassengersDiscounts(totalPrice, priceFromApi);

    return totalPrice;
  }

  async fetchApiPrice(details: TripDetails): Promise<number> {
    return (
      (
        await (
          await fetch(
            `https://sncf.com/api/train/estimate/price?from=${details.from}&to=${details.to}&date=${details.when}`
          )
        ).json()
      )?.price || -1
    );
  }
}
