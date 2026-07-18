import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface GoogleMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
}

const GOOGLE_MAPS_URL = "https://www.google.com/maps/place/Car+Plus-%E1%9E%91%E1%9E%B7%E1%9E%89%E1%9E%9B%E1%9E%80%E1%9F%8B%E1%9E%9A%E1%9E%87%E1%9E%99%E1%9E%93%E1%9F%92%E1%9E%8F/@11.5756432,104.8933951,17z";

const GoogleMap = ({ 
  center = { lat: 11.5756, lng: 104.8959 }, // Car Plus location
  zoom = 16,
  className = "w-full h-[400px]"
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Fetch API key from edge function
        const { data, error: fnError } = await supabase.functions.invoke('get-google-maps-key');
        
        if (fnError || !data?.apiKey) {
          throw new Error('Failed to load Google Maps API key');
        }

        // Check if Google Maps script is already loaded
        if (window.google?.maps) {
          initMap();
          return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap();
        script.onerror = () => setError('Failed to load Google Maps');
        document.head.appendChild(script);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setLoading(false);
      }
    };

    const initMap = () => {
      if (!mapRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        styles: [
          {
            featureType: "all",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }]
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#c9e7f5" }]
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#ffffff" }]
          },
          {
            featureType: "poi.park",
            elementType: "geometry",
            stylers: [{ color: "#d4ecd5" }]
          }
        ]
      });

      // Add marker for store location
      new window.google.maps.Marker({
        position: center,
        map,
        title: "Car Plus-ទីញលក់រថយន្ត",
        animation: window.google.maps.Animation.DROP
      });

      setLoading(false);
    };

    loadGoogleMaps();
  }, [center, zoom]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted rounded-lg`}>
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  const handleMapClick = () => {
    window.open(GOOGLE_MAPS_URL, '_blank');
  };

  return (
    <div 
      className={`${className} relative rounded-lg overflow-hidden shadow-lg cursor-pointer group`}
      onClick={handleMapClick}
      title="Click to open in Google Maps"
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors pointer-events-none" />
      <div className="absolute bottom-3 right-3 bg-card/90 px-3 py-1.5 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Open in Google Maps
      </div>
    </div>
  );
};

export default GoogleMap;

// Add type declarations for Google Maps
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: object) => object;
        Marker: new (options: object) => object;
        Animation: {
          DROP: number;
          BOUNCE: number;
        };
      };
    };
  }
}
