# Deployment Checklist

## Pre-Deployment

- [ ] Copy full RangeManager code from docs
- [ ] Copy full YellowLinkingPanel code from docs
- [ ] Replace WorkBenchPDP.tsx with enhanced version
- [ ] Run `npm install`
- [ ] Run `npm run build` successfully
- [ ] Test SAP Portal functionality
- [ ] Test WorkBench chapter creation
- [ ] Test yellow linking
- [ ] Test publishing toggle
- [ ] Test Web View display

## Testing Flow

1. Generate Session
2. Go to SAP Portal (green card)
3. Create 2-3 SAP items
4. Go to WorkBench (blue card)
5. Create Blue Chapter "Power Tools"
6. Add Sub-Chapter "Drills"
7. Add Range "Cordless 18V"
8. Assign SAP items to range
9. Create Yellow Chapter "Power Tools"
10. Link range to yellow chapter
11. Toggle "Publish"
12. Go to Web View (red card)
13. Verify published items appear

## Known Issues

- RangeManager and YellowLinkingPanel are STUBS
- Need to copy full code from PHASE_4A_4B_COMPLETE_CODE.md
- Web View navigation needs implementation (pattern in docs)

## Support

All code is provided in the documentation files.
Estimated time to complete: 1 hour
