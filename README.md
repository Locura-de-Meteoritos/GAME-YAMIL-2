# 🌍 PLANETARY DEFENSE COMMANDER 🚀

Juego interactivo 3D donde eres el comandante de defensa planetaria encargado de proteger la Tierra de un asteroide entrante.

## 🎮 Descripción del Juego

Un asteroide de 370m (Apophis) se aproxima a la Tierra. Tienes **60 segundos** para elegir y ejecutar una estrategia de mitigación. ¿Podrás salvar a la humanidad?

### Estrategias Disponibles:

- 🚀 **Misil Nuclear** (70% éxito) - Explosión de alta energía
- 💥 **Impactador Cinético** (85% éxito) - Inspirado en la misión NASA DART
- ☀️ **Vela Solar** (40% éxito) - Desviación gradual con radiación solar
- ❌ **Evacuación** (0% éxito) - Abandona la defensa

## ✨ Características

- **Visualización 3D realista** con Three.js y React Three Fiber
- **Física y mecánicas basadas en datos reales** de la NASA
- **Animaciones fluidas a 60 FPS**
- **UI futurista con glassmorphism**
- **Sistema de éxito/fallo dinámico** (mejor con más tiempo de reacción)
- **Datos educativos** sobre cada estrategia
- **Rejugabilidad** con resultados variables
- **Responsive** para múltiples dispositivos

## 🚀 Instalación

### Prerrequisitos

- Node.js 16+ instalado
- npm o yarn

### Pasos

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo**:
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador**:
   - El juego se abrirá automáticamente en `http://localhost:3000`
   - Si no, abre manualmente esa URL

## 🎯 Cómo Jugar

1. **Briefing Inicial**: Lee la alerta y espera 4 segundos
2. **Analiza los Datos**: Observa el tamaño, velocidad y distancia del asteroide
3. **Elige tu Estrategia**: Tienes 60 segundos para decidir
4. **Observa el Resultado**: ¿Éxito o impacto?
5. **Aprende**: Lee los datos educativos sobre defensa planetaria
6. **Juega de Nuevo**: Prueba diferentes estrategias

## 🎓 Valor Educativo

Este juego está basado en investigaciones reales:

- **NASA DART** (Double Asteroid Redirection Test) - Primera misión de defensa planetaria exitosa (2022)
- **Apophis** - Asteroide real de 370m que pasó cerca de la Tierra
- **Técnicas de mitigación** estudiadas por NASA, ESA y otras agencias espaciales
- **Probabilidades realistas** basadas en estudios científicos

## 🛠️ Stack Tecnológico

- **React 18** - Framework UI
- **Three.js** - Motor 3D
- **@react-three/fiber** - React renderer para Three.js
- **@react-three/drei** - Helpers para React Three Fiber
- **Vite** - Build tool y dev server
- **CSS3** - Animaciones y efectos visuales

## 🎨 Optimizaciones

- Geometrías simples para mejor rendimiento
- Reciclaje de objetos Three.js
- requestAnimationFrame optimizado
- Limpieza de memoria al desmontar componentes
- Sin localStorage (solo estado React)

## 📦 Estructura del Proyecto

```
nasa2/
├── src/
│   ├── App.jsx          # Lógica principal y estados del juego
│   ├── Scene3D.jsx      # Componentes 3D (Tierra, Asteroide, etc.)
│   ├── main.jsx         # Punto de entrada
│   └── styles.css       # Estilos y animaciones
├── index.html           # HTML base
├── package.json         # Dependencias
└── vite.config.js       # Configuración de Vite
```

## 🌟 Características Técnicas Destacadas

- **Estado Reactivo**: Todo el juego usa hooks de React (useState, useEffect, useRef)
- **Animaciones 3D**: useFrame de React Three Fiber para animaciones a 60 FPS
- **Cálculo Dinámico**: Probabilidad de éxito ajustada por tiempo de reacción
- **Efectos Visuales**: Explosiones, trayectorias, partículas
- **Feedback Constante**: Actualización en tiempo real de distancia y countdown

## 🎬 Estados del Juego

1. **Briefing** - Introducción dramática
2. **Playing** - Fase de decisión (60s)
3. **Executing** - Animación de la estrategia
4. **Success** - ¡Asteroide desviado!
5. **Failure** - Impacto catastrófico

## 🤝 Contribuciones

Este es un proyecto educativo. Las mejoras son bienvenidas:
- Más estrategias de mitigación
- Efectos visuales mejorados
- Sistema de puntuación
- Modo multijugador
- Sonidos y música

## 📄 Licencia

MIT License - Libre para uso educativo y personal

## 🔗 Referencias

- [NASA Planetary Defense](https://www.nasa.gov/planetarydefense)
- [DART Mission](https://dart.jhuapl.edu/)
- [Apophis Asteroid](https://cneos.jpl.nasa.gov/apophis/)
- [ESA Planetary Defence](https://www.esa.int/Safety_Security/Planetary_Defence)

---

**¡Salva la humanidad! 🌍🛡️**
