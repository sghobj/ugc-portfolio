import { gql } from '@apollo/client'
import ugcQuerySource from '@/queries/ugc.graphql?raw'

export const UGC_QUERY = gql`
  ${ugcQuerySource}
`
