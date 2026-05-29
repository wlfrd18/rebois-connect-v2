import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async


class NotificationConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope["user"]

        if user.is_anonymous:
            # Rejeter les connexions non authentifiées
            await self.close()
            return

        # Chaque user a son propre groupe WebSocket
        self.group_name = f"user_{user.id}"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Reçoit un message du groupe et l'envoie au client WebSocket
    async def notification_message(self, event):
        await self.send(text_data=json.dumps({
            "type":    event["notification_type"],
            "title":   event["title"],
            "message": event["message"],
            "data":    event.get("data", {}),
        }))
