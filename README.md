# GYMTRACE

Athletic-dark demo webapp for gym face check-in and occupancy prediction.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo PINs
- Staff: `1234`
- Admin: `9999`

### Day-pass demo codes
- `DP-2201`, `DP-2202` (unused)
- `DP-USED1` (already used)

Face scan is mocked (camera UI + timed match against seeded members). Occupancy uses a deterministic predictor over time-of-day + recent attendance.
