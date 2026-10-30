from math import sqrt
from math import radians, sin, cos, atan2

def distancia_haversine(coord1, coord2):



    if len(coord1) != 2 or len(coord2) != 2:
        return float('inf') 

    lon1, lat1 = coord1
    lon2, lat2 = coord2

    R = 6371.0


    dlon = radians(lon2 - lon1)
    dlat = radians(lat2 - lat1)
    a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def hill_climbing_recomendacion(usuario_preferencias, items, usuario_ubicacion, radio_km):

    # Premisa de geolocalización: D -> I.
    # D significa distancia <= radio_km e I significa incluir el perfil en los resultados.
    items_en_radio = [
        item for item in items
        if distancia_haversine(usuario_ubicacion, item["ubicacion"]) <= radio_km
    ]

    if not items_en_radio:
        return []



    def funcion_objetivo(item):
        dist_pref = sqrt(
            (usuario_preferencias[0] - item["perfil"][0])**2 +
            (usuario_preferencias[1] - item["perfil"][1])**2
        )
        return dist_pref


    items_en_radio.sort(key=funcion_objetivo)

    return items_en_radio
