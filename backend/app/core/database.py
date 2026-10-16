from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError
from contextlib import asynccontextmanager
from fastapi import FastAPI

from app.core.config import settings

class Database:
    #Variable para la conexión, si ya se realizo o esta vacía
    client: AsyncIOMotorClient | None = None

#Instancia global
database = Database()

async def connection_mongo():
    database.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS = 5000
        )
    try:
        await database.client.admin.command('ping')
        print(f"Conexión Iniciada")
    except ServerSelectionTimeoutError:
        print("Conexión No Establecida")

async def close_connection_mongo():
    if database.client:
        database.client.close() #Es propio de la librería Motor para cerrar la conexión
        print(f"Conexión Terminada")

def get_database():
    if database.client is None: #Si se quiere usar la BD pero no hay conexión
        raise RuntimeError("Se requiere una base de datos") #Excepción
    return database.client[settings.MONGO_DB]#Usar corchetes, recordar que funciona como un diccionario

#Para enviar a main
@asynccontextmanager
async def lifespan(app:FastAPI): #Sigue al servidor de Uvicorn
    await connection_mongo()
    yield #Función de pausa
    await close_connection_mongo()
