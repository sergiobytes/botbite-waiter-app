import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { IconsService } from '../../../core/services/icons.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';

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

  downloadPdf() {
    const url = this.pdfUrl();
    if (!url) return;

    const link = document.createElement('a');
    link.href = url;

    // Usar el valor de menuName como nombre del archivo con extensión .pdf
    const fileName = `${this.menuName()}.pdf`;
    link.download = fileName;

    link.click();

    console.log('Archivo descargado:', { link, url, fileName });
  }

  onPdfError() {
    this.pdfLoadError.set(true);
  }
}
