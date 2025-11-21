import { Component, ChangeDetectionStrategy, input, output, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Trip, Activity } from '../../models/trip.model';

// Declare google for TypeScript
declare const google: any;

@Component({
  selector: 'app-activity-map',
  templateUrl: './activity-map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityMapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  trip = input.required<Trip>();
  close = output<void>();
  
  map: any; // google.maps.Map
  infoWindow: any; // google.maps.InfoWindow

  ngAfterViewInit(): void {
    this.initMap();
  }

  async initMap() {
    // Wait for Google Maps script to load
    if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
      setTimeout(() => this.initMap(), 100); // Retry after 100ms
      return;
    }

    const { Map } = await google.maps.importLibrary("maps");

    this.map = new Map(this.mapContainer.nativeElement, {
      center: this.trip().coordenadas,
      zoom: 12,
      mapId: 'AI_TRAVEL_ACTIVITY_MAP',
      disableDefaultUI: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] }
      ]
    });

    this.infoWindow = new google.maps.InfoWindow({
      disableAutoPan: true,
    });
    
    this.updateMarkers(this.trip());
  }
  
  async updateMarkers(trip: Trip) {
    const allActivities = trip.plan.flatMap(day => day.actividades);
    if (allActivities.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    
    for (const activity of allActivities) {
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      
      const emojiContainer = document.createElement('div');
      emojiContainer.className = 'text-2xl cursor-pointer drop-shadow-md';
      emojiContainer.textContent = activity.emoji;

      const marker = new AdvancedMarkerElement({
        map: this.map,
        position: activity.coordenadas,
        title: activity.nombre,
        content: emojiContainer
      });

      bounds.extend(activity.coordenadas);

      marker.addListener('gmp-mouseover', () => {
        const content = `<div class="font-sans font-semibold p-1">${activity.nombre}</div>`;
        this.infoWindow.setContent(content);
        this.infoWindow.open({
          anchor: marker,
          map: this.map
        });
      });
      
      marker.addListener('gmp-mouseout', () => {
        this.infoWindow.close();
      });
    }

    if (this.map) {
      if (allActivities.length > 1) {
        this.map.fitBounds(bounds, 80); // 80px padding
      } else {
        this.map.setCenter(allActivities[0].coordenadas);
        this.map.setZoom(14);
      }
    }
  }

  onClose() {
    this.close.emit();
  }
}
