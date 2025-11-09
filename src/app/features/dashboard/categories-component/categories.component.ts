import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CategoriesService } from '../../../core/services/categories.service';
import { Category } from '../../../core/services/types/category.types';

type Mode = 'create' | 'edit' | null;

@Component({
  selector: 'app-categories.component',
  imports: [CommonModule, FormsModule],
  templateUrl: './categories.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private categories = inject(CategoriesService);
  private toast = inject(ToastrService);

  loading = signal(false);
  saving = signal(false);
  mode = signal<Mode>(null);

  target = signal<Category | null>(null);
  confirming = signal(false);

  categoriesList = signal<Category[]>([]);

  form: { id?: number; name: string; isActive?: boolean } = {
    name: '',
    isActive: true,
  };

  trackById = (_: number, c: Category) => c.id;

  constructor() {
    this.reload();
  }

  debouncedReload = (() => {
    let t: any;
    return () => {
      clearTimeout(t);
      t = setTimeout(() => this.reload(), 300);
    };
  })();

  reload() {
    this.loading.set(true);
    this.categories.getCategories().subscribe({
      next: (rows) => {
        this.categoriesList.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar las categorías');
        this.loading.set(false);
      },
    });
  }

  openCreate() {
    this.mode.set('create');
    this.form = { name: '', isActive: true };
  }

  openEdit(c: Category) {
    this.mode.set('edit');
    this.form = { id: c.id, name: c.name, isActive: !!c.isActive };
  }

  save() {
    if (!this.form.name.trim()) return;
    this.saving.set(true);

    const base: Partial<Category> = {
      name: this.form.name.trim().toUpperCase(),
      isActive: this.form.isActive,
    };

    const obs =
      this.mode() === 'create'
        ? this.categories.createCategory(base)
        : this.categories.updateCategory(this.form.id!, base);

    obs.subscribe({
      next: () => {
        this.toast.success('Categoría guardada');
        this.saving.set(false);
        this.mode.set(null);
        this.reload();
      },
    });
  }

  delete() {
    const id = this.target()!.id;
    if (!id) return;
    this.categories.removeCategory(id).subscribe({
      next: () => {
        this.toast.success('Categoría eliminada');
        this.confirming.set(false);
        this.target.set(null);
        this.reload();
      },
    });
  }

  closeModal() {
    this.mode.set(null);
  }

  confirmDelete(c: Category) {
    this.target.set(c);
    this.confirming.set(true);
  }
}
