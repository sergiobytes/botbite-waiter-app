import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard, superGuard, userGuard } from './core/guards/roles.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login-component/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/layout/shell-component/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/dashboard/home-component/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'categories',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/dashboard/categories-component/categories.component').then(
            (m) => m.CategoriesComponent
          ),
      },
      {
        path: 'restaurants',
        loadComponent: () =>
          import('./features/dashboard/restaurants-component/restaurants.component').then(
            (m) => m.RestaurantsComponent
          ),
      },
      {
        path: 'branches',
        loadComponent: () =>
          import('./features/dashboard/branches-component/branches.component').then(
            (m) => m.BranchesComponent
          ),
      },
    ],
  },
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  { path: '**', redirectTo: '/login' },
];
