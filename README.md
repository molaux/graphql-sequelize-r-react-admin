# graphql-sequelize-r-react-admin

A [graphql-sequelize-r](https://github.com/molaux/graphql-sequelize-r) plugin that *partially* implements [ra-data-graphql-simple](https://github.com/marmelab/react-admin/tree/master/packages/ra-data-graphql-simple) grammar (a GraphQL data provider for [react-admin](https://github.com/marmelab/react-admin/)).

## Install

```bash
yarn add @molaux/graphql-sequelize-r-react-admin
```

## Use

```javascript
import graphqlSequelizeRReactAdmin from '@molaux/graphql-sequelize-r-react-admin'

const {
  extraModelFields: reactAdminFieldsGenerator,
  extraModelQueries: reactAdminQueriesGenerator,
  extraModelTypes: reactAdminTypesGenerator,
  extraTypes: reactAdminExtraTypes
} = graphqlSequelizeRReactAdmin
```
