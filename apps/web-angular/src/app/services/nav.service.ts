import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { AuthService, UserProfile } from './auth.service';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class NavService {
  private navItemsSubject = new BehaviorSubject<NavItem[]>([]);

  constructor(private authService: AuthService) {
    this.authService.userProfile$.subscribe(profile => {
      this.generateMenu(profile);
    });
  }

  get navItems$(): Observable<NavItem[]> {
    return this.navItemsSubject.asObservable();
  }

  private generateMenu(profile: UserProfile | null) {
    const menu: NavItem[] = [
      { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' }
    ];

    if (!profile) {
      this.navItemsSubject.next(menu);
      return;
    }

    // Menú según rol
    if (profile.rol === 'ADMIN') {
      menu.push(
        { label: 'Usuarios', icon: 'people', route: '/admin/users' },
        { label: 'Configuración', icon: 'settings', route: '/admin/settings' }
      );
    }

    if (profile.rol === 'PREPARADOR' || profile.rol === 'ADMIN') {
      menu.push({ label: 'Carga de Datos', icon: 'cloud_upload', route: '/upload' });
    }

    if (profile.rol === 'REVISOR' || profile.rol === 'ADMIN') {
      menu.push({ label: 'Revisión Técnica', icon: 'fact_check', route: '/review' });
    }

    if (profile.rol === 'APROBADOR' || profile.rol === 'ADMIN') {
      menu.push({ label: 'Firma y Envío', icon: 'draw', route: '/approve' });
    }

    this.navItemsSubject.next(menu);
  }
}
