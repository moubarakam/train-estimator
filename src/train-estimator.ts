import { TripRequest } from './model/trip.request';
import { ApiException } from './exceptions/ApiException';
import { ApiSNCF } from './model/ApiSNCF';
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

    tripRequest.fetchApiPrice();
    let totalPrice = tripRequest.getTripCost(priceFromApi);
    totalPrice = tripRequest.getPassengersDiscounts(totalPrice, priceFromApi);

    return totalPrice;
  }

  async fetchApiPrice(details: TripDetails): Promise<number> {
    const api = new ApiSNCF(details);
    return await api.fetchApiSNCF();
  }
}
