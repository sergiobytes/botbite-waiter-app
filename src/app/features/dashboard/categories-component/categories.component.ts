import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CategoriesService } from '../../../core/services/categories.service';
import { OrgService } from '../../../core/services/org.service';
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
  private org = inject(OrgService);

  loading = signal(false);
  saving = signal(false);
  mode = signal<Mode>(null);

  target = signal<Category[]>([]);
  confirming = signal(false);

  categoriesList = () => this.categories.categories();
}
