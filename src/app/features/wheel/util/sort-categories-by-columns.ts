import { WheelStateCategory } from '../../../state/typings';
import { COLUMNS_NUMBER } from '../wheel.constants';

export const sortByColumns = (categories: WheelStateCategory[]): WheelStateCategory[][] => {
  const result: WheelStateCategory[][] = [];

  for (let i = 1; i <= COLUMNS_NUMBER; i++) {
    const total = categories.length;
    const itemsPerColumn = Math.ceil(total / COLUMNS_NUMBER);
    let top = itemsPerColumn * i;
    const bottom = top - itemsPerColumn;
    top -= 1;

    result.push(
      categories.filter((item: WheelStateCategory) => {
        return categories.indexOf(item) <= top && categories.indexOf(item) >= bottom;
      })
    );
  }

  return result;
};
