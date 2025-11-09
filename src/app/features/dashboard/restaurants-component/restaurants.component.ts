import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { RestaurantsService } from '../../../core/services/restaurants.service';
import { OrgService } from '../../../core/services/org.service';
import { Mode } from '../../../core/services/types/common.types';
import { RestaurantDetails } from '../../../core/services/types/org.types';
import { catchError, EMPTY, finalize, tap } from 'rxjs';

interface RestaurantForm {
  readonly id?: string;
  name: string;
  isActive: boolean;
}

@Component({
  selector: 'app-restaurants.component',
  imports: [CommonModule],
  templateUrl: './restaurants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsComponent {
  private readonly restaurantsService = inject(RestaurantsService);
  private readonly orgService = inject(OrgService);
  private readonly toastService = inject(ToastrService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<Mode>(null);
  readonly target = signal<RestaurantDetails | null>(null);
  readonly confirming = signal(false);

  readonly form = signal<RestaurantForm>({
    name: '',
    isActive: true,
  });

  readonly trackById = (_: string, restaurant: RestaurantDetails) => restaurant.id;

  // Computed signal reactivo en lugar de getter
  readonly restaurants = computed(() => this.orgService.restaurants());

  openCreate(): void {
    this.mode.set('create');
    this.form.set({ name: '', isActive: true });
  }

  openEdit(restaurant: RestaurantDetails): void {
    this.mode.set('edit');
    this.form.set({
      id: restaurant.id,
      name: restaurant.name,
      isActive: restaurant.isActive,
    });
  }

  save(): void {
    const formValue = this.form();

    if (!formValue.name.trim()) return;

    this.saving.set(true);

    const restaurantData: Partial<RestaurantDetails> = {
      name: formValue.name.trim(),
      isActive: formValue.isActive,
    };

    const operation =
      this.mode() === 'create'
        ? this.restaurantsService.createRestaurant(restaurantData)
        : this.restaurantsService.updateRestaurant(formValue.id!, restaurantData);

    operation
      .pipe(
        catchError((error) => {
          console.error('Error saving restaurant:', error);
          this.toastService.error('No se pudo guardar el restaurante');
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => {
        this.toastService.success('Restaurante guardado correctamente');
        this.mode.set(null);
      });
  }

  delete(): void {
    const targetRestaurant = this.target();
    if (!targetRestaurant?.id) return;

    this.restaurantsService
      .removeRestaurant(targetRestaurant.id)
      .pipe(
        catchError((error) => {
          console.error('Error deleting restaurant:', error);
          this.toastService.error('No se pudo eliminar el restaurante');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastService.success('Restaurante eliminado correctamente');
        this.confirming.set(false);
        this.target.set(null);
      });
  }

  closeModal(): void {
    this.mode.set(null);
    this.form.set({ name: '', isActive: true });
  }

  confirmDelete(restaurant: RestaurantDetails): void {
    this.target.set(restaurant);
    this.confirming.set(true);
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
