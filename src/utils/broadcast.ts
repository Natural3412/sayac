// Broadcast utility for SSE connections
import { readGameState } from './gameState';

type GameState = {
  okan: number;
  sevilay: number;
  usedPhotos: number[];
  gameStarted: string;
  gameEnded: boolean;
  winner: string | null;
};

// Global clients set - bu production'da memory store olacak
const clients = new Set<ReadableStreamDefaultController>();

// Oyun verilerini JSON dosyasından oku
let gameData = readGameState();

// Tüm istemcilere yeni verileri gönder
export function broadcastUpdate(newData: GameState) {
  gameData = newData;
  const message = `data: ${JSON.stringify(gameData)}\n\n`;
  
  clients.forEach((controller) => {
    try {
      controller.enqueue(message);
    } catch {
      // Bağlantı kesilmişse istemciyi kaldır
      clients.delete(controller);
    }
  });
}

// İstemci ekle
export function addClient(controller: ReadableStreamDefaultController) {
  clients.add(controller);
}

// İstemci kaldır
export function removeClient(controller: ReadableStreamDefaultController) {
  clients.delete(controller);
}

// Mevcut game data'yı al
export function getCurrentGameData() {
  return gameData;
}

// Game data'yı güncelle
export function updateGameData(newData: GameState) {
  gameData = newData;
}