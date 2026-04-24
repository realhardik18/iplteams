import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all players (optionally filtered by minimum team count for the game)
export const getPlayers = query({
  args: { minTeams: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const minTeams = args.minTeams ?? 0;
    return await ctx.db
      .query("players")
      .withIndex("by_teamCount")
      .filter((q) => q.gte(q.field("teamCount"), minTeams))
      .collect();
  },
});

// Seed data from the JSON file (to be called once)
export const seedPlayers = mutation({
  args: {
    players: v.array(
      v.object({
        name: v.string(),
        role: v.string(),
        batting: v.string(),
        bowling: v.string(),
        teams: v.array(
          v.object({
            team: v.string(),
            years: v.array(v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const player of args.players) {
      // Check if player already exists to avoid duplicates
      const existing = await ctx.db
        .query("players")
        .filter((q) => q.eq(q.field("name"), player.name))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          ...player,
          teamCount: player.teams.length,
        });
      } else {
        await ctx.db.insert("players", {
          ...player,
          teamCount: player.teams.length,
        });
      }
    }
  },
});
