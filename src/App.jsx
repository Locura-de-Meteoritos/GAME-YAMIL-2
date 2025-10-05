import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Earth, Asteroid, StarField, Trajectory, Particles, Missile, NuclearExplosion, CameraShake } from './Scene3D';
import { getRandomThreat } from './nasaAPI';
import './styles.css';

// Datos actualizados con sistema presidencial
const STRATEGIES = {
  nuclear: {
    name: 'Misil Nuclear',
    emoji: '🚀',
    successRate: 70,
    cost: '50 mil millones USD',
    timeRequired: '15 minutos',
    description: 'Interceptación con cabeza nuclear',
    info: 'Detonación nuclear a distancia segura. Validado por NASA y DoD. Riesgo: fragmentación del asteroide.',
    advisors: {
      military: '✅ "Operacionalmente viable. Tenemos 3 misiles Minuteman modificados listos."',
      science: '⚠️ "70% de éxito. Riesgo de fragmentación en 12 pedazos. Algunos podrían impactar."',
      political: '⚠️ "Tratado de prohibición de armas nucleares espaciales. ONU protestará."',
      economic: '💰 "Costo: $50B. Presupuesto de defensa lo cubre."'
    }
  },
  kinetic: {
    name: 'Impactador Cinético',
    emoji: '💥',
    successRate: 85,
    cost: '5 mil millones USD',
    timeRequired: '20 minutos',
    description: 'Impacto directo sin explosivos (NASA DART)',
    info: 'Misión DART (2022) probó esta técnica exitosamente. Desviación precisa sin fragmentación.',
    advisors: {
      military: '✅ "Tecnología probada. SpaceX puede lanzar en 18 minutos."',
      science: '✅ "85% de éxito. Método más limpio. Sin fragmentación. NASA recomienda esta opción."',
      political: '✅ "Sin controversia internacional. Colaboración con ESA y JAXA."',
      economic: '✅ "Costo: $5B. Más económico y seguro."'
    }
  },
  intercept: {
    name: 'Interceptación Múltiple',
    emoji: '🎯',
    successRate: 90,
    cost: '100 mil millones USD',
    timeRequired: '25 minutos',
    description: 'Salva de 5 misiles simultáneos',
    info: 'Redundancia máxima. Sistema AEGIS + THAAD + Patriot modificados. Máxima probabilidad.',
    advisors: {
      military: '✅ "Despliegue desde 3 bases. Cobertura total. Esta es nuestra mejor opción."',
      science: '✅ "90% de éxito. Múltiples vectores de impacto. Probabilidad más alta."',
      political: '⚠️ "Requiere coordinar con Rusia y China. Tensiones geopolíticas."',
      economic: '❌ "Costo: $100B. Requiere aprobación del Congreso. Déficit presupuestario."'
    }
  },
  evacuate: {
    name: 'Evacuación Global',
    emoji: '🚨',
    successRate: 0,
    cost: '500 mil millones USD',
    timeRequired: '60 minutos',
    description: 'Abandonar intercepción, evacuar zona de impacto',
    info: 'Sin intervención. Evacuación de 200 millones de personas. Pérdidas catastróficas inevitables.',
    advisors: {
      military: '❌ "Rendición total. Inaceptable para la defensa nacional."',
      science: '❌ "Impacto confirmado. 2.5 millones de muertes directas. Invierno nuclear 3 años."',
      political: '❌ "Fin de su presidencia. Moción de censura inmediata. Crisis constitucional."',
      economic: '❌ "Colapso económico global. Pérdidas: $10 trillones. Gran Depresión 2.0."'
    }
  }
};

function App() {
  // Estados principales
  const [gameState, setGameState] = useState('briefing');
  const [countdown, setCountdown] = useState(60);
  const [distance, setDistance] = useState(1000000);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [reactionTime, setReactionTime] = useState(0);
  const [showAdvisors, setShowAdvisors] = useState(false);
  const [selectedForAdvice, setSelectedForAdvice] = useState(null);
  
  // Datos del asteroide real de la NASA
  const [asteroidData, setAsteroidData] = useState({
    name: 'Apophis',
    size: 370,
    velocity: 12,
    isPotentiallyHazardous: true
  });
  
  // Estados de efectos 3D
  const [missileActive, setMissileActive] = useState(false);
  const [explosionActive, setExplosionActive] = useState(false);
  const [explosionPosition, setExplosionPosition] = useState([0, 0, 0]);
  const [fragments, setFragments] = useState(null);
  const [asteroidTarget, setAsteroidTarget] = useState({ x: 5, y: 2.5, z: 5 });

  const startTimeRef = useRef(null);

  // Cargar asteroide real de la NASA
  useEffect(() => {
    const loadAsteroid = async () => {
      const threat = await getRandomThreat();
      setAsteroidData(threat);
      setDistance(threat.distance);
    };
    loadAsteroid();
  }, []);

  // Iniciar el juego
  useEffect(() => {
    if (gameState === 'briefing') {
      const timer = setTimeout(() => {
        setGameState('situation-room');
        startTimeRef.current = Date.now();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Countdown
  useEffect(() => {
    if (gameState === 'situation-room' || gameState === 'playing') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            handleStrategyFailure('evacuate');
            return 0;
          }
          return prev - 1;
        });

        setDistance((prev) => Math.max(50000, prev - 16666));
        
        // Actualizar posición del asteroide para targeting
        const newDistance = Math.max(50000, distance - 16666);
        const angle = Math.PI / 4;
        const baseDistance = 8;
        const currentDistance = baseDistance - (baseDistance - 2.5) * (1 - newDistance / 1000000);
        setAsteroidTarget({
          x: Math.cos(angle) * currentDistance,
          y: Math.sin(angle) * currentDistance * 0.5,
          z: Math.sin(angle) * currentDistance
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState, distance]);

  // Consultar asesores
  const consultAdvisors = (strategyKey) => {
    setSelectedForAdvice(strategyKey);
    setShowAdvisors(true);
  };

  // Ejecutar estrategia
  const executeStrategy = (strategyKey) => {
    if (gameState !== 'situation-room' && gameState !== 'playing') return;
    if (selectedStrategy) return;

    setSelectedStrategy(strategyKey);
    setReactionTime(60 - countdown);
    setGameState('executing');
    setShowAdvisors(false);

    // Efectos visuales según estrategia
    if (strategyKey === 'nuclear' || strategyKey === 'kinetic' || strategyKey === 'intercept') {
      setMissileActive(true);
    }

    setTimeout(() => {
      calculateOutcome(strategyKey);
    }, 4000);
  };

  // Impacto del misil
  const handleMissileImpact = () => {
    setMissileActive(false);
    setExplosionPosition([asteroidTarget.x, asteroidTarget.y, asteroidTarget.z]);
    setExplosionActive(true);

    // Generar fragmentos si es nuclear
    if (selectedStrategy === 'nuclear') {
      const frags = [];
      for (let i = 0; i < 12; i++) {
        frags.push({
          position: { ...asteroidTarget },
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2,
            z: (Math.random() - 0.5) * 2
          },
          size: Math.random() * 0.15 + 0.05
        });
      }
      setFragments(frags);
    }
  };

  // Calcular resultado
  const calculateOutcome = (strategyKey) => {
    const strategy = STRATEGIES[strategyKey];
    const baseSuccess = strategy.successRate;
    const timeBonus = Math.min(20, countdown * 0.5);
    const finalChance = baseSuccess + timeBonus;
    const roll = Math.random() * 100;

    if (roll <= finalChance) {
      setGameState('success');
    } else {
      handleStrategyFailure(strategyKey);
    }
  };

  const handleStrategyFailure = (strategyKey) => {
    setGameState('failure');
    if (!selectedStrategy) {
      setSelectedStrategy(strategyKey);
      setReactionTime(60);
    }
  };

  // Reiniciar
  const resetGame = () => {
    setGameState('briefing');
    setCountdown(60);
    setDistance(1000000);
    setSelectedStrategy(null);
    setReactionTime(0);
    setShowAdvisors(false);
    setSelectedForAdvice(null);
    setMissileActive(false);
    setExplosionActive(false);
    setFragments(null);
    startTimeRef.current = null;
  };

  return (
    <div className="app">
      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 3, 12], fov: 60 }}
        className="canvas-3d"
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#4285f4" />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        
        <StarField />
        <Earth gameState={gameState} />
        <Asteroid 
          distance={distance} 
          strategy={selectedStrategy}
          gameState={gameState}
          fragments={fragments}
        />
        <Trajectory distance={distance} />
        
        {/* Misil */}
        <Missile 
          target={asteroidTarget}
          active={missileActive}
          onImpact={handleMissileImpact}
        />

        {/* Explosión nuclear MASIVA */}
        <NuclearExplosion 
          position={explosionPosition}
          active={explosionActive}
          onComplete={() => setExplosionActive(false)}
        />
        
        {/* Camera Shake - Vibración dramática */}
        <CameraShake 
          active={explosionActive}
          intensity={0.3}
          duration={2.5}
        />
        
        {/* Partículas de explosión */}
        <Particles 
          active={explosionActive} 
          position={explosionPosition}
          color="#ff6600"
          count={5000}
        />
        
        {/* Partículas adicionales de humo */}
        <Particles 
          active={explosionActive} 
          position={explosionPosition}
          color="#888888"
          count={2000}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Briefing */}
        {gameState === 'briefing' && (
          <div className="briefing-screen animate-fade-in">
            <div className="presidential-seal">🦅</div>
            <h1 className="title-main">🇺🇸 OFICINA DEL PRESIDENTE 🇺🇸</h1>
            <div className="briefing-content">
              <p className="briefing-text">
                <strong>SEÑOR PRESIDENTE</strong><br />
                <br />
                NORAD detectó asteroide 2025-PDC en trayectoria de colisión.<br />
                Designación: <span className="highlight">APOPHIS</span><br />
                Impacto estimado: <span className="highlight">60 MINUTOS</span><br />
                <br />
                Su Gabinete de Seguridad Nacional está reunido.<br />
                La decisión recae en usted.
              </p>
              <p className="briefing-subtext">
                Ingresando a la Sala de Situación...
              </p>
            </div>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        )}

        {/* Sala de Situación - HUD Gaming Style */}
        {(gameState === 'situation-room' || gameState === 'playing') && (
          <>
            {/* HUD Superior Compacto */}
            <div className="hud-top">
              <div className="hud-left">
                <div className="hud-item">
                  <span className="hud-icon">🎯</span>
                  <div>
                    <div className="hud-label">TARGET</div>
                    <div className="hud-value">{asteroidData.name}</div>
                  </div>
                </div>
                <div className="hud-item">
                  <span className="hud-icon">📏</span>
                  <div>
                    <div className="hud-label">SIZE</div>
                    <div className="hud-value">{asteroidData.size}m</div>
                  </div>
                </div>
                <div className="hud-item">
                  <span className="hud-icon">⚡</span>
                  <div>
                    <div className="hud-label">SPEED</div>
                    <div className="hud-value">{asteroidData.velocity} km/s</div>
                  </div>
                </div>
              </div>
              
              {/* Countdown en esquina superior derecha */}
              <div className={`hud-countdown ${countdown <= 10 ? 'critical' : ''}`}>
                <div className="countdown-circle">
                  <svg viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                    <circle 
                      cx="50" cy="50" r="45" 
                      fill="none" 
                      stroke={countdown <= 10 ? '#ff0000' : '#4285f4'}
                      strokeWidth="8"
                      strokeDasharray={`${(countdown / 60) * 283} 283`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="countdown-text">{countdown}</div>
                </div>
              </div>
            </div>

            {/* Barra de distancia */}
            <div className="distance-bar">
              <div className="distance-fill" style={{ width: `${(1 - distance / 1000000) * 100}%` }}></div>
              <span className="distance-text">{Math.round(distance).toLocaleString()} km</span>
            </div>

            {/* Panel de asesores compacto */}
            {showAdvisors && selectedForAdvice && (
              <div className="advisor-overlay">
                <div className="advisor-compact glass">
                  <div className="advisor-compact-header">
                    <h3>{STRATEGIES[selectedForAdvice].emoji} {STRATEGIES[selectedForAdvice].name}</h3>
                    <button className="close-btn-small" onClick={() => setShowAdvisors(false)}>✕</button>
                  </div>
                  <div className="advisor-quick-stats">
                    <div className="quick-stat">
                      <span className="stat-icon">🎯</span>
                      <span>{STRATEGIES[selectedForAdvice].successRate}% Success</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-icon">💰</span>
                      <span>{STRATEGIES[selectedForAdvice].cost}</span>
                    </div>
                    <div className="quick-stat">
                      <span className="stat-icon">⏱️</span>
                      <span>{STRATEGIES[selectedForAdvice].timeRequired}</span>
                    </div>
                  </div>
                  <div className="advisors-compact-grid">
                    {Object.entries(STRATEGIES[selectedForAdvice].advisors).map(([role, advice]) => (
                      <div key={role} className="advisor-mini">
                        <span className="advisor-icon">
                          {role === 'military' && '⭐'}
                          {role === 'science' && '🔬'}
                          {role === 'political' && '🏛️'}
                          {role === 'economic' && '💼'}
                        </span>
                        <div className="advisor-mini-text">{advice}</div>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn-authorize"
                    onClick={() => executeStrategy(selectedForAdvice)}
                  >
                    ⚡ AUTHORIZE STRIKE
                  </button>
                </div>
              </div>
            )}

            {/* Menú de Estrategias estilo Gaming - Compacto en la parte inferior */}
            {!showAdvisors && (
              <div className="game-menu-bottom">
                <div className="menu-header">
                  <span className="menu-title">⚔️ DEFENSES</span>
                  <span className="menu-subtitle">Select your strategy</span>
                </div>
                <div className="game-strategies">
                  {Object.entries(STRATEGIES).map(([key, strategy]) => (
                    <div key={key} className="game-strategy-card">
                      <div className="strategy-icon">{strategy.emoji}</div>
                      <div className="strategy-content">
                        <div className="strategy-name">{strategy.name}</div>
                        <div className="strategy-quick-stats">
                          <span className={`success-badge ${strategy.successRate >= 70 ? 'high' : strategy.successRate >= 40 ? 'medium' : 'low'}`}>
                            {strategy.successRate}%
                          </span>
                          <span className="cost-badge">${strategy.cost.split(' ')[0]}B</span>
                        </div>
                      </div>
                      <div className="strategy-buttons">
                        <button 
                          className="btn-info"
                          onClick={() => consultAdvisors(key)}
                          disabled={selectedStrategy !== null}
                          title="Consultar asesores"
                        >
                          ℹ️
                        </button>
                        <button 
                          className="btn-launch"
                          onClick={() => executeStrategy(key)}
                          disabled={selectedStrategy !== null}
                        >
                          LAUNCH
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Ejecutando */}
        {gameState === 'executing' && (
          <div className="side-panel-left presidential glass animate-slide-left">
            <h2 className="execution-title">⚙️ EJECUTANDO OPERACIÓN</h2>
            <div className="execution-emoji">{STRATEGIES[selectedStrategy].emoji}</div>
            <p className="execution-text">{STRATEGIES[selectedStrategy].name}</p>
            <div className="execution-details">
              <p>🎯 Sistema de armas activado</p>
              <p>🚀 Misil en trayectoria de interceptación</p>
              <p>📡 Tracking en tiempo real</p>
            </div>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <p className="execution-subtext">El mundo observa...</p>
          </div>
        )}

        {/* Victoria */}
        {gameState === 'success' && (
          <>
            {/* Título centrado */}
            <div className="center-message animate-fade-in">
              <div className="presidential-seal large">🦅</div>
              <h1 className="result-title success-title">🎖️ OPERACIÓN EXITOSA 🎖️</h1>
            </div>

            {/* Panel lateral con información */}
            <div className="side-panel-left presidential glass animate-slide-left">
              <p className="result-message">
                ¡Señor Presidente, el asteroide ha sido neutralizado!<br />
                Su decisión salvó millones de vidas.<br />
                <strong>La humanidad está a salvo.</strong>
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Estrategia</div>
                  <div className="stat-value">{STRATEGIES[selectedStrategy].name}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tiempo de Decisión</div>
                  <div className="stat-value">{reactionTime}s</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Vidas Salvadas</div>
                  <div className="stat-value success-text">7,800,000,000</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Aprobación</div>
                  <div className="stat-value success-text">94%</div>
                </div>
              </div>

              <div className="news-ticker">
                <p>📰 <strong>CNN:</strong> "Presidente lideró la operación de defensa planetaria más importante de la historia"</p>
                <p>📰 <strong>ONU:</strong> "Medalla de Honor para el Comandante en Jefe"</p>
                <p>📰 <strong>NASA:</strong> "Protocolo ejecutado a la perfección"</p>
              </div>

              <div className="info-box">
                <h3>📚 Análisis Técnico</h3>
                <p>{STRATEGIES[selectedStrategy].info}</p>
              </div>

              <button className="reset-button presidential" onClick={resetGame}>
                🔄 Nueva Crisis Global
              </button>
            </div>
          </>
        )}

        {/* Derrota */}
        {gameState === 'failure' && (
          <div className="result-screen failure-screen animate-fade-in">
            <h1 className="result-title failure-title">💥 IMPACTO CONFIRMADO 💥</h1>
            <div className="result-content presidential glass">
              <p className="result-message">
                Señor Presidente...<br />
                El asteroide impactó la Tierra.<br />
                <strong>Consecuencias catastróficas.</strong>
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Estrategia</div>
                  <div className="stat-value">
                    {selectedStrategy ? STRATEGIES[selectedStrategy].name : 'Ninguna'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tiempo de Decisión</div>
                  <div className="stat-value">{reactionTime}s</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Bajas</div>
                  <div className="stat-value failure-text">2.5M+ directas</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Aprobación</div>
                  <div className="stat-value failure-text">12%</div>
                </div>
              </div>

              <div className="news-ticker failure">
                <p>📰 <strong>Breaking:</strong> "Congreso inicia proceso de juicio político"</p>
                <p>📰 <strong>Protestas:</strong> "Manifestaciones globales exigen renuncia"</p>
                <p>📰 <strong>ONU:</strong> "Investigación sobre incompetencia en la respuesta"</p>
              </div>

              <div className="info-box danger">
                <h3>📊 Consecuencias del Impacto</h3>
                <p>
                  • <strong>Zona de devastación:</strong> 500 km de radio<br />
                  • <strong>Víctimas directas:</strong> 2.5 millones<br />
                  • <strong>Tsunami:</strong> Olas de 30m en costa oeste<br />
                  • <strong>Invierno por impacto:</strong> 3 años<br />
                  • <strong>Pérdidas económicas:</strong> $10 trillones<br />
                  • <strong>Hambruna global:</strong> 500 millones afectados<br />
                  <br />
                  <em>Una mejor decisión pudo haber salvado al mundo.</em>
                </p>
              </div>

              <button className="reset-button presidential" onClick={resetGame}>
                🔄 Rehacer Historia
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
