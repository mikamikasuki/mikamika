# Statistics sources and definitions

Source profile revision: `d4ca626cf2f955065b3aa669955ae5389c8ba475`.

The source uses github-readme-stats without `include_all_commits` or `commits_year`. Its fetcher requests the default past-year contributions collection, all authored PRs, open + closed authored issues, `repositoriesContributedTo` with COMMIT/ISSUE/PULL_REQUEST/REPOSITORY types, and owned repository stars. Reviewed upstream source: <https://github.com/anuraghazra/github-readme-stats/blob/master/src/fetchers/stats.js>.

| Display | Adopted definition |
| --- | --- |
| Total Stars Earned | Sum of stargazers on all owned repositories visible to the credential; every page is fetched. The public upstream instance may limit pagination. |
| Total Commits (last year) | `totalCommitContributions` over an explicit one-calendar-year window ending at fetch time, matching the source’s default rolling window. It is not account lifetime commits. |
| Total PRs | All authored pull requests, every status; not merged PRs. |
| Total Issues | Authored OPEN + CLOSED issues, lifetime totals. |
| Contributed to (last year) | `repositoriesContributedTo` totalCount with the same four contribution types and GitHub’s default past-year window. |
| Total Contributions | Sum of daily contribution counts from account creation to fetch date; distinct calendar dates are aggregated across yearly queries. This includes the types GitHub includes in its contribution calendar. |
| Current Streak | Consecutive calendar dates with a positive API count, ending today, or yesterday if today has no contribution yet. |

The current year is refreshed on each build. Completed years are cached by username/year for 30 days, allowing retroactive GitHub changes to refresh without re-requesting all years daily. The API’s UTC-named calendar dates are retained; the day considered “today” is evaluated in `stats_timezone` (default America/Los_Angeles). Counts cannot be re-bucketed to arbitrary timezones because the calendar API does not provide event timestamps. This explicit rule can differ from another streak service’s UTC “today.” Tests cover today/yesterday, gaps and New Year boundaries.

Yearly responses are checked for calendar coverage. GraphQL errors, null counts, invalid creation dates, truncated pagination, timeouts and depleted rate limits reject the fetch; partially fetched numbers never replace a complete snapshot. A last-known-good record retains its original `fetched_at` and is marked stale. With no successful snapshot, values and rank remain unavailable, displayed as `—`.

Rank is the unmodified github-readme-stats calculation, with `all_commits: false`, rolling commits/reviews, lifetime PRs/issues, stars and followers. It is a comparative grade, not an official GitHub identity. `vendor/calculateRank.js` and its MIT license preserve attribution. Snapshot fields include `source`, `fetched_at`, `window` and `timezone`; the site Statistics disclosure displays them.

Only contribution counts and public display metrics are exported. Credentials never enter frontend bundles, SVGs, manifests or request-error logs. No API calls are made while a README image plays.
