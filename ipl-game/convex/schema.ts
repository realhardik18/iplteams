import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  players: defineTable({
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
    teamCount: v.number(), // Added for easier filtering/sorting
  }).index("by_teamCount", ["teamCount"]),

  rooms_v2: defineTable({
    code: v.string(),
    players: v.array(
      v.object({
        name: v.string(),
        score: v.number(),
        identity: v.string(),
        ready: v.boolean(),
      })
    ),
    status: v.string(), // "waiting", "playing", "finished"
    startTime: v.optional(v.number()),
    questions: v.array(
      v.object({
        playerId: v.id("players"),
        options: v.array(v.string()),
      })
    ),
  }).index("by_code", ["code"]),
});
