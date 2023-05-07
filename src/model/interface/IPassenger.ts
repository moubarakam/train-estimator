import { DiscountCard } from '../../utils/tripCostCalculate';

export interface IPassenger {
  age: number;
  discounts: DiscountCard[];
}
