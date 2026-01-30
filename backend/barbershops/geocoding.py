"""Geocoding: address -> lat/lng (OpenStreetMap Nominatim, no API key)."""
import logging
import requests

logger = logging.getLogger(__name__)


class GeocodingService:
    NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'

    @staticmethod
    def address_to_coords(address, city, country):
        """
        Return { 'lat': float, 'lng': float } or None.
        Uses OpenStreetMap Nominatim (free, no API key).
        """
        parts = [p for p in (address, city, country) if p and str(p).strip()]
        query = ', '.join(parts) if parts else None
        if not query:
            return None
        params = {'q': query, 'format': 'json', 'limit': 1}
        headers = {'User-Agent': 'BSBS-App/1.0'}
        try:
            response = requests.get(
                GeocodingService.NOMINATIM_URL,
                params=params,
                headers=headers,
                timeout=5,
            )
            data = response.json()
            if data and len(data) > 0:
                return {
                    'lat': float(data[0]['lat']),
                    'lng': float(data[0]['lon']),
                }
        except Exception as e:
            logger.warning('Geocoding error for %s: %s', query, e)
        return None
