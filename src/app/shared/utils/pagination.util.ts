import { computed, signal, Signal } from '@angular/core';

export interface PaginationState {
  limit: number;
  offset: number;
}

export interface PaginationConfig {
  initialLimit?: number;
  onChange?: () => void;
}

export function createPaginationState(total: Signal<number>, config: PaginationConfig = {}) {
  const { initialLimit = 10, onChange } = config;

  const pagination = signal<PaginationState>({
    limit: initialLimit,
    offset: 0,
  });

  const pageFrom = computed(() => {
    const offset = pagination().offset;
    return total() === 0 ? 0 : offset + 1;
  });

  const pageTo = computed(() => {
    const { offset, limit } = pagination();
    return Math.min(offset + limit, total());
  });

  const canPrev = computed(() => pagination().offset > 0);

  const canNext = computed(() => {
    const { offset, limit } = pagination();
    return offset + limit < total();
  });

  const nextPage = () => {
    if (!canNext()) return;
    pagination.update((p) => ({ ...p, offset: p.offset + p.limit }));
    onChange?.();
  };

  const prevPage = () => {
    if (!canPrev()) return;
    pagination.update((p) => ({ ...p, offset: Math.max(0, p.offset - p.limit) }));
    onChange?.();
  };

  const changeLimit = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    const newLimit = parseInt(target.value, 10);
    pagination.set({ limit: newLimit, offset: 0 });
    onChange?.();
  };

  const resetToFirstPage = () => {
    pagination.update((p) => ({ ...p, offset: 0 }));
  };

  return {
    pagination,
    pageFrom,
    pageTo,
    canPrev,
    canNext,
    nextPage,
    prevPage,
    changeLimit,
    resetToFirstPage,
  };
}
