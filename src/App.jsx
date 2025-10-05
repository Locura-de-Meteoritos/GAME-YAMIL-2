import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Earth, Asteroid, StarField, Trajectory, Particles } from './Scene3D';
import './styles.css';

// Datos de las estrategias
const STRATEGIES = {
  nuclear: {
    name: 'Misil Nuclear',
    emoji: '🚀',
    successRate: 70,
    description: 'Explosión de alta energía',
    info: 'Detonación nuclear a distancia segura. Similar a propuestas de la NASA de los años 90. Riesgo: fragmentación del asteroide.'
  },
  kinetic: {
    name: 'Impactador Cinético',
    emoji: '💥',
    successRate: 85,
    description: 'Cambio de trayectoria (NASA DART)',
    info: 'Misión DART (2022) demostró exitosamente esta técnica con el asteroide Dimorphos, cambiando su órbita en 32 minutos.'
  },
  solar: {
    name: 'Vela Solar',
    emoji: '☀️',
    successRate: 40,
    description: 'Desviación gradual (requiere más tiempo)',
    info: 'Usa radiación solar para empuje gradual. Efectivo solo con años de anticipación. Sin riesgo de fragmentación.'
  },
  evacuate: {
    name: 'Evacuación',
    emoji: '❌',
    successRate: 0,
    description: 'Abandona la defensa',
    info: 'Sin intervención. Un asteroide de 370m causaría devastación regional masiva y efectos climáticos globales.'
  }
};

function App() {
  // Estados principales del juego
  const [gameState, setGameState] = useState('briefing'); // briefing, playing, executing, success, failure
  const [countdown, setCountdown] = useState(60);
  const [distance, setDistance] = useState(1000000); // km
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const [reactionTime, setReactionTime] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  const startTimeRef = useRef(null);

  // Iniciar el juego después del briefing
  useEffect(() => {
    if (gameState === 'briefing') {
      const timer = setTimeout(() => {
        setGameState('playing');
        startTimeRef.current = Date.now();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Ocultar tutorial después de 5 segundos
  useEffect(() => {
    if (gameState === 'playing' && showTutorial) {
      const timer = setTimeout(() => setShowTutorial(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [gameState, showTutorial]);

  // Countdown y actualización de distancia
  useEffect(() => {
    if (gameState === 'playing') {
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // Tiempo agotado - fallo automático
            handleStrategyFailure('evacuate');
            return 0;
          }
          return prev - 1;
        });

        // Actualizar distancia (se acerca)
        setDistance((prev) => Math.max(50000, prev - 16666)); // 12 km/s aprox
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [gameState]);

  // Ejecutar estrategia seleccionada
  const executeStrategy = (strategyKey) => {
    if (gameState !== 'playing' || selectedStrategy) return;

    setSelectedStrategy(strategyKey);
    setReactionTime(60 - countdown);
    setGameState('executing');

    // Simular tiempo de ejecución
    setTimeout(() => {
      calculateOutcome(strategyKey);
    }, 3000);
  };

  // Calcular éxito o fallo
  const calculateOutcome = (strategyKey) => {
    const strategy = STRATEGIES[strategyKey];
    const baseSuccess = strategy.successRate;
    
    // Bonus por tiempo (más tiempo = mejor)
    const timeBonus = Math.min(20, countdown * 0.5);
    
    // Probabilidad final
    const finalChance = baseSuccess + timeBonus;
    
    // Factor aleatorio
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

  // Reiniciar juego
  const resetGame = () => {
    setGameState('briefing');
    setCountdown(60);
    setDistance(1000000);
    setSelectedStrategy(null);
    setReactionTime(0);
    setShowTutorial(true);
    startTimeRef.current = null;
  };

  return (
    <div className="app">
      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        className="canvas-3d"
      >
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4285f4" />
        
        <StarField />
        <Earth gameState={gameState} />
        <Asteroid 
          distance={distance} 
          strategy={selectedStrategy}
          gameState={gameState}
        />
        <Trajectory distance={distance} />
        
        {/* Partículas de explosión */}
        <Particles 
          active={gameState === 'executing' && selectedStrategy === 'nuclear'} 
          position={[4, 2, 4]}
        />
      </Canvas>

      {/* UI Overlay */}
      <div className="ui-overlay">
        {/* Briefing inicial */}
        {gameState === 'briefing' && (
          <div className="briefing-screen animate-fade-in">
            <h1 className="title-main">⚠️ PLANETARY DEFENSE COMMANDER ⚠️</h1>
            <div className="briefing-content">
              <p className="briefing-text">
                <strong>ALERTA CRÍTICA</strong><br />
                Asteroide detectado en curso de colisión con la Tierra.<br />
                Designación: <span className="highlight">APOPHIS</span><br />
                Usted ha sido designado Comandante de Defensa Planetaria.
              </p>
              <p className="briefing-subtext">
                Iniciando protocolo de emergencia...
              </p>
            </div>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
          </div>
        )}

        {/* Panel de control durante el juego */}
        {gameState === 'playing' && (
          <>
            {/* Header con datos del asteroide */}
            <div className="header-panel glass animate-slide-down">
              <div className="asteroid-data">
                <div className="data-item">
                  <span className="data-label">OBJETIVO</span>
                  <span className="data-value">Apophis</span>
                </div>
                <div className="data-item">
                  <span className="data-label">TAMAÑO</span>
                  <span className="data-value">370m</span>
                </div>
                <div className="data-item">
                  <span className="data-label">VELOCIDAD</span>
                  <span className="data-value">12 km/s</span>
                </div>
                <div className="data-item">
                  <span className="data-label">DISTANCIA</span>
                  <span className="data-value blink-red">
                    {Math.round(distance).toLocaleString()} km
                  </span>
                </div>
              </div>
            </div>

            {/* Countdown */}
            <div className={`countdown ${countdown <= 10 ? 'critical' : ''}`}>
              <div className="countdown-label">TIEMPO RESTANTE</div>
              <div className="countdown-value">{countdown}s</div>
              {countdown <= 10 && <div className="countdown-warning">¡CRÍTICO!</div>}
            </div>

            {/* Tutorial */}
            {showTutorial && (
              <div className="tutorial glass animate-fade-in">
                <p>👆 Selecciona una estrategia de mitigación</p>
                <p className="tutorial-small">Actúa rápido - más tiempo = mayor probabilidad de éxito</p>
              </div>
            )}

            {/* Botones de estrategias */}
            <div className="strategies-panel glass animate-slide-up">
              <h2 className="strategies-title">ESTRATEGIAS DE MITIGACIÓN</h2>
              <div className="strategies-grid">
                {Object.entries(STRATEGIES).map(([key, strategy]) => (
                  <button
                    key={key}
                    className="strategy-button"
                    onClick={() => executeStrategy(key)}
                    disabled={selectedStrategy !== null}
                  >
                    <div className="strategy-emoji">{strategy.emoji}</div>
                    <div className="strategy-info">
                      <div className="strategy-name">{strategy.name}</div>
                      <div className="strategy-success">
                        Éxito: <span className={`success-rate ${strategy.successRate >= 70 ? 'high' : strategy.successRate >= 40 ? 'medium' : 'low'}`}>
                          {strategy.successRate}%
                        </span>
                      </div>
                      <div className="strategy-desc">{strategy.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Control de audio */}
            <button 
              className="mute-button glass"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </>
        )}

        {/* Pantalla de ejecución */}
        {gameState === 'executing' && (
          <div className="execution-screen glass animate-fade-in">
            <h2 className="execution-title">EJECUTANDO ESTRATEGIA</h2>
            <div className="execution-emoji">{STRATEGIES[selectedStrategy].emoji}</div>
            <p className="execution-text">{STRATEGIES[selectedStrategy].name}</p>
            <div className="loading-bar">
              <div className="loading-progress"></div>
            </div>
            <p className="execution-subtext">Calculando resultado...</p>
          </div>
        )}

        {/* Pantalla de victoria */}
        {gameState === 'success' && (
          <div className="result-screen success-screen animate-fade-in">
            <h1 className="result-title success-title">✅ MISIÓN EXITOSA</h1>
            <div className="result-content glass">
              <p className="result-message">
                ¡El asteroide ha sido desviado con éxito!<br />
                La humanidad está a salvo.
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Estrategia</div>
                  <div className="stat-value">{STRATEGIES[selectedStrategy].name}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tiempo de Reacción</div>
                  <div className="stat-value">{reactionTime}s</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Población Salvada</div>
                  <div className="stat-value success-text">7,800,000,000</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Efectividad</div>
                  <div className="stat-value success-text">ÓPTIMA</div>
                </div>
              </div>

              <div className="info-box">
                <h3>📚 Dato Educativo</h3>
                <p>{STRATEGIES[selectedStrategy].info}</p>
              </div>

              <button className="reset-button" onClick={resetGame}>
                🔄 Nueva Amenaza
              </button>
            </div>
          </div>
        )}

        {/* Pantalla de derrota */}
        {gameState === 'failure' && (
          <div className="result-screen failure-screen animate-fade-in">
            <h1 className="result-title failure-title">💥 IMPACTO CONFIRMADO</h1>
            <div className="result-content glass">
              <p className="result-message">
                El asteroide ha impactado la Tierra.<br />
                Consecuencias catastróficas globales.
              </p>
              
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Estrategia</div>
                  <div className="stat-value">
                    {selectedStrategy ? STRATEGIES[selectedStrategy].name : 'Ninguna'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Tiempo de Reacción</div>
                  <div className="stat-value">{reactionTime}s</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Población Salvada</div>
                  <div className="stat-value failure-text">0</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Estado</div>
                  <div className="stat-value failure-text">CRÍTICO</div>
                </div>
              </div>

              <div className="info-box danger">
                <h3>📚 Consecuencias Reales</h3>
                <p>
                  Un asteroide de 370m como Apophis causaría:<br />
                  • Devastación regional de miles de km²<br />
                  • Tsunami si impacta en océano<br />
                  • Invierno por impacto global<br />
                  • Millones de víctimas<br />
                  <br />
                  Por eso la NASA y ESA monitorean constantemente objetos cercanos a la Tierra (NEOs).
                </p>
              </div>

              <button className="reset-button" onClick={resetGame}>
                🔄 Intentar de Nuevo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
