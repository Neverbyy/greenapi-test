import { useMutation } from '@tanstack/react-query'
import { sendMessage } from '../api/greenApi'
import { useCredentials } from '../store/authStore'
import { useChatStore } from '../store/chatStore'

type SendVariables = {
  chatId: string
  text: string
}

/** Сообщение показывается сразу (status: pending) и подтверждается ответом GREEN-API. */
export function useSendMessage() {
  const credentials = useCredentials()
  const addMessage = useChatStore((state) => state.addMessage)
  const updateMessage = useChatStore((state) => state.updateMessage)

  return useMutation({
    mutationFn: (variables: SendVariables) =>
      sendMessage(credentials, variables.chatId, variables.text),

    onMutate: (variables) => {
      const localId = `local-${crypto.randomUUID()}`
      addMessage(variables.chatId, {
        id: localId,
        text: variables.text,
        outgoing: true,
        timestamp: Date.now(),
        status: 'pending',
      })
      return { localId }
    },

    onSuccess: (data, variables, onMutateResult) => {
      // Подменяем локальный id на idMessage: по нему эхо-уведомление
      // outgoingAPIMessageReceived будет распознано как уже показанное сообщение.
      updateMessage(variables.chatId, onMutateResult.localId, {
        id: data.idMessage,
        status: 'sent',
      })
    },

    onError: (error, variables, onMutateResult) => {
      if (!onMutateResult) return
      updateMessage(variables.chatId, onMutateResult.localId, {
        status: 'error',
        error: error.message,
      })
    },
  })
}
