import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface MapperField {
  name: string;
  sampleValue?: string;
  label?: string;
  required?: boolean;
  mappedTo?: string;
}

@Component({
  selector: 'app-mapper',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './mapper.component.html',
  styleUrls: ['./mapper.component.css']
})
export class MapperComponent {
  // Datos simulados de la base de datos origen
  sourceFields: MapperField[] = [
    { name: 'num_documento', sampleValue: '10203040' },
    { name: 'p_nombre', sampleValue: 'JUAN' },
    { name: 's_nombre', sampleValue: 'CARLOS' },
    { name: 'p_apellido', sampleValue: 'PEREZ' },
    { name: 'fecha_afi', sampleValue: '2023-01-15' }
  ];

  // Datos simulados de la estructura XSD
  targetFields: MapperField[] = [
    { label: 'Identificación', required: true, mappedTo: '' },
    { label: 'Primer Nombre', required: true, mappedTo: '' },
    { label: 'Segundo Nombre', required: false, mappedTo: '' },
    { label: 'Primer Apellido', required: true, mappedTo: '' },
    { label: 'Fecha Afiliación', required: true, mappedTo: '' }
  ];

  testMapping() {
    console.log('Probando mapeo contra datos reales...');
    // Lógica para invocar al backend y ver vista previa
  }

  saveMapping() {
    console.log('Guardando configuración de mapeo...');
    // Lógica para persistir en Supabase
  }
}
