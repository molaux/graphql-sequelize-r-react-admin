'use strict'

const {
  GraphQLID,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
  GraphQLList
} = require('graphql')

const { resolver } = require('graphql-sequelize')

const staticTypes = {
  ListMetadata: new GraphQLObjectType({
    name: 'ListMetadata',
    description: 'React admin lists meta data (count)',
    fields: {
      count: { type: new GraphQLNonNull(GraphQLInt) }
    }
  })
}

const extraTypes = () => staticTypes

const extraModelFields = ({ modelsTypes, nameFormatter, logger }, model) => {
  if (model === undefined) {
    return {}
  }

  const extraFields = {}
  const [primaryKey, ...otherPks] = Object.keys(model.primaryKeys)
  if (otherPks.length) {
    logger.log(`graphql-sequelize-r / react-admin : Composite PKs are not yet handled by module (in ${model.name})`)
    return extraFields
  }

  // add the id field as alias of PK
  if (!('id' in model.rawAttributes)) {
    extraFields.id = {
      type: new GraphQLNonNull(GraphQLID),
      resolve: o => o[primaryKey]
    }
  }

  // add associations_id fields as foreign keys

  return extraFields
}

const extraModelQueries = ({ modelsTypes, nameFormatter, logger }, model, queries) => {
  if (model === undefined) {
    return {}
  }

  const queryName = nameFormatter.formatModelName(model.name)
  if (!(queryName in queries)) {
    const [primaryKey, ...otherPks] = Object.keys(model.primaryKeys)
    if (otherPks.length) {
      logger.log(`graphql-sequelize-r / react-admin : Composite PKs are not yet handled by module (in ${model.name})`)
      return {}
    }
    return {
      [queryName]: {
        type: modelsTypes[nameFormatter.formatTypeName(model.name)],
        args: {
          id: { type: new GraphQLNonNull(GraphQLID) }
        },
        resolve: resolver(model, {
          before: (findOptions, { id }) => {
            findOptions.where = {
              [primaryKey]: id
            }
            return findOptions
          }
        })
      },
      [`all${nameFormatter.formatManyModelName(model.name)}`]: {
        type: new GraphQLList(modelsTypes[nameFormatter.formatTypeName(model.name)]),
        args: {
          page: { type: GraphQLInt },
          perPage: { type: GraphQLInt },
          sortField: { type: GraphQLString },
          sortOrder: { type: GraphQLString },
          filter: { type: modelsTypes[`${nameFormatter.formatTypeName(model.name)}Filter`] }
        },
        resolve: resolver(model, {
          before: (findOptions, { page, perPage, sortField, sortOrder, filter }) => {
            if (perPage !== undefined) {
              findOptions.limit = perPage
              if (page !== undefined && perPage !== undefined) {
                findOptions.offset = page * perPage
              }
            }
            if (sortField !== undefined && sortOrder !== undefined) {
              if (sortField === 'id') {
                sortField = primaryKey
              }
              findOptions.order = [[sortField, sortOrder]]
            }
            return findOptions
          }
        })
      },
      [`_all${nameFormatter.formatManyModelName(model.name)}Meta`]: {
        type: staticTypes.ListMetadata,
        args: {
          page: { type: GraphQLInt },
          perPage: { type: GraphQLInt },
          sortField: { type: GraphQLString },
          sortOrder: { type: GraphQLString },
          filter: { type: modelsTypes[`${nameFormatter.formatTypeName(model.name)}Filter`] }
        },
        resolve: (_, { page, perPage, sortField, sortOrder, filter }) => {
          // Todo : apply filter
          return { count: model.count() }
        }
      }
    }
  } else {
    console.warn(`graphql-sequelize-r / react-admin : ${queryName} query already exists`)
  }
}

const extraModelTypes = ({ modelsTypes, nameFormatter }, model) => {
  if (model === undefined) {
    return {}
  }

  const typeName = nameFormatter.formatTypeName(model.name)
  return {
    [`${typeName}Filter`]: new GraphQLInputObjectType({
      name: `${typeName}Filter`,
      description: `${typeName}Filter implements react admin ${typeName} filter grammar`,
      fields: () => ({
        q: { type: GraphQLString }
        // todo : add fields + number_lt,lte,gt,gte
      })
    })
  }
}

module.exports = {
  extraModelFields,
  extraModelQueries,
  extraModelTypes,
  extraTypes
}
