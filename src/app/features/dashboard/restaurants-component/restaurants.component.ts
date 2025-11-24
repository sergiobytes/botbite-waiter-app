import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, EMPTY, finalize } from 'rxjs';
import { OrgService } from '../../../core/services/org.service';
import { RestaurantsService } from '../../../core/services/restaurants.service';
import { Mode } from '../../../core/services/types/common.types';
import { Restaurant } from '../../../core/services/types/restaurants.types';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { TitleComponent } from '../../../shared/components/title/title';

interface RestaurantForm {
  readonly id?: string;
  name: string;
  isActive: boolean;
}

@Component({
  selector: 'app-restaurants.component',
  imports: [CommonModule, TitleComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './restaurants.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestaurantsComponent {
  private readonly restaurantsService = inject(RestaurantsService);
  private readonly orgService = inject(OrgService);
  private readonly toastrService = inject(ToastrService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly mode = signal<Mode>(null);
  readonly target = signal<Restaurant | null>(null);
  readonly confirming = signal(false);

  readonly form = signal<RestaurantForm>({
    name: '',
    isActive: true,
  });

  readonly trackById = (_: string, restaurant: Restaurant) => restaurant.id;

  readonly restaurants = computed(() => this.orgService.restaurants());

  readonly modalTitle = computed(() => {
    return this.mode() === 'create' ? 'Nuevo restaurante' : 'Editar restaurante';
  });

  readonly isFormValid = computed(() => {
    const f = this.form();
    return f.name.trim() !== '';
  });

  openCreate(): void {
    this.mode.set('create');
    this.form.set({ name: '', isActive: true });
  }

  openEdit(restaurant: Restaurant): void {
    this.mode.set('edit');
    this.form.set({
      id: restaurant.id,
      name: restaurant.name,
      isActive: restaurant.isActive,
    });
  }

  closeModal(): void {
    this.mode.set(null);
    this.form.set({ name: '', isActive: true });
  }

  save(): void {
    const formValue = this.form();

    if (!formValue.name.trim()) return;

    this.saving.set(true);

    const restaurantData: Partial<Restaurant> = {
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
          this.toastrService.error('No se pudo guardar el restaurante');
          return EMPTY;
        }),
        finalize(() => this.saving.set(false))
      )
      .subscribe(() => {
        this.toastrService.success('Restaurante guardado correctamente');
        this.mode.set(null);
      });
  }

  confirmDisable(restaurant: Restaurant): void {
    this.target.set(restaurant);
    this.confirming.set(true);
  }

  closeConfirmation(): void {
    this.confirming.set(false);
    this.target.set(null);
  }

  disable(): void {
    const targetRestaurant = this.target();
    if (!targetRestaurant?.id) return;

    this.restaurantsService
      .updateRestaurant(targetRestaurant.id, { isActive: false })
      .pipe(
        catchError((error) => {
          console.error('Error disabling restaurant:', error);
          this.toastrService.error('No se pudo deshabilitar el restaurante');
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.toastrService.success('Restaurante deshabilitado correctamente');
        this.confirming.set(false);
        this.target.set(null);
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
}
