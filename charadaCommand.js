const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('charada')
    .setDescription('Define uma charada e envia uma mensagem com a palavra secreta.')
    .addStringOption(option => 
      option.setName('mensagem')
        .setDescription('Pergunta da charada')
        .setRequired(true)
    )
    .addStringOption(option => 
      option.setName('word')
        .setDescription('A palavra secreta da charada')
        .setRequired(true)
    ),

  async execute(interaction) {
    const { options, user } = interaction;
    const requiredRoleIds = ['1242981733792743474', '1242982998052311151', '1242981380967764030'];
    const member = await interaction.guild.members.fetch(user.id);

    // Verificando se o membro tem pelo menos um dos cargos necessários
    const hasRequiredRole = requiredRoleIds.some(roleId => member.roles.cache.has(roleId));

    if (hasRequiredRole) {
      const secretWord = options.getString('word');
      const messageToSend = options.getString('mensagem');

      // Definindo uma resposta de deferimento
      await interaction.deferReply();

      // Criando a embed de Natal
      const christmasEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🎄 Charada de Natal 🎄')
        .setDescription('Aqui está sua charada! Tente adivinhar a palavra secreta!')
        .addFields(
          { name: 'Mensagem', value: messageToSend },
          { name: 'Boa sorte!', value: 'Que o espírito natalino te ajude a acertar! 🎅' }
        )
        .setThumbnail('https://i.ibb.co/8K5Pm8h/erses.webp')
        .setFooter({ text: 'Boa sorte e Feliz Natal!', iconURL: 'https://i.ibb.co/8K5Pm8h/erses.webp' });

      // Enviando a embed com a charada
      await interaction.followUp({ embeds: [christmasEmbed] });
      // Se o usuário não tem permissão
      await interaction.reply({ content: 'Você não tem permissão para usar esse comando.', ephemeral: true });
    }
  },
};
