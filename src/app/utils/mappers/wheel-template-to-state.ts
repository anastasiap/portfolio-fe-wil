import { SingleWheelState } from '../../state/typings';
import categorySnapshotToState from './category-snapshot-to-state';

export default (wheel: WheelTemplateDetailDto): SingleWheelState => {
  return {
    id: wheel.id,
    categories: categorySnapshotToState(wheel.categories),
    name: wheel.name,
    descriptionKey: 0,
    wheelKey: 0,
    focus: [],
    focusLoading: false,
    loading: false,
  };
};
