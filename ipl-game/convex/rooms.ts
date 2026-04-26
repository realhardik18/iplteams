import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: { name: v.string(), identity: v.string() },
  handler: async (ctx, args) => {
    const allPlayers = await ctx.db.query("players").collect();
    const pool = allPlayers
      .filter(p => p.teams.length >= 2)
      .sort((a, b) => b.teams.length - a.teams.length);
    
    // Pick top players for battle
    const battlePool = pool.slice(0, 150).sort(() => 0.5 - Math.random()).slice(0, 50);
    
    const questions = battlePool.map(target => {
      // Find similar players for options
      const similar = allPlayers.filter(p => 
        p.name !== target.name && 
        p.role === target.role && 
        p.batting === target.batting
      );
      
      let distractors = similar.sort(() => 0.5 - Math.random()).slice(0, 3);
      if (distractors.length < 3) {
        const remaining = allPlayers.filter(p => p.name !== target.name && !distractors.find(d => d.name === p.name));
        distractors = [...distractors, ...remaining.sort(() => 0.5 - Math.random()).slice(0, 3 - distractors.length)];
      }
      
      const options = [target.name, ...distractors.map(d => d.name)].sort();
      return { playerId: target._id, options };
    });
    
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    
    const roomId = await ctx.db.insert("rooms_v2", {
      code,
      players: [{ name: args.name, score: 0, identity: args.identity, ready: false }],
      status: "waiting",
      questions,
    });
    
    return { roomId, code };
  },
});

export const join = mutation({
  args: { code: v.string(), name: v.string(), identity: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms_v2")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    
    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Game already started");
    if (room.players.length >= 2) throw new Error("Room is full");
    
    const players = [...room.players, { name: args.name, score: 0, identity: args.identity, ready: false }];
    await ctx.db.patch(room._id, { players });
    
    return room._id;
  },
});

export const toggleReady = mutation({
  args: { roomId: v.id("rooms_v2"), identity: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return;
    
    const players = room.players.map(p => 
      p.identity === args.identity ? { ...p, ready: !p.ready } : p
    );
    
    const allReady = players.length === 2 && players.every(p => p.ready);
    
    await ctx.db.patch(args.roomId, { 
      players,
      status: allReady ? "starting" : "waiting",
      startTime: allReady ? Date.now() + 3000 : undefined
    });
  },
});

export const start = mutation({
  args: { roomId: v.id("rooms_v2") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      status: "playing",
      startTime: Date.now(),
    });
  },
});

export const updateScore = mutation({
  args: { roomId: v.id("rooms_v2"), identity: v.string(), score: v.number() },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return;
    
    const players = room.players.map(p => 
      p.identity === args.identity ? { ...p, score: args.score } : p
    );
    
    await ctx.db.patch(args.roomId, { players });
  },
});

export const get = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("rooms_v2")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
  },
});

export const rematch = mutation({
  args: { roomId: v.id("rooms_v2") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Re-generate questions
    const allPlayers = await ctx.db.query("players").collect();
    const pool = allPlayers
      .filter(p => p.teams.length >= 2)
      .sort((a, b) => b.teams.length - a.teams.length);

    const battlePool = pool.slice(0, 150).sort(() => 0.5 - Math.random()).slice(0, 50);

    const questions = battlePool.map(target => {
      const similar = allPlayers.filter(p =>
        p.name !== target.name &&
        p.role === target.role &&
        p.batting === target.batting
      );

      let distractors = similar.sort(() => 0.5 - Math.random()).slice(0, 3);
      if (distractors.length < 3) {
        const remaining = allPlayers.filter(p => p.name !== target.name && !distractors.find(d => d.name === p.name));
        distractors = [...distractors, ...remaining.sort(() => 0.5 - Math.random()).slice(0, 3 - distractors.length)];
      }

      const options = [target.name, ...distractors.map(d => d.name)].sort();
      return { playerId: target._id, options };
    });

    const players = room.players.map(p => ({ ...p, score: 0, ready: false }));

    await ctx.db.patch(args.roomId, {
      players,
      status: "waiting",
      questions,
      startTime: undefined,
    });
  },
});

export const getById = query({
  args: { roomId: v.id("rooms_v2") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.roomId);
  },
});
