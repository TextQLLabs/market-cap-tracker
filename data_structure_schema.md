# Market Cap Tracker Data Structure

## Schema Design

### Company Object Structure:
```json
{
  "ticker": "string",
  "name": "string", 
  "first_public_year": "number or PRIVATE",
  "ever_top_10": "boolean",
  "market_cap_history": [
    {
      "year": "number",
      "market_cap": "number (in billions) or PRIVATE",
      "citation": "string (source URL or HEURISTIC)",
      "notes": "string (additional context)"
    }
  ]
}
```

### Key Features:
- **Comprehensive Coverage**: Tracks ANY company that has EVER been in top 10
- **Full History**: Includes data from IPO/founding to present
- **Private Years**: Marks "PRIVATE" for years before going public
- **Citations**: Every data point has a citation field (marked "HEURISTIC" for estimates)
- **Flexible**: Can handle companies that went private again, merged, or split

### Data Categories:
1. **Historical Tech Giants**: IBM, GE, Microsoft, Apple
2. **Energy Leaders**: Exxon Mobil (formerly Standard Oil lineage)
3. **Retail/Consumer**: Walmart
4. **Financial**: JPMorgan Chase
5. **Modern Tech**: Google/Alphabet, Meta/Facebook, Amazon

### Heuristic Markers:
All current entries marked "HEURISTIC" for transparency
- Based on historical knowledge of major milestones
- Rough estimates aligned with known events (IPOs, product launches, crises)
- Ready to be replaced with actual cited data

## Ready for Real Data Import
The structure is designed to easily accept pasted data and update the heuristic values with real citations.