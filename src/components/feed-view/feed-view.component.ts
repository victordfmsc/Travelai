import { Component, ChangeDetectionStrategy, inject, signal, effect, computed, output } from '@angular/core';
import { TripService } from '../../services/trip.service';
import { Trip } from '../../models/trip.model';
import { ActivityMapComponent } from '../activity-map/activity-map.component';

@Component({
  selector: 'app-feed-view',
  templateUrl: './feed-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ActivityMapComponent]
})
export class FeedViewComponent {
  tripService = inject(TripService);
  trips = this.tripService.trips;
  isLoading = this.tripService.isLoading;
  selectedTrip = signal<Trip | null>(null);
  mapSelectedTripId = this.tripService.mapSelectedTripId;
  sortState = signal<'none' | 'asc' | 'desc'>('none');
  showActivityMapForTrip = signal<Trip | null>(null);
  editTrip = output<Trip>();

  sortedTrips = computed(() => {
    const sort = this.sortState();
    const currentTrips = this.trips();

    if (sort === 'none') {
      return currentTrips;
    }

    const budgetOrder = { 'Bajo': 1, 'Medio': 2, 'Alto': 3 };
    
    // Create a new array to avoid mutating the original signal's array
    const sorted = [...currentTrips].sort((a, b) => {
      const budgetA = budgetOrder[a.presupuesto];
      const budgetB = budgetOrder[b.presupuesto];
      return sort === 'asc' ? budgetA - budgetB : budgetB - budgetA;
    });

    return sorted;
  });

  constructor() {
    effect(() => {
      const tripId = this.mapSelectedTripId();
      if (tripId) {
        this.sortState.set('none'); // Reset sort to default when selecting from map
        const tripToSelect = this.trips().find(t => t.id === tripId);
        if (tripToSelect) {
          // Directly open the itinerary for the selected trip
          this.selectedTrip.set(tripToSelect);
        }

        // Scroll after a short delay to allow for rendering after view switch
        setTimeout(() => {
          const element = document.getElementById(`trip-${tripId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    });
  }

  selectTrip(trip: Trip) {
    this.selectedTrip.set(this.selectedTrip() === trip ? null : trip);
    this.tripService.selectTripFromMap(null); // Clear map selection on feed interaction
  }

  toggleSort() {
    this.sortState.update(current => {
      if (current === 'none') return 'asc';
      if (current === 'asc') return 'desc';
      return 'none';
    });
  }

  async shareTrip(trip: Trip) {
    const shareData: { title: string; text: string; url?: string; } = {
      title: `Mi viaje: ${trip.titulo}`,
      text: `¡Mira este increíble itinerario para un viaje a ${trip.ubicacion} que he creado con IA!\n\n${trip.descripcion}`,
    };

    // Make URL handling more robust to prevent TypeErrors in navigator.share
    try {
      // This will throw if window.location.href is not a full URL (e.g., just a path)
      const url = new URL(window.location.href);
      if (['http:', 'https:'].includes(url.protocol)) {
        shareData.url = url.href;
      }
    } catch (e) {
      console.warn('Could not construct a valid URL from window.location.href, sharing without URL.');
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // A TypeError could indicate invalid data. Other errors like AbortError are user-initiated.
        if (err instanceof TypeError) {
          console.error('TypeError while sharing:', err, shareData);
        } else {
          console.log('Sharing was cancelled or failed.', err);
        }
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      try {
        const clipboardText = `${shareData.title}\n${shareData.text}${shareData.url ? `\n${shareData.url}`: ''}`;
        await navigator.clipboard.writeText(clipboardText);
        alert('¡Itinerario copiado al portapapeles!');
      } catch (err) {
        console.error('Failed to copy: ', err);
        alert('No se pudo compartir ni copiar el viaje. Por favor, inténtalo manualmente.');
      }
    }
  }

  openActivityMap(trip: Trip) {
    this.showActivityMapForTrip.set(trip);
  }

  closeActivityMap() {
    this.showActivityMapForTrip.set(null);
  }

  onEditTrip(trip: Trip) {
    this.editTrip.emit(trip);
  }
}
