import { Component, ChangeDetectionStrategy, output, inject, input, OnInit } from '@angular/core';
import { TripService } from '../../services/trip.service';
import { FormsModule } from '@angular/forms';
import { Trip } from '../../models/trip.model';

@Component({
  selector: 'app-trip-creator',
  templateUrl: './trip-creator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule]
})
export class TripCreatorComponent implements OnInit {
  close = output<void>();
  tripToEdit = input<Trip | undefined>();
  
  tripService = inject(TripService);
  isLoading = this.tripService.isLoading;
  error = this.tripService.error;
  isGeminiConfigured = this.tripService.isGeminiConfigured;

  isEditMode = false;

  tripDetails = {
    location: '',
    days: 5,
    budget: 'Medio' as 'Bajo' | 'Medio' | 'Alto'
  };

  ngOnInit() {
    const trip = this.tripToEdit();
    if (trip) {
      this.isEditMode = true;
      this.tripDetails = {
        location: trip.ubicacion,
        days: trip.dias_totales,
        budget: trip.presupuesto
      };
    }
  }

  async handleSubmit() {
    if (!this.isFormValid()) return;

    if (this.isEditMode && this.tripToEdit()) {
      await this.tripService.updateTrip(
        this.tripToEdit()!.id,
        this.tripDetails.location,
        this.tripDetails.days,
        this.tripDetails.budget
      );
    } else {
      await this.tripService.createTrip(
        this.tripDetails.location,
        this.tripDetails.days,
        this.tripDetails.budget
      );
    }
    
    if (!this.error()) {
      this.close.emit();
    }
  }

  isFormValid(): boolean {
    return this.tripDetails.location.trim() !== '' && this.tripDetails.days > 0;
  }

  closeCreator() {
    this.close.emit();
  }
}
