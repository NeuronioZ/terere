// resgatarCommand.js
const fs = require('fs');
const userPointsFile = './userPoints.json';
const cooldownsFile = './cooldowns.json';

let userPoints = {};
let cooldowns = {};

// Carrega os dados
const loadData = () => {
  if (fs.existsSync(userPointsFile)) {
    userPoints = JSON.parse(fs.readFileSync(userPointsFile, 'utf-8'));
  } else {
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));
  }

  if (fs.existsSync(cooldownsFile)) {
    cooldowns = JSON.parse(fs.readFileSync(cooldownsFile, 'utf-8'));
  } else {
    fs.writeFileSync(cooldownsFile, JSON.stringify(cooldowns, null, 2));
  }
};

const resgatarCommand = {
  data: {
    name: 'resgatar',
    description: 'Ganha de 0 a 5 snowflakes/pontos aleatórios. (Usável a cada 12 horas)',
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const currentTime = Date.now();
    const cooldownTime = 12 * 60 * 60 * 1000; // 12 horas

    // Verifica se o usuário já usou o comando nas últimas 12 horas
    if (cooldowns[userId] && currentTime - cooldowns[userId] < cooldownTime) {
      const timeLeft = ((cooldowns[userId] + cooldownTime) - currentTime) / 1000; // Tempo restante em segundos
      const hoursLeft = Math.floor(timeLeft / 3600);
      const minutesLeft = Math.floor((timeLeft % 3600) / 60);
      return await interaction.reply({
        content: `Você já usou o comando recentemente! Tente novamente em ${hoursLeft} horas e ${minutesLeft} minutos.`,
        ephemeral: true,
      });
    }

    // Gera um número aleatório de pontos
    const randomPoints = Math.floor(Math.random() * 6);

    // Atualiza os pontos do usuário
    userPoints[userId] = (userPoints[userId] || 0) + randomPoints;

    // Atualiza o tempo de cooldown para o usuário
    cooldowns[userId] = currentTime;

    // Salva os dados
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));
    fs.writeFileSync(cooldownsFile, JSON.stringify(cooldowns, null, 2));

    // Resposta visível a todos
    await interaction.reply({
      content: `${interaction.user.username} ganhou ${randomPoints} snowflake(s)! Agora ele(a) tem ${userPoints[userId]} snowflake(s).`,
    });
  },
};

// Chama o carregamento dos dados
loadData();

module.exports = resgatarCommand;
