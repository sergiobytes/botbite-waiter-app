import { inject } from '@angular/core';
import { Router, UrlTree, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export type UserRole = 'SUPER' | 'ADMIN' | 'USER' | 'CLIENT';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  SUPER: 4,
  ADMIN: 3,
  CLIENT: 2,
  USER: 1,
};

function hasRequiredRole(userRoles: string[] | null | undefined, requiredRole: UserRole): boolean {
  if (!userRoles?.length) return false;

  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return userRoles.some((role) => {
    const normalizedRole = role.toUpperCase() as UserRole;
    const userLevel = ROLE_HIERARCHY[normalizedRole];
    return userLevel >= requiredLevel;
  });
}

export function createRolesGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const user = auth.user();
    if (user && hasRequiredRole(user.roles, requiredRole)) return true;

    if (!user && auth.isAuthenticated()) {
      return new Promise<boolean | UrlTree>((resolve) => {
        auth.loadProfile().subscribe({
          next: (profile) =>
            resolve(
              hasRequiredRole(profile.roles, requiredRole)
                ? true
                : router.navigateByUrl('/dashboard/home')
            ),
          error: () => resolve(router.navigateByUrl('/login')),
        });
      });
    }

    return router.navigateByUrl('/login');
  };
}

// Guards predefinidos para cada rol
export const superGuard = createRolesGuard('SUPER');
export const adminGuard = createRolesGuard('ADMIN');
export const userGuard = createRolesGuard('USER');
export const clientGuard = createRolesGuard('CLIENT');

// Función helper para verificar roles específicos (uso en componentes)
export function hasRole(userRoles: string[], role: UserRole): boolean {
  return hasRequiredRole(userRoles, role);
}
