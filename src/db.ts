import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');
export const db = new Database(dbPath);

export const connectDB = async () => {
  try {
    console.log('SQLite connected successfully');
    initDB();
    seedData();
  } catch (error) {
    console.error('SQLite connection error:', error);
  }
};

const initDB = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      recentlyPlayed TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT NOT NULL,
      duration INTEGER NOT NULL,
      coverUrl TEXT NOT NULL,
      audioUrl TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      tracks TEXT DEFAULT '[]',
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS radio_stations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      frequency TEXT NOT NULL,
      genre TEXT NOT NULL,
      coverUrl TEXT NOT NULL,
      streamUrl TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS podcasts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      host TEXT NOT NULL,
      description TEXT NOT NULL,
      coverUrl TEXT NOT NULL,
      audioUrl TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS likes (
      userId INTEGER NOT NULL,
      trackId TEXT NOT NULL,
      PRIMARY KEY (userId, trackId),
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (trackId) REFERENCES tracks(id)
    );
  `);
};

const seedData = () => {
  const trackCount = db.prepare('SELECT COUNT(*) as count FROM tracks').get() as { count: number };
  if (trackCount.count === 0) {
    const tracks = [
      { id: "1", title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", duration: 243, coverUrl: "https://picsum.photos/seed/m83/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { id: "2", title: "Starboy", artist: "The Weeknd", album: "Starboy", duration: 230, coverUrl: "https://picsum.photos/seed/weeknd/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { id: "3", title: "Blinding Lights", artist: "The Weeknd", album: "After Hours", duration: 200, coverUrl: "https://picsum.photos/seed/blinding/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { id: "4", title: "Levitating", artist: "Dua Lipa", album: "Future Nostalgia", duration: 203, coverUrl: "https://picsum.photos/seed/dua/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { id: "5", title: "Stay", artist: "The Kid LAROI & Justin Bieber", album: "F*CK LOVE 3: OVER YOU", duration: 141, coverUrl: "https://picsum.photos/seed/stay/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { id: "6", title: "Save Your Tears", artist: "The Weeknd", album: "After Hours", duration: 215, coverUrl: "https://picsum.photos/seed/save/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { id: "7", title: "Peaches", artist: "Justin Bieber", album: "Justice", duration: 198, coverUrl: "https://picsum.photos/seed/peaches/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { id: "8", title: "Good 4 U", artist: "Olivia Rodrigo", album: "SOUR", duration: 178, coverUrl: "https://picsum.photos/seed/good4u/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
      { id: "9", title: "Enjoy Enjaami", artist: "Dhee ft. Arivu", album: "Enjoy Enjaami", duration: 230, coverUrl: "https://picsum.photos/seed/tamil1/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3" },
      { id: "10", title: "Arabic Kuthu", artist: "Anirudh Ravichander", album: "Beast", duration: 280, coverUrl: "https://picsum.photos/seed/tamil2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { id: "11", title: "Naatu Naatu", artist: "Rahul Sipligunj", album: "RRR", duration: 215, coverUrl: "https://picsum.photos/seed/indian1/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { id: "12", title: "Kesariya", artist: "Arijit Singh", album: "Brahmastra", duration: 268, coverUrl: "https://picsum.photos/seed/indian2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { id: "13", title: "Vathi Coming", artist: "Anirudh Ravichander", album: "Master", duration: 230, coverUrl: "https://picsum.photos/seed/master/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { id: "14", title: "Rowdy Baby", artist: "Dhanush & Dhee", album: "Maari 2", duration: 281, coverUrl: "https://picsum.photos/seed/maari2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" },
      { id: "15", title: "Tum Tum", artist: "Sri Vardhini", album: "Enemy", duration: 227, coverUrl: "https://picsum.photos/seed/enemy/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" },
      { id: "16", title: "Shape of You", artist: "Ed Sheeran", album: "Divide", duration: 233, coverUrl: "https://picsum.photos/seed/ed1/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" },
      { id: "17", title: "Perfect", artist: "Ed Sheeran", album: "Divide", duration: 263, coverUrl: "https://picsum.photos/seed/ed2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3" },
      { id: "18", title: "Lose Yourself", artist: "Eminem", album: "8 Mile", duration: 326, coverUrl: "https://picsum.photos/seed/em1/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
      { id: "19", title: "Without Me", artist: "Eminem", album: "The Eminem Show", duration: 290, coverUrl: "https://picsum.photos/seed/em2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
      { id: "20", title: "Mockingbird", artist: "Eminem", album: "Encore", duration: 250, coverUrl: "https://picsum.photos/seed/em3/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
      { id: "21", title: "Bad Habits", artist: "Ed Sheeran", album: "=", duration: 231, coverUrl: "https://picsum.photos/seed/ed3/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
      { id: "22", title: "Butta Bomma", artist: "Armaan Malik", album: "Ala Vaikunthapurramuloo", duration: 210, coverUrl: "https://picsum.photos/seed/indian3/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
      { id: "23", title: "Ranjithame", artist: "Vijay", album: "Varisu", duration: 280, coverUrl: "https://picsum.photos/seed/tamil3/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
      { id: "24", title: "The Monster", artist: "Eminem ft. Rihanna", album: "The Marshall Mathers LP 2", duration: 250, coverUrl: "https://picsum.photos/seed/em4/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
      { id: "25", title: "Thinking Out Loud", artist: "Ed Sheeran", album: "X", duration: 281, coverUrl: "https://picsum.photos/seed/ed4/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
    ];
    const insert = db.prepare('INSERT INTO tracks (id, title, artist, album, duration, coverUrl, audioUrl) VALUES (?, ?, ?, ?, ?, ?, ?)');
    tracks.forEach(t => insert.run(t.id, t.title, t.artist, t.album, t.duration, t.coverUrl, t.audioUrl));
    console.log('Tracks seeded');
  }

  const stationCount = db.prepare('SELECT COUNT(*) as count FROM radio_stations').get() as { count: number };
  if (stationCount.count === 0) {
    const stations = [
      { id: "r1", name: "KEXP", frequency: "90.3 FM", genre: "Alternative", coverUrl: "https://picsum.photos/seed/radio1/300/300", streamUrl: "https://kexp-mp3-128.streamguys1.com/kexp128.mp3" },
      { id: "r2", name: "FIP", frequency: "Radio France", genre: "Eclectic", coverUrl: "https://picsum.photos/seed/radio2/300/300", streamUrl: "https://icecast.radiofrance.fr/fip-midfi.mp3" },
      { id: "r3", name: "Groove Salad", frequency: "SomaFM", genre: "Ambient", coverUrl: "https://picsum.photos/seed/radio3/300/300", streamUrl: "https://ice2.somafm.com/groovesalad-128-mp3" }
    ];
    const insert = db.prepare('INSERT INTO radio_stations (id, name, frequency, genre, coverUrl, streamUrl) VALUES (?, ?, ?, ?, ?, ?)');
    stations.forEach(s => insert.run(s.id, s.name, s.frequency, s.genre, s.coverUrl, s.streamUrl));
    console.log('Radio stations seeded');
  }

  const podcastCount = db.prepare('SELECT COUNT(*) as count FROM podcasts').get() as { count: number };
  if (podcastCount.count === 0) {
    const podcasts = [
      { id: "p1", title: "The Daily", host: "Michael Barbaro", description: "The biggest stories of our time.", coverUrl: "https://picsum.photos/seed/pod1/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3" },
      { id: "p2", title: "Tech Today", host: "Sarah Chen", description: "Latest in technology and innovation.", coverUrl: "https://picsum.photos/seed/pod2/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3" },
      { id: "p3", title: "Crime Junkie", host: "Ashley Flowers", description: "True crime stories that will keep you up.", coverUrl: "https://picsum.photos/seed/pod3/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3" },
      { id: "p4", title: "Tamil Talkies", host: "Tamil Selvan", description: "Cinema reviews and discussions in Tamil.", coverUrl: "https://picsum.photos/seed/pod4/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3" },
      { id: "p5", title: "Indian History", host: "Dr. Sharma", description: "Exploring the rich history of India.", coverUrl: "https://picsum.photos/seed/pod5/300/300", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3" }
    ];
    const insert = db.prepare('INSERT INTO podcasts (id, title, host, description, coverUrl, audioUrl) VALUES (?, ?, ?, ?, ?, ?)');
    podcasts.forEach(p => insert.run(p.id, p.title, p.host, p.description, p.coverUrl, p.audioUrl));
    console.log('Podcasts seeded');
  }
};
