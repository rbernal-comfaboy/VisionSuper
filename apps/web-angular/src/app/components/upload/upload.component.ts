import { Component } from '@nestjs/common';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  isDragging = false;
  uploadProgress = 0;
  isUploading = false;
  rowsProcessed = 0;

  units = [
    { id: 'VIV', name: 'Vivienda' },
    { id: 'EDU', name: 'Educación' },
    { id: 'FIN', name: 'Financiera' }
  ];

  chapters = [
    { id: 'CAP_II', name: 'Capítulo II - Estadística' },
    { id: 'CAP_III', name: 'Capítulo III - Financiero' }
  ];

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave() {
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    this.isUploading = true;
    this.uploadProgress = 0;
    
    // Simulación de subida
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.isUploading = false;
        this.rowsProcessed = Math.floor(Math.random() * 500) + 100;
      }
    }, 200);
  }
}
