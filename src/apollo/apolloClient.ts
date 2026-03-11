import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'
import { env } from '@/config/env'

const baseUrl = env.strapiBaseUrl || 'http://localhost:1337'

const httpLink = new HttpLink({
  uri: `${baseUrl.replace(/\/$/, '')}/graphql`,
  headers: env.strapiToken ? { Authorization: `Bearer ${env.strapiToken}` } : undefined,
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})
