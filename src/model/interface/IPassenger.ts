import { DiscountCard } from '../../utils/tripCostCalculate';
export interface IPassenger {
  age: number;
  lastName?: string;
  discounts: DiscountCard[];
}
