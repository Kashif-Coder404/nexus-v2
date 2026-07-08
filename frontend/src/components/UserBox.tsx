const UserBox = ({ message }: { message: string }) => {
  return (
    <div className="UserCont">
      <div className="UserTitle">You</div>
      <p className="UserContent">{message}</p>
    </div>
  );
};

export default UserBox;
