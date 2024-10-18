import asyncio
import websockets
import json

async def audio_stream(websocket, path):
    print("WebSocket connection established.")

    total_bytes_received = 0
    while True:
        try:
            data = await websocket.recv()

            if (total_bytes_received == 0):
                #  Send the 'opened' back to kick off the file send
               await websocket.send('{"type":"opened"}')

            total_bytes_received += len(data)
            print(f"Total bytes received: {total_bytes_received}")

        # client disconnected?
        except websockets.ConnectionClosedOK:
            print(f"Web socket closed")
            break

async def main():
    server = await websockets.serve(audio_stream, "localhost", 8080)

    print("WebSocket server started at ws://localhost:8080")
    await server.wait_closed()

asyncio.run(main())