import "./App.css";
import Chat from "./components/Chat";
import AuthPage from "./components/AuthPage";
import { useAppContext } from "./context/provider";

function App() {
  const { isAuthenticated } = useAppContext();

  return (
    <div className="app-container">
      <main className="app-main">
        {isAuthenticated ? <Chat /> : <AuthPage />}
      </main>
    </div>
  );
}

export default App;
