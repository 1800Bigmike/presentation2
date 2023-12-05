function createMap() {
    // Set up the map
    var map = L.map('college_football_map', {
        center: [39.8283, -98.5795],
        zoom: 4
    });

    // Add tile layer
    L.tileLayer('https://api.mapbox.com/styles/v1/donaldmi/clonhl9e9003s01r7gnt51ksd/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZG9uYWxkbWkiLCJhIjoiY2xvaXlvYzhzMDBiODJsbW84dDg0OGYycyJ9.R7ApXrX_89B27zOIqDVujg', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Load and display the GeoJSON data
    fetch('data/Football_stadiums.geojson')
        .then(response => response.json())
        .then(data => {
            // Load and preprocess the CSV data
            return fetch('data/oregon_st_schedule.csv')
                .then(response => response.text())
                .then(csvData => {
                    // Parse the CSV data
                    const gameData = Papa.parse(csvData, { header: true }).data;

                    // Create a dictionary to store the count of games and wins for each stadium
                    const gameCountByStadium = {};
                    const winCountByStadium = {};

                    // Iterate through the game data to count games and wins for each stadium
                    gameData.forEach(game => {
                        const city = game.Location; // Assuming 'Location' in CSV corresponds to 'CITY' in GeoJSON
                        gameCountByStadium[city] = (gameCountByStadium[city] || 0) + 1;
                        if (game.Status === 'W') {
                            winCountByStadium[city] = (winCountByStadium[city] || 0) + 1;
                        }
                    });
                    
                    // Create a GeoJSON layer with custom styling
                    L.geoJSON(data, {
                        pointToLayer: function (feature, latlng) {
                            const city = feature.properties.CITY;
                            const gameCount = gameCountByStadium[city] || 0;
                    
                            // Filter out stadiums with zero games played
                            if (gameCount === 0) {
                                return null; // Skip this stadium
                            }
                    
                            const winCount = winCountByStadium[city] || 0;
                            const winPercentage = gameCount > 0 ? (winCount / gameCount) * 100 : 0;
                            const schoolName = feature.properties.COMP_AFFIL;
                            const stadiumName = feature.properties.NAME1;
                            // Assign color based on win percentage
                            const color = getColor(winPercentage);
                    
                            // Scale the radius based on game count
                            const maxRadiusDifference = 50;
                            const maxGameCount = 535;
                            const minGameCount = 1;
                            const scaledRadius = ((gameCount - minGameCount) / (maxGameCount - minGameCount)) * maxRadiusDifference + 5;
                    
                            // Customize the appearance of each point based on win percentage
                            return L.circleMarker(latlng, {
                                radius: scaledRadius,
                                fillColor: color,
                                color: 'white',
                                weight: 1,
                                opacity: 1,
                                fillOpacity: 0.8,
                                zIndex: maxGameCount - gameCount // Adjust zIndex to ensure smaller symbols are on top
                            }).bindPopup(`Primary Home Team: ${schoolName}<br>Stadium: ${stadiumName} <br> Games Played: ${gameCount} <br> Win Percentage: ${winPercentage.toFixed(2)}%`);
                        }
                    }).addTo(map);
                    
                });
        })
        .catch(error => {
            console.error('Error loading data:', error);
        });

    // Call your function to get and display additional data
}

// Call the function to create the map
createMap();

// Function to assign color based on win percentage
function getColor(winPercentage) {
    // Convert win percentage to a grayscale value (between 0 and 255)
    const grayscaleValue = Math.round((winPercentage / 100) * 255);

    // Create a grayscale color string
    const grayscaleColor = `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue})`;

    return grayscaleColor;
}


