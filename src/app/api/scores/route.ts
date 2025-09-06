// src/app/api/scores/route.ts
import { NextResponse } from 'next/server';
import { broadcastUpdate, updateGameData } from '@/utils/broadcast';
import { readGameState, writeGameState } from '@/utils/gameState';

export async function GET() {
  const currentState = readGameState();
  return NextResponse.json(currentState);
}

export async function POST(request: Request) {
  const currentState = readGameState();
  
  // Oyun bittiyse puan kabul etme
  if (currentState.gameEnded) {
    return NextResponse.json({ success: false, message: 'Oyun sona erdi!' });
  }
  
  const newData = await request.json();
  const updatedData = {
    ...currentState,
    okan: newData.okan || 0,
    sevilay: newData.sevilay || 0,
    usedPhotos: newData.usedPhotos || []
  };
  
  // JSON dosyasına kaydet
  writeGameState(updatedData);
  
  // Broadcast utility'de game data'yı güncelle
  updateGameData(updatedData);
  
  // Tüm bağlı istemcilere güncellemeyi gönder
  broadcastUpdate(updatedData);
  
  return NextResponse.json({ success: true });
}