from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

class GeocodeService:
    def __init__(self):
        self.geolocator = Nominatim(user_agent="catalyst_donation_platform")

    def geocode_address(self, address):
        """
        Converts a text address into (latitude, longitude).
        Returns (lat, lng) or (None, None) if not found.
        """
        try:
            location = self.geolocator.geocode(address)
            if location:
                return location.latitude, location.longitude
            return None, None
        except (GeocoderTimedOut, Exception) as e:
            print(f"Geocoding error for {address}: {e}")
            return None, None

geocoder = GeocodeService()
