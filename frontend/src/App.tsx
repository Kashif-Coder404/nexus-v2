import "./App.css";
import Chat from "./components/Chat";

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Nexus AI</h1>
        <p>Your Intelligent Assistant</p>
      </header>
      <main className="app-main">
        <Chat />
      </main>
    </div>
  );
}

export default App;
