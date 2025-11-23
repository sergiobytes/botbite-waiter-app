import { DestroyRef, inject, signal } from '@angular/core';
import { debounceTime, Subject } from 'rxjs';

export interface SearchConfig {
  debounceMs?: number;
  onSearch?: (term: string) => void;
}

export function createSearchState(config: SearchConfig = {}) {
  const { debounceMs = 300, onSearch } = config;
  const destroyRef = inject(DestroyRef);

  const searchTerm = signal<string>('');
  const searchSubject = new Subject<string>();

  const subscription = searchSubject.pipe(debounceTime(debounceMs)).subscribe((term) => {
    searchTerm.set(term);
    onSearch?.(term);
  });

  destroyRef.onDestroy(() => subscription.unsubscribe());

  const updateSearch = (event: Event) => {
    const value = (event.target as HTMLInputElement).value;
    searchSubject.next(value);
  };

  return {
    searchTerm,
    updateSearch,
  };
}
