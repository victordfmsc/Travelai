import { Injectable, signal } from '@angular/core';
import { GoogleGenAI, Type, GenerateContentResponse } from '@google/genai';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  
  constructor() {
    // IMPORTANT: This relies on `process.env.API_KEY` being set in the execution environment.
    // Do not modify this to take user input.
    try {
      if (process.env.API_KEY) {
        this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      } else {
        console.error('API_KEY environment variable not found.');
      }
    } catch(e) {
      console.error('Error initializing GoogleGenAI:', e);
    }
  }

  isConfigured(): boolean {
    return this.ai !== null;
  }

  async generateTrip(location: string, days: number, budget: string): Promise<any> {
    if (!this.ai) {
      throw new Error('Gemini API client is not initialized. Please check your API_KEY.');
    }

    const prompt = `Eres un experto planificador de viajes. Crea un itinerario detallado para un viaje a ${location} de ${days} días con un presupuesto ${budget}.
El presupuesto puede ser 'Bajo' (enfocado en actividades gratuitas y comida económica), 'Medio' (una mezcla de atracciones populares y experiencias locales) o 'Alto' (incluyendo experiencias premium y restaurantes de alta gama).
Devuelve la respuesta en formato JSON. El plan debe incluir un título general para el viaje, una descripción corta y atractiva, la ubicación, coordenadas geográficas (lat, lng) para la ubicación principal, y un plan detallado para cada día.
Para cada día, especifica un título para el día (ej. 'Día 1: Explorando el Centro Histórico'), una lista de actividades, y sugiere 1 o 2 restaurantes que encajen con el presupuesto del día.
Para cada actividad, proporciona el nombre, sus coordenadas geográficas (lat, lng) y un emoji de Unicode que represente el tipo de actividad (ej. 🏛️ para un museo, 🍕 para un restaurante).
Para cada restaurante, proporciona su nombre, el tipo de cocina, y una URL de Google Maps para su ubicación.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        titulo: { type: Type.STRING, description: "Título creativo para el viaje." },
        descripcion: { type: Type.STRING, description: "Descripción corta y atractiva del viaje." },
        ubicacion: { type: Type.STRING, description: "La ciudad y país del viaje." },
        coordenadas: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER, description: "Latitud de la ubicación." },
            lng: { type: Type.NUMBER, description: "Longitud de la ubicación." }
          },
          required: ["lat", "lng"]
        },
        plan: {
          type: Type.ARRAY,
          description: "Array con el plan de cada día.",
          items: {
            type: Type.OBJECT,
            properties: {
              dia: { type: Type.INTEGER, description: "Número del día." },
              titulo_dia: { type: Type.STRING, description: "Título temático para el día." },
              actividades: {
                type: Type.ARRAY,
                description: "Lista de actividades para el día.",
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    nombre: { type: Type.STRING, description: "Nombre de la actividad." },
                    coordenadas: {
                      type: Type.OBJECT,
                      properties: {
                        lat: { type: Type.NUMBER, description: "Latitud de la actividad." },
                        lng: { type: Type.NUMBER, description: "Longitud de la actividad." }
                      },
                      required: ["lat", "lng"]
                    },
                    emoji: { type: Type.STRING, description: "Emoji Unicode que representa la actividad." }
                  },
                  required: ["nombre", "coordenadas", "emoji"]
                }
              },
              restaurantes: {
                type: Type.ARRAY,
                description: "Sugerencias de restaurantes para el día, acordes al presupuesto.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nombre: { type: Type.STRING, description: "Nombre del restaurante." },
                    tipo_cocina: { type: Type.STRING, description: "Ej: Italiana, Mexicana, Local." },
                    mapa_url: { type: Type.STRING, description: "URL de Google Maps para el restaurante." }
                  },
                  required: ["nombre", "tipo_cocina"]
                }
              }
            },
            required: ["dia", "titulo_dia", "actividades"]
          }
        }
      },
      required: ["titulo", "descripcion", "ubicacion", "coordenadas", "plan"]
    };

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
          temperature: 0.7,
        },
      });
      
      const jsonString = response.text.trim();
      return JSON.parse(jsonString);

    } catch (error) {
      console.error('Error generating trip with Gemini:', error);
      throw new Error('Failed to generate trip itinerary. The AI model might be overloaded or an error occurred.');
    }
  }

  async generateTripImage(prompt: string): Promise<string> {
    if (!this.ai) {
      throw new Error('Gemini API client is not initialized. Please check your API_KEY.');
    }

    try {
      const response = await this.ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '4:3',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        return response.generatedImages[0].image.imageBytes;
      } else {
        throw new Error('No image was generated by the API.');
      }
    } catch (error) {
      console.error('Error generating image with Gemini:', error);
      throw new Error('Failed to generate trip image.');
    }
  }
}
