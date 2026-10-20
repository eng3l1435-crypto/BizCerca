from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

# Configuración del hash de contraseñas con Bcrypt
password_hash = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    """Genera un hash seguro a partir de la contraseña en texto plano."""
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña ingresada coincide con el hash guardado."""
    return password_hash.verify(plain_password, hashed_password)