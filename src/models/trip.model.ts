
export interface Restaurante {
  nombre: string;
  tipo_cocina: string;
  mapa_url?: string;
}

export interface Activity {
  nombre: string;
  coordenadas: {
    lat: number;
    lng: number;
  };
  emoji: string;
}

export interface Trip {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string;
  presupuesto: 'Bajo' | 'Medio' | 'Alto';
  dias_totales: number;
  coordenadas: {
    lat: number;
    lng: number;
  };
  plan: DayPlan[];
  imageUrl: string;
}

export interface DayPlan {
  dia: number;
  titulo_dia: string;
  actividades: Activity[];
  restaurantes?: Restaurante[];
}
