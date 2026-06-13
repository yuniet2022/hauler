from dotenv import load_dotenv
load_dotenv("/etc/autologix-backend.env")

import os
from rq import Worker
from redis import Redis

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
QUEUE = os.getenv("RQ_QUEUE_NAME", "autologix")

if __name__ == "__main__":
    redis_conn = Redis.from_url(REDIS_URL)
    worker = Worker([QUEUE], connection=redis_conn)
    worker.work(with_scheduler=False)
