import { db } from './db';

export const User = {
  findOne: (query: { email?: string; id?: any }) => {
    if (query.email) {
      return db.prepare('SELECT * FROM users WHERE email = ?').get(query.email);
    }
    if (query.id) {
      return db.prepare('SELECT * FROM users WHERE id = ?').get(query.id);
    }
    return null;
  },
  findById: (id: any) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (user) {
      user.recentlyPlayed = JSON.parse(user.recentlyPlayed || '[]');
    }
    return user;
  },
  findByIdAndUpdate: (id: any, update: any) => {
    const keys = Object.keys(update);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => update[k]);
    db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`).run(...values, id);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  create: (data: any) => {
    const { email, password, name } = data;
    const info = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, password, name);
    return { id: info.lastInsertRowid, email, name };
  },
  save: (user: any) => {
    const recentlyPlayed = JSON.stringify(user.recentlyPlayed || []);
    db.prepare('UPDATE users SET recentlyPlayed = ? WHERE id = ?').run(recentlyPlayed, user.id);
  }
};

export const Track = {
  find: (query: any = {}) => {
    if (query.id && query.id.$in) {
      const placeholders = query.id.$in.map(() => '?').join(',');
      return db.prepare(`SELECT * FROM tracks WHERE id IN (${placeholders})`).all(...query.id.$in);
    }
    if (query.album && query.artist) {
      return db.prepare('SELECT * FROM tracks WHERE album = ? AND artist = ?').all(query.album, query.artist);
    }
    if (query.artist) {
      return db.prepare('SELECT * FROM tracks WHERE artist = ?').all(query.artist);
    }
    const keys = Object.keys(query);
    if (keys.length > 0) {
      const whereClause = keys.map(k => `${k} LIKE ?`).join(' OR ');
      const values = keys.map(k => `%${query[k].source || query[k]}%`);
      return db.prepare(`SELECT * FROM tracks WHERE ${whereClause}`).all(...values);
    }
    return db.prepare('SELECT * FROM tracks').all();
  },
  countDocuments: () => {
    const res = db.prepare('SELECT COUNT(*) as count FROM tracks').get() as any;
    return res.count;
  }
};

export const Playlist = {
  find: (query: { userId: any }) => {
    const playlists = db.prepare('SELECT * FROM playlists WHERE userId = ?').all(query.userId) as any[];
    return playlists.map(p => ({ ...p, tracks: JSON.parse(p.tracks || '[]') }));
  },
  findOne: (query: { id?: any; userId?: any; name?: string }) => {
    let playlist;
    if (query.id) {
      playlist = db.prepare('SELECT * FROM playlists WHERE id = ? AND userId = ?').get(query.id, query.userId) as any;
    } else if (query.name) {
      playlist = db.prepare('SELECT * FROM playlists WHERE userId = ? AND name = ?').get(query.userId, query.name) as any;
    }
    if (playlist) {
      playlist.tracks = JSON.parse(playlist.tracks || '[]');
    }
    return playlist;
  },
  create: (data: any) => {
    const { userId, name, description } = data;
    const info = db.prepare('INSERT INTO playlists (userId, name, description) VALUES (?, ?, ?)').run(userId, name, description);
    return { id: info.lastInsertRowid, userId, name, description, tracks: [] };
  },
  save: (playlist: any) => {
    const tracks = JSON.stringify(playlist.tracks || []);
    db.prepare('UPDATE playlists SET tracks = ?, name = ?, description = ? WHERE id = ?').run(tracks, playlist.name, playlist.description, playlist.id);
  },
  findOneAndDelete: (query: { id: any; userId: any }) => {
    return db.prepare('DELETE FROM playlists WHERE id = ? AND userId = ?').run(query.id, query.userId);
  }
};

export const RadioStation = {
  find: () => db.prepare('SELECT * FROM radio_stations').all(),
  countDocuments: () => {
    const res = db.prepare('SELECT COUNT(*) as count FROM radio_stations').get() as any;
    return res.count;
  }
};

export const Podcast = {
  find: () => db.prepare('SELECT * FROM podcasts').all(),
  countDocuments: () => {
    const res = db.prepare('SELECT COUNT(*) as count FROM podcasts').get() as any;
    return res.count;
  }
};

export const Like = {
  findOne: (query: { userId: any; trackId: any }) => {
    return db.prepare('SELECT * FROM likes WHERE userId = ? AND trackId = ?').get(query.userId, query.trackId);
  },
  create: (data: { userId: any; trackId: any }) => {
    return db.prepare('INSERT INTO likes (userId, trackId) VALUES (?, ?)').run(data.userId, data.trackId);
  },
  deleteOne: (query: { userId: any; trackId: any }) => {
    return db.prepare('DELETE FROM likes WHERE userId = ? AND trackId = ?').run(query.userId, query.trackId);
  }
};
