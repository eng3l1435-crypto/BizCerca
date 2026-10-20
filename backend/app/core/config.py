from pydantic import computed_field
from  pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    #Variables de MongoDB que deben coincidir
    MONGO_USER: str | None = None #Tendrá una cadena o nada de nada
    MONGO_PASSWORD: str | None = None
    MONGO_CLUSTER: str
    MONGO_DB: str

    #Calcula la URI correcta si existen o no credenciales
    @computed_field #Lo definira como campo oficial
    @property
    def MONGO_URI(self) -> str:
        if self.MONGO_USER and self.MONGO_PASSWORD:
            return f"mongodb://{self.MONGO_USER}:{self.MONGO_PASSWORD}@{self.MONGO_CLUSTER}"
        return f"mongodb://{self.MONGO_CLUSTER}"

    #Lectura del archivo .env 
    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        case_sensitive = True, #Distingue entre mayúsculas y minusculas MONGO != Mongo
        extra = "ignore" #Por si hay otras variables en el .env que no sean necesarias para settings
     )
#Creación del objeto a partir de la clase    
settings = Settings() 