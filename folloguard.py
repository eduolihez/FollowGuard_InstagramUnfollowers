import os
from instagrapi import Client
from dotenv import load_dotenv
import time

# Cargar variables de entorno desde un archivo .env
load_dotenv()

def login_user():
    """Inicia sesión en Instagram usando credenciales."""
    cl = Client()
    try:
        # Intentar cargar una sesión existente para evitar login repetido
        cl.load_settings("session.json")
        cl.login(os.getenv('INSTAGRAM_USERNAME'), os.getenv('INSTAGRAM_PASSWORD'))
    except Exception:
        # Si falla, iniciar sesión normalmente y guardar la sesión
        cl.login(os.getenv('INSTAGRAM_USERNAME'), os.getenv('INSTAGRAM_PASSWORD'))
        cl.dump_settings("session.json")
    return cl

def get_non_followers(target_username):
    """Obtiene los usuarios que no siguen de vuelta al perfil target."""
    cl = login_user()
    
    # Obtener ID del usuario target
    user_id = cl.user_id_from_username(target_username)
    
    # Obtener seguidores y seguidos
    print("⏳ Obteniendo seguidores...")
    followers = cl.user_followers(user_id, amount=0)  # amount=0 obtiene todos
    followers_usernames = {user.username for user in followers.values()}
    
    print("⏳ Obteniendo seguidos...")
    followings = cl.user_following(user_id, amount=0)
    followings_usernames = {user.username for user in followings.values()}
    
    # Calcular no seguidores
    non_followers = followings_usernames - followers_usernames
    
    # Guardar resultados en un archivo
    with open(f"{target_username}_non_followers.txt", "w") as f:
        f.write(f"Usuarios que no siguen a {target_username} (total: {len(non_followers)}):\n")
        for username in non_followers:
            f.write(username + "\n")
    
    return non_followers

if __name__ == "__main__":
    # Configurar credenciales en variables de entorno o directamente aquí
    INSTAGRAM_USERNAME = os.getenv('INSTAGRAM_USERNAME') or "TU_USUARIO"
    INSTAGRAM_PASSWORD = os.getenv('INSTAGRAM_PASSWORD') or "TU_CONTRASEÑA"
    
    target_username = input("Introduce el nombre de usuario público de Instagram: ").strip()
    
    try:
        non_followers = get_non_followers(target_username)
        print(f"✅ Se encontraron {len(non_followers)} usuarios que no te siguen de vuelta.")
        print(f"📁 Resultados guardados en {target_username}_non_followers.txt")
    except Exception as e:
        print(f"❌ Error: {e}")