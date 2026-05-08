import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NavService, NavItem } from '../../services/nav.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.css']
})
export class ShellComponent {
  navItems$: Observable<NavItem[]>;
  userProfile$: Observable<UserProfile | null>;

  constructor(
    private navService: NavService,
    private authService: AuthService
  ) {
    this.navItems$ = this.navService.navItems$;
    this.userProfile$ = this.authService.userProfile$;
  }

  onLogout() {
    this.authService.logout();
  }
}
