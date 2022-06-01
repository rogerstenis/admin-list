import React, { FC, useEffect, useState } from 'react'
import { useLazyQuery, useQuery } from 'react-apollo'

import searchGiftCards from '../queries/searchGiftCards.gql'
import searchUser from '../queries/searchUser.gql'
import searchListUser from '../queries/searchListUser.gql'
import { ContextUser } from '../hooks/useUser'
import { columns, messages } from '../utils/definedMessages'
import { useIntl } from 'react-intl'
import { Tag, useDataGridState, useDataViewState, IconArrowUpRight } from '@vtex/admin-ui'
import { CURRENCY, ITEMS_PER_PAGE, LOCALE } from '../utils/constants'
import { useInterface } from '../hooks/useInterface'

const ProviderUser: FC = (props) => {  
  const [valuesGiftCard, setValuesGiftCard] = useState<ValuesGiftCard[]>()
  const [valuesUser, setValuesUser] = useState<ValuesUser[]>()
  const [valuesListsUser, setValuesListsUser] = useState<ValuesListsUsers[]>()
  const [itemsListsUsers, setItemsListsUsers] = useState<ItemsListsUsers[]>()
  const [emailFilter, setEmailFilter] = useState<string>()
  const [emailFilterGiftCard, setEmailFilterGiftCard] = useState<string>()
  const { data: dataSearchUser } = useQuery(searchUser, {variables: {page: 1, pageSize: 15}})
  const [searchListUserQuery, { data: dataSearchListsUser }] = useLazyQuery(searchListUser)
  const [searchGiftCardQuery, { data: dataSearchGiftCards }] = useLazyQuery(searchGiftCards)
  
  const view = useDataViewState()
  const { formatMessage } = useIntl()

  const { setTableLists, setSearchEmailFilter } = useInterface()
  
  function openTableList(event: React.MouseEvent<SVGSVGElement, MouseEvent>, email:any) {
    event.preventDefault()
    setTableLists(true)
    setSearchEmailFilter(email)
  }

  const gridUsers = useDataGridState({
    view,
    columns: [
      {
        id: 'link',
        resolver: {
          type: 'plain',
          render: ({ data }) => 
            <IconArrowUpRight size="small" onClick={(event) => openTableList(event, data)}/>
          }
        },
      {
        id: 'owner',
        header: formatMessage(columns.owner),
        resolver: {
          type: 'plain',
          render: ({ data }: {data: any}) =>
            data ? (<><b>{data.ownerName}</b><p>{data.ownerEmail}</p></>
            ) : undefined,
        },
      }, 
      {
        id: 'lists',
        header: formatMessage(columns.lists),
      },    
      {
        id: 'bought',
        header: formatMessage(columns.bought),
        resolver: {
          type: 'currency',
          locale: LOCALE,
          currency: CURRENCY,
        },
      },
      {
        id: 'converted',
        header:formatMessage(columns.converted),
        resolver: {
          type: 'currency',
          locale: LOCALE,
          currency: CURRENCY,
        },
      },
      {
        id: 'status',
        header: formatMessage(columns.status),
        resolver: {
          type: 'plain',
          render: ({ data }) =>
            data ? (
              <Tag
                label={formatMessage(
                  messages.active
                )}
                palette="green"
              />
            ) : (
              <Tag
                label= {formatMessage(
                  messages.disabled
                )}
                palette="red"
              />
            ),
        },
        sortable: true,
      },
    ],
    items: itemsListsUsers,
    length: ITEMS_PER_PAGE,
  })

  useEffect(() => {
    const valuesSearchListsUser: ValuesListsUsers[] = dataSearchListsUser?.searchListUser
    setValuesListsUser(valuesSearchListsUser)
  }, [dataSearchListsUser])
  
  useEffect(() => {
    const valuesSearchGiftCards: ValuesGiftCard[] = dataSearchGiftCards?.searchGiftCards?.data
    setValuesGiftCard(valuesSearchGiftCards)
  }, [dataSearchGiftCards])

  useEffect(() => {
    const valuesSearcUser: ValuesUser[] = dataSearchUser?.allUsers?.data
    setValuesUser(valuesSearcUser)
  }, [dataSearchUser])

  useEffect(() => {
    if(valuesUser !== undefined && valuesUser.length > 0){
      let filter = valuesUser[0].email
      let filterGift = valuesUser[0].email
      for (let index = 1; index < valuesUser.length; index++){
        filter += ' OR ownerEmail='+ valuesUser[index].email
        filterGift += ' OR email='+ valuesUser[index].email
      }
      setEmailFilter(filter)
      setEmailFilterGiftCard(filterGift)
    }

  }, [valuesUser])

  useEffect(() => {
    if(emailFilter){
    searchListUserQuery({
      variables: {
        page: 1, 
        pageSize: 15, 
        filter: { ownerEmail: emailFilter },
    }})

    searchGiftCardQuery({
      variables: {
        page: 1, 
        pageSize: 15, 
        filter: { email: emailFilterGiftCard },
        sorting: { field: "email", order: "ASC"}
    }})
  }
  }, [emailFilter, emailFilterGiftCard])

 
  useEffect(() => {
    const valueItems = valuesListsUser?.map((item) => {
      const valueGift = valuesGiftCard?.find(element => element.email === item.ownerEmail)
       return {
        link: item?.ownerEmail ? item.ownerEmail : '',
        id: item?.id ? item.id : '',
        owner: item?.ownerEmail ? {ownerEmail: item.ownerEmail, ownerName: item.ownerName} : '',
        lists: item?.lists ? item.lists : 0,
        bought: item?.purchase ? (item.purchase)/100 : 0,
        converted: valueGift ? valueGift.quantityAlreadyInGiftCard : 0,
        status: item?.status ? item?.status : false,
      }
    })

    setItemsListsUsers(valueItems) 
  }, [valuesListsUser, valuesGiftCard])

 
  return (
    <ContextUser.Provider
      value={{
        gridUsers,
        view,
      }}
    >
      {props.children}
    </ContextUser.Provider>
  )
}

export default ProviderUser
