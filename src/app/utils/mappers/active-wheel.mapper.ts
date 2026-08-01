import { SingleWheelState } from '../../state/typings';

export const mapActiveWheel = (
  wheels: WheelVersionOutputDto[],
  wheelId?: string,
  session?: WheelSessionOutputDto | null
): SingleWheelState | void => {
  if (!wheels.length) return;

  const activeWheel = wheels.find((w) => (wheelId ? w.id === wheelId : w.isDefault));

  if (!activeWheel) return;

  return mapOutputToState(activeWheel, session);
};

export const mapOutputToState = (wheel: WheelVersionOutputDto, session?: WheelSessionOutputDto | null): SingleWheelState | void => ({
  id: wheel.id,
    categories: wheel.categorySnapshots.map((cat, index: number) => ({
    id: cat.categoryId,
    name: cat.label,
      description: cat.description || '',
    color: cat.color,
    order: index,
    score: session?.scores.find((s) => s.categoryId === cat.categoryId)?.value ?? 0,
  })),
  name: wheel.name,
  descriptionKey: 0,
  wheelKey: 0,
  focus: session ? session.focusAtSubmit : wheel.focusIds,
  focusLoading: false,
  loading: false,
});
