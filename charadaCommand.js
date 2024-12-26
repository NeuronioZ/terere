const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'charada',
    description: 'Define uma charada e envia uma mensagem com a palavra secreta.',
    options: [
      {
        name: 'word',
        description: 'A palavra secreta da charada',
        type: 3, // Tipo string
        required: true,
      },
      {
        name: 'mensagem',
        description: 'Mensagem que será enviada junto à charada',
        type: 3, // Tipo string
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const { options, user } = interaction;
    const requiredRoleIds = ['1242981733792743474', '1242982998052311151', '1242981380967764030']; // Adicionando os dois IDs de cargo
    const member = await interaction.guild.members.fetch(user.id);

    // Verificando se o membro tem pelo menos um dos cargos necessários
    const hasRequiredRole = requiredRoleIds.some(roleId => member.roles.cache.has(roleId));

    if (hasRequiredRole) {
      const secretWord = options.getString('word');
      const messageToSend = options.getString('mensagem');

      // Definindo uma resposta de deferimento
      await interaction.deferReply(); // Aguarda mais tempo para responder

      // Criando a embed de Natal
      const christmasEmbed = new EmbedBuilder()
        .setColor('#FF0000') // Vermelho Natalino
        .setTitle('🎄 Charada de Natal 🎄')
        .setDescription('Aqui está sua charada! Tente adivinhar a palavra secreta!')
        .addFields(
          { name: 'Mensagem', value: messageToSend },
          { name: 'Boa sorte!', value: 'Que o espírito natalino te ajude a acertar! 🎅' }
        )
        .setThumbnail('https://i.imgur.com/7nHq1Fz.png') // Imagem de árvore de Natal
        .setFooter({ text: 'Boa sorte e Feliz Natal!', iconURL: 'https://i.imgur.com/0N2lDWT.png' });

      // Enviando a embed com a charada
      await interaction.followUp({ embeds: [christmasEmbed] });

      // Opcional: Enviar a palavra secreta em um canal específico para moderadores ou ao usuário
      // Exemplo: se você quiser enviar a palavra secreta para o autor do comando:
      await interaction.followUp({
        content: `A palavra secreta da charada é: **${secretWord}**. Boa sorte para quem tentar adivinhar!`
      });

    } else {
      // Se o usuário não tem permissão
      await interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
    }
  },
};
