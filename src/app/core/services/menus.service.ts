import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { OrgService } from './org.service';
import { environment } from '../../../environments/environment';
import {
  Menu,
  MenuItem,
  MenuItemListResponse,
  MenuItemResponse,
  MenuListResponse,
  MenuResponse,
} from './types/menus.types';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenusService {
  private readonly http = inject(HttpClient);
  private readonly orgService = inject(OrgService);
  private readonly apiUrl = environment.apiBaseUrl;

  createMenu(newMenu: Partial<Menu>): Observable<Menu> {
    const branchId = this.orgService.selectedBranchId();

    if (!branchId) throw new Error('No branch selected');

    return this.http
      .post<MenuResponse>(`${this.apiUrl}/menus/${branchId}`, newMenu)
      .pipe(map((response) => response.menu));
  }

  createMenuItem(menuId: string, newMenuItem: Partial<MenuItem>): Observable<MenuItem> {
    return this.http
      .post<MenuItemResponse>(`${this.apiUrl}/menus/${menuId}/items`, newMenuItem)
      .pipe(map((res) => res.menuItem));
  }

  findMenusByBranch(params: {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Observable<Menu[]> {
    const branchId = this.orgService.selectedBranchId();

    if (!branchId) throw new Error('No branch selected');

    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http
      .get<MenuListResponse>(`${this.apiUrl}/menus/${branchId}`, { params: httpParams })
      .pipe(map((response) => response.menus));
  }

  findItemsByMenu(
    menuId: string,
    params: {
      search?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Observable<MenuItem[]> {
    let httpParams = new HttpParams();

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.offset !== undefined) {
      httpParams = httpParams.set('offset', params.offset.toString());
    }

    return this.http
      .get<MenuItemListResponse>(`${this.apiUrl}/menus/${menuId}/items`, { params: httpParams })
      .pipe(map((response) => response.items));
  }

  findOneMenu(menuId: string): Observable<Menu> {
    return this.http
      .get<MenuResponse>(`${this.apiUrl}/menus/menu/${menuId}`)
      .pipe(map((response) => response.menu));
  }

  updateMenu(menuId: string, updatedMenu: Partial<Menu>): Observable<Menu> {
    return this.http
      .patch<MenuResponse>(`${this.apiUrl}/menus/menu/${menuId}`, updatedMenu)
      .pipe(map((response) => response.menu));
  }

  updateMenuItem(menuId: string, itemId: string): Observable<MenuItem> {
    return this.http
      .patch<MenuItemResponse>(`${this.apiUrl}/menus/${menuId}/items/${itemId}`, {})
      .pipe(map((response) => response.menuItem));
  }

  removeMenu(menuId: string): Observable<Menu> {
    return this.http
      .delete<MenuResponse>(`${this.apiUrl}/menus/menu/${menuId}`)
      .pipe(map((response) => response.menu));
  }

  removeMenuItem(menuId: string, itemId: string): Observable<MenuItem> {
    return this.http
      .delete<MenuItemResponse>(`${this.apiUrl}/menus/menu/${menuId}/items/${itemId}`)
      .pipe(map((response) => response.menuItem));
  }
}
