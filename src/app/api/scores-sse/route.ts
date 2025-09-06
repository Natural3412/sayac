// src/app/api/scores-sse/route.ts
import { addClient, removeClient, getCurrentGameData } from '@/utils/broadcast';

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Yeni istemciyi kaydet
      addClient(controller);
      
      // İlk verileri gönder
      const gameData = getCurrentGameData();
      controller.enqueue(`data: ${JSON.stringify(gameData)}\n\n`);
      
      // Bağlantı kesildiğinde istemciyi kaldır
      const cleanup = () => {
        removeClient(controller);
      };
      
      // Cleanup fonksiyonunu controller'a bağla
      (controller as unknown as { cleanup: () => void }).cleanup = cleanup;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}