import { computed, effect, signal, Signal, untracked } from '@angular/core';

export interface PaginationState {
  limit: number;
  offset: number;
}

export interface PaginationConfig {
  initialLimit?: number;
  onChange?: () => void;
  loading?: Signal<boolean>;
}

export function createPaginationState(total: Signal<number>, config: PaginationConfig = {}) {
  const { initialLimit = 10, onChange, loading } = config;

  const pagination = signal<PaginationState>({
    limit: initialLimit,
    offset: 0,
  });

  // Mantiene el total anterior mientras carga para evitar parpadeo
  const stableTotal = signal<number>(total());

  if (loading) {
    effect(() => {
      const isLoading = loading();

      if (!isLoading) {
        const currentTotal = total();
        untracked(() => stableTotal.set(currentTotal));
      }
    });
  } else {
    effect(() => {
      stableTotal.set(total());
    });
  }

  const pageFrom = computed(() => {
    const offset = pagination().offset;
    const t = stableTotal();
    return t === 0 ? 0 : offset + 1;
  });

  const pageTo = computed(() => {
    const { offset, limit } = pagination();
    return Math.min(offset + limit, stableTotal());
  });

  const canPrev = computed(() => pagination().offset > 0);

  const canNext = computed(() => {
    const { offset, limit } = pagination();
    return offset + limit < stableTotal();
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
    stableTotal,
    canPrev,
    canNext,
    nextPage,
    prevPage,
    changeLimit,
    resetToFirstPage,
  };
}
