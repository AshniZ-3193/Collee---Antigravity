import { internalMutation } from "./_generated/server";

/**
 * One-time migration: clear malformed identityHandling values that are not
 * arrays (e.g. plain strings saved by an earlier version of the code).
 * Run once via the Convex dashboard, then this file can be deleted.
 */
export const fixIdentityHandling = internalMutation({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("userProfiles").collect();
    let fixed = 0;
    for (const profile of profiles) {
      if (
        profile.identityHandling !== undefined &&
        !Array.isArray(profile.identityHandling)
      ) {
        await ctx.db.patch(profile._id, { identityHandling: undefined });
        fixed++;
      }
    }
    return { fixed };
  },
});
