const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const fs = require('fs');
const userPointsFile = './userPoints.json';

let userPoints = {};

// Carrega os dados dos pontos dos usuários
const loadData = () => {
  if (fs.existsSync(userPointsFile)) {
    userPoints = JSON.parse(fs.readFileSync(userPointsFile, 'utf8'));
  } else {
    fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));
  }
};

// Aposta
module.exports = {
  data: new SlashCommandBuilder()
    .setName('aposta') // Nome do comando deve ser único
    .setDescription('Faz uma aposta com outro usuário')
    .addUserOption(option => option.setName('adversario').setDescription('Escolha um adversário').setRequired(true))
    .addIntegerOption(option => option.setName('valor').setDescription('Valor da aposta em pontos').setRequired(true)),

  async execute(interaction) {
    loadData();

    const userId = interaction.user.id;
    const adversario = interaction.options.getUser('adversario');
    const valorAposta = interaction.options.getInteger('valor');

    // Verifica se o usuário está tentando apostar contra si mesmo
    if (userId === adversario.id) {
      return await interaction.reply({ content: 'Você não pode apostar contra si mesmo! ❌', ephemeral: true });
    }

    // Verifica se o usuário tem pontos suficientes
    if (!userPoints[userId] || userPoints[userId] < valorAposta) {
      return await interaction.reply({ content: 'Você não tem pontos suficientes para fazer essa aposta.', ephemeral: true });
    }

    // Criação do botão para aceitar a aposta
    const acceptButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aceitar_${userId}_${valorAposta}`)
        .setLabel('Aceitar aposta')
        .setStyle(3) // Estilo do botão
    );

    // Embed informando que o usuário fez a aposta
    const apostaEmbed = new EmbedBuilder()
      .setColor('#3498db')
      .setTitle('Aposta Enviada 🎄')
      .setDescription(`${interaction.user.username} fez uma aposta de **${valorAposta} pontos** contra **${adversario.username}**. 🎅`)
      .addFields(
        { name: 'Valor Apostado', value: `**${valorAposta} pontos**` },
        { name: 'Adversário', value: `${adversario.username}` },
      )
      .setTimestamp();

    // Envia a mensagem com a Embed e o botão para aceitar a aposta
    await interaction.reply({
      embeds: [apostaEmbed],
      content: `${adversario}, você recebeu uma aposta de **${interaction.user.username}** no valor de **${valorAposta} pontos**. Clique no botão abaixo para aceitar a aposta. 🎄✨`,
      components: [acceptButton],
    });

    // Recupera a mensagem enviada
    const message = await interaction.fetchReply();

    // Cria o coletor de componentes para a mensagem
    const filter = (i) => i.user.id === adversario.id; // Só o adversário pode interagir
    const collector = message.createMessageComponentCollector({ filter, time: 180000 }); // Tempo de expiração aumentada para 3 minutos

    collector.on('collect', async (i) => {
      if (i.customId === `aceitar_${userId}_${valorAposta}`) {
        // Adversário aceitou a aposta
        if (!userPoints[adversario.id]) userPoints[adversario.id] = 0;

        // Deduzir pontos da pessoa que fez a aposta e do adversário
        userPoints[userId] -= valorAposta;
        userPoints[adversario.id] -= valorAposta;

        // Sortear o vencedor
        const vencedor = Math.random() < 0.5 ? userId : adversario.id; // Sorteio simples

        // Calcular 90% da aposta para o vencedor e 10% para a casa
        const premio = Math.floor(valorAposta * 0.9);
        const taxaCasa = valorAposta - premio;

        // Atualizar pontos com base no vencedor
        if (vencedor === userId) {
          userPoints[userId] += premio;
          userPoints[adversario.id] += taxaCasa;
        } else {
          userPoints[adversario.id] += premio;
          userPoints[userId] += taxaCasa;
        }

        // Salvar os dados atualizados
        fs.writeFileSync(userPointsFile, JSON.stringify(userPoints, null, 2));

        // Criar o resultado
        const resultEmbed = new EmbedBuilder()
          .setColor(vencedor === userId ? '#00FF00' : '#FF0000')
          .setTitle(vencedor === userId ? 'Você ganhou a aposta! 🎉' : 'Você perdeu a aposta. 😞')
          .setDescription(`${interaction.user.username} apostou **${valorAposta} pontos** contra **${adversario.username}**. O vencedor é **${vencedor === userId ? interaction.user.username : adversario.username}**! 🎅`)
          .addFields(
            { name: 'Pontos Atualizados', value: `**${interaction.user.username}**: ${userPoints[userId]} pontos\n**${adversario.username}**: ${userPoints[adversario.id]} pontos` }
          )
          .setTimestamp();

        // Enviar o resultado
        await i.update({ content: 'A aposta foi concluída! 🎄', components: [] });
        await interaction.followUp({ embeds: [resultEmbed] });
      }
    });

    // Se alguém tentar clicar no botão e não for o adversário
    collector.on('collect', async (i) => {
      if (i.user.id !== adversario.id) {
        await i.reply({ content: '❌ Você não é o adversário! Apenas o adversário pode aceitar a aposta. 🎅🎄', ephemeral: true });
      }
    });
  },
};
