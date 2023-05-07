import { ApiSNCF } from './ApiSNCF';
import {
  applyDiscountCard,
  calculateTripCostWithoutDiscount,
} from '../utils/tripCostCalculate';
import { IPassenger } from './interface/IPassenger';
import { TripDetails } from './TripDetails';

export class TripRequest {
  details: TripDetails;
  passengers: IPassenger[];
  constructor(details: TripDetails, passengers: IPassenger[]) {
    this.details = details;
    this.passengers = passengers;
  }

  getTripCost(priceFromApi: number) {
    return calculateTripCostWithoutDiscount(
      this.passengers,
      this.details,
      priceFromApi
    );
  }

  getPassengersDiscounts(totalPrice: number, priceFromApi: number) {
    return applyDiscountCard(this.passengers, totalPrice, priceFromApi);
  }

  async fetchApiPrice(): Promise<number> {
    const api = new ApiSNCF(this.details);
    return await api.fetchApiSNCF();
  }
}
