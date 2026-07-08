const AIBOX = ({ message, cmd, terminal, terminalError }: any) => {
  return (
    <div className="AICont">
      <div className="AITitle">Nexus</div>
      <p className="AIContent">{message}</p>
      {cmd && <p className="AICmd">&gt; {cmd}</p>}
      {terminal && <p className="AITerminal">{terminal}</p>}
      {terminalError && <p className="AITerminalError">{terminalError}</p>}
    </div>
  );
};

export default AIBOX;
