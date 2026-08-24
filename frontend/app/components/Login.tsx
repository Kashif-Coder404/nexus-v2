import React from "react";

const Login = (): React.JSX.Element => {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
          Log in
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Welcome back to Nexus
        </p>
        <div id="form">
          <form action="submit">Form </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
