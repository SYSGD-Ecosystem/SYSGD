import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-generales-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generales-section.component.html',
  styleUrl: './generales-section.component.css'
})
export class GeneralesSectionComponent {
  @Input({ required: true }) generalesForm!: FormGroup;
  @Input({ required: true }) provinces!: string[];
  @Input({ required: true }) fiscalMunicipios!: string[];
  @Input({ required: true }) legalMunicipios!: string[];

  @Output() saveGenerales = new EventEmitter<void>();
}
