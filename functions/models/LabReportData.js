// Assuming you have a model file named labreport_data.js
"use strict";
module.exports = (sequelize, DataTypes) => {
  const LabReportData = sequelize.define(
    "labreport_data",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      labReoprtFk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'lab_report', // Ensure this matches your lab_report model name
          key: 'id'
        }
      },
      refRangeFk: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'ref_range_data',
          key: 'id'
        }
      },
      pdfEmailIdFk: {  // New column
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pdf_email',
          key: 'id'
        }
      },
      lab_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      isPending: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      tableName: "labreport_data",
      timestamps: true,
    }
  );

  LabReportData.associate = function(models) {
    // Define associations
    LabReportData.belongsTo(models.lab_report, { 
      foreignKey: 'labReoprtFk',
      as: 'labReport'
    });

    LabReportData.belongsTo(models.ref_range_data, { 
      foreignKey: 'refRangeFk',
      as: 'refRangeData'
    });
  };

  return LabReportData;
};
