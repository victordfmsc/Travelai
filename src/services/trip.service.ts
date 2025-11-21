import { Injectable, signal, computed } from '@angular/core';
import { Trip } from '../models/trip.model';
import { GeminiService } from './gemini.service';

@Injectable({ providedIn: 'root' })
export class TripService {
  private _trips = signal<Trip[]>([]);
  public trips = this._trips.asReadonly();
  public isLoading = signal(false);
  public error = signal<string | null>(null);
  public mapSelectedTripId = signal<string | null>(null);
  
  public readonly isGeminiConfigured = computed(() => this.geminiService.isConfigured());

  constructor(private geminiService: GeminiService) {}

  selectTripFromMap(tripId: string | null): void {
    this.mapSelectedTripId.set(tripId);
  }

  async createTrip(location: string, days: number, budget: 'Bajo' | 'Medio' | 'Alto'): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const generatedData = await this.geminiService.generateTrip(location, days, budget);
      
      let imageUrl = `https://picsum.photos/seed/${crypto.randomUUID()}/800/600`; // Fallback image

      try {
        const imagePrompt = `Una hermosa fotografía de alta calidad para un blog de viajes de "${generatedData.titulo}" en ${generatedData.ubicacion}. Estilo cinematográfico, colores vibrantes, muy detallada.`;
        const base64ImageBytes = await this.geminiService.generateTripImage(imagePrompt);
        imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      } catch (imageError) {
        console.warn('Could not generate trip image, using fallback.', imageError);
      }
      
      const newTrip: Trip = {
        id: crypto.randomUUID(),
        titulo: generatedData.titulo,
        descripcion: generatedData.descripcion,
        ubicacion: generatedData.ubicacion,
        presupuesto: budget,
        dias_totales: days,
        coordenadas: generatedData.coordenadas,
        plan: generatedData.plan,
        imageUrl: imageUrl
      };
      
      this._trips.update(currentTrips => [newTrip, ...currentTrips]);

    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  async updateTrip(tripId: string, location: string, days: number, budget: 'Bajo' | 'Medio' | 'Alto'): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const generatedData = await this.geminiService.generateTrip(location, days, budget);
      
      let imageUrl = `https://picsum.photos/seed/${crypto.randomUUID()}/800/600`; // Fallback image

      try {
        const imagePrompt = `Una hermosa fotografía de alta calidad para un blog de viajes de "${generatedData.titulo}" en ${generatedData.ubicacion}. Estilo cinematográfico, colores vibrantes, muy detallada.`;
        const base64ImageBytes = await this.geminiService.generateTripImage(imagePrompt);
        imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      } catch (imageError) {
        console.warn('Could not generate trip image, using fallback.', imageError);
      }
      
      const updatedTrip: Trip = {
        id: tripId, // Keep the original ID
        titulo: generatedData.titulo,
        descripcion: generatedData.descripcion,
        ubicacion: generatedData.ubicacion,
        presupuesto: budget,
        dias_totales: days,
        coordenadas: generatedData.coordenadas,
        plan: generatedData.plan,
        imageUrl: imageUrl
      };
      
      this._trips.update(currentTrips => {
        const index = currentTrips.findIndex(t => t.id === tripId);
        if (index !== -1) {
          const newTrips = [...currentTrips];
          newTrips[index] = updatedTrip;
          return newTrips;
        }
        return currentTrips;
      });

    } catch (e: any) {
      this.error.set(e.message || 'An unknown error occurred.');
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }
}
