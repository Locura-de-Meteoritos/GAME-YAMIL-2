// NASA NeoWs API Service
const NASA_API_KEY = 'gDbFisHOXVFSzFqoD1YTxDNgbuNVMtlLF75qoa2f';
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

export const getNearEarthObjects = async () => {
  try {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    const startDateStr = today.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const response = await fetch(
      `${BASE_URL}/feed?start_date=${startDateStr}&end_date=${endDateStr}&api_key=${NASA_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch NEOs');
    }
    
    const data = await response.json();
    
    // Obtener todos los NEOs del periodo
    const allNeos = [];
    Object.values(data.near_earth_objects).forEach(neos => {
      allNeos.push(...neos);
    });
    
    // Filtrar los más peligrosos (potencialmente peligrosos)
    const dangerousNeos = allNeos
      .filter(neo => neo.is_potentially_hazardous_asteroid)
      .sort((a, b) => {
        const aSize = a.estimated_diameter.meters.estimated_diameter_max;
        const bSize = b.estimated_diameter.meters.estimated_diameter_max;
        return bSize - aSize;
      })
      .slice(0, 5);
    
    // Si no hay asteroides peligrosos, tomar los más grandes
    const selectedNeos = dangerousNeos.length > 0 
      ? dangerousNeos 
      : allNeos
          .sort((a, b) => {
            const aSize = a.estimated_diameter.meters.estimated_diameter_max;
            const bSize = b.estimated_diameter.meters.estimated_diameter_max;
            return bSize - aSize;
          })
          .slice(0, 5);
    
    return selectedNeos.map(neo => ({
      id: neo.id,
      name: neo.name,
      size: Math.round(neo.estimated_diameter.meters.estimated_diameter_max),
      velocity: Math.round(parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second)),
      distance: Math.round(parseFloat(neo.close_approach_data[0].miss_distance.kilometers)),
      isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid,
      approachDate: neo.close_approach_data[0].close_approach_date,
      absoluteMagnitude: neo.absolute_magnitude_h
    }));
  } catch (error) {
    console.error('Error fetching NASA NEOs:', error);
    // Fallback a datos de ejemplo si la API falla
    return [{
      id: '2029075',
      name: 'Apophis',
      size: 370,
      velocity: 12,
      distance: 1000000,
      isPotentiallyHazardous: true,
      approachDate: '2029-04-13',
      absoluteMagnitude: 19.7
    }];
  }
};

export const getRandomThreat = async () => {
  const neos = await getNearEarthObjects();
  const randomIndex = Math.floor(Math.random() * neos.length);
  return neos[randomIndex];
};
