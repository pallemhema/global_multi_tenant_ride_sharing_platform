import redis
from app.core.config import settings

redis_client = redis.Redis.from_url(
    settings.REDIS_URL,
    decode_responses=True
)

def check_redis_connection() -> bool:
    try:
        redis_client.ping()
        return True
    except redis.RedisError:
        return False
def get_redis() -> redis.Redis:
    return redis_client