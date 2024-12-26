// Importando dependências
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const charadaCommand = require('./charadaCommand.js'); // Importando o comando charada
const pontosCommand = require('./pontosCommand.js'); // Importando o comando pontos
require('dotenv').config(); // Carrega as variáveis do arquivo .env

const TOKEN = process.env.DISCORD_TOKEN; // Usando o token da variável de ambiente
const CLIENT_ID = '1312620873743863949'; // Substitua pelo CLIENT_ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Variáveis globais
let secretWord = null;
let wordAnswered = false;
let userPoints = {};
let cooldowns = {}; // Para armazenar o tempo de cooldown de cada usuário
const userPointsFile = './userPoints.json';
const cooldownsFile = './cooldowns.json';

const loadUserPoints = () => {
  if (fs.existsSync(userPointsFile)) {
    userPoints = JSON.parse(fs.readFileSync(userPointsFile, 'utf-8'));
  } else {
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));
  }
};

const loadCooldowns = () => {
  if (fs.existsSync(cooldownsFile)) {
    cooldowns = JSON.parse(fs.readFileSync(cooldownsFile, 'utf-8'));
  } else {
    fs.writeFileSync(cooldownsFile, JSON.stringify(cooldowns, null, 2));
  }
};

const normalizeText = (text) => text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const rest = new REST({ version: '9' }).setToken(TOKEN);

// Comando /gf
const resgatarCommand = {
  data: {
    name: 'resgatar',
    description: 'Ganha de 0 a 5 snowflakes/pontos aleatórios. (Usável a cada 12 horas)',
  },
  async execute(interaction) {
    const userId = interaction.user.id;
    const currentTime = Date.now();
    const cooldownTime = 12 * 60 * 60 * 1000; // 12 horas em milissegundos

    // Verifica se o usuário está em cooldown
    if (cooldowns[userId] && currentTime - cooldowns[userId] < cooldownTime) {
      const timeLeft = ((cooldowns[userId] + cooldownTime) - currentTime) / 1000; // Tempo restante em segundos
      const hoursLeft = Math.floor(timeLeft / 3600);
      const minutesLeft = Math.floor((timeLeft % 3600) / 60);
      return await interaction.reply({
        content: `Você já usou o comando recentemente! Tente novamente em ${hoursLeft} horas e ${minutesLeft} minutos.`,
        ephemeral: true, // Resposta apenas para o usuário
      });
    }

    // Gera um número aleatório de pontos entre 0 e 5
    const randomPoints = Math.floor(Math.random() * 6);

    // Atualiza os pontos do usuário
    userPoints[userId] = (userPoints[userId] || 0) + randomPoints;

    // Atualiza o tempo de cooldown
    cooldowns[userId] = currentTime;

    // Salva os dados no arquivo
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));
    fs.writeFileSync(cooldownsFile, JSON.stringify(cooldowns, null, 2));

    // Resposta visível a todos
    await interaction.reply({
      content: `${interaction.user.username} ganhou ${randomPoints} snowflake(s! Agora ele(a) tem ${userPoints[userId]} snowflake(s).`,
    });
  },
};

const commands = [
  pontosCommand.data, // Comando pontos
  charadaCommand.data, // Comando charada
  resgatarCommand.data, // Comando gf
];

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
  loadUserPoints(); // Carrega os pontos dos usuários no início
  loadCooldowns(); // Carrega os tempos de cooldown
});

// Listener de interação de comandos
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  // Comando /rega
  if (interaction.commandName === 'resgatar') {
    await resgatarCommand.execute(interaction);
  }

  // Comando /pontos
  else if (interaction.commandName === 'pontos') {
    await pontosCommand.execute(interaction);
  }

  // Comando /charada
  else if (interaction.commandName === 'charada') {
    const { options, user } = interaction;
    const requiredRoleIds = ['1242981733792743474', '1242982998052311151', '1242981380967764030']; // Adicionando os dois IDs de cargo
    const member = await interaction.guild.members.fetch(user.id);

    // Verificando se o membro tem pelo menos um dos cargos necessários
    const hasRequiredRole = requiredRoleIds.some(roleId => member.roles.cache.has(roleId));

    if (hasRequiredRole) {
      secretWord = options.getString('word');
      const messageToSend = options.getString('mensagem');
      wordAnswered = false;

      // Definindo a embed de Natal
      const christmasEmbed = new EmbedBuilder()
        .setColor('#FF0000') // Vermelho Natalino
        .setTitle('🎄 Charada de Natal 🎄')
        .setDescription('Aqui está sua charada! Tente adivinhar a palavra secreta!')
        .addFields(
          { name: 'Charada:', value: messageToSend },
          { name: 'Boa sorte!', value: 'Que o espírito natalino te ajude a acertar! 🎅' }
        )
        .setThumbnail('https://i.ibb.co/8K5Pm8h/erses.webp') // Imagem de árvore de Natal
        .setFooter({ text: 'Boa sorte e Feliz Natal!', iconURL: 'https://i.ibb.co/8K5Pm8h/erses.webp' });

      // Enviando a embed de Natal com o comando
      await interaction.reply({ content: 'A charada foi definida!', ephemeral: true });
      await interaction.followUp({ embeds: [christmasEmbed] }); // Usando followUp para enviar a embed após a resposta

    } else {
      return interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
    }
  }
});

// Listener para respostas de mensagens
client.on('messageCreate', async (message) => {
  if (message.author.bot || wordAnswered || !secretWord) return;

  const normalizedMessage = normalizeText(message.content);
  const normalizedSecretWord = normalizeText(secretWord);

  if (normalizedMessage === normalizedSecretWord) {
    const userId = message.author.id;
    const currentPoints = userPoints[userId] || 0;
    userPoints[userId] = currentPoints + 1;

    // Criando a embed de acerto de charada
    const christmasCongratsEmbed = new EmbedBuilder()
      .setColor('#00FF00') // Verde Natalino
      .setTitle('🎄 Parabéns! 🎄')
      .setDescription(`🎉 Parabéns, ${message.author.username}! Você acertou a charada e agora tem ${currentPoints + 1} snowflake(s).`)
      .addFields(
        { name: 'Veja o Top do Servidor', value: 'Use /pontos para ver sua posição!' }
      )
      .setThumbnail('https://i.ibb.co/8K5Pm8h/erses.webp') // Imagem de árvore de Natal
      .setFooter({ text: 'Feliz Natal! 🎅', iconURL: 'https://i.ibb.co/8K5Pm8h/erses.webp' });

    // Enviando a embed de acerto
    await message.channel.send({ embeds: [christmasCongratsEmbed] });
    await message.react('🎄'); // Reagindo com a árvore de Natal 🎄

    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));

    wordAnswered = true;
    secretWord = null;
  }
});

// Iniciando o bot
client.login(TOKEN);
