const fs = require('fs');
const path = require('path'); // Importa o módulo path para garantir compatibilidade multiplataforma
const { Client, GatewayIntentBits, REST } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const TOKEN = process.env.DISCORD_TOKEN; // Usando o token da variável de ambiente
const CLIENT_ID = '1312620873743863949'; // Usando o CLIENT_ID da variável de ambiente

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Inicialize o objeto client.commands
client.commands = new Map();

// Caminho absoluto para o diretório de comandos
const commandsPath = path.join(__dirname, 'comandos');

// Verifica se o diretório de comandos existe
if (!fs.existsSync(commandsPath)) {
  console.error('Diretório de comandos não encontrado!');
  process.exit(1);  // Termina o processo com erro
}

// Comandos a serem registrados
const commands = [];
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Verifica e carrega os comandos sem duplicação de nome
const commandNames = new Set();
for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file)); // Carrega o comando usando o caminho correto
  if (command.data) {
    if (commandNames.has(command.data.name)) {
      console.error(`Erro: O comando ${command.data.name} já existe!`);
    } else {
      client.commands.set(command.data.name, command); // Armazenando o comando no Map
      commands.push(command.data);
      commandNames.add(command.data.name);
    }
  } else {
    console.error(`O comando ${file} não possui a propriedade 'data' correta.`);
  }
}

// Usando o REST para registrar os comandos no Discord
const rest = new REST({ version: '9' }).setToken(TOKEN);

// Registro de comandos no Discord
(async () => {
  try {
    console.log('Iniciando registro de comandos...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();

// Quando o bot estiver pronto
client.once('ready', () => {
  console.log(`Bot logado como ${client.user.tag}`);
});

// Listener de interação de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName); // Acessando corretamente o comando

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'Ocorreu um erro ao tentar executar esse comando.', ephemeral: true });
  }
});

// Iniciando o bot
client.login(TOKEN);
