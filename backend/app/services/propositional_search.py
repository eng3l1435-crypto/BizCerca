import unicodedata
from typing import Any


def _normalizar(texto: str) -> str:
    # Ignora mayúsculas y acentos para que "repostería" coincida con "reposteria".
    return "".join(
        caracter
        for caracter in unicodedata.normalize("NFD", texto.casefold())
        if unicodedata.category(caracter) != "Mn"
    )


def evaluar_regla_busqueda(
    documento: dict[str, Any],
    query: str,
    terminos: list[str],
) -> tuple[bool, dict[str, bool]]:
    # Junta el texto buscable de la publicación, incluidas sus etiquetas.
    texto = " ".join(
        valor
        for campo in ("titulo", "descripcion")
        if isinstance((valor := documento.get(campo)), str)
    )
    etiquetas = documento.get("categorias_tags", [])
    if isinstance(etiquetas, list):
        texto += " " + " ".join(etiqueta for etiqueta in etiquetas if isinstance(etiqueta, str))
    texto_normalizado = _normalizar(texto)

    # Evalúa si coincide la consulta original o alguno de sus sinónimos.
    coincide_consulta = _normalizar(query) in texto_normalizado
    query_normalizada = _normalizar(query)
    coincide_sinonimo = any(
        termino_normalizado != query_normalizada
        and termino_normalizado in texto_normalizado
        for termino in terminos
        if (termino_normalizado := _normalizar(termino))
    )
    publicado = documento.get("publicado") is True


# P: está publicada.
# C: coincide con la categoría buscada.
# S: coincide con un sinónimo sugerido por Ollama.
# D: está dentro del radio.
# R: cumple el rango de precio.
# Una regla podría ser:


# mostrarla si está publicada, coincide por categoría o por sinónimo, y además cumple la distancia y el precio.

    # Regla proposicional: P AND (C OR S).
    # P = publicado, C = coincide consulta y S = coincide sinónimo.
    mostrar = publicado and (coincide_consulta or coincide_sinonimo)

    return mostrar, {
        "publicado": publicado,
        "coincide_consulta": coincide_consulta,
        "coincide_sinonimo": coincide_sinonimo,
        "mostrar": mostrar,
    }
