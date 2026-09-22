import ChatLayout from './components/ChatLayout'
import LoginScreen from './components/LoginScreen'
import { useAuthStore } from './store/authStore'

export default function App() {
  const credentials = useAuthStore((state) => state.credentials)

  return credentials ? <ChatLayout /> : <LoginScreen />
}
