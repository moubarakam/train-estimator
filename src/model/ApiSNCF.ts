import { TripDetails } from './TripDetails';

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
