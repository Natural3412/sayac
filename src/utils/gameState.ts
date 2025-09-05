import fs from 'fs';
import path from 'path';

type GameState = {
  okan: number;
  sevilay: number;
  usedPhotos: number[];
  gameStarted: string;
  gameEnded: boolean;
  winner: string | null;
};

const gameStateFile = path.join(process.cwd(), 'data', 'game-state.json');

// Oyun durumunu oku
export function readGameState(): GameState {
  try {
    if (fs.existsSync(gameStateFile)) {
      const data = fs.readFileSync(gameStateFile, 'utf-8');
      const state = JSON.parse(data);
      
      // 10 gün kontrolü (10 gün = 10 * 24 * 60 * 60 * 1000 ms)
      const gameStart = new Date(state.gameStarted);
      const now = new Date();
      const tenDays = 10 * 24 * 60 * 60 * 1000;
      
      if (now.getTime() - gameStart.getTime() >= tenDays && !state.gameEnded) {
        // 10 gün doldu, kazananı belirle
        const winner = state.okan > state.sevilay ? 'Okan' : 
                      state.sevilay > state.okan ? 'Sevilay' : 'Berabere';
        state.gameEnded = true;
        state.winner = winner;
        writeGameState(state);
      }
      
      return state;
    }
  } catch (error) {
    console.error('Game state okunamadı:', error);
  }
  
  // Varsayılan değer
  return {
    okan: 0,
    sevilay: 0,
    usedPhotos: [],
    gameStarted: new Date().toISOString(),
    gameEnded: false,
    winner: null
  };
}

// Oyun durumunu yaz
export function writeGameState(state: GameState) {
  try {
    const dirPath = path.dirname(gameStateFile);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(gameStateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Game state yazılamadı:', error);
  }
}