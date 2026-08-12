const UserBox = ({ message }: { message: any }) => {
  const displayText =
    typeof message === "string"
      ? message
      : message?.content || message?.msg || String(message || "");

  return (
    <div className="UserCont">
      <div className="UserTitle">You</div>
      <p className="UserContent">{displayText}</p>
    </div>
  );
};

export default UserBox;
