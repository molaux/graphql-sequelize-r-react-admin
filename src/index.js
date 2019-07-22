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
const pluralize = require('pluralize')

const staticTypes = {
  ListMetadata: new GraphQLObjectType({
    name: 'ListMetadata',
    description: `React admin lists meta data (count)`,
    fields: {
      count: { type: new GraphQLNonNull(GraphQLInt) }
    }
  })
}

const extraTypes = ({ modelsTypes }) => staticTypes

const extraModelFields = ({ modelsTypes }, model) => {
  let extraFields = {}
  const [ primaryKey, ...otherPks ] = Object.keys(model.primaryKeys)
  if (otherPks.length) {
    console.warn(`graphql-sequelize-r / react-admin : Composite PKs are not yet handled by module (in ${model.name})`)
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

const extraModelQueries = ({ modelsTypes }, modelName, model, queries) => {
  if (!(modelName in queries)) {
    const [ primaryKey, ...otherPks ] = Object.keys(model.primaryKeys)
    if (otherPks.length) {
      console.warn(`graphql-sequelize-r / react-admin : Composite PKs are not yet handled by module (in ${model.name})`)
      return {}
    }
    return {
      [modelName]: {
        type: modelsTypes[model.name],
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
      [`all${pluralize(modelName)}`]: {
        type: new GraphQLList(modelsTypes[model.name]),
        args: {
          page: { type: GraphQLInt },
          perPage: { type: GraphQLInt },
          sortField: { type: GraphQLString },
          sortOrder: { type: GraphQLString },
          filter: { type: modelsTypes[`${modelName}Filter`] }
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
      [`_all${pluralize(modelName)}Meta`]: {
        type: staticTypes.ListMetadata,
        args: {
          page: { type: GraphQLInt },
          perPage: { type: GraphQLInt },
          sortField: { type: GraphQLString },
          sortOrder: { type: GraphQLString },
          filter: { type: modelsTypes[`${modelName}Filter`] }
        },
        resolve: (_, { page, perPage, sortField, sortOrder, filter }) => {
          // Todo : apply filter
          return { count: model.count() }
        }
      }
    }
  } else {
    console.warn(`graphql-sequelize-r / react-admin : ${modelName} query already exists`)
  }
}

const extraModelTypes = ({ modelsTypes }, modelName, model) => {
  return {
    [`${modelName}Filter`]: new GraphQLInputObjectType({
      name: `${modelName}Filter`,
      description: `${modelName}Filter implements react admin ${modelName} filter grammar`,
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
