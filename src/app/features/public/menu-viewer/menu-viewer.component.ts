import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { IconsService } from '../../../core/services/icons.service';

@Component({
  selector: 'app-menu-viewer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, PdfViewerModule],
  templateUrl: './menu-viewer.component.html',
})
export class MenuViewerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly iconsService = inject(IconsService);

  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pdfUrl = signal<string>('');
  readonly menuName = signal<string>('Menú');
  readonly pdfLoadError = signal(false);

  readonly safePdfUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.pdfUrl();
    if (!url) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  ngOnInit() {
    // Obtener parámetros de la URL
    const menuId = this.route.snapshot.paramMap.get('menuId');
    const pdfUrl = this.route.snapshot.queryParamMap.get('url');
    const name = this.route.snapshot.queryParamMap.get('name');

    if (!pdfUrl) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.pdfUrl.set(decodeURIComponent(pdfUrl));
    if (name) {
      this.menuName.set(decodeURIComponent(name));
    }
    this.loading.set(false);
  }

  async downloadPdf() {
    console.log('Método downloadPdf llamado');

    const url = this.pdfUrl();
    if (!url) return;

    const fileName = `${this.menuName()}.pdf`;

    try {
      // Descargar el archivo como blob para poder controlar el nombre
      const response = await fetch(url);
      const blob = await response.blob();

      // Crear una URL local del blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Crear el link de descarga con la URL local
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;

      // Descargar el archivo
      link.click();

      // Liberar la URL del blob después de un momento
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      // Fallback al método anterior si falla
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  }

  onPdfError() {
    this.pdfLoadError.set(true);
  }
}
