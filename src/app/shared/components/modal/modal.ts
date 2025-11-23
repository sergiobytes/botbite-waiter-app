import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  isOpen = input.required<boolean>();
  title = input.required<string>();
  maxWidth = input<string>('max-w-2xl');
  showActions = input<boolean>(true);
  cancelText = input<string>('Cancelar');
  confirmText = input<string>('Guardar');
  loadingText = input<string>('Guardando...');
  loading = input<boolean>(false);
  confirmDisabled = input<boolean>(false);
  closeOnOverlayClick = input<boolean>(true);
  ariaLabelId = input<string>('modal-title');

  close = output<void>();
  cancel = output<void>();
  confirm = output<void>();

  protected containerClasses(): string {
    return `relative bg-white w-full rounded-2xl border border-black/10 p-6 shadow-xl ${this.maxWidth()}`;
  }

  protected handleOverlayClick(): void {
    if (this.closeOnOverlayClick()) {
      this.close.emit();
    }
  }
}
