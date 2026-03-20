import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "./src/db";
import { User, Track, Playlist, RadioStation, Podcast, Like } from "./src/models";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

async function startServer() {
  await connectDB();
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  console.log("Starting SoundsOn Server...");

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = User.create({ email, password: hashedPassword, name });
      
      // Create default "Liked Songs" playlist
      Playlist.create({ userId: user.id, name: "Liked Songs", description: "Your favorite tracks" });

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error: any) {
      res.status(400).json({ error: error.message.includes("UNIQUE") ? "Email already exists" : "Signup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Track Routes
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = Track.find();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/album", async (req, res) => {
    const { name, artist } = req.query;
    try {
      const tracks = Track.find({ album: name as string, artist: artist as string });
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch album tracks" });
    }
  });

  app.get("/api/tracks/artist", async (req, res) => {
    const { name } = req.query;
    try {
      const tracks = Track.find({ artist: name as string });
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artist tracks" });
    }
  });

  app.get("/api/tracks/recent", authenticateToken, async (req: any, res) => {
    try {
      const user = User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      
      const tracks = Track.find({ id: { $in: user.recentlyPlayed } });
      // Maintain order
      const orderedTracks = user.recentlyPlayed.map((id: string) => tracks.find((t: any) => t.id === id)).filter(Boolean);
      res.json(orderedTracks);
    } catch (error) {
      console.error("Error fetching recently played:", error);
      res.status(500).json({ error: "Failed to fetch recently played" });
    }
  });

  app.get("/api/tracks/new", async (req, res) => {
    try {
      const tracks = Track.find();
      res.json(tracks.slice(0, 10)); // Just return first 10 for now
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch new tracks" });
    }
  });

  app.get("/api/tracks/recommended", async (req, res) => {
    try {
      const tracks = Track.find();
      res.json(tracks.slice(10, 20)); // Just return next 10 for now
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recommended tracks" });
    }
  });

  app.get("/api/tracks/suggestions", async (req, res) => {
    try {
      const tracks = Track.find();
      res.json(tracks.slice(0, 5)); // Just return 5 for now
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.post("/api/tracks/recent", authenticateToken, async (req: any, res) => {
    const { trackId } = req.body;
    try {
      const user = User.findById(req.user.id);
      if (user) {
        user.recentlyPlayed = [trackId, ...user.recentlyPlayed.filter((id: string) => id !== trackId)].slice(0, 20);
        User.save(user);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update recently played" });
    }
  });

  app.get("/api/radio", async (req, res) => {
    try {
      const stations = RadioStation.find();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch radio stations" });
    }
  });

  app.get("/api/podcasts", async (req, res) => {
    try {
      const podcasts = Podcast.find();
      res.json(podcasts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch podcasts" });
    }
  });

  app.put("/api/user", authenticateToken, async (req: any, res) => {
    const { name, email } = req.body;
    try {
      const user = User.findByIdAndUpdate(req.user.id, { name, email });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
      res.status(400).json({ error: error.message.includes("UNIQUE") ? "Email already exists" : "Update failed" });
    }
  });

  app.get("/api/search", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    try {
      const tracks = Track.find({
        title: q as string,
        artist: q as string,
        album: q as string
      });
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Playlist Routes
  app.get("/api/playlists", authenticateToken, async (req: any, res) => {
    try {
      const playlists = Playlist.find({ userId: req.user.id });
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.post("/api/playlists", authenticateToken, async (req: any, res) => {
    const { name, description } = req.body;
    try {
      const playlist = Playlist.create({ userId: req.user.id, name, description: description || "" });
      res.json(playlist);
    } catch (error) {
      res.status(400).json({ error: "Failed to create playlist" });
    }
  });

  app.delete("/api/playlists/:id", authenticateToken, async (req: any, res) => {
    try {
      Playlist.findOneAndDelete({ id: req.params.id, userId: req.user.id });
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to delete playlist" });
    }
  });

  app.get("/api/playlists/:id/tracks", authenticateToken, async (req: any, res) => {
    try {
      const playlist = Playlist.findOne({ id: req.params.id, userId: req.user.id });
      if (!playlist) return res.status(404).json({ error: "Playlist not found" });
      
      const tracks = Track.find({ id: { $in: playlist.tracks } });
      // Maintain order
      const orderedTracks = playlist.tracks.map((id: string) => tracks.find((t: any) => t.id === id)).filter(Boolean);
      res.json(orderedTracks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlist tracks" });
    }
  });

  app.post("/api/playlists/:id/tracks", authenticateToken, async (req: any, res) => {
    const { trackId } = req.body;
    try {
      const playlist = Playlist.findOne({ id: req.params.id, userId: req.user.id });
      if (!playlist) return res.status(404).json({ error: "Playlist not found" });
      
      if (!playlist.tracks.includes(trackId)) {
        playlist.tracks.push(trackId);
        Playlist.save(playlist);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: "Failed to add track" });
    }
  });

  app.delete("/api/playlists/:id/tracks/:trackId", authenticateToken, async (req: any, res) => {
    try {
      const playlist = Playlist.findOne({ id: req.params.id, userId: req.user.id });
      if (playlist) {
        playlist.tracks = playlist.tracks.filter((id: string) => id !== req.params.trackId);
        Playlist.save(playlist);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to remove track" });
    }
  });

  app.post("/api/tracks/:id/like", authenticateToken, async (req: any, res) => {
    try {
      let playlist = Playlist.findOne({ userId: req.user.id, name: 'Liked Songs' });
      if (!playlist) {
        playlist = Playlist.create({ userId: req.user.id, name: 'Liked Songs', description: 'Your favorite tracks' });
      }

      const trackId = req.params.id;
      if (playlist.tracks.includes(trackId)) {
        playlist.tracks = playlist.tracks.filter((id: string) => id !== trackId);
        Playlist.save(playlist);
        res.json({ success: true, unliked: true });
      } else {
        playlist.tracks.push(trackId);
        Playlist.save(playlist);
        res.json({ success: true, liked: true });
      }
    } catch (e: any) {
      res.status(400).json({ error: "Failed to like track" });
    }
  });

  app.get("/api/tracks/:id/is-liked", authenticateToken, async (req: any, res) => {
    try {
      const playlist = Playlist.findOne({ userId: req.user.id, name: 'Liked Songs' });
      const liked = playlist?.tracks.includes(req.params.id);
      res.json({ liked: !!liked });
    } catch (error) {
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  // Catch-all for API routes to return 404 JSON instead of falling through to SPA fallback
  app.get("/api/tracks/:id/is-liked", authenticateToken, async (req: any, res) => {
    try {
      const like = Like.findOne({ userId: req.user.id, trackId: req.params.id });
      res.json({ isLiked: !!like });
    } catch (error) {
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  app.post("/api/tracks/:id/like", authenticateToken, async (req: any, res) => {
    try {
      const query = { userId: req.user.id, trackId: req.params.id };
      const existingLike = Like.findOne(query);
      if (existingLike) {
        Like.deleteOne(query);
        res.json({ isLiked: false });
      } else {
        Like.create(query);
        res.json({ isLiked: true });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
