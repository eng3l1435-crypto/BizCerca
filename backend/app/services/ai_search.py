import re
import unicodedata

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

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


def expandir_terminos(query: str) -> list[str]:
    terminos_base = [query.strip()]
    terminos_base.extend(_SINONIMOS.get(_normalizar(query.strip()), []))

    terminos = []
    normalizados = set()
    for termino in terminos_base:
        normalizado = _normalizar(termino)
        if normalizado and normalizado not in normalizados:
            normalizados.add(normalizado)
            terminos.append(termino)

    return terminos


def puntuar_relevancia(
    query: str,
    terminos: list[str],
    documentos: list[dict],
) -> list[float]:
    if not documentos:
        return []

    textos = []
    for documento in documentos:
        partes = [
            documento[campo]
            for campo in ("titulo", "descripcion")
            if isinstance(documento.get(campo), str)
        ]
        etiquetas = documento.get("categorias_tags", [])
        if isinstance(etiquetas, list):
            partes.extend(etiqueta for etiqueta in etiquetas if isinstance(etiqueta, str))
        textos.append(" ".join(partes))

    consulta = " ".join(terminos) or query
    vectorizador = TfidfVectorizer(
        analyzer="char_wb",
        lowercase=True,
        ngram_range=(2, 5),
        strip_accents="unicode",
    )
    vectores = vectorizador.fit_transform([consulta, *textos])
    return cosine_similarity(vectores[0:1], vectores[1:]).ravel().tolist()


def crear_regex_busqueda(terminos: list[str]) -> dict[str, str]:
    patrones = [_regex_con_acentos(termino) for termino in terminos if termino]
    return {"$regex": "|".join(patrones), "$options": "i"}
