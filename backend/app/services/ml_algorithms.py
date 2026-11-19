import math
import re
from collections import Counter
from typing import Any

import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.neighbors import NearestNeighbors
from sklearn.tree import DecisionTreeClassifier


_CLASES_CALIDAD = ("baja", "media", "alta")


def _texto_oferta(oferta: dict[str, Any]) -> str:
    partes = [
        oferta.get("tipo", ""),
        oferta.get("titulo", ""),
        oferta.get("descripcion", ""),
    ]
    etiquetas = oferta.get("categorias_tags", [])
    if isinstance(etiquetas, list):
        partes.extend(etiqueta for etiqueta in etiquetas if isinstance(etiqueta, str))
    return " ".join(
        parte.strip()
        for parte in partes
        if isinstance(parte, str) and parte.strip()
    )


def _clase_calidad(calidad: float) -> str:
    if calidad < 5:
        return "baja"
    if calidad < 8:
        return "media"
    return "alta"


def _vectorizador() -> TfidfVectorizer:
    return TfidfVectorizer(
        ngram_range=(1, 2),
        strip_accents="unicode",
        token_pattern=r"(?u)\b\w+\b",
    )


def evaluar_arbol_decision(
    ofertas_calificadas: list[dict[str, Any]],
) -> dict[str, Any]:
    muestras = []
    for oferta in ofertas_calificadas:
        texto = _texto_oferta(oferta)
        try:
            calidad = float(oferta.get("rating_calidad_oferente"))
        except (TypeError, ValueError):
            continue
        if texto and math.isfinite(calidad) and 1 <= calidad <= 10:
            muestras.append((oferta, texto, calidad))

    etiquetas = [_clase_calidad(calidad) for _, _, calidad in muestras]
    frecuencias = Counter(etiquetas)
    if len(frecuencias) < 2 or min(frecuencias.values(), default=0) < 2:
        raise ValueError(
            "Se necesitan al menos dos ofertas calificadas por cada nivel de calidad "
            "(baja, media o alta) y al menos dos niveles presentes."
        )

    grupos = [
        str(oferta.get("usuario_id") or oferta.get("_id") or indice)
        for indice, (oferta, _, _) in enumerate(muestras)
    ]
    oferentes_por_nivel = {
        nivel: {
            grupos[indice]
            for indice, etiqueta in enumerate(etiquetas)
            if etiqueta == nivel
        }
        for nivel in frecuencias
    }
    if min(map(len, oferentes_por_nivel.values())) < 2:
        raise ValueError(
            "Se necesitan ofertas de al menos dos oferentes distintos por cada nivel de calidad."
        )

    textos = [texto for _, texto, _ in muestras]
    indices_entrenamiento = indices_prueba = None
    splitter = GroupShuffleSplit(n_splits=50, test_size=0.25, random_state=42)
    for entrenamiento, prueba in splitter.split(textos, etiquetas, groups=grupos):
        if (
            set(etiquetas[indice] for indice in entrenamiento) == set(frecuencias)
            and set(etiquetas[indice] for indice in prueba) == set(frecuencias)
        ):
            indices_entrenamiento, indices_prueba = entrenamiento, prueba
            break
    if indices_entrenamiento is None or indices_prueba is None:
        raise ValueError(
            "No se pudo separar entrenamiento y prueba conservando todos los niveles "
            "de calidad; se necesitan más oferentes calificados por nivel."
        )

    textos_entrenamiento = [textos[indice] for indice in indices_entrenamiento]
    textos_prueba = [textos[indice] for indice in indices_prueba]
    etiquetas_entrenamiento = [etiquetas[indice] for indice in indices_entrenamiento]
    etiquetas_prueba = [etiquetas[indice] for indice in indices_prueba]
    vectorizador = _vectorizador()
    matriz_entrenamiento = vectorizador.fit_transform(textos_entrenamiento)
    modelo = DecisionTreeClassifier(
        max_depth=5,
        class_weight="balanced",
        random_state=42,
    )
    modelo.fit(matriz_entrenamiento, etiquetas_entrenamiento)
    predicciones = modelo.predict(vectorizador.transform(textos_prueba))
    reporte = classification_report(
        etiquetas_prueba,
        predicciones,
        labels=list(_CLASES_CALIDAD),
        output_dict=True,
        zero_division=0,
    )
    factores = sorted(
        zip(vectorizador.get_feature_names_out(), modelo.feature_importances_),
        key=lambda factor: factor[1],
        reverse=True,
    )

    return {
        "algoritmo": "arbol_decision",
        "muestras_entrenamiento": len(indices_entrenamiento),
        "muestras_prueba": len(indices_prueba),
        "niveles_calidad": {
            "baja": "calificación menor que 5",
            "media": "calificación desde 5 y menor que 8",
            "alta": "calificación de 8 a 10",
        },
        "factores_principales": [
            {"termino": str(termino), "importancia": round(float(importancia), 4)}
            for termino, importancia in factores[:10]
            if importancia > 0
        ],
        "evaluacion": {
            "exactitud": round(float(accuracy_score(etiquetas_prueba, predicciones)), 4),
            "f1_macro": round(
                float(f1_score(
                    etiquetas_prueba,
                    predicciones,
                    labels=list(_CLASES_CALIDAD),
                    average="macro",
                    zero_division=0,
                )),
                4,
            ),
            "por_nivel": {
                nivel: {
                    "precision": round(float(reporte[nivel]["precision"]), 4),
                    "recall": round(float(reporte[nivel]["recall"]), 4),
                    "f1": round(float(reporte[nivel]["f1-score"]), 4),
                }
                for nivel in _CLASES_CALIDAD
            },
        },
        "predicciones_prueba": [
            {
                "oferta_id": str(muestras[indice][0].get("_id", "")),
                "titulo": muestras[indice][0].get("titulo", ""),
                "calidad_real": etiquetas[indice],
                "calidad_predicha": str(prediccion),
            }
            for indice, prediccion in zip(indices_prueba, predicciones)
        ],
    }


def recomendar_ofertas_random_forest(
    ofertas_publicadas: list[dict[str, Any]],
    ofertas_calificadas: list[dict[str, Any]],
    cantidad: int = 5,
) -> dict[str, Any]:
    muestras = []
    for oferta in ofertas_calificadas:
        texto = _texto_oferta(oferta)
        try:
            calidad = float(oferta.get("rating_calidad_oferente"))
        except (TypeError, ValueError):
            continue
        if texto and math.isfinite(calidad) and 1 <= calidad <= 10:
            muestras.append((texto, calidad))

    if len(muestras) < 3 or len({calidad for _, calidad in muestras}) < 2:
        raise ValueError(
            "Se necesitan al menos tres ofertas calificadas y dos calificaciones "
            "de calidad diferentes para generar recomendaciones."
        )

    textos_entrenamiento = [texto for texto, _ in muestras]
    calidades = [calidad for _, calidad in muestras]
    vectorizador = _vectorizador()
    matriz_entrenamiento = vectorizador.fit_transform(textos_entrenamiento)
    modelo = RandomForestRegressor(
        n_estimators=100,
        min_samples_leaf=2,
        random_state=42,
    )
    modelo.fit(matriz_entrenamiento, calidades)

    ofertas_con_texto = [
        (oferta, _texto_oferta(oferta))
        for oferta in ofertas_publicadas
        if _texto_oferta(oferta)
    ]
    if not ofertas_con_texto:
        raise ValueError("No hay ofertas publicadas con texto para recomendar.")

    predicciones = modelo.predict(
        vectorizador.transform([texto for _, texto in ofertas_con_texto])
    )
    recomendaciones = [
        {
            "id": str(oferta.get("_id", "")),
            "titulo": oferta.get("titulo", ""),
            "tipo": oferta.get("tipo", ""),
            "descripcion": oferta.get("descripcion", ""),
            "categorias_tags": oferta.get("categorias_tags", []),
            "calidad_estimada": round(float(np.clip(calidad, 1, 10)), 2),
        }
        for (oferta, _), calidad in zip(ofertas_con_texto, predicciones)
    ]
    recomendaciones.sort(key=lambda oferta: oferta["calidad_estimada"], reverse=True)

    return {
        "algoritmo": "random_forest",
        "ofertas_entrenamiento": len(muestras),
        "recomendaciones": recomendaciones[:cantidad],
    }


def buscar_ofertas_similares(
    ofertas: list[dict[str, Any]],
    consulta: str,
    limite: int = 5,
) -> dict[str, Any]:
    consulta = consulta.strip()
    if not consulta:
        raise ValueError("La consulta no puede estar vacía.")

    ofertas_con_texto = [
        (oferta, _texto_oferta(oferta))
        for oferta in ofertas
        if _texto_oferta(oferta)
    ]
    if not ofertas_con_texto:
        return {"algoritmo": "knn", "consulta": consulta, "resultados": []}

    textos = [texto for _, texto in ofertas_con_texto]
    vectorizador = _vectorizador()
    vectores = vectorizador.fit_transform(textos)
    consulta_vector = vectorizador.transform([consulta])
    if consulta_vector.nnz == 0:
        return {"algoritmo": "knn", "consulta": consulta, "resultados": []}

    cantidad = min(limite, len(ofertas_con_texto))
    modelo = NearestNeighbors(n_neighbors=cantidad, metric="cosine", algorithm="brute")
    modelo.fit(vectores)
    distancias, indices = modelo.kneighbors(consulta_vector)
    resultados = []
    for distancia, indice in zip(distancias[0], indices[0]):
        similitud = max(0.0, 1.0 - float(distancia))
        if similitud <= 0:
            continue
        oferta = ofertas_con_texto[indice][0]
        resultados.append({
            "id": str(oferta.get("_id", "")),
            "titulo": oferta.get("titulo", ""),
            "tipo": oferta.get("tipo", ""),
            "categorias_tags": oferta.get("categorias_tags", []),
            "similitud": round(similitud, 4),
        })

    return {"algoritmo": "knn", "consulta": consulta, "resultados": resultados}


def agrupar_ofertas(
    ofertas: list[dict[str, Any]],
    cantidad_grupos: int = 3,
) -> dict[str, Any]:
    muestras = [
        (oferta, _texto_oferta(oferta))
        for oferta in ofertas
        if _texto_oferta(oferta)
    ]
    if len(muestras) < 2:
        raise ValueError("Se necesitan al menos dos ofertas publicadas con texto para agrupar.")

    textos = [texto for _, texto in muestras]
    vectorizador = _vectorizador()
    vectores = vectorizador.fit_transform(textos)
    filas_unicas = {
        tuple(zip(
            vectores.indices[vectores.indptr[indice]:vectores.indptr[indice + 1]],
            np.round(vectores.data[vectores.indptr[indice]:vectores.indptr[indice + 1]], 10),
        ))
        for indice in range(vectores.shape[0])
    }
    if len(filas_unicas) < 2:
        raise ValueError("Las ofertas publicadas no tienen suficiente variedad para formar grupos.")

    cantidad = min(cantidad_grupos, len(filas_unicas), len(muestras))
    modelo = KMeans(n_clusters=cantidad, n_init=10, random_state=42)
    etiquetas = modelo.fit_predict(vectores)
    terminos = vectorizador.get_feature_names_out()
    grupos = []
    for grupo in range(cantidad):
        indices = np.flatnonzero(etiquetas == grupo)
        if not len(indices):
            continue
        principales = modelo.cluster_centers_[grupo].argsort()[::-1][:5]
        grupos.append({
            "grupo": grupo,
            "cantidad_ofertas": int(len(indices)),
            "terminos_representativos": [
                str(terminos[indice])
                for indice in principales
                if modelo.cluster_centers_[grupo][indice] > 0
            ],
            "ofertas": [
                {
                    "id": str(muestras[indice][0].get("_id", "")),
                    "titulo": muestras[indice][0].get("titulo", ""),
                    "tipo": muestras[indice][0].get("tipo", ""),
                    "categorias_tags": muestras[indice][0].get("categorias_tags", []),
                }
                for indice in indices
            ],
        })
    return {
        "algoritmo": "k_means",
        "ofertas_agrupadas": sum(grupo["cantidad_ofertas"] for grupo in grupos),
        "cantidad_grupos": len(grupos),
        "grupos": grupos,
    }
