import json
from collections import defaultdict

def process_data():
    with open("ipl_players_detailed.json", "r") as f:
        data = json.load(f)
    
    TEAM_MAPPING = {
        "Delhi Daredevils": "Delhi Capitals",
        "Kings XI Punjab": "Punjab Kings",
        "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
        "Bangalore Royal Challengers": "Royal Challengers Bengaluru"
    }

    # Structure: player -> { teams: {team -> [years]}, details: {role, batting, bowling} }
    player_map = {}
    
    # Sort years to ensure we process them in chronological order
    sorted_years = sorted(data.keys())
    
    for year in sorted_years:
        teams = data[year]
        for original_team_name, players in teams.items():
            # Normalize team name
            team_name = TEAM_MAPPING.get(original_team_name, original_team_name)
            
            for p_info in players:
                name = p_info["name"]
                if name not in player_map:
                    player_map[name] = {
                        "name": name,
                        "teams_dict": defaultdict(set),
                        "role": p_info.get("role", ""),
                        "batting": p_info.get("batting", ""),
                        "bowling": p_info.get("bowling", "")
                    }
                
                player_map[name]["teams_dict"][team_name].add(year)
                # Update details with latest year info
                if p_info.get("role"): player_map[name]["role"] = p_info["role"]
                if p_info.get("batting"): player_map[name]["batting"] = p_info["batting"]
                if p_info.get("bowling"): player_map[name]["bowling"] = p_info["bowling"]
    
    processed_data = []
    for name, p_data in player_map.items():
        teams_with_years = []
        for team_name, years_set in p_data["teams_dict"].items():
            teams_with_years.append({
                "team": team_name,
                "years": sorted(list(years_set))
            })
        
        teams_with_years.sort(key=lambda x: x["years"][0])
        
        processed_data.append({
            "name": name,
            "role": p_data["role"],
            "batting": p_data["batting"],
            "bowling": p_data["bowling"],
            "teams": teams_with_years,
            "teamCount": len(teams_with_years)
        })
    
    with open("processed_players.json", "w") as f:
        json.dump(processed_data, f, indent=4)
    
    print(f"Processed {len(processed_data)} unique players with detailed info.")

if __name__ == "__main__":
    process_data()
