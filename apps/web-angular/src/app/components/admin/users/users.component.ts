import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent {
  displayedColumns: string[] = ['nombre', 'rol', 'unidad', 'acciones'];
  
  // Data Mock para visualización inicial
  users = [
    { nombre_completo: 'Carlos Rodríguez', rol: 'ADMIN', unidad_id: 'Sede Central' },
    { nombre_completo: 'Ana María López', rol: 'APROBADOR', unidad_id: 'Vivienda' },
    { nombre_completo: 'Jorge Martínez', rol: 'REVISOR', unidad_id: 'Crédito' },
    { nombre_completo: 'Lucía Fernández', rol: 'PREPARADOR', unidad_id: 'Recreación' }
  ];
}
