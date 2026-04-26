import json
import time
import os
import re
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium_stealth import stealth

def get_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--proxy-server='direct://'")
    chrome_options.add_argument("--proxy-bypass-list=*")
    chrome_options.add_argument("--blink-settings=imagesEnabled=false") # Disable images for speed
    chrome_options.page_load_strategy = 'eager' # Don't wait for everything
    chrome_options.add_argument("window-size=1920,1080")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    
    stealth(driver,
            languages=["en-US", "en"],
            vendor="Google Inc.",
            platform="Win32",
            webgl_vendor="Intel Inc.",
            renderer="Intel Iris OpenGL Engine",
            fix_hairline=True,
            )
    driver.set_page_load_timeout(60) # Increased timeout
    return driver

def scrape_ipl_data(seasons_file):
    output_file = "ipl_players_detailed.json"
    all_data = {}
    
    if os.path.exists(output_file):
        try:
            with open(output_file, "r") as f:
                all_data = json.load(f)
            print(f"Loaded existing data for seasons: {list(all_data.keys())}")
        except:
            print("Could not load existing data, starting fresh.")

    seasons = {}
    with open(seasons_file, "r") as f:
        content = f.read()
        matches = re.findall(r'"(\d{4})":\s*"([^"]+)"', content)
        for year, url in matches:
            seasons[year] = url

    driver = get_driver()
    
    try:
        for year, squads_url in sorted(seasons.items()):
            if year in all_data and all_data[year]:
                print(f"Skipping Season {year} (already scraped)")
                continue
                
            print(f"--- Scraping Season {year} ---")
            all_data[year] = {}
            
            for attempt in range(3):
                try:
                    driver.get(squads_url)
                    # Wait for team links
                    WebDriverWait(driver, 30).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, 'a[href*="-squad-"]'))
                    )
                    break
                except Exception as e:
                    print(f"  Attempt {attempt+1} failed for {year}: {e}")
                    if attempt == 2: raise e
                    time.sleep(5)
                    driver.quit()
                    driver = get_driver()
            
            # Find all squad links
            team_elements = driver.find_elements(By.CSS_SELECTOR, 'a[href*="-squad-"]')
            team_links = []
            for el in team_elements:
                href = el.get_attribute("href")
                title = el.get_attribute("title") or el.text
                if "/series-squads" in href or "-squad-" in href:
                    team_name = title.replace(" Squad", "").strip()
                    if team_name and href not in [l[1] for l in team_links]:
                        team_links.append((team_name, href))
            
            print(f"Found {len(team_links)} teams for {year}")
            
            for team_name, team_url in team_links:
                print(f"  Scraping {team_name}...")
                
                for attempt in range(3):
                    try:
                        driver.get(team_url)
                        # Wait for player name element
                        WebDriverWait(driver, 30).until(
                            EC.presence_of_element_located((By.CSS_SELECTOR, 'span.ds-text-compact-s.ds-font-medium'))
                        )
                        
                        # Scroll down to load all players if lazy loaded
                        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                        time.sleep(1)
                        
                        player_cards = driver.find_elements(By.CSS_SELECTOR, 'div.ds-relative.ds-flex.ds-flex-row')
                        players = []
                        for card in player_cards:
                            try:
                                name_el = card.find_element(By.CSS_SELECTOR, 'span.ds-text-compact-s.ds-font-medium')
                                name = name_el.text.strip()
                                if not name: continue
                                
                                role = ""
                                try:
                                    role_el = card.find_element(By.CSS_SELECTOR, 'p.ds-text-tight-s.ds-font-regular')
                                    role = role_el.text.strip()
                                except: pass
                                
                                batting = ""
                                bowling = ""
                                info_spans = card.find_elements(By.CSS_SELECTOR, 'span.ds-text-compact-xxs')
                                for i, span in enumerate(info_spans):
                                    text = span.text.strip()
                                    if text == "Batting:":
                                        try: batting = info_spans[i+1].text.strip()
                                        except: pass
                                    elif text == "Bowling:":
                                        try: bowling = info_spans[i+1].text.strip()
                                        except: pass
                                
                                player_info = {"name": name, "role": role, "batting": batting, "bowling": bowling}
                                if player_info not in players:
                                    players.append(player_info)
                            except: continue
                        
                        all_data[year][team_name] = players
                        print(f"    Done: {len(players)} players found.")
                        break
                    except Exception as e:
                        print(f"    Attempt {attempt+1} failed for {team_name}: {e}")
                        if attempt == 2: break
                        time.sleep(5)
                        driver.quit()
                        driver = get_driver()
                
                # Save progress after each team to be extra safe
                with open(output_file, "w") as f:
                    json.dump(all_data, f, indent=4)
                
                time.sleep(1)
            
            # Refresh driver every season
            driver.quit()
            driver = get_driver()

        with open("ipl_players.json", "w") as f:
            json.dump(all_data, f, indent=4)
        print("Scraping completed successfully.")

    finally:
        try: driver.quit()
        except: pass

if __name__ == "__main__":
    scrape_ipl_data("seasons.txt")
