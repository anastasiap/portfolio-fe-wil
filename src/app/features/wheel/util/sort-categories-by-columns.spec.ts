import { WheelStateCategory } from '../../../state/typings';
import { sortByColumns } from './sort-categories-by-columns';

describe('sortByColumns', () => {
  function createCategory(id: string, order: number): WheelStateCategory {
    return {
      id,
      order,
      name: `Category ${id}`,
      description: `Description ${id}`,
      color: '#f00',
      score: 0,
    };
  }

  it('should return two empty columns when categories are empty', () => {
    // Arrange
    const categories: WheelStateCategory[] = [];

    // Act
    const result = sortByColumns(categories);

    // Assert
    expect(result).toEqual([[], []]);
  });

  it('should split an even number of categories evenly across two columns', () => {
    // Arrange
    const categories = [createCategory('1', 0), createCategory('2', 1), createCategory('3', 2), createCategory('4', 3)];

    // Act
    const result = sortByColumns(categories);

    // Assert
    expect(result.map((column) => column.map((category) => category.id))).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });

  it('should put the extra category in the first column when category count is odd', () => {
    // Arrange
    const categories = [createCategory('1', 0), createCategory('2', 1), createCategory('3', 2), createCategory('4', 3), createCategory('5', 4)];

    // Act
    const result = sortByColumns(categories);

    // Assert
    expect(result.map((column) => column.map((category) => category.id))).toEqual([
      ['1', '2', '3'],
      ['4', '5'],
    ]);
  });

  it('should put a single category in the first column', () => {
    // Arrange
    const categories = [createCategory('1', 0)];

    // Act
    const result = sortByColumns(categories);

    // Assert
    expect(result.map((column) => column.map((category) => category.id))).toEqual([['1'], []]);
  });

  it('should preserve the input category object references', () => {
    // Arrange
    const firstCategory = createCategory('1', 0);
    const secondCategory = createCategory('2', 1);

    // Act
    const result = sortByColumns([firstCategory, secondCategory]);

    // Assert
    expect(result[0][0]).toBe(firstCategory);
    expect(result[1][0]).toBe(secondCategory);
  });
});
