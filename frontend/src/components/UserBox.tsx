const UserBox = ({ message }: { message: string }) => {
  return (
    <div className="UserCont">
      <h1 className="UserTitle">User</h1>
      <br />
      <p className="UserContent">{message}</p>
    </div>
  );
};

export default UserBox;
