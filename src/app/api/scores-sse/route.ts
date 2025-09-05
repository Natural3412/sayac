// src/app/api/scores-sse/route.ts
import { NextRequest } from 'next/server';
import { readGameState } from '@/utils/gameState';

// Oyun verilerini JSON dosyasından oku
let gameData = readGameState();

const clients = new Set<ReadableStreamDefaultController>();

export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      // Yeni istemciyi kaydet
      clients.add(controller);
      
      // İlk verileri gönder
      controller.enqueue(`data: ${JSON.stringify(gameData)}\n\n`);
      
      // Bağlantı kesildiğinde istemciyi kaldır
      const cleanup = () => {
        clients.delete(controller);
      };
      
      // Cleanup fonksiyonunu controller'a bağla
      (controller as any).cleanup = cleanup;
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

// Tüm istemcilere yeni verileri gönder
export function broadcastUpdate(newData: any) {
  gameData = newData;
  const message = `data: ${JSON.stringify(gameData)}\n\n`;
  
  clients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch (error) {
      // Bağlantı kesilmişse istemciyi kaldır
      clients.delete(controller);
    }
  });
}

export { gameData };