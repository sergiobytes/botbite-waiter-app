import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize } from 'rxjs';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/services/types/category.types';

type Mode = 'create' | 'edit' | null;

interface CategoryForm {
  readonly id?: number;
  name: string;
  isActive: boolean;
}

@Component({
  selector: 'app-categories',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly toastService = inject(ToastrService);

  // State signals
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<Mode>(null);
  readonly target = signal<Category | null>(null);
  readonly confirming = signal(false);
  readonly categoriesList = signal<Category[]>([]);

  // Form state
  readonly form = signal<CategoryForm>({
    name: '',
    isActive: true,
  });

  // Computed properties
  readonly hasCategories = computed(() => this.categoriesList().length > 0);
  readonly isModalOpen = computed(() => this.mode() !== null);

  // Readonly methods
  readonly trackById = (_: number, category: Category) => category.id;

  constructor() {
    this.loadCategories();
  }

  private readonly debouncedReload = (() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => this.loadCategories(), 300);
    };
  })();

  private loadCategories(): void {
    this.loading.set(true);

    this.categoriesService.getCategories()
      .pipe(
        catchError((error) => {
          console.error('Error loading categories:', error);
          this.toastService.error('No se pudieron cargar las categorías');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((categories: Category[]) => {
        this.categoriesList.set(categories);
      });
  }

  openCreate(): void {
    this.mode.set('create');
    this.form.set({ name: '', isActive: true });
  }

  openEdit(category: Category): void {
    this.mode.set('edit');
    this.form.set({
      id: category.id,
      name: category.name,
      isActive: Boolean(category.isActive)
    });
  }

  save(): void {
    const formValue = this.form();
    if (!formValue.name.trim()) return;

    this.saving.set(true);

    const categoryData: Partial<Category> = {
      name: formValue.name.trim().toUpperCase(),
      isActive: formValue.isActive,
    };

    const operation = this.mode() === 'create'
      ? this.categoriesService.createCategory(categoryData)
      : this.categoriesService.updateCategory(formValue.id!, categoryData);

    operation
      .pipe(
        catchError((error) => {
          console.error('Error saving category:', error);
          this.toastService.error('Error al guardar la categoría');
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => {
        this.toastService.success('Categoría guardada correctamente');
        this.closeModal();
        this.loadCategories();
      });
  }

  delete(): void {
    const targetCategory = this.target();
    if (!targetCategory?.id) return;

    this.categoriesService.removeCategory(targetCategory.id)
      .pipe(
        catchError((error) => {
          console.error('Error deleting category:', error);
          this.toastService.error('Error al eliminar la categoría');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastService.success('Categoría eliminada correctamente');
        this.confirming.set(false);
        this.target.set(null);
        this.loadCategories();
      });
  }

  closeModal(): void {
    this.mode.set(null);
    this.form.set({ name: '', isActive: true });
  }

  confirmDelete(category: Category): void {
    this.target.set(category);
    this.confirming.set(true);
  }

  updateFormName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.update(form => ({ ...form, name: input.value }));
  }

  updateFormActive(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.update(form => ({ ...form, isActive: input.checked }));
  }
}
