const AIBOX = ({ message, cmd, terminal, terminalError }: any) => {
  return (
    <div className="AICont">
      <h3 className="AITitle">Nexus</h3>
      <p className="AIContent">{message}</p>
      {cmd && <p className="AICmd">{cmd}</p>}
      {terminal && <p className="AITerminal">{terminal}</p>}
      {terminalError && <p className="AITerminalError">{terminalError}</p>}
    </div>
  );
};

export default AIBOX;
