'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Prospects', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      apellido_paterno: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      apellido_materno: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      telefono: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dependencia: {
        type: Sequelize.ENUM('IMSS', 'ISSSTE', 'CFE', 'PEMEX'),
        allowNull: true,
      },
      ingresos: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      perfil: {
        type: Sequelize.ENUM('A', 'B', 'C'),
        allowNull: true,
      },
      interes: {
        type: Sequelize.ENUM('A', 'B', 'C'),
        allowNull: true,
      },
      decision: {
        type: Sequelize.ENUM('A', 'B', 'C'),
        allowNull: true,
      },
      score_total: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      nivel_venta: {
        type: Sequelize.ENUM('caliente', 'tibio', 'frio'),
        allowNull: true,
      },
      comprobante_ingresos: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      identificacion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      fecha_subida_comprobante: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      fecha_subida_identificacion: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      proximo_contacto: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      comentarios: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('Prospects', ['userId'], {
      name: 'prospects_user_id_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Prospects');
  },
};
