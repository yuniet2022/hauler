from core.config import settings

def get_queue():
    if not settings.use_rq:
        return None
    from redis import Redis
    from rq import Queue
    conn = Redis.from_url(settings.redis_url)
    return Queue(name=settings.rq_queue_name, connection=conn, default_timeout=settings.rq_job_timeout)
