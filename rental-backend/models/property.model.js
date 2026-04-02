module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: { len: [5, 200] }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price_per_night: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    monthly_rent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: { min: 0 }
    },
    listing_type: {
      type: DataTypes.ENUM('short_term', 'long_term'),
      defaultValue: 'short_term'
    },
    location: {
      type: DataTypes.STRING(300),
      allowNull: false
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'India'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    property_type: {
      type: DataTypes.ENUM('apartment', 'house', 'villa', 'studio', 'condo', 'penthouse', 'flat'),
      defaultValue: 'apartment'
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    max_guests: {
      type: DataTypes.INTEGER,
      defaultValue: 2
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    is_available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    avg_rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    total_reviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rules: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'properties',
    timestamps: true
  });

  return Property;
};
