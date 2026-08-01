import { WheelStateCategory } from '../../state/typings';

export default (categories: CategorySnapshotDto[]): WheelStateCategory[] => {
  return categories.map((c, i) => ({
    color: c.color,
    description: c.description ?? '',
    order: i + 1,
    id: c.categoryId,
    score: 0,
    name: c.label,
  }));
};
