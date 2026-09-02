const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Coordenadas centrales y configuración
let cx, cy;
let flowers = [];
let fireflies = [];
let pollenParticles = [];

function calculateLayout() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    cx = canvas.width / 2;
    // Factor de escala basado en el ancho (para que se achique en móviles)
    let s = Math.min(1, canvas.width / 800); 
    s = Math.max(0.45, s); // Limitar para que no sea microscópico
    
    // Mientras más pequeña sea la flor (en móviles), más la subimos para que alcance el arco
    let yOffset = 100 + ((1 - s) * 180); 
    cy = canvas.height / 2 - yOffset; 
    
    // Distancias máximas de separación para móviles
    let leftSpacing = Math.min(200, canvas.width * 0.25);
    let rightSpacing = Math.min(230, canvas.width * 0.28);
    
    // Configuración recalculable
    flowers = [
        // Izquierda
        { startX: cx, endX: cx - leftSpacing, endY: cy + (180 * s), maxScale: 0.38 * s, amp: -35 * s, delay: 0.4 },
        // Derecha
        { startX: cx, endX: cx + rightSpacing, endY: cy + (160 * s), maxScale: 0.44 * s, amp: 45 * s, delay: 0.2 },
        // Centro (Principal)
        { startX: cx, endX: cx, endY: cy, maxScale: 0.65 * s, amp: 50 * s, delay: 0 }
    ];

    // Redistribuir luciérnagas por toda la pantalla actual
    fireflies = [];
    const numFireflies = 60;
    for(let i=0; i<numFireflies; i++) {
        fireflies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 2 + 0.5,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() * -0.5) - 0.2, // Siempre suben lentamente
            blinkSpeed: Math.random() * 0.05 + 0.02
        });
    }
}

// Inicializar la estructura responsiva
calculateLayout();

let globalTime = 0;
let breathTime = 0;

// Pre-calcular semillas para optimizar rendimiento y evitar parpadeos
const centerRadius = 85;
const centerContour = [];
for(let i=0; i<360; i+=5) {
    let r = centerRadius + Math.random() * 4;
    centerContour.push({x: r * Math.cos(i * Math.PI / 180), y: r * Math.sin(i * Math.PI / 180)});
}

const seeds = [];
for(let i=0; i<1200; i++) {
    let r = Math.sqrt(Math.random()) * centerRadius * 0.95;
    let theta = Math.random() * Math.PI * 2;
    let seedColor = r < centerRadius * 0.4 ? "#170800" : (Math.random() > 0.6 ? "#632d06" : "#8c440d");
    let sSize = r > centerRadius * 0.7 ? 1.8 : 1.2;
    seeds.push({x: r * Math.cos(theta), y: r * Math.sin(theta), color: seedColor, size: sSize});
}

// FUNCION: Dibujar el tallo y las hojas creciendo
function drawStemAndLeaves(stemGrowth, f) {
    const startY = canvas.height + 50; 
    const endY = f.endY; 
    
    const stemHeight = startY - endY;
    const currentY = startY - (stemHeight * stemGrowth);
    
    ctx.save();
    
    const greenColor = "#119b48"; 
    const lightGreenColor = "#77cc86"; 
    
    // TALLO PRINCIPAL (Curva interpolada con S)
    ctx.beginPath();
    for (let y = startY; y >= currentY; y -= 2) {
        let t = (startY - y) / stemHeight; 
        
        let baseX = f.startX + (f.endX - f.startX) * t;
        let offsetX = Math.sin(t * 2 * Math.PI) * f.amp; 
        
        if (y === startY) {
            ctx.moveTo(baseX + offsetX, y);
        } else {
            ctx.lineTo(baseX + offsetX, y);
        }
    }
    
    // Grosor proporcional al tamaño de la flor
    ctx.lineWidth = 26 * (f.maxScale / 0.65); 
    ctx.strokeStyle = greenColor; 
    ctx.lineCap = "round";
    ctx.stroke();

    function getStemX(targetY) {
        let t = (startY - targetY) / stemHeight;
        let baseX = f.startX + (f.endX - f.startX) * t;
        return baseX + Math.sin(t * 2 * Math.PI) * f.amp;
    }

    let leafScale = f.maxScale / 0.65;

    // HOJA 1 (Derecha)
    if (stemGrowth > 0.4) {
        let leaf1Growth = (stemGrowth - 0.4) / 0.6;
        let leafY = startY - (stemHeight * 0.25); 
        let leafX = getStemX(leafY) + (8 * leafScale); 
        
        ctx.save();
        ctx.translate(leafX, leafY); 
        ctx.rotate(Math.PI / 4.5); 
        ctx.scale(leaf1Growth * 1.3 * leafScale, leaf1Growth * 1.3 * leafScale); 
        drawFlatLeaf(greenColor, lightGreenColor);
        ctx.restore();
    }
    
    // HOJA 2 (Izquierda)
    if (stemGrowth > 0.6) {
        let leaf2Growth = (stemGrowth - 0.6) / 0.4;
        let leafY = startY - (stemHeight * 0.55); 
        let leafX = getStemX(leafY) - (8 * leafScale); 
        
        ctx.save();
        ctx.translate(leafX, leafY); 
        ctx.rotate(-Math.PI / 3.2); 
        ctx.scale(leaf2Growth * 1.2 * leafScale, leaf2Growth * 1.2 * leafScale); 
        drawFlatLeaf(greenColor, lightGreenColor);
        ctx.restore();
    }
    
    ctx.restore();
}

// Función auxiliar para la hoja plana
function drawFlatLeaf(fillColor, highlightColor) {
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.lineTo(0, -25);
    ctx.lineWidth = 18;
    ctx.strokeStyle = fillColor;
    ctx.lineCap = "round";
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -15); 
    ctx.quadraticCurveTo(-50, -50, 0, -130); 
    ctx.quadraticCurveTo(50, -50, 0, -15);   
    
    ctx.fillStyle = fillColor;
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.quadraticCurveTo(-15, -70, -5, -110);
    ctx.lineWidth = 4;
    ctx.strokeStyle = highlightColor; 
    ctx.lineCap = "round";
    ctx.stroke();
}

// FUNCION: Dibujar el Girasol Detallado
function drawDetailedSunflower(x, y, scaleFactor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scaleFactor, scaleFactor);
    
    const layers = [
        { radius: 60, length: 190, width: 65, count: 22, color: "#ffc800" },
        { radius: 70, length: 170, width: 65, count: 22, color: "#ffd500", offset: 8 },
        { radius: 80, length: 150, width: 60, count: 22, color: "#ffea00", offset: 16 }
    ];
    
    layers.forEach(layer => {
        for(let i=0; i<layer.count; i++) {
            let angle = (Math.PI * 2 / layer.count) * i + ((layer.offset || 0) * Math.PI / 180);
            ctx.save();
            ctx.rotate(angle);
            ctx.translate(0, -layer.radius);
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(layer.width*0.8, -layer.length*0.4, layer.width*0.5, -layer.length*0.8, 0, -layer.length);
            ctx.bezierCurveTo(-layer.width*0.5, -layer.length*0.8, -layer.width*0.8, -layer.length*0.4, 0, 0);
            
            let grad = ctx.createLinearGradient(0, 0, 0, -layer.length);
            grad.addColorStop(0, "#fca311"); 
            grad.addColorStop(1, layer.color);
            
            ctx.fillStyle = grad;
            ctx.fill();
            
            ctx.strokeStyle = "#c48800";
            ctx.lineWidth = 1.5;
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(4, -layer.length/2, 0, -layer.length*0.7);
            ctx.strokeStyle = "rgba(196, 136, 0, 0.4)";
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.restore();
        }
    });
    
    // Dibujar el centro con los puntos precalculados
    ctx.beginPath();
    centerContour.forEach((p, index) => {
        if(index === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = "#3a1902"; 
    ctx.fill();
    
    // Dibujar las semillas precalculadas
    seeds.forEach(s => {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI*2);
        ctx.fill();
    });
    
    ctx.restore();
}

let hasStarted = false;

function animate() {
    // 1. Limpiar pantalla
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. Dibujar resplandor cálido en el fondo (Glow)
    let bgGlow = ctx.createRadialGradient(cx, cy + 100, 0, cx, cy + 100, canvas.width * 0.85); // Más grande
    bgGlow.addColorStop(0, "rgba(255, 180, 0, 0.25)"); // Más brillante y notorio
    bgGlow.addColorStop(1, "transparent");
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 3. Dibujar y animar luciérnagas
    fireflies.forEach(f => {
        f.x += f.vx;
        f.y += f.vy;
        
        // Reposicionar si salen de la pantalla
        if (f.y < -20) f.y = canvas.height + 20;
        if (f.x < -20) f.x = canvas.width + 20;
        if (f.x > canvas.width + 20) f.x = -20;
        
        // Parpadeo suave
        let alpha = 0.5 + Math.sin(globalTime * 50 * f.blinkSpeed) * 0.4;
        
        // Núcleo de la luciérnaga
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 100, ${alpha})`;
        ctx.fill();
        
        // Aura difuminada de la luciérnaga
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
        ctx.fill();
    });

    if (hasStarted) {
        globalTime += 0.008; // (Antes 0.012) Hacemos crecer los girasoles más lento
        breathTime += 0.04; 
        
        // 4. Dibujar Girasoles y emitir polen
        flowers.forEach(f => {
            // Crecimiento del tallo (0 a 1), respetando su delay
            let stemGrowth = Math.max(0, Math.min(1, (globalTime - f.delay) * 1.5));
            
            let flowerGrowth = 0;
            // La flor solo empieza a crecer cuando su tallo ya llegó arriba
            if (stemGrowth >= 1) {
                flowerGrowth = Math.max(0, Math.min(f.maxScale, (globalTime - f.delay - 0.66) * 1.5));
                // Si ya llegó a su tamaño máximo, empieza a respirar suavemente y suelta polen
                if (flowerGrowth >= f.maxScale) {
                    flowerGrowth = f.maxScale + Math.sin(breathTime) * 0.01;
                    
                    // Generar polen mágico (10% de probabilidad por frame)
                    if (Math.random() < 0.1) {
                        pollenParticles.push({
                            x: f.endX + (Math.random() - 0.5) * 60 * f.maxScale,
                            y: f.endY + (Math.random() - 0.5) * 60 * f.maxScale,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: (Math.random() * -1) - 0.5, // Sube lentamente
                            radius: Math.random() * 1.5 + 0.5,
                            life: 1, // Desvanece de 1 a 0
                            decay: Math.random() * 0.01 + 0.005
                        });
                    }
                }
            }
            
            if (stemGrowth > 0) {
                drawStemAndLeaves(stemGrowth, f);
            }
            
            if (flowerGrowth > 0) {
                drawDetailedSunflower(f.endX, f.endY, flowerGrowth);
            }
        });

        // 5. Dibujar y animar polen
        for (let i = pollenParticles.length - 1; i >= 0; i--) {
            let p = pollenParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            
            if (p.life <= 0) {
                pollenParticles.splice(i, 1);
                continue;
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 215, 0, ${p.life})`; // Dorado brillante
            ctx.fill();
        }
    }
    
    requestAnimationFrame(animate);
}

// Iniciar loop de animación
animate();

// Ajustar canvas si cambian el tamaño de la ventana
window.addEventListener('resize', calculateLayout);

// --- Lógica de la Pantalla de Entrada (Intro) ---
const introScreen = document.getElementById("intro-screen");
const startBtn = document.getElementById("start-btn");
const audio = document.getElementById("audio");

startBtn.addEventListener("click", () => {
    // 1. Iniciar la música
    audio.play().catch(e => console.log("Añade el audio.mp3 a la carpeta."));
    
    // 2. Desvanecer la pantalla negra
    introScreen.classList.add("hidden");
    
    // 3. Activar las animaciones CSS (el texto arco, carta, etc.)
    document.body.classList.add("started");
    
    // 4. Iniciar el crecimiento de los girasoles en el Canvas
    hasStarted = true;
});

// Lógica de la Carta Popup (Máquina de escribir)
const letterBtn = document.getElementById("letter-btn");
const letterModal = document.getElementById("letter-modal");
const closeLetter = document.getElementById("close-letter");
const typewriterContainer = document.getElementById("typewriter-container");

const fullText = `Dicen que regalar algo amarillo hoy es una forma silenciosa de decir que esa persona te mueve el mundo y que hace que todo sea un poco más cálido.<br><br>Tal vez la excusa sea el 21 de septiembre, pero la verdad es que me gusta coincidir contigo y no quería quedarme con las ganas de este detalle.<br><br>Ojalá te robe una sonrisa. 💛`;

let typingInterval;
let isTyping = false;

letterBtn.addEventListener("click", () => {
    letterModal.classList.remove("hidden");
    
    // Solo inicia si no está escribiendo ya
    if (!isTyping) {
        isTyping = true;
        typewriterContainer.innerHTML = "";
        let i = 0;
        
        typingInterval = setInterval(() => {
            // Manejar saltos de línea HTML
            if (fullText.substring(i, i + 4) === "<br>") {
                typewriterContainer.innerHTML += "<br>";
                i += 4;
            } else {
                typewriterContainer.innerHTML += fullText.charAt(i);
                i++;
            }
            
            if (i >= fullText.length) {
                clearInterval(typingInterval);
            }
        }, 65); // (Antes 35) Velocidad mucho más lenta y natural
    }
});

function resetTyping() {
    clearInterval(typingInterval);
    isTyping = false;
    typewriterContainer.innerHTML = "";
}

closeLetter.addEventListener("click", () => {
    letterModal.classList.add("hidden");
    resetTyping(); // Reiniciar para que vuelva a escribir la próxima vez
});

// Cerrar carta al hacer clic fuera del pergamino
letterModal.addEventListener("click", (e) => {
    if (e.target === letterModal) {
        letterModal.classList.add("hidden");
        resetTyping(); // Reiniciar para que vuelva a escribir
    }
});
