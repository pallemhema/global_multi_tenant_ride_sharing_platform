# app/api/v1/driver/ws.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from app.core.redis import redis_client

router = APIRouter()

@router.websocket("/ws/driver/{driver_id}")
async def driver_ws(websocket: WebSocket, driver_id: int):
    await websocket.accept()

    pubsub = redis_client.pubsub()
    channel = f"driver:trip_request:{driver_id}"
    pubsub.subscribe(channel)

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message:
                await websocket.send_text(message["data"].decode())
            await asyncio.sleep(0.2)
    except WebSocketDisconnect:
        pubsub.unsubscribe(channel)
