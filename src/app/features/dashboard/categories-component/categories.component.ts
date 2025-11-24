import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize } from 'rxjs';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/services/types/category.types';
import { Mode } from '../../../core/services/types/common.types';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { TitleComponent } from '../../../shared/components/title/title';

interface CategoryForm {
  readonly id?: number;
  name: string;
  isActive: boolean;
}

@Component({
  selector: 'app-categories',
  imports: [CommonModule, TitleComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly toastrService = inject(ToastrService);

  readonly saving = signal(false);
  readonly mode = signal<Mode>(null);
  readonly confirming = signal(false);
  readonly target = signal<Category | null>(null);

  readonly form = signal<CategoryForm>({
    name: '',
    isActive: true,
  });

  readonly loading = signal(false);
  readonly categoriesList = signal<Category[]>([]);

  readonly modalTitle = computed(() => {
    return this.mode() === 'create' ? 'Nueva categoría' : 'Editar categoría';
  });

  readonly isFormValid = computed(() => {
    const f = this.form();
    return f.name.trim() !== '';
  });

  constructor() {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.loading.set(true);

    this.categoriesService
      .getCategories()
      .pipe(
        catchError((error) => {
          console.error('Error loading categories:', error);
          this.toastrService.error('No se pudieron cargar las categorías');
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
      isActive: Boolean(category.isActive),
    });
  }

  closeModal(): void {
    this.mode.set(null);
    this.form.set({ name: '', isActive: true });
  }

  save(): void {
    const formValue = this.form();
    if (!formValue.name.trim()) {
      this.toastrService.warning('El nombre de la categoría es obligatorio');
      return;
    }

    this.saving.set(true);

    const categoryData: Partial<Category> = {
      name: formValue.name.trim().toUpperCase(),
      isActive: formValue.isActive,
    };

    const operation =
      this.mode() === 'create'
        ? this.categoriesService.createCategory(categoryData)
        : this.categoriesService.updateCategory(formValue.id!, categoryData);

    operation
      .pipe(
        catchError((error) => {
          console.error('Error saving category:', error);
          this.toastrService.error('Error al guardar la categoría');
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => {
        this.toastrService.success('Categoría guardada correctamente');
        this.closeModal();
        this.loadCategories();
      });
  }

  confirmDisable(category: Category): void {
    this.target.set(category);
    this.confirming.set(true);
  }

  closeConfirmation(): void {
    this.confirming.set(false);
    this.target.set(null);
  }

  disable(): void {
    const targetCategory = this.target();
    if (!targetCategory?.id) return;

    this.categoriesService
      .updateCategory(targetCategory.id, { isActive: false })
      .pipe(
        catchError((error) => {
          console.error('Error disabling category:', error);
          this.toastrService.error('Error al deshabilitar la categoría');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastrService.success('Categoría deshabilitada correctamente');
        this.confirming.set(false);
        this.target.set(null);
        this.loadCategories();
      });
  }

  updateFormName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.update((form) => ({ ...form, name: input.value }));
  }

  updateFormActive(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.update((form) => ({ ...form, isActive: input.checked }));
  }

  handleSave(): void {
    this.save();
  }
}
