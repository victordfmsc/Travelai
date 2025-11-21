import { Component, ChangeDetectionStrategy, inject, output, signal, computed, effect, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { TripService } from '../../services/trip.service';
import { Trip } from '../../models/trip.model';

// Declare google for TypeScript
declare const google: any;

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  
  tripService = inject(TripService);
  trips = this.tripService.trips;
  isLoading = this.tripService.isLoading;
  tripSelected = output<string>();

  budgetOptions: Array<'Todos' | 'Bajo' | 'Medio' | 'Alto'> = ['Todos', 'Bajo', 'Medio', 'Alto'];
  budgetFilter = signal<'Todos' | 'Bajo' | 'Medio' | 'Alto'>('Todos');

  map: any; // google.maps.Map
  markers: any[] = []; // google.maps.marker.AdvancedMarkerElement[]
  infoWindow: any; // google.maps.InfoWindow

  filteredTrips = computed(() => {
    const filter = this.budgetFilter();
    if (filter === 'Todos') {
      return this.trips();
    }
    return this.trips().filter(trip => trip.presupuesto === filter);
  });

  constructor() {
    effect(() => {
      // This effect will run whenever the filtered trips change
      if (this.map) {
        this.updateMarkers(this.filteredTrips());
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    // Clean up markers and listeners if component is destroyed
    this.clearMarkers();
  }
  
  async initMap() {
    // Wait for Google Maps script to load
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      setTimeout(() => this.initMap(), 100); // Retry after 100ms
      return;
    }
    
    const { Map } = await google.maps.importLibrary("maps");
    
    this.map = new Map(this.mapContainer.nativeElement, {
      center: { lat: 20, lng: 0 }, // Default center
      zoom: 2,
      mapId: 'AI_TRAVEL_PLANNER_MAP',
      disableDefaultUI: true,
      styles: [ 
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      ]
    });

    this.infoWindow = new google.maps.InfoWindow({
      disableAutoPan: true,
      minWidth: 200,
    });
    
    // Initial marker setup
    this.updateMarkers(this.filteredTrips());
  }

  async updateMarkers(trips: Trip[]) {
    this.clearMarkers();

    if (trips.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    for(const trip of trips) {
      const { PinElement } = await google.maps.importLibrary("marker");
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

      const pin = new PinElement({
        scale: 1.2,
        background: this.getPinColor(trip.presupuesto),
        borderColor: '#ffffff',
        glyphColor: '#ffffff',
      });

      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: trip.coordenadas,
        title: trip.titulo,
        content: pin.element,
      });

      bounds.extend(trip.coordenadas);

      marker.addListener('gmp-mouseover', () => {
        const content = `
          <div class="font-sans max-w-[200px]">
            <img src="${trip.imageUrl}" alt="Imagen de ${trip.ubicacion}" class="w-full h-24 object-cover rounded-t-lg">
            <div class="p-2">
              <p class="text-sm font-bold text-gray-800 truncate">${trip.titulo}</p>
              <p class="text-xs text-gray-500">${trip.ubicacion}</p>
            </div>
          </div>
        `;
        this.infoWindow.setContent(content);
        this.infoWindow.open({
          anchor: marker,
          map: this.map,
        });
      });
      
      marker.addListener('gmp-mouseout', () => {
          this.infoWindow.close();
      });

      marker.addListener('click', () => {
        this.onPinClick(trip.id);
      });

      this.markers.push(marker);
    };

    if (this.map) {
      if (trips.length > 1) {
        this.map.fitBounds(bounds, 100); // 100px padding
      } else if (trips.length === 1) {
        this.map.setCenter(trips[0].coordenadas);
        this.map.setZoom(12);
      }
    }
  }

  getPinColor(budget: 'Bajo' | 'Medio' | 'Alto'): string {
    switch (budget) {
      case 'Bajo': return '#10B981'; // Green-500
      case 'Medio': return '#F59E0B'; // Amber-500
      case 'Alto': return '#EF4444'; // Red-500
      default: return '#3B82F6'; // Blue-500
    }
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.map = null);
    this.markers = [];
  }

  setBudgetFilter(budget: 'Todos' | 'Bajo' | 'Medio' | 'Alto') {
    this.budgetFilter.set(budget);
  }

  onPinClick(tripId: string) {
    this.tripSelected.emit(tripId);
  }
}
