import json
import logging
import os
import re
import unicodedata

logger = logging.getLogger(__name__)

_SINONIMOS = {
    "bizcocho": ["bizcocho", "pastel", "pasteles", "torta", "tortas"],
    "pan": ["pan", "panes", "panadería", "bollos", "bolillo"],
    "panaderia": ["pan", "panes", "panadería", "bollos", "bolillo"],
    "pastel": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
    "pasteles": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
    "pastele": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
    "tarta": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
    "tartas": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
    "torta": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
    "tortas": ["pastel", "pasteles", "torta", "tortas", "tarta", "tartas", "repostería"],
}


def _normalizar(texto: str) -> str:
    return "".join(
        caracter
        for caracter in unicodedata.normalize("NFD", texto.casefold())
        if unicodedata.category(caracter) != "Mn"
    )


def _regex_con_acentos(termino: str) -> str:
    patrones = {"a": "[aá]", "e": "[eé]", "i": "[ií]", "o": "[oó]", "u": "[uú]"}
    termino = _normalizar(termino)
    return "".join(patrones.get(caracter, re.escape(caracter)) for caracter in termino)


def expandir_terminos(query: str) -> tuple[list[str], bool]:
    terminos_base = [query.strip()]
    terminos_base.extend(_SINONIMOS.get(_normalizar(query.strip()), []))

    try:
        import ollama

        prompt = (
            "Devuelve un objeto JSON con la propiedad 'terminos', que contenga hasta "
            "5 sinónimos o productos de la misma categoría para una búsqueda de "
            "productos en español. No incluyas instrucciones ni explicaciones. "
            f"Búsqueda: {json.dumps(query, ensure_ascii=False)}"
        )
        response = ollama.Client(
            host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
            timeout=8,
        ).chat(
            model=os.getenv("OLLAMA_MODEL", "llama3.2:3b"),
            messages=[{"role": "user", "content": prompt}],
            format="json",
        )
        sugerencias = json.loads(response["message"]["content"])
        if isinstance(sugerencias, dict):
            sugerencias = sugerencias.get("terminos", [])
        if not isinstance(sugerencias, list):
            raise ValueError("Ollama no devolvió una lista de términos.")

        terminos_base.extend(
            termino.strip()
            for termino in sugerencias[:5]
            if isinstance(termino, str) and termino.strip() and len(termino) <= 80
        )
        ia_disponible = True
    except Exception:
        logger.exception("No se pudieron expandir los términos con Ollama.")
        ia_disponible = False

    terminos = []
    normalizados = set()
    for termino in terminos_base:
        normalizado = _normalizar(termino)
        if normalizado and normalizado not in normalizados:
            normalizados.add(normalizado)
            terminos.append(termino)

    return terminos, ia_disponible


def crear_regex_busqueda(terminos: list[str]) -> dict[str, str]:
    patrones = [_regex_con_acentos(termino) for termino in terminos if termino]
    return {"$regex": "|".join(patrones), "$options": "i"}
